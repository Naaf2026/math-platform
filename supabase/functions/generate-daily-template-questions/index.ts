import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-cron-secret"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});

function valueFor(spec:any, seed:number, example:any){
  if(spec&&typeof spec==="object"&&(spec.type==="integer"||spec.type==="number"||spec.kind==="integer"||spec.kind==="number")){
    const min=Number(spec.min??spec.minimum??(spec.range?.[0]??10));
    const max=Number(spec.max??spec.maximum??(spec.range?.[1]??99));
    const safeMin=Number.isFinite(min)?min:10, safeMax=Number.isFinite(max)?max:safeMin+89;
    return Math.floor(Math.abs(Math.sin(seed))*((safeMax-safeMin)+1))+safeMin;
  }
  if(spec?.values&&Array.isArray(spec.values)&&spec.values.length)return spec.values[Math.abs(seed)%spec.values.length];
  if(example!==undefined&&example!==null)return example;
  return String.fromCharCode(65+(Math.abs(seed)%26));
}
function evalRule(node:any,vars:any,answers:any={}):any{
  if(node==null)return null;
  if(typeof node==="number"||typeof node==="boolean")return node;
  if(typeof node==="string")return Object.prototype.hasOwnProperty.call(vars,node)?vars[node]:Object.prototype.hasOwnProperty.call(answers,node)?answers[node]:node;
  if(Array.isArray(node))return node.map(x=>evalRule(x,vars,answers));
  const op=node.op;
  if(op==="value")return evalRule(node.name,vars,answers);
  const args=Array.isArray(node.args)?node.args.map((x:any)=>Number(evalRule(x,vars,answers))):[];
  if(op==="add")return args.reduce((a,b)=>a+b,0);
  if(op==="subtract")return args.slice(1).reduce((a,b)=>a-b,args[0]??0);
  if(op==="multiply")return args.reduce((a,b)=>a*b,1);
  if(op==="divide")return args.slice(1).reduce((a,b)=>a/b,args[0]??0);
  throw new Error(`Unsupported operation ${op}`);
}
function render(text:string,vars:any){return text.replace(/\{([a-zA-Z0-9_]+)\}/g,(_,k)=>String(vars[k]??`{${k}}`));}
function visual(type:string,cfg:any,vars:any,answers:any){
 const v=cfg&&typeof cfg==="object"?structuredClone(cfg):{};
 if(type==="number_line"){
   const start=Number(vars.start??vars.starting_number??0),forward=Number(vars.forward??vars.steps_forward??0),backward=Number(vars.backward??vars.steps_backward??0);
   return {...v,type:"number_line",start,forward,backward,firstResult:answers.alima??answers.first??start+forward,secondResult:answers.ibrahim??answers.second??start+forward-backward};
 }
 if(type==="visual_table"||type==="visual_question"){
   const rows=Array.isArray(v.rows)?v.rows.map((r:any,i:number)=>{const key=r.value_variable||r.variable||String.fromCharCode(97+i),n=Number(vars[key]??r.number??0);return {...r,id:r.id||key,hundreds:Math.floor(Math.abs(n)/100)%10,tens:Math.floor(Math.abs(n)/10)%10,ones:Math.abs(n)%10,numberFormed:n};}):[];
   return {...v,type,rows};
 }
 return v;
}

Deno.serve(async(req)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return out({error:"Supabase environment is not configured"},500);
 const secret=Deno.env.get("DAILY_GENERATION_SECRET")||Deno.env.get("DAILY_QUESTION_CRON_SECRET");if(!secret||req.headers.get("x-cron-secret")!==secret)return out({error:"Cron authorization required"},401);
 const db=createClient(url,key),body=await req.json().catch(()=>({}));const day=String(body.date??new Date().toISOString().slice(0,10));
 const {data:templates,error:te}=await db.from("question_templates").select("*").eq("active",true).limit(500);if(te)throw te;
 const results:any[]=[];
 for(const t of templates??[]){try{
   const {data:book}=t.book_id?await db.from("books").select("id,title,subject,grade").eq("id",t.book_id).maybeSingle():{data:null};
   const grade=Number(body.grade??book?.grade);if(body.grade&&grade!==Number(book?.grade))continue;
   const seed=Array.from(`${day}:${t.id}`).reduce((a,c)=>a+c.charCodeAt(0),0);
   const vars:any={};const defs=t.variables||{};for(const [name,spec] of Object.entries(defs))vars[name]=valueFor(spec,seed+name.length+(name.charCodeAt(0)||0),(t.example_values||{})[name]);
   const answers:any={};for(const [name,rule] of Object.entries(t.answer_rules||{}))answers[name]=evalRule(rule,vars,answers);
   const prompt=render(t.template_text,vars);
   const visualCfg=visual(t.question_type,t.illustration_config,vars,answers);
   const interaction={...(t.interaction_config||{})};
   if(["number_line","visual_table","visual_question"].includes(t.question_type))interaction.visual=visualCfg;
   const answer=Object.keys(answers).length===1?answers[Object.keys(answers)[0]]:answers;
   const topicId=(t.template_name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"textbook").slice(0,80);
   await db.from("learning_topics").upsert({id:topicId,title:t.template_name,description:"Textbook-aligned practice",level:grade<=4?"Foundation":"Development",lessons:1,sort_order:998},{onConflict:"id",ignoreDuplicates:true});
   const existing=await db.from("question_template_instances").select("id,learning_question_id").eq("template_id",t.id).eq("generated_on",day).limit(1);
   if(existing.data?.length){results.push({template_id:t.id,status:"already_generated"});continue;}
   const qid=`daily-tpl-${day.replace(/[^0-9]/g,"")}-${t.id.replace(/-/g,"").slice(0,10)}`;
   const tags={textbook_template:true,template_id:t.id,book_id:t.book_id,chapter_id:t.chapter_id,source_page_start:t.source_page_start,source_page_end:t.source_page_end};
   const {error:qe}=await db.from("learning_questions").insert({
     id:qid,topic_id:topicId,prompt,options:[],answer:typeof answer==="object"?JSON.stringify(answer):String(answer),
     explanation:"Solve the question using the same method shown in the textbook exercise.",sort_order:seed,difficulty:"medium",skill:"textbook-template",
     question_type:t.question_type,interaction_config:interaction,hint:"",animation:"question-enter",time_limit_seconds:null,media_url:null,
     title:t.template_name,subject:book?.subject||"Mathematics",status:"published",version:1,tags,mission_ids:[],usage_count:0,correct_count:0,
     source_ai_question_id:null,published_at:new Date().toISOString(),published_by:null,grade_level:Number.isFinite(grade)?String(grade):null,daily_challenge_enabled:true,template_id:t.id
   });
   if(qe){results.push({template_id:t.id,status:"insert_failed",error:qe.message});continue;}
   const {error:ie}=await db.from("question_template_instances").insert({template_id:t.id,learning_question_id:qid,values:vars,generated_on:day});
   if(ie){results.push({template_id:t.id,status:"instance_failed",error:ie.message});continue;}
   results.push({template_id:t.id,status:"published",question_id:qid,grade,prompt});
 }catch(e){results.push({template_id:t.id,status:"error",error:e instanceof Error?e.message:String(e)})}}
 return out({success:true,date:day,generated:results.filter(x=>x.status==="published").length,results});
}catch(e){return out({error:e instanceof Error?e.message:String(e)},500)}});
