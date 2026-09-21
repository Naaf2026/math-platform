"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Eye, LockKeyhole, Trophy, Home, Gamepad2, Gift, BarChart3, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import InteractiveQuestionEngine from "@/components/interactive-question-engine";
import LearnerBottomNav from "@/components/learner-bottom-nav";

type Question = {
  id:string; prompt:string; options?:string[]; answer:string; explanation?:string; difficulty:string;
  skill?:string; question_type?:string|null; interaction_config?:Record<string,unknown>|null; hint?:string|null; points?:number; grade_level?:string;
};
type Access = {enabled:boolean;daily_limit:number|null;used_today:number;plan_name:string;subscription_status:string;trial_ends_at:string|null};

export default function VisualQuestionsPage(){
 const [access,setAccess]=useState<Access|null>(null); const [questions,setQuestions]=useState<Question[]>([]);
 const [index,setIndex]=useState(0); const [selected,setSelected]=useState<string|null>(null); const [loading,setLoading]=useState(true);
 const [retryVersion,setRetryVersion]=useState(0);
 const [error,setError]=useState(""); const [earned,setEarned]=useState(0);
 const advanceTimer=useRef<number|null>(null); const [correct,setCorrect]=useState(0); const [finished,setFinished]=useState(false);

 useEffect(()=>{void load(); return ()=>{if(advanceTimer.current!==null)window.clearTimeout(advanceTimer.current);};},[]);
 useEffect(()=>{
  const retry=(event:Event)=>{
   const detail=(event as CustomEvent<{id?:string}>).detail;
   const currentId=questions[index]?.id;
   if(detail?.id && currentId && detail.id!==currentId)return;
   if(advanceTimer.current!==null){window.clearTimeout(advanceTimer.current);advanceTimer.current=null;}
   setSelected(null);
  };
  window.addEventListener("fv:retry-question",retry);
  return ()=>window.removeEventListener("fv:retry-question",retry);
 },[]);
 async function withTimeout<T>(promise:Promise<T>,ms=12000):Promise<T>{
  return await Promise.race([
   promise,
   new Promise<T>((_,reject)=>window.setTimeout(()=>reject(new Error("The learning service took too long to respond. Please try again.")),ms))
  ]);
 }
 async function load(){
  setLoading(true);setError("");
  const supabase=createClient(); if(!supabase){setError("Learning account is not configured.");setLoading(false);return;}
  try{
   const {data:auth}=await withTimeout(supabase.auth.getUser());
   if(!auth.user){window.location.href="/login";return;}
   let a:any=null; let ae:any=null;
   for(let attempt=0;attempt<2;attempt++){
    const result=await withTimeout(supabase.rpc("get_visual_question_access"));
    a=result.data; ae=result.error;
    if(!ae)break;
   }
   if(ae)throw new Error(ae.message);
   const state=(Array.isArray(a)?a[0]:a) as Access|undefined; setAccess(state??null);
   if(!state?.enabled){setLoading(false);return;}
   const remaining=state.daily_limit===null?20:Math.max(0,state.daily_limit-(state.used_today||0));
   let q:any=null; let qe:any=null;
   for(let attempt=0;attempt<2;attempt++){
    const result=await withTimeout(supabase.rpc("get_visual_questions",{p_limit:Math.min(20,remaining),p_exclude_ids:[]}));
    q=result.data; qe=result.error;
    if(!qe)break;
   }
   if(qe)throw new Error(qe.message);
   const selectedQuestions=(Array.isArray(q)?q:[]).filter((item:any)=>item && typeof item.id==="string" && typeof item.prompt==="string" && typeof item.answer==="string") as Question[];
   if(!selectedQuestions.length)throw new Error("There are no Grade 2 Visual Lab questions available right now.");
   const record=await withTimeout(supabase.rpc("record_visual_questions",{p_question_ids:selectedQuestions.map(item=>item.id)}));
   if(record.error)throw new Error(record.error.message);
   setQuestions(selectedQuestions);
   setLoading(false);
  }catch(e){
   setError(e instanceof Error?e.message:"Unable to load Visual Questions right now.");setLoading(false);
  }
 }
 function answer(value:string){
  if(selected!==null)return; setSelected(value);
  const q=questions[index]; if(!q)return;
  let ok=false;
  if(q.question_type==="visual_table"){try{const expected=JSON.parse(q.answer);const expectedNumber=Array.isArray(expected)&&expected[0]?.numberFormed!=null?String(expected[0].numberFormed):q.answer;ok=value.trim()===expectedNumber.trim();}catch{ok=value.trim().toLowerCase()===q.answer.trim().toLowerCase();}}
  else ok=value.trim().toLowerCase()===q.answer.trim().toLowerCase();
  if(ok){
   setCorrect(v=>v+1);setEarned(v=>v+(q.points??10));
   if(advanceTimer.current!==null)window.clearTimeout(advanceTimer.current);
   advanceTimer.current=window.setTimeout(()=>{
    advanceTimer.current=null;
    setSelected(null);
    setIndex(prev=>{
      if(prev>=questions.length-1){setFinished(true);return prev;}
      return prev+1;
    });
   },1000);
  }else{
   // Stay on an incorrect question until the learner explicitly retries.
   if(advanceTimer.current!==null){window.clearTimeout(advanceTimer.current);advanceTimer.current=null;}
  }
 }
 const used=access?.used_today??0; const limit=access?.daily_limit??20; const remaining=limit===null?null:Math.max(0,limit-used);
 if(loading)return <main className="min-h-screen bg-[#eef9ff] grid place-items-center p-6"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-100 text-3xl">👀</div><h1 className="mt-5 text-2xl font-black text-[#083d78]">Preparing Visual Questions</h1><p className="mt-2 text-sm font-bold text-[#6685a4]">Loading your visual maths adventure…</p></div></main>;
 if(error)return <main className="min-h-screen bg-[#eef9ff] grid place-items-center p-6"><div className="max-w-md rounded-[2rem] bg-white p-9 text-center shadow-xl"><h1 className="text-2xl font-black text-[#083d78]">Visual Questions are not ready</h1><p className="mt-3 text-sm font-semibold text-[#6685a4]">{error}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><button onClick={()=>void load()} className="rounded-2xl bg-[#197fe9] px-6 py-3 font-black text-white">Try Again</button><Link href="/dashboard" className="rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-700">Back to Dashboard</Link></div></div></main>;
 if(!access?.enabled)return <Locked plan={access?.plan_name??"Free"}/>;
 if((access.daily_limit!==null&&used>=access.daily_limit)||!questions.length)return <Limit used={used} limit={access.daily_limit}/>;
 if(finished)return <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 pb-24 lg:pb-0"><div className="mx-auto flex min-h-[85vh] max-w-2xl items-center justify-center p-5"><div className="w-full rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-12"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-yellow-100 text-yellow-500"><Trophy size={52}/></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-sky-600">Visual session complete</p><h1 className="mt-2 text-4xl font-black text-[#083d78]">Amazing work! 🎉</h1><div className="mt-7 grid grid-cols-3 gap-3"><Stat label="Correct" value={`${correct}/${questions.length}`}/><Stat label="XP earned" value={`+${earned}`}/><Stat label="Used today" value={limit===null?`${used+questions.length}`: `${Math.min(limit,used+questions.length)}/${limit}`}/></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/dashboard" className="flex-1 rounded-2xl bg-[#197fe9] px-6 py-3 font-black text-white">Back to Dashboard</Link><button onClick={()=>window.location.reload()} className="flex-1 rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-700">Play Again</button></div></div></div><LearnerBottomNav/></main>;
 const q=questions[index]; const progress=Math.round(((index)/questions.length)*100);
 return <main className="min-h-screen bg-[#eef9ff] pb-24 text-[#083d78] md:pb-0">
  <header className="sticky top-0 z-30 border-b border-[#dcecf6] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-3 sm:px-4 xl:gap-4 xl:px-6"><Link href="/dashboard" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eef6fc] text-[#197fe9]"><ArrowLeft size={18}/></Link><div className="min-w-0 md:w-[210px] md:shrink-0 xl:w-[300px]"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#197fe9]">Premium • Visual Maths</p><h1 className="truncate text-base font-black sm:text-lg">See it. Think it. Solve it. 👀</h1></div><nav className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 md:flex xl:justify-center xl:gap-3" aria-label="Student navigation desktop"><Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-1.5 py-2 text-[13px] font-black hover:bg-sky-50 lg:px-2 lg:text-sm xl:px-2.5 xl:text-base xl:px-2.5 xl:text-base"><Home size={21}/>Home</Link><Link href="/brain-games" className="flex items-center gap-2 rounded-xl px-1.5 py-2 text-[13px] font-black hover:bg-sky-50 lg:px-2 lg:text-sm xl:px-2.5 xl:text-base xl:px-2.5 xl:text-base"><Gamepad2 size={21}/>Games</Link><Link href="/leaderboard" className="flex items-center gap-2 rounded-xl px-1.5 py-2 text-[13px] font-black hover:bg-sky-50 lg:px-2 lg:text-sm xl:px-2.5 xl:text-base xl:px-2.5 xl:text-base"><Trophy size={21}/>Leaderboard</Link><Link href="/rewards" className="flex items-center gap-2 rounded-xl px-1.5 py-2 text-[13px] font-black hover:bg-sky-50 lg:px-2 lg:text-sm xl:px-2.5 xl:text-base xl:px-2.5 xl:text-base"><Gift size={21}/>Rewards</Link><Link href="/progress" className="flex items-center gap-2 rounded-xl px-1.5 py-2 text-[13px] font-black hover:bg-sky-50 lg:px-2 lg:text-sm xl:px-2.5 xl:text-base xl:px-2.5 xl:text-base"><BarChart3 size={21}/>Progress</Link><Link href="/profile" className="flex items-center gap-2 rounded-xl px-1.5 py-2 text-[13px] font-black hover:bg-sky-50 lg:px-2 lg:text-sm xl:px-2.5 xl:text-base xl:px-2.5 xl:text-base"><GraduationCap size={21}/>Profile</Link></nav><div className="ml-1 shrink-0 rounded-2xl bg-[#fff4cf] px-3 py-2 text-xs font-black text-[#806a12] xl:ml-auto"><Crown size={14} className="mr-1 inline"/> {access.plan_name}</div></div></header>
  <div className="mx-auto flex h-[calc(100dvh-73px)] max-w-6xl flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-4"><section className="rounded-[1.6rem] bg-gradient-to-r from-[#197fe9] via-[#2877e8] to-[#5367ea] px-5 py-3.5 text-white shadow-lg sm:px-6 sm:py-4"><div className="flex items-center gap-3"><div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"><Eye size={14}/> Visual Questions</div><div className="hidden h-5 w-px bg-white/35 sm:block"/><p className="min-w-0 flex-1 truncate text-sm font-bold text-blue-50">Question {index+1} of {questions.length} • {q.skill||"Visual Maths"}</p><div className="shrink-0 rounded-2xl bg-white/10 px-4 py-2 text-center"><p className="text-xl font-black leading-none">{remaining===null?"∞":remaining}</p><p className="mt-1 text-[9px] font-black uppercase text-white/75">Remaining</p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{width:`${Math.max(5,progress)}%`}}/></div></section>
   <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100"><div className="border-b border-slate-100 px-5 py-4 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">{q.skill||"Visual Question"}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{q.difficulty}</span><span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-orange-700">⭐ +{q.points??10} XP</span></div></div><div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-8 sm:py-6 lg:px-10"><h2 className="text-2xl font-black leading-snug text-[#15233f] sm:text-3xl">{q.prompt}</h2><InteractiveQuestionEngine key={"".concat(q.id,"-",retryVersion)} question={q as never} selected={selected} disabled={selected!==null} onAnswer={answer} onRetry={()=>{if(advanceTimer.current!==null){window.clearTimeout(advanceTimer.current);advanceTimer.current=null;}setSelected(null);setRetryVersion(v=>v+1);}}/></div></section></div>
  <LearnerBottomNav/>
 </main>;
}
function Locked({plan}:{plan:string}){return <main className="min-h-screen bg-[#eef9ff] pb-24 lg:pb-0"><div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center p-5"><div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#fff4cf] text-[#f3a900]"><LockKeyhole size={40}/></div><h1 className="mt-5 text-3xl font-black text-[#083d78]">Visual Questions are Premium 👑</h1><p className="mt-3 font-semibold leading-6 text-[#6685a4]">Use Premium to unlock interactive visual maths activities including place value, number lines, patterns, shapes and more.</p><Link href="/subscription" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#197fe9] px-7 py-3.5 font-black text-white"><Crown size={18}/> View Premium</Link><p className="mt-4 text-xs font-bold text-slate-400">Current plan: {plan}</p></div></div><LearnerBottomNav/></main>}
function Limit({used,limit}:{used:number;limit:number|null}){return <main className="min-h-screen bg-[#eef9ff] pb-24 lg:pb-0"><div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center p-5"><div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#e8f4ff] text-4xl">🌟</div><h1 className="mt-5 text-3xl font-black text-[#083d78]">Great visual work today!</h1><p className="mt-3 font-semibold leading-6 text-[#6685a4]">You have used {used} of {limit??"your"} Visual Questions for today. Your limit resets tomorrow.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-[#197fe9] px-7 py-3.5 font-black text-white">Back to Dashboard</Link></div></div><LearnerBottomNav/></main>}
function Stat({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xl font-black text-[#15233f]">{value}</p><p className="mt-1 text-xs font-bold text-slate-400">{label}</p></div>}
