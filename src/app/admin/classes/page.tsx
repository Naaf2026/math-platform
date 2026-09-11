"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = { id:number; name:string; class_code:string; grade:string|null; learning_level:string|null; description:string; status:string };
type Profile = { id:string; full_name:string|null; display_name:string|null; grade:string|null; learning_level:string|null };

export default function AdminClassesPage(){
 const supabase=createClient();
 const[classes,setClasses]=useState<ClassRow[]>([]),[profiles,setProfiles]=useState<Profile[]>([]);
 const[status,setStatus]=useState("Loading class management…"),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const[name,setName]=useState(""),[code,setCode]=useState(""),[grade,setGrade]=useState(""),[level,setLevel]=useState(""),[description,setDescription]=useState("");

 async function load(){
  if(!supabase){setStatus("Supabase is not configured yet.");return;}
  setStatus("Loading class management…");setNotice("");
  const{data:{user},error:userError}=await supabase.auth.getUser();
  if(userError){setStatus(`Authentication check failed: ${userError.message}`);return;}
  if(!user){window.location.href="/login";return;}
  const{data:isAdmin,error:roleError}=await supabase.rpc("has_role",{p_role:"admin"});
  if(roleError){setStatus(`Administrator verification failed: ${roleError.message}`);return;}
  if(isAdmin!==true){setStatus("Admin access is required. Your account must have the admin role.\n\nDiagnostic: the signed-in session is valid, but has_role('admin') returned false. This usually means the deployed app is connected to a different Supabase project, or the admin role is not present in that project.");return;}
  const[{data:cs,error:ce},{data:ps,error:pe}]=await Promise.all([
   supabase.from("classes").select("id,name,class_code,grade,learning_level,description,status").order("created_at",{ascending:false}),
   supabase.from("profiles").select("id,full_name,display_name,grade,learning_level").order("full_name")
  ]);
  if(ce){setStatus(ce.message);return;}if(pe){setStatus(pe.message);return;}
  setClasses((cs??[]) as ClassRow[]);setProfiles((ps??[]) as Profile[]);setStatus("");
 }
 useEffect(()=>{void load()},[]);

 async function createClass(e:FormEvent){
  e.preventDefault();if(!supabase)return;setBusy(true);setNotice("");
  const{error}=await supabase.rpc("create_learning_class",{p_name:name,p_class_code:code,p_grade:grade||null,p_learning_level:level||null,p_description:description});
  setBusy(false);if(error){setNotice(error.message);return;}
  setName("");setCode("");setGrade("");setLevel("");setDescription("");setNotice("Class created successfully.");await load();
 }

 if(status)return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-slate-100"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Admin Class Management</h1><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">{status}</p><Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><ArrowLeft size={17}/> Dashboard</Link></div></main>;

 return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-center justify-between gap-4"><Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link><div className="flex gap-2"><Link href="/admin/users" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-slate-200">User Management</Link><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"><RefreshCw size={16}/> Refresh</button></div></header>
  <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><ShieldCheck size={14}/> Secure administrator view</div><h1 className="mt-4 text-4xl font-black">Class Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Create and manage learning classes. Administrator access is verified by the protected Supabase role RPC.</p></div><div className="rounded-2xl bg-white/10 p-4 text-center"><Users className="mx-auto" size={25}/><div className="mt-1 text-2xl font-black">{classes.length}</div><div className="text-xs font-bold text-indigo-100">Classes</div></div></div></section>
  {notice&&<div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm font-bold text-violet-800">{notice}</div>}
  <section className="mt-6 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
   <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center gap-3"><Plus className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">New class</p><h2 className="text-2xl font-black text-[#071b3a]">Create learning class</h2></div></div><form onSubmit={createClass} className="mt-6 space-y-4"><Field label="Class name"><input value={name} onChange={e=>setName(e.target.value)} required placeholder="e.g. Grade 5 Maths"/></Field><Field label="Class code"><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required placeholder="e.g. G5-MATH-01"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Grade"><input value={grade} onChange={e=>setGrade(e.target.value)} placeholder="Grade 5"/></Field><Field label="Learning level"><input value={level} onChange={e=>setLevel(e.target.value)} placeholder="Foundation"/></Field></div><Field label="Description"><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Optional class description"/></Field><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white disabled:opacity-50"><Plus size={18}/>{busy?" Working…":" Create class"}</button></form></div>
   <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Learning classes</p><h2 className="text-2xl font-black text-[#071b3a]">Active class directory</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{classes.filter(c=>c.status==='active').length} active</span></div><div className="mt-5 space-y-3">{classes.length===0?<div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">No classes created yet.</div>:classes.map(c=><div key={c.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#071b3a]">{c.name}</p><p className="mt-1 text-xs font-bold text-slate-500">{c.class_code} · {c.grade||"Grade not set"} · {c.learning_level||"Level not set"}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{c.status}</span></div></div>)}</div></div>
  </section>
  <p className="mt-6 text-center text-xs text-slate-400">{profiles.length} profiles available to the administrator.</p>
 </div></main>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><div className="[&_input]:w-full [&_input]:rounded-2xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:font-semibold [&_textarea]:w-full [&_textarea]:rounded-2xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-white [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm">{children}</div></label>}
