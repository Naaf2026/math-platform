import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const TYPES = ['multiple_choice','number_input','text_input','true_false','ordering','drag_drop','number_line','manipulatives','geometry','timed_challenge'];
const DIFFS = ['easy','medium','hard'];

const schema = {
  type:'object', additionalProperties:false,
  properties:{questions:{type:'array',items:{
    type:'object',additionalProperties:false,
    properties:{
      prompt:{type:'string'},question_type:{type:'string',enum:TYPES},
      difficulty:{type:'string',enum:DIFFS},skill:{type:'string'},topic:{type:'string'},
      options:{type:'array',items:{type:'object',additionalProperties:false,properties:{id:{type:'string'},text:{type:'string'}},required:['id','text']}},
      correct_answer:{type:'object',additionalProperties:false,properties:{value:{type:'string'}},required:['value']},
      explanation:{type:'string'},hint:{type:'string'},
      interaction_config:{type:'object',additionalProperties:true},
      source_reference:{type:'object',additionalProperties:true},ai_confidence:{type:'number'}
    },
    required:['prompt','question_type','difficulty','skill','topic','options','correct_answer','explanation','hint','interaction_config','source_reference','ai_confidence']
  }}},
  required:['questions']
};

function json(data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{...CORS,'Content-Type':'application/json'}});
}
function err(e:unknown){return e instanceof Error?e.message:typeof e==='string'?e:JSON.stringify(e);}

async function openai(model:string,key:string,prompt:string){
  let last='';
  for(let attempt=1;attempt<=3;attempt++){
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({
        model,
        input:[{role:'user',content:[{type:'input_text',text:prompt}]}],
        text:{format:{type:'json_schema',name:'daily_challenge_questions',strict:true,schema}}
      })
    });
    const raw=await r.text();
    if(r.ok){
      const x=JSON.parse(raw);
      const out=x?.output_text??x?.output?.flatMap((i:any)=>i?.content??[]).map((i:any)=>i?.text??'').join('')??'';
      if(!out) throw new Error('OpenAI returned no structured content');
      return JSON.parse(out);
    }
    last=raw.slice(0,1600);
    if(![429,500,502,503,504].includes(r.status)||attempt===3) throw new Error('OpenAI API error '+r.status+': '+last);
    const ra=Number(r.headers.get('retry-after'));
    await new Promise(r=>setTimeout(r,Math.min(Number.isFinite(ra)&&ra>0?ra*1000:1000*2**(attempt-1),8000)));
  }
  throw new Error(last);
}

function normalize(q:any,book:any,chapter:any,objective:any){
  const options=(Array.isArray(q.options)?q.options:[]).map((o:any)=>({id:String(o?.id??'').trim(),text:String(o?.text??'').trim()})).filter((o:any)=>o.id&&o.text);
  let answer=String(q?.correct_answer?.value??q?.correct_answer??'').trim();
  const hit=options.find((o:any)=>o.id.toLowerCase()===answer.toLowerCase());
  if(hit) answer=hit.text;
  let interaction=q?.interaction_config&&typeof q.interaction_config==='object'?q.interaction_config:{};

  if(q.question_type==='number_line'){
    const start=Number(interaction.start??interaction.starting_number??0);
    const moves=Array.isArray(interaction.moves)?interaction.moves.map((m:any)=>({
      character:String(m.character??''),steps:Number(m.steps??0),
      direction:String(m.direction??'forward').toLowerCase()==='backward'?'backward':'forward',
      answer:Number(m.answer)
    })).filter((m:any)=>Number.isFinite(m.answer)):[];
    const inputs=Array.isArray(interaction.inputs)?interaction.inputs.map((i:any)=>({
      position:Number(i.position),answer:Number(i.answer),editable:i.editable!==false
    })).filter((i:any)=>Number.isFinite(i.position)&&Number.isFinite(i.answer)):[];
    const nums=[start,...moves.map((m:any)=>m.answer),...inputs.map((i:any)=>i.answer)].filter(Number.isFinite);
    const min=Number(interaction.min??Math.min(...nums));
    const max=Number(interaction.max??Math.max(...nums));
    interaction={
      type:'number_line',start,min,max,
      boxes:Math.max(2,Math.min(21,Number(interaction.boxes??(max-min+1)))),
      step:Number(interaction.step??1),moves,inputs,
      illustration:{type:'number_line_story',characters:moves.map((m:any)=>m.character).filter(Boolean)}
    };
    const editable=inputs.filter((i:any)=>i.editable!==false);
    if(editable.length) answer=editable.map((i:any)=>String(i.answer)).join('|');
  }

  return {
    topic:String(q.topic??objective?.title??chapter?.title??book.subject),
    skill:String(q.skill??objective?.skill_code??'curriculum'),
    difficulty:q.difficulty,question_type:q.question_type,
    prompt:String(q.prompt??'').trim(),options,
    correct_answer:{value:answer},
    explanation:String(q.explanation??'').trim(),hint:String(q.hint??'').trim(),
    interaction_config:interaction,
    source_reference:q.source_reference??{book:book.title,chapter:chapter?.title??null,page_start:chapter?.page_start??null,page_end:chapter?.page_end??null},
    ai_confidence:Number(q.ai_confidence??0.8)
  };
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:CORS});
  if(req.method!=='POST') return json({error:'POST required'},405);

  try{
    const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),key=Deno.env.get('OPENAI_API_KEY');
    const model=Deno.env.get('OPENAI_DAILY_CHALLENGE_MODEL')??Deno.env.get('OPENAI_MODEL')??'gpt-5.6-luna';
    if(!url||!service||!key) return json({error:'OpenAI Daily Challenge service is not configured'},500);

    const auth=req.headers.get('Authorization');
    if(!auth?.startsWith('Bearer ')) return json({error:'Authentication required'},401);
    const db=createClient(url,service);
    const {data:{user},error:userError}=await db.auth.getUser(auth.slice(7));
    if(userError||!user) return json({error:'Invalid authentication token'},401);
    const {data:role}=await db.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();
    if(!['admin','teacher'].includes(role?.role??'')) return json({error:'Administrator or teacher access required'},403);

    const body=await req.json();
    const grade=Number(body.grade),count=Math.max(1,Math.min(10,Number(body.count??5)));
    if(!Number.isInteger(grade)||grade<1||grade>13) return json({error:'Invalid grade'},400);
    const difficulty=DIFFS.includes(body.difficulty)?body.difficulty:'adaptive';

    let bq=db.from('books').select('id,title,subject,grade,min_age,max_age,academic_year').eq('is_active',true).eq('grade',grade).eq('processing_status','indexed').order('updated_at',{ascending:false}).limit(1);
    if(body.book_id) bq=bq.eq('id',body.book_id);
    const {data:books,error:be}=await bq;
    const book=books?.[0];
    if(be||!book) return json({error:'No indexed book found for this grade',detail:err(be)},404);

    let cq=db.from('book_chapters').select('id,title,chapter_number,page_start,page_end,content').eq('book_id',book.id).order('chapter_number',{ascending:true}).limit(1);
    if(body.chapter_id) cq=db.from('book_chapters').select('id,title,chapter_number,page_start,page_end,content').eq('id',body.chapter_id).eq('book_id',book.id).limit(1);
    const {data:chapters,error:ce}=await cq;
    const chapter=chapters?.[0];
    if(ce||!chapter) return json({error:'No indexed chapter found',detail:err(ce)},404);

    let objective:any=null;
    if(body.learning_objective_id){
      const x=await db.from('learning_objectives').select('id,title,description,skill_code,cognitive_level').eq('id',body.learning_objective_id).eq('book_id',book.id).maybeSingle();
      objective=x.data;
    }else{
      const x=await db.from('learning_objectives').select('id,title,description,skill_code,cognitive_level').eq('book_id',book.id).eq('chapter_id',chapter.id).limit(1);
      objective=x.data?.[0]??null;
    }

    const sr=await db.from('book_sections').select('title,page_start,page_end,content').eq('chapter_id',chapter.id).order('section_order',{ascending:true}).limit(8);
    if(sr.error) throw sr.error;

    const context=[
      'BOOK: '+book.title,'SUBJECT: '+book.subject,'GRADE: '+grade,
      'AGE RANGE: '+(book.min_age??'?')+'-'+(book.max_age??'?'),
      'CHAPTER: '+chapter.title,
      'OBJECTIVE: '+(objective?.title??'not specified'),
      'OBJECTIVE DESCRIPTION: '+(objective?.description??''),
      'SKILL CODE: '+(objective?.skill_code??''),
      'CHAPTER CONTENT:\\n'+(chapter.content??''),
      'SECTIONS:\\n'+(sr.data??[]).map((s:any)=>'[pages '+(s.page_start??'?')+'-'+(s.page_end??'?')+'] '+s.title+'\\n'+s.content).join('\\n\\n')
    ].join('\\n');

    const prompt=[
      'You are the FAHI VISSNUN Daily Challenge Generator for a Maldives Grade '+grade+' mathematics platform.',
      'Use ONLY the supplied indexed textbook content. The textbook is the curriculum authority.',
      'Create '+count+' ORIGINAL questions. Do not copy a textbook question verbatim. Preserve its mathematical concept, pedagogical structure, representations and approximate difficulty while changing numbers, names and context when appropriate.',
      'Use only these renderer types: '+TYPES.join(', ')+'. Prefer interactive types supported by the source.',
      'Requested difficulty: '+difficulty+'. Every question must have exactly one defensible answer.',
      'For number_line, interaction_config MUST contain type, start, min, max, boxes, step, moves, inputs and illustration. moves are {character,steps,direction,answer}; inputs are {position,answer,editable}; correct_answer.value is editable answers joined by |. Do not put emoji or combined Dhivehi characters in cells.',
      'For manipulatives, use structured counts such as hundreds, tens and ones; do not use emoji as the actual visual.',
      'For geometry, return renderer-ready shape/type/count/measurement data, not image URLs.',
      'Include source_reference with book, chapter and page information. Return only JSON.',
      '\\nTEXTBOOK CONTEXT:\\n'+context
    ].join('\\n');

    const generated=await openai(model,key,prompt);
    const raw=Array.isArray(generated?.questions)?generated.questions:[];
    const rows=raw.slice(0,count).map((q:any)=>{
      const n=normalize(q,book,chapter,objective);
      return {
        book_id:book.id,chapter_id:chapter.id,learning_objective_id:objective?.id??null,
        grade,age_min:book.min_age,age_max:book.max_age,subject:book.subject,
        topic:n.topic,skill:n.skill,difficulty:n.difficulty,question_type:n.question_type,
        prompt:n.prompt,options:n.options,correct_answer:n.correct_answer,
        explanation:n.explanation,hint:n.hint,interaction_config:n.interaction_config,
        source_reference:n.source_reference,ai_confidence:n.ai_confidence,
        validation_status:'pending',validation_errors:[],daily_challenge_enabled:true
      };
    }).filter((q:any)=>q.prompt&&TYPES.includes(q.question_type)&&DIFFS.includes(q.difficulty)&&String(q.correct_answer?.value??'').trim());

    if(!rows.length) return json({error:'OpenAI generated no valid Daily Challenge questions'},502);

    const off=await db.from('ai_generated_questions').update({daily_challenge_enabled:false}).eq('grade',grade).eq('subject',book.subject).eq('daily_challenge_enabled',true);
    if(off.error) throw off.error;
    const ins=await db.from('ai_generated_questions').insert(rows).select('id,question_type,prompt,difficulty,source_reference');
    if(ins.error) throw ins.error;

    return json({status:'completed',provider:'openai',model,book_id:book.id,book:book.title,grade,subject:book.subject,chapter:chapter.title,generated_count:rows.length,questions:ins.data??[]});
  }catch(e){
    console.error('[generate-daily-challenge]',e);
    return json({error:'Daily Challenge generation failed',detail:err(e)},200);
  }
});
