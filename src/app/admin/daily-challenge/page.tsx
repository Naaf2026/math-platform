"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Target, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

type Question={id:string;prompt:string;question_type:string;difficulty:string;skill:string;subject:string;grade_level:string|null;status:string;daily_challenge_enabled:boolean;source_ai_question_id:string|null;created_at:string};

export default function DailyChallengeAdmin(){
 const supabase=createClient();
 const [questions,setQuestions]=useState<Question[]>([]);
 const [grade,setGrade]=useState("all");
 const [enabled,setEnabled]=useState("all");
 const [search,setSearch]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 async function load(){
  setLoading(true);setNotice("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){location.href="/login";return;}
  const role=await getUserRole(supabase,user.id);
  if(role!=="admin"&&role!=="teacher"){setNotice("Teacher or administrator access is required.");setLoading(false);return;}
  const {data,error}=await supabase.from("learning_questions").select("id,prompt,question_type,difficulty,skill,subject,grade_level,status,daily_challenge_enabled,source_ai_question_id,created_at").eq("status","published").order("created_at",{ascending:false}).limit(500);
  if(error)setNotice(error.message);else setQuestions((data??[]) as Question[]);
  setLoading(false);
 }
 useEffect(()=>{void load()},[]);
 async function toggle(q:Question){
  setBusy(q.id);setNotice("");
  const next=!q.daily_challenge_enabled;
  const {error}=await supabase.rpc("set_daily_challenge_question",{p_question_id:q.id,p_enabled:next});
  if(error)setNotice(error.message);else setQuestions(items=>items.map(x=>x.id===q.id?{...x,daily_challenge_enabled:next}:x));
  setBusy(null);
 }
 const grades=useMemo(()=>Array.from(new Set(questions.map(q=>q.grade_level).filter(Boolean))).sort(),[questions]);
 const filtered=useMemo(()=>questions.filter(q=>{
  const g=grade==="all"||q.grade_level===grade;
  const e=enabled==="all"||(enabled==="yes"?q.daily_challenge_enabled:!q.daily_challenge_enabled);
  const s=!search.trim()||q.prompt.toLowerCase().includes(search.toLowerCase())||q.skill?.toLowerCase().includes(search.toLowerCase())||q.subject?.toLowerCase().includes(search.toLowerCase());
  return g&&e&&s;
 }),[questions,grade,enabled,search]);
 const onCount=questions.filter(q=>q.daily_challenge_enabled).length;
 return <main className="min-h-screen bg-slate-50 p-5 pb-24 sm:p-8"><div className="mx-auto max-w-7xl">
  <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Admin Home</Link><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200"><RefreshCw size={16}/> Refresh</button></header>
  <section className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-xl sm:p-9"><div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Target size={14}/> Daily Challenge</div><h1 className="mt-4 text-4xl font-black">Daily Challenge Question Pool</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100">Control which published learning questions can appear in the student Daily Challenge. Book-based AI questions become eligible here automatically when they are published.</p></div><div className="rounded-3xl bg-white/10 px-6 py-5 text-center"><div className="text-4xl font-black">{onCount}</div><div className="mt-1 text-xs font-bold text-indigo-100">Questions enabled</div></div></div></section>
  {notice&&<div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm font-bold text-violet-800">{notice}</div>}
  <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"><div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search question, skill or subject…" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-500"/><select value={grade} onChange={e=>setGrade(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option value="all">All grades</option>{grades.map(g=><option key={g} value={g}>{g}</option>)}</select><select value={enabled} onChange={e=>setEnabled(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option value="all">All Daily Challenge</option><option value="yes">Enabled</option><option value="no">Disabled</option></select><div className="grid place-items-center rounded-xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">Showing {filtered.length}</div></div></section>
  <section className="mt-5 space-y-3">{loading?<div className="rounded-3xl bg-white p-12 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" size={32}/><p className="mt-3 text-sm font-bold text-slate-500">Loading question pool…</p></div>:filtered.length===0?<div className="rounded-3xl bg-white p-12 text-center text-slate-500">No published questions match these filters.</div>:filtered.map((q,i)=><article key={q.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">Q{i+1}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{q.question_type}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{q.grade_level||"All grades"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{q.difficulty}</span>{q.source_ai_question_id&&<span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">Book AI</span>}</div><h2 className="mt-3 font-black leading-6 text-slate-900">{q.prompt}</h2><p className="mt-2 text-xs font-semibold text-slate-400">{q.subject} · {q.skill}</p></div><button onClick={()=>void toggle(q)} disabled={busy===q.id} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:opacity-60 ${q.daily_challenge_enabled?"bg-cyan-600 text-white":"bg-slate-100 text-slate-600"}`}>{busy===q.id?<Loader2 className="animate-spin" size={17}/>:q.daily_challenge_enabled?<CheckCircle2 size={17}/>:<Target size={17}/>} {busy===q.id?"Saving…":q.daily_challenge_enabled?"In Daily Challenge":"Add to Daily Challenge"}</button></div></article>)}</section>
 </div></main>;
}
