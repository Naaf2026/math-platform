import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-cron-secret"};
const out=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const allowed=new Set(["multiple_choice","number_input","text_input","true_false","ordering","drag_drop","number_line","manipulatives","geometry","timed_challenge","visual_question","visual_table"]);

function clean(value:any){
 if(!Array.isArray(value))return [];
 return value.flatMap((raw:any)=>{
  if(!raw||typeof raw!=="object")return [];
  const type=String(raw.question_type||"");const text=String(raw.template_text||"").trim();
  if(!allowed.has(type)||!text||!raw.variables||typeof raw.variables!=="object"||!raw.answer_rules||typeof raw.answer_rules!=="object")return [];
  return [{template_name:String(raw.template_name||"Textbook template").trim(),question_type:type,template_text:text,variables:raw.variables,answer_rules:raw.answer_rules,illustration_config:raw.illustration_config&&typeof raw.illustration_config==="object"?raw.illustration_config:{},interaction_config:raw.interaction_config&&typeof raw.interaction_config==="object"?raw.interaction_config:{},example_values:raw.example_values&&typeof raw.example_values==="object"?raw.example_values:{},source_excerpt:typeof raw.source_excerpt==="string"?raw.source_excerpt.slice(0,1200):null}];
 });
}

async function askAI(sectionText:string,grade:number|undefined,provider:string){
 const system=`You extract reusable mathematics exercise templates from textbook material. Do not invent a new exercise format. Preserve the exercise's instructional structure, sequence, wording pattern, labels and illustration concept, while turning changeable numbers/content into placeholders such as {start}, {forward}, {backward}. Return structured templates only. Never copy an entire textbook page or its artwork. Identify variables, deterministic answer rules, and deterministic illustration requirements. Express answer_rules as a small JSON operation tree using operations add, subtract, multiply, divide and value references; never executable code.`;
 const user=`Grade: ${grade??"unknown"}\n\nTEXTBOOK SECTION:\n${sectionText}\n\nReturn 1-8 of the clearest reusable exercise templates. Capture number-line starts/movements and answer relationships. Capture base-10/place-value row labels and hundreds/tens/ones structures. For other visual exercises, describe deterministic illustration JSON.`;
 if(provider==="gemini"){
  const key=Deno.env.get("GEMINI_API_KEY");if(!key)throw new Error("GEMINI_API_KEY is not configured");
  const model=Deno.env.get("GEMINI_MODEL")||"gemini-2.5-flash";
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${system}\n\n${user}` }]}],generationConfig:{responseMimeType:"application/json"}})});
  if(!r.ok)throw new Error(`Gemini error ${r.status}`);const d=await r.json();return JSON.parse(d.candidates?.[0]?.content?.parts?.[0]?.text||"{}");
 }
 const key=Deno.env.get("OPENAI_API_KEY");if(!key)throw new Error("OPENAI_API_KEY is not configured");
 const model=Deno.env.get("OPENAI_TEMPLATE_MODEL")||"gpt-5-mini";
 const schema={type:"object",additionalProperties:false,properties:{templates:{type:"array",items:{type:"object",additionalProperties:true}}},required:["templates"]};
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model,input:[{role:"system",content:system},{role:"user",content:user}],text:{format:{type:"json_schema",name:"question_templates",strict:false,schema}}})});
 if(!r.ok)throw new Error(`OpenAI error ${r.status}: ${await r.text()}`);const d=await r.json();const text=d.output_text||d.output?.flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("")?.trim();return JSON.parse(text||"{}");
}

Deno.serve(async(req)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!service)return out({error:"Supabase environment is not configured"},500);
 const admin=createClient(url,service);const token=req.headers.get("Authorization")?.replace(/^Bearer\s+/i,"");if(!token)return out({error:"Authentication required"},401);
 const {data:userData}=await admin.auth.getUser(token);if(!userData.user)return out({error:"Invalid session"},401);
 const {data:role}=await admin.from("user_roles").select("role").eq("user_id",userData.user.id).maybeSingle();if(!role||!["admin","teacher"].includes(role.role))return out({error:"Admin or teacher access required"},403);
 const body=await req.json().catch(()=>({}));const bookId=String(body.book_id||"");if(!bookId)return out({error:"book_id is required"},400);
 const limit=Math.min(Math.max(Number(body.limit||5),1),10);const provider=Deno.env.get("AI_PROVIDER")||"openai";
 const {data:book}=await admin.from("books").select("id,title,subject,grade,processing_status,is_active").eq("id",bookId).maybeSingle();if(!book)return out({error:"Book not found"},404);
 const {data:chapters,error:ce}=await admin.from("book_chapters").select("id").eq("book_id",bookId);if(ce)throw ce;const chapterIds=(chapters||[]).map(x=>x.id);if(!chapterIds.length)return out({success:true,processed:0,message:"No indexed chapters found"});
 const {data:sections,error:se}=await admin.from("book_sections").select("id,chapter_id,title,page_start,page_end,content,section_order").in("chapter_id",chapterIds).order("section_order").limit(limit*3);if(se)throw se;
 const results:any[]=[];let processed=0;
 for(const section of sections||[]){if(processed>=limit)break;if(!section.content||section.content.trim().length<40)continue;
  const {count}=await admin.from("question_templates").select("id",{count:"exact",head:true}).eq("book_id",bookId).eq("chapter_id",section.chapter_id).eq("source_page_start",section.page_start).eq("source_page_end",section.page_end);
  if((count||0)>0){results.push({section_id:section.id,status:"already_extracted"});continue;}
  try{
   const result=await askAI(section.content.slice(0,30000),Number(book.grade)||undefined,provider);const templates=clean(result?.templates);
   if(!templates.length){results.push({section_id:section.id,status:"no_templates"});processed++;continue;}
   const rows=templates.map((t:any)=>({book_id:bookId,chapter_id:section.chapter_id,source_page_start:section.page_start,source_page_end:section.page_end,template_name:t.template_name,question_type:t.question_type,template_text:t.template_text,variables:t.variables,answer_rules:t.answer_rules,illustration_config:t.illustration_config,interaction_config:t.interaction_config,example_values:t.example_values,source_excerpt:t.source_excerpt||null}));
   const {data:inserted,error:ie}=await admin.from("question_templates").insert(rows).select("id,template_name,question_type");if(ie)throw ie;
   results.push({section_id:section.id,status:"extracted",count:inserted?.length||0,page_start:section.page_start,page_end:section.page_end});processed++;
  }catch(e){results.push({section_id:section.id,status:"error",error:e instanceof Error?e.message:String(e)});processed++;}
 }
 return out({success:true,book_id:bookId,processed,results});
}catch(e){return out({success:false,error:e instanceof Error?e.message:String(e)},500)}});
