import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const describe=(e:unknown)=>{if(!e)return 'Unknown error';if(typeof e==='string')return e;const x=e as {message?:string;code?:string;details?:string;hint?:string};return [x.message,x.code?`code ${x.code}`:null,x.details,x.hint].filter(Boolean).join(' — ')||'Unknown error'};

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 try{
  const auth=req.headers.get('Authorization'); if(!auth)return json({error:'Authorization required'},401);
  const url=Deno.env.get('SUPABASE_URL'); const anon=Deno.env.get('SUPABASE_ANON_KEY'); const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!service)return json({error:'Supabase environment is not configured'},500);
  const sup=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const db=createClient(url,service);
  const {data:{user},error:ue}=await sup.auth.getUser(); if(ue||!user)return json({error:'Unauthorized'},401);
  const {data:role,error:re}=await db.from('user_roles').select('role').eq('user_id',user.id).maybeSingle(); if(re)return json({error:`Role lookup failed: ${describe(re)}`},500); if(!['admin','teacher'].includes(role?.role))return json({error:'Teacher or administrator access required'},403);
  const body=await req.json().catch(()=>({})); const ids=Array.isArray(body.question_ids)?body.question_ids.filter((x:string)=>typeof x==='string'):[]; const limit=Math.min(Math.max(Number(body.limit||20),1),50);
  let query=db.from('ai_generated_questions').select('id,generation_job_id,book_id,chapter_id,learning_objective_id,grade,age_min,age_max,subject,topic,skill,difficulty,question_type,prompt,options,correct_answer,explanation,hint,interaction_config,source_reference,ai_confidence').eq('validation_status','pending').limit(limit);
  if(ids.length) query=query.in('id',ids);
  const {data:questions,error:qe}=await query; if(qe)return json({error:`Question lookup failed: ${describe(qe)}`},500); if(!questions?.length)return json({success:true,count:0,attempted:0,results:[],model:Deno.env.get('GEMINI_MODEL')||'gemini-3.6-flash'});
  const apiKey=Deno.env.get('GEMINI_API_KEY'); if(!apiKey)return json({error:'GEMINI_API_KEY is not configured'},500); const model=Deno.env.get('GEMINI_MODEL')||'gemini-3.6-flash';
  const results:any[]=[];
  for(const q of questions){
   try{
    const [{data:book,error:be},{data:chapter,error:ce},{data:objective,error:oe}]=await Promise.all([
     db.from('books').select('id,title,subject,grade,min_age,max_age,academic_year,publisher').eq('id',q.book_id).maybeSingle(),
     q.chapter_id?db.from('book_chapters').select('id,title,chapter_number,page_start,page_end,description,content').eq('id',q.chapter_id).maybeSingle():Promise.resolve({data:null,error:null}),
     q.learning_objective_id?db.from('learning_objectives').select('id,title,description,skill_code,cognitive_level').eq('id',q.learning_objective_id).maybeSingle():Promise.resolve({data:null,error:null})
    ]);
    if(be||ce||oe)throw new Error(`Curriculum context lookup failed: ${describe(be||ce||oe)}`);
    const {data:similar,error:se}=await db.from('ai_generated_questions').select('id,prompt,topic,skill').eq('book_id',q.book_id).neq('id',q.id).ilike('prompt',`%${String(q.prompt).slice(0,45)}%`).limit(5); if(se)throw new Error(`Duplicate lookup failed: ${describe(se)}`);
    const context={book,chapter,objective,question:q,possible_duplicates:similar||[]};
    const prompt=`You are a strict curriculum question validator. Validate the supplied mathematics question using ONLY the supplied curriculum source. Do not rewrite it. Check mathematical correctness, answer validity, grade/age appropriateness, curriculum alignment, difficulty, and duplicates. Return a conservative quality score 0-100. Your result is advisory only: NEVER approve or reject the question. Context: ${JSON.stringify(context)}`;
    const schema={type:'OBJECT',properties:{mathematically_correct:{type:'BOOLEAN'},answer_valid:{type:'BOOLEAN'},grade_appropriate:{type:'BOOLEAN'},age_appropriate:{type:'BOOLEAN'},curriculum_aligned:{type:'BOOLEAN'},difficulty_valid:{type:'BOOLEAN'},duplicate_detected:{type:'BOOLEAN'},quality_score:{type:'NUMBER'},validator_notes:{type:'STRING'}},required:['mathematically_correct','answer_valid','grade_appropriate','age_appropriate','curriculum_aligned','difficulty_valid','duplicate_detected','quality_score','validator_notes']};
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:schema,temperature:0.1}})});
    if(!r.ok)throw new Error(`Gemini validation failed (${r.status}): ${(await r.text()).slice(0,1200)}`);
    const payload=await r.json(); const raw=payload?.candidates?.[0]?.content?.parts?.map((p:any)=>p?.text||'').join('').trim(); if(!raw)throw new Error('Gemini returned no validator response');
    const v=JSON.parse(raw); const score=Math.max(0,Math.min(100,Number(v.quality_score)||0));
    const {error:vrError}=await db.from('question_validation_results').insert({generated_question_id:q.id,mathematically_correct:!!v.mathematically_correct,answer_valid:!!v.answer_valid,grade_appropriate:!!v.grade_appropriate,age_appropriate:!!v.age_appropriate,curriculum_aligned:!!v.curriculum_aligned,difficulty_valid:!!v.difficulty_valid,duplicate_detected:!!v.duplicate_detected,quality_score:score,validator_notes:String(v.validator_notes||''),validated_by:'gemini'}); if(vrError)throw new Error(`Validation result save failed: ${describe(vrError)}`);
    const {error:updateError}=await db.from('ai_generated_questions').update({validation_status:'needs_review',validation_errors:[String(v.validator_notes||'AI validation completed — teacher review required')]}).eq('id',q.id); if(updateError)throw new Error(`Question status update failed: ${describe(updateError)}`);
    results.push({id:q.id,status:'needs_review',quality_score:score,mathematically_correct:!!v.mathematically_correct,answer_valid:!!v.answer_valid,grade_appropriate:!!v.grade_appropriate,age_appropriate:!!v.age_appropriate,curriculum_aligned:!!v.curriculum_aligned,difficulty_valid:!!v.difficulty_valid,duplicate_detected:!!v.duplicate_detected,validator_notes:String(v.validator_notes||'')});
   }catch(e){results.push({id:q.id,status:'error',error:describe(e)});}
  }
  const successCount=results.filter(r=>r.status!=='error').length;
  return json({success:true,count:successCount,attempted:questions.length,results,model});
 }catch(e){return json({error:describe(e)},500)}
});
