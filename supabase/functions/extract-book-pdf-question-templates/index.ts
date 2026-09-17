import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const out=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:{...cors,"Content-Type":"application/json"}});
const allowed=new Set(["multiple_choice","number_input","text_input","true_false","ordering","drag_drop","number_line","manipulatives","geometry","timed_challenge","visual_question","visual_table"]);
const clean=(v:any)=>Array.isArray(v)?v.filter(x=>x&&typeof x==="object").map(x=>({template_name:String(x.template_name||"Textbook template"),question_type:String(x.question_type||"number_input"),template_text:String(x.template_text||"").trim(),variables:x.variables||{},answer_rules:x.answer_rules||{},illustration_config:x.illustration_config||{},interaction_config:x.interaction_config||{},example_values:x.example_values||{},source_page_start:Number(x.source_page_start||x.example_page||0)||null,source_page_end:Number(x.source_page_end||x.source_page_start||x.example_page||0)||null,source_excerpt:typeof x.source_excerpt==="string"?x.source_excerpt.slice(0,1200):null})).filter(x=>allowed.has(x.question_type)&&x.template_text&&typeof x.variables==="object"&&typeof x.answer_rules==="object"):[];

async function extract(pdfUrl:string,book:any,apiKey:string){
  const model=Deno.env.get("OPENAI_CURRICULUM_MODEL")||Deno.env.get("OPENAI_MODEL")||"gpt-5-mini";
  const prompt=`Extract reusable mathematics exercise templates from the attached textbook PDF. Use ONLY exercises actually visible in the PDF. Do not invent a new format. Preserve each exercise's instructional structure, sequence, wording pattern, labels, mathematical relationships and illustration concept. Replace only changeable numbers/content with placeholders such as {start}, {forward}, {backward}. Do not reproduce an entire textbook page or artwork. For every template provide deterministic answer_rules as JSON operation trees using value references and add/subtract/multiply/divide. For visual questions provide deterministic illustration_config. Include a short source_excerpt from the actual exercise.\\n\\nBook: ${book.title}; Grade: ${book.grade}; Subject: ${book.subject}.\\nReturn 5-10 strong reusable templates from the clearest exercises in the PDF. Prioritize number-line, place-value/base-10, arithmetic word problems, tables, geometry and other exercises that can be regenerated with new values.\\nReturn ONLY JSON in this shape: {\"templates\":[{\"template_name\":\"...\",\"question_type\":\"number_line|visual_table|visual_question|number_input|multiple_choice|text_input|true_false|ordering|drag_drop|manipulatives|geometry|timed_challenge\",\"template_text\":\"...\",\"variables\":{},\"answer_rules\":{},\"illustration_config\":{},\"interaction_config\":{},\"example_values\":{},\"source_page_start\":1,\"source_page_end\":1,\"source_excerpt\":\"...\"}]}`;
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model,input:[{role:"user",content:[{type:"input_file",file_url:pdfUrl},{type:"input_text",text:prompt}]}],text:{format:{type:"json_object"}},temperature:0.1})});
  if(!r.ok)throw new Error(`OpenAI curriculum extraction failed (${r.status}): ${(await r.text()).slice(0,1400)}`);
  const data=await r.json();
  const text=data?.output?.flatMap((item:any)=>item?.content||[]).map((part:any)=>part?.text||"").join("")||data?.output_text||"";
  if(!text)throw new Error(`OpenAI returned no extraction content${data?.incomplete_details?`: ${JSON.stringify(data.incomplete_details).slice(0,700)}`:""}`);
  try{return JSON.parse(text)}catch{throw new Error(`OpenAI returned invalid JSON: ${text.slice(0,900)}`)}
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  let stage="startup";
  try{
    const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),openai=Deno.env.get("OPENAI_API_KEY");
    if(!url||!service)throw new Error("Supabase environment is not configured");
    if(!openai)throw new Error("OPENAI_API_KEY is not configured in Supabase Edge Function secrets");
    const db=createClient(url,service);
    stage="authentication";
    const token=req.headers.get("Authorization")?.replace(/^Bearer\\s+/i,"");
    if(!token)throw new Error("Authentication required");
    const{data:user,error:authError}=await db.auth.getUser(token);
    if(authError||!user.user)throw new Error(authError?.message||"Invalid session");
    const{data:role,error:roleError}=await db.from("user_roles").select("role").eq("user_id",user.user.id).maybeSingle();
    if(roleError)throw new Error(`Role lookup failed: ${roleError.message}`);
    if(!role||!["admin","teacher"].includes(role.role))throw new Error("Admin or teacher access required");
    stage="request validation";
    const body=await req.json().catch(()=>({}));
    const bookId=String(body.book_id||"");
    if(!bookId)throw new Error("book_id is required");
    const limit=Math.min(Math.max(Number(body.limit||10),1),10);
    stage="book lookup";
    const{data:book,error:bookError}=await db.from("books").select("id,title,subject,grade,file_path,file_name,is_active").eq("id",bookId).eq("is_active",true).maybeSingle();
    if(bookError)throw new Error(`Book lookup failed: ${bookError.message}`);
    if(!book)throw new Error("Book not found");
    if(!book.file_path)throw new Error("Book has no stored PDF");
    stage="PDF access URL";
    const{data:signed,error:signedError}=await db.storage.from("curriculum-books").createSignedUrl(book.file_path,60*30);
    if(signedError||!signed?.signedUrl)throw new Error(signedError?.message||"Unable to create a temporary PDF access URL");
    stage="OpenAI textbook extraction";
    const result=await extract(signed.signedUrl,book,openai);
    const templates=clean(result?.templates).slice(0,limit);
    if(!templates.length)throw new Error("No valid textbook templates were extracted from the PDF");
    stage="template save";
    const{data:chapters,error:chapterError}=await db.from("book_chapters").select("id,chapter_number,page_start,page_end").eq("book_id",bookId).order("chapter_number");
    if(chapterError)throw new Error(`Chapter lookup failed: ${chapterError.message}`);
    const rows=templates.map((t:any)=>{const p=Number(t.source_page_start||0);const ch=(chapters||[]).find((c:any)=>p&&Number(c.page_start)<=p&&Number(c.page_end)>=p);return{...t,book_id:bookId,chapter_id:ch?.id||null,created_by:user.user.id}});
    const{data:inserted,error:insertError}=await db.from("question_templates").insert(rows).select("id,template_name,question_type,source_page_start,source_page_end");
    if(insertError)throw new Error(`Template save failed: ${insertError.message}`);
    return out({success:true,provider:"openai",model:Deno.env.get("OPENAI_CURRICULUM_MODEL")||Deno.env.get("OPENAI_MODEL")||"gpt-5-mini",book_id:bookId,count:inserted?.length||0,templates:inserted});
  }catch(e){const message=e instanceof Error?e.message:String(e);console.error("extract-book-pdf-question-templates",stage,message);return out({success:false,provider:"openai",stage,error:message},200)}
});