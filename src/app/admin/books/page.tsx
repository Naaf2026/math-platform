"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

type Book={id:string;title:string;subject:string;grade:number;min_age:number|null;max_age:number|null;academic_year:number|null;publisher:string|null;description:string|null;file_name:string|null;file_size:number|null;processing_status:string;is_active:boolean;created_at:string;curriculum?:{name:string}|null};
type Curriculum={id:string;name:string};
const input="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export default function AdminBooksPage(){
 const supabase=createClient();
 const[books,setBooks]=useState<Book[]>([]),[curriculums,setCurriculums]=useState<Curriculum[]>([]),[search,setSearch]=useState("");
 const[status,setStatus]=useState("Loading book library…"),[notice,setNotice]=useState(""),[showForm,setShowForm]=useState(false),[busy,setBusy]=useState(false),[file,setFile]=useState<File|null>(null);
 const[title,setTitle]=useState(""),[subject,setSubject]=useState("Mathematics"),[grade,setGrade]=useState("5"),[minAge,setMinAge]=useState(""),[maxAge,setMaxAge]=useState(""),[year,setYear]=useState(String(new Date().getFullYear())),[publisher,setPublisher]=useState(""),[curriculumId,setCurriculumId]=useState(""),[newCurriculum,setNewCurriculum]=useState(""),[description,setDescription]=useState("");

 async function load(){
  if(!supabase){setStatus("Supabase is not configured yet.");return;}
  setStatus("Loading book library…");
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){window.location.href="/login";return;}
  const role=await getUserRole(supabase,user.id);
  if(role!=="admin"){setStatus("Administrator access is required.");return;}
  const[{data:b,error:be},{data:c,error:ce}]=await Promise.all([
   supabase.from("books").select("id,title,subject,grade,min_age,max_age,academic_year,publisher,description,file_name,file_size,processing_status,is_active,created_at,curriculum:curriculums(name)").eq("is_active",true).order("created_at",{ascending:false}),
   supabase.from("curriculums").select("id,name").eq("active",true).order("name")
  ]);
  if(be){setStatus(be.message);return;}if(ce){setStatus(ce.message);return;}
  setBooks((b??[]) as Book[]);setCurriculums((c??[]) as Curriculum[]);setStatus("");
 }
 useEffect(()=>{void load()},[]);

 function reset(){setTitle("");setSubject("Mathematics");setGrade("5");setMinAge("");setMaxAge("");setYear(String(new Date().getFullYear()));setPublisher("");setCurriculumId("");setNewCurriculum("");setDescription("");setFile(null);setShowForm(false);}
 async function addBook(e:FormEvent){
  e.preventDefault();if(!supabase)return;
  if(!file){setNotice("Please select a PDF book.");return;}if(file.type!=="application/pdf"){setNotice("Only PDF files are supported.");return;}if(file.size>50*1024*1024){setNotice("Maximum PDF size is 50 MB.");return;}
  setBusy(true);setNotice("Uploading book…");
  try{
   let cid=curriculumId||null;
   if(!cid&&newCurriculum.trim()){
    const{data,error}=await supabase.from("curriculums").insert({name:newCurriculum.trim(),active:true}).select("id").single();if(error)throw error;cid=data.id;
   }
   const safe=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");const path=`${grade}/${crypto.randomUUID()}-${safe}`;
   const{error:ue}=await supabase.storage.from("curriculum-books").upload(path,file,{contentType:"application/pdf",upsert:false});if(ue)throw ue;
   const{error:be}=await supabase.from("books").insert({curriculum_id:cid,title:title.trim(),subject,grade:Number(grade),min_age:minAge?Number(minAge):null,max_age:maxAge?Number(maxAge):null,academic_year:year?Number(year):null,publisher:publisher.trim()||null,description:description.trim()||null,file_path:path,file_name:file.name,file_size:file.size,processing_status:"pending",is_active:true});
   if(be){await supabase.storage.from("curriculum-books").remove([path]);throw be;}
   setNotice("Book added successfully. It is ready for indexing.");reset();await load();
  }catch(err){setNotice(err instanceof Error?err.message:"Unable to add book.");}finally{setBusy(false)}
 }
 async function archive(book:Book){if(!supabase||!confirm(`Archive ${book.title}?`))return;setBusy(true);const{error}=await supabase.from("books").update({is_active:false}).eq("id",book.id);setBusy(false);if(error)setNotice(error.message);else await load();}
 const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return q?books.filter(b=>[b.title,b.subject,String(b.grade),b.publisher,b.curriculum?.name].some(v=>v?.toLowerCase().includes(q))):books},[books,search]);
 if(status)return <Gate status={status}/>;
 return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-center justify-between gap-4"><Link href="/admin" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Admin dashboard</Link><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"><RefreshCw size={16}/> Refresh</button></header>
  <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-10"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><BookOpen size={14}/> Curriculum source library</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Book Library</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100">Upload curriculum books once. The private source will later be indexed and used to ground Gemini question generation.</p></div><div className="rounded-3xl bg-white/10 p-5 text-center"><Sparkles className="mx-auto text-yellow-300" size={25}/><p className="mt-2 text-3xl font-black">{books.length}</p><p className="text-xs font-bold text-indigo-100">Active books</p></div></div></section>
  {notice&&<div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm font-bold text-violet-800">{notice}</div>}
  <section className="mt-6 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Library</p><h2 className="text-2xl font-black text-[#071b3a]">Curriculum sources</h2></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input className={`${input} pl-10 sm:w-72`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search books…"/></div><button onClick={()=>setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><Plus size={18}/> Add Book</button></div></section>
  {showForm&&<section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">New source</p><h2 className="text-2xl font-black text-[#071b3a]">Add Book</h2></div><button onClick={reset} className="rounded-xl p-2 text-slate-400"><X/></button></div><form onSubmit={addBook} className="mt-6 grid gap-4 md:grid-cols-2">
   <Field label="Book title"><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Grade 5 Mathematics" required/></Field><Field label="Subject"><input className={input} value={subject} onChange={e=>setSubject(e.target.value)} required/></Field>
   <Field label="Grade"><select className={input} value={grade} onChange={e=>setGrade(e.target.value)}>{Array.from({length:13},(_,i)=><option key={i} value={i+1}>Grade {i+1}</option>)}</select></Field><Field label="Academic year"><input className={input} value={year} onChange={e=>setYear(e.target.value)} inputMode="numeric"/></Field>
   <Field label="Minimum age"><input className={input} value={minAge} onChange={e=>setMinAge(e.target.value)} placeholder="10" inputMode="numeric"/></Field><Field label="Maximum age"><input className={input} value={maxAge} onChange={e=>setMaxAge(e.target.value)} placeholder="11" inputMode="numeric"/></Field>
   <Field label="Publisher"><input className={input} value={publisher} onChange={e=>setPublisher(e.target.value)} placeholder="Publisher"/></Field><Field label="Curriculum"><select className={input} value={curriculumId} onChange={e=>setCurriculumId(e.target.value)}><option value="">Select existing…</option>{curriculums.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input className={`${input} mt-2`} value={newCurriculum} onChange={e=>setNewCurriculum(e.target.value)} placeholder="Or create new curriculum"/></Field>
   <Field label="Description"><textarea className={input} value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="Book coverage and notes"/></Field><Field label="Book PDF"><label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-4"><Upload className="text-violet-600"/><span className="min-w-0 flex-1"><b className="block truncate">{file?.name||"Choose PDF"}</b><small className="text-slate-500">PDF only · maximum 50 MB</small></span><input type="file" accept="application/pdf,.pdf" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></Field>
   <div className="md:col-span-2 flex justify-end gap-3 border-t pt-5"><button type="button" onClick={reset} className="rounded-2xl border px-5 py-3 font-bold">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 font-black text-white disabled:opacity-50"><Upload size={18}/>{busy?"Uploading…":"Add Book"}</button></div>
  </form></section>}
  <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.length===0?<div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100"><FileText className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-xl font-black text-[#071b3a]">No books yet</h3><p className="mt-2 text-sm text-slate-500">Add your first curriculum PDF to create the AI source library.</p></div>:filtered.map(b=><article key={b.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><BookOpen/></div><span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${b.processing_status==='indexed'?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800"}`}>{b.processing_status}</span></div><h3 className="mt-5 text-xl font-black text-[#071b3a]">{b.title}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{b.subject} · Grade {b.grade}</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><Meta l="Curriculum" v={b.curriculum?.name||"Not set"}/><Meta l="Age" v={b.min_age&&b.max_age?`${b.min_age}–${b.max_age}`:"Not set"}/><Meta l="Year" v={b.academic_year?String(b.academic_year):"Not set"}/><Meta l="File" v={b.file_name||"PDF"}/></div>{b.description&&<p className="mt-4 text-sm leading-6 text-slate-500">{b.description}</p>}<div className="mt-5 flex justify-between border-t pt-4 text-xs"><span className="font-bold text-slate-400">{fmt(b.file_size)}</span><button disabled={busy} onClick={()=>void archive(b)} className="font-black text-slate-500 hover:text-red-600">Archive</button></div></article>)}</section>
  <section className="mt-6 rounded-3xl bg-gradient-to-r from-violet-50 to-cyan-50 p-6 ring-1 ring-violet-100"><div className="flex gap-4"><Sparkles className="shrink-0 text-violet-600"/><div><h2 className="font-black text-[#071b3a]">Next pipeline</h2><p className="mt-1 text-sm leading-6 text-slate-600">Upload → extract chapters → index sections → map learning objectives → generate Gemini questions → validate → publish to the adaptive question bank.</p></div></div></section>
 </div></main>;
}
function Gate({status}:{status:string}){return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Book Library</h1><p className="mt-3 text-sm text-slate-500">{status}</p><Link href="/admin" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Admin dashboard</Link></div></main>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>}
function Meta({l,v}:{l:string;v:string}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{l}</p><p className="mt-1 truncate font-bold text-slate-600">{v}</p></div>}
function fmt(n:number|null){if(!n)return "Size unavailable";return n<1048576?`${Math.round(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`}
