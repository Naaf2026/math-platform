import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-cron-secret","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const describe=(e:unknown)=>e instanceof Error?e.message:typeof e==='string'?e:JSON.stringify(e);

const schema={type:'object',additionalProperties:false,properties:{questions:{type:'array',items:{type:'object',additionalProperties:false,properties:{prompt:{type:'string'},question_type:{type:'string',enum:['visual_question','visual_table']},difficulty:{type:'string',enum:['easy','medium','hard']},skill:{type:'string'},topic:{type:'string'},options:{type:'array',items:{type:'object',additionalProperties:false,properties:{id:{type:'string'},text:{type:'string'}},required:['id','text']}},correct_answer:{type:'object',additionalProperties:false,properties:{value:{type:'string'}},required:['value']},explanation:{type:'string'},hint:{type:'string'},interaction_config:{type:'object',additionalProperties:true},source_reference:{type:'object',additionalProperties:true},ai_confidence:{type:'number'}},required:['prompt','question_type','difficulty','skill','topic','options','correct_answer','explanation','hint','interaction_config','source_reference','ai_confidence']}}},required:['questions']};

function outputText(p:any){return p?.output_text??p?.output?.flatMap((x:any)=>x?.content??[]).map((x:any)=>x?.text??'').join('')??'';}
async function ai(model:string,key:string,prompt:string,provider:string){
 const url=provider==='openai'?'https://api.openai.com/v1/responses':`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
 const headers:any={'Content-Type':'application/json'};if(provider==='openai')headers.Authorization=`Bearer ${key}`;
 const body=provider==='openai'?{model,input:[{role:'user',content:[{type:'input_text',text:prompt}]}],text:{format:{type:'json_schema',name:'daily_visual_questions',strict:false,schema}}}:{contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:schema,temperature:.25}};
 for(let attempt=1;attempt<=3;attempt++){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});const raw=await r.text();if(r.ok){const p=JSON.parse(raw);const text=provider==='openai'?outputText(p):p?.candidates?.[0]?.content?.parts?.map((x:any)=>x.text??'').join('')??'';return JSON.parse(text);}if(![429,500,502,503,504].includes(r.status)||attempt===3)throw new Error(`${provider} API error ${r.status}: ${raw.slice(0,1200)}`);await new Promise(r=>setTimeout(r,1000*attempt));}throw new Error('AI request failed');
}

function validVisual(q:any){
 const cfg=q?.interaction_config?.visual??q?.interaction_config;if(!cfg||!Array.isArray(cfg.rows)||!cfg.rows.length)return false;
 return cfg.rows.every((r:any)=>{const h=Number(r.hundreds??0),t=Number(r.tens??0),o=Number(r.ones??0),n=Number(r.numberFormed??h*100+t*10+o);return /^([a-z]|[a-z]\d+)$/i.test(String(r.id))&&[h,t,o,n].every(Number.isFinite)&&h>=0&&t>=0&&o>=0&&n===h*100+t*10+o});
}

function normalize(q:any,book:any,section:any,day:string){
 const cfg=q.interaction_config?.visual??q.interaction_config;
 const rows=cfg.rows.map((r:any)=>({id:String(r.id),label:r.label?String(r.label):undefined,hundreds:Number(r.hundreds??0),tens:Number(r.tens??0),ones:Number(r.ones??0),numberFormed:Number(r.numberFormed??Number(r.hundreds??0)*100+Number(r.tens??0)*10+Number(r.ones??0))}));
 const visual={variant:q.question_type==='visual_question'?'base10':'base10_table',columns:Array.isArray(cfg.columns)&&cfg.columns.length?cfg.columns:['Hundreds','Tens','Ones','Number formed'],rows,instruction:String(cfg.instruction??q.prompt),image_url:cfg.image_url??undefined};
 return {topic:String(q.topic??'Place Value'),skill:String(q.skill??'place value'),difficulty:q.difficulty,prompt:String(q.prompt).trim(),options:Array.isArray(q.options)?q.options:[],answer:String(q.correct_answer?.value??''),explanation:String(q.explanation??''),hint:String(q.hint??''),question_type:q.question_type,interaction_config:{visual},source_reference:{book_id:book.id,book:book.title,chapter_id:section.chapter_id,page_start:section.page_start,page_end:section.page_end,generated_for:day}};
}

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');if(!url||!service)return json({error:'Supabase environment is not configured'},500);
  const cronSecret=Deno.env.get('DAILY_GENERATION_SECRET');const provided=req.headers.get('x-cron-secret');const auth=req.headers.get('Authorization');
  const db=createClient(url,service);let authorized=!!cronSecret&&provided===cronSecret;
  if(!authorized&&auth?.startsWith('Bearer ')){const anon=Deno.env.get('SUPABASE_ANON_KEY');if(anon){const client=createClient(url,anon,{global:{headers:{Authorization:auth}}});const {data:{user}}=await client.auth.getUser();if(user){const {data:role}=await db.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();authorized=['admin','teacher'].includes(role?.role);}}}
  if(!authorized)return json({error:'Authentication required'},401);
  const body=await req.json().catch(()=>({}));const grades=Array.isArray(body.grades)?body.grades.map(Number).filter((g:number)=>Number.isInteger(g)&&g>=1&&g<=13):[1,2,3,4,5,6,7,8,9,10,11,12,13];const day=String(body.date??new Date().toISOString().slice(0,10));
  const provider=(Deno.env.get('AI_PROVIDER')??'openai').toLowerCase();const key=provider==='gemini'?Deno.env.get('GEMINI_API_KEY'):Deno.env.get('OPENAI_API_KEY');const model=provider==='gemini'?(Deno.env.get('GEMINI_MODEL')??'gemini-3.6-flash'):(Deno.env.get('OPENAI_MODEL')??'gpt-5.6-luna');if(!key)return json({error:`${provider} API key is not configured`},500);
  const {data:books,error:be}=await db.from('books').select('id,title,subject,grade,min_age,max_age').eq('is_active',true).eq('processing_status','indexed').in('grade',grades);if(be)throw new Error(`Book lookup failed: ${describe(be)}`);
  const results:any[]=[];
  for(const book of books??[]){try{
   const {count}=await db.from('learning_questions').select('id',{count:'exact',head:true}).eq('source_book_id',book.id).eq('source_page_start',Number(body.page_start??-1));
   let section:any=null;const {data:sections,error:se}=await db.from('book_sections').select('id,chapter_id,title,page_start,page_end,content').eq('chapter_id',body.chapter_id??'00000000-0000-0000-0000-000000000000').limit(1);if(body.chapter_id&&!se&&sections?.[0])section=sections[0];
   if(!section){const {data:all,error:ae}=await db.from('book_sections').select('id,chapter_id,title,page_start,page_end,content,section_order').in('chapter_id',(await db.from('book_chapters').select('id').eq('book_id',book.id)).data?.map((x:any)=>x.id)??[]).order('section_order').order('page_start');if(ae||!all?.length){results.push({book_id:book.id,status:'no_source'});continue;}section=all[Math.abs(day.split('-').join('').split('').reduce((a,c)=>a+c.charCodeAt(0),0))%all.length];}
   const duplicateKey=`${book.id}:${section.page_start??0}:${day}`;const {data:existing}=await db.from('learning_questions').select('id').eq('source_book_id',book.id).eq('source_page_start',section.page_start??0).eq('source_page_end',section.page_end??0).limit(1);if(existing?.length){results.push({book_id:book.id,status:'already_generated'});continue;}
   const prompt=`Generate exactly 1 original textbook-style mathematics question for grade ${book.grade} from ONLY this book section. Question type MUST be visual_table or visual_question. Focus on place value/base-10 representation whenever the section supports it. The learner must enter Hundreds, Tens, Ones and Number formed directly in the table. Use 2-5 rows labelled a,b,c,d,e as appropriate. Every row must satisfy numberFormed = hundreds*100 + tens*10 + ones. Do not put combined digits, emoji, or decorative symbols into data cells. Use concise worksheet wording. Return only JSON. BOOK: ${book.title}. SUBJECT: ${book.subject}. GRADE: ${book.grade}. PAGES: ${section.page_start??'?'}-${section.page_end??'?'}\nSECTION: ${section.content}`;
   const generated=await ai(model,key,prompt,provider);const q=generated?.questions?.[0];if(!q||!validVisual(q)){results.push({book_id:book.id,status:'invalid_generation'});continue;}
   const n=normalize(q,book,section,day);const topicId=String(n.topic).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'place-value';
   await db.from('learning_topics').upsert({id:topicId,title:n.topic,description:'Textbook-aligned visual mathematics practice.',level:book.grade<=4?'Foundation':'Development',lessons:1,sort_order:999},{onConflict:'id'});
   const id=`daily-${day.replace(/[^0-9]/g,'')}-${book.grade}-${book.id.replace(/-/g,'').slice(0,8)}`;
   const {error:ie}=await db.from('learning_questions').insert({id,topic_id:topicId,prompt:n.prompt,options:n.options,answer:n.answer,explanation:n.explanation,sort_order:Math.floor(Date.now()/1000),difficulty:n.difficulty,skill:n.skill,question_type:n.question_type,interaction_config:n.interaction_config,hint:n.hint,animation:'question-enter',media_url:null,grade:book.grade,source_book_id:book.id,source_chapter_id:section.chapter_id,source_page_start:section.page_start,source_page_end:section.page_end});if(ie){results.push({book_id:book.id,status:'insert_failed',error:describe(ie)});continue;}
   results.push({book_id:book.id,grade:book.grade,status:'published',question_id:id,pages:[section.page_start,section.page_end]});
  }catch(e){results.push({book_id:book.id,status:'error',error:describe(e)});}
  }
  return json({success:true,date:day,provider,model,generated:results.filter(r=>r.status==='published').length,results});
 }catch(e){return json({error:describe(e)},500)}
});
