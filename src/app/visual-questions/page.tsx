"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Eye, LockKeyhole, Sparkles, Trophy } from "lucide-react";
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
 const [error,setError]=useState(""); const [earned,setEarned]=useState(0); const [correct,setCorrect]=useState(0); const [finished,setFinished]=useState(false);

 useEffect(()=>{void load();},[]);
 async function load(){
  const supabase=createClient(); if(!supabase){setError("Learning account is not configured.");setLoading(false);return;}
  const {data:auth}=await supabase.auth.getUser(); if(!auth.user){window.location.href="/login";return;}
  const {data:a,error:ae}=await supabase.rpc("get_visual_question_access");
  if(ae){setError(ae.message);setLoading(false);return;}
  const state=(Array.isArray(a)?a[0]:a) as Access|undefined; setAccess(state??null);
  if(!state?.enabled){setLoading(false);return;}
  const remaining=state.daily_limit===null?20:Math.max(0,state.daily_limit-(state.used_today||0));
  if(remaining<=0){setLoading(false);return;}
  const {data:q,error:qe}=await supabase.rpc("get_visual_questions",{p_limit:Math.min(20,remaining)});
  if(qe){setError(qe.message);setLoading(false);return;}
  setQuestions((q??[]) as Question[]);setLoading(false);
 }
 function answer(value:string){
  if(selected!==null)return; setSelected(value);
  const q=questions[index]; if(!q)return;
  let ok=false;
  if(q.question_type==="visual_table"){try{const got=JSON.parse(value);const expected=JSON.parse(q.answer);ok=JSON.stringify(got)===JSON.stringify(expected);}catch{}}
  else ok=value.trim().toLowerCase()===q.answer.trim().toLowerCase();
  if(ok){setCorrect(v=>v+1);setEarned(v=>v+(q.points??10));}
  window.setTimeout(()=>{if(index>=questions.length-1)setFinished(true);else{setIndex(v=>v+1);setSelected(null);}},1100);
 }
 const used=access?.used_today??0; const limit=access?.daily_limit??20; const remaining=limit===null?null:Math.max(0,limit-used);
 if(loading)return <main className="min-h-screen bg-[#eef9ff] grid place-items-center p-6"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-100 text-3xl">👀</div><h1 className="mt-5 text-2xl font-black text-[#083d78]">Preparing Visual Questions</h1><p className="mt-2 text-sm font-bold text-[#6685a4]">Loading your visual maths adventure…</p></div></main>;
 if(error)return <main className="min-h-screen bg-[#eef9ff] grid place-items-center p-6"><div className="max-w-md rounded-[2rem] bg-white p-9 text-center shadow-xl"><h1 className="text-2xl font-black text-[#083d78]">Visual Questions are not ready</h1><p className="mt-3 text-sm font-semibold text-[#6685a4]">{error}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-[#197fe9] px-6 py-3 font-black text-white">Back to Dashboard</Link></div></main>;
 if(!access?.enabled)return <Locked plan={access?.plan_name??"Free"}/>;
 if((access.daily_limit!==null&&used>=access.daily_limit)||!questions.length)return <Limit used={used} limit={access.daily_limit}/>;
 if(finished)return <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 pb-24 lg:pb-0"><div className="mx-auto flex min-h-[85vh] max-w-2xl items-center justify-center p-5"><div className="w-full rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-12"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-yellow-100 text-yellow-500"><Trophy size={52}/></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-sky-600">Visual session complete</p><h1 className="mt-2 text-4xl font-black text-[#083d78]">Amazing work! 🎉</h1><div className="mt-7 grid grid-cols-3 gap-3"><Stat label="Correct" value={`${correct}/${questions.length}`}/><Stat label="XP earned" value={`+${earned}`}/><Stat label="Used today" value={limit===null?`${used+questions.length}`: `${Math.min(limit,used+questions.length)}/${limit}`}/></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/dashboard" className="flex-1 rounded-2xl bg-[#197fe9] px-6 py-3 font-black text-white">Back to Dashboard</Link><button onClick={()=>window.location.reload()} className="flex-1 rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-700">Play Again</button></div></div></div><LearnerBottomNav/></main>;
 const q=questions[index]; const progress=Math.round(((index)/questions.length)*100);
 return <main className="min-h-screen bg-[#eef9ff] pb-24 text-[#083d78] lg:pb-0">
  <header className="sticky top-0 z-30 border-b border-[#dcecf6] bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6"><Link href="/dashboard" className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef6fc] text-[#197fe9]"><ArrowLeft size={18}/></Link><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#197fe9]">Premium • Visual Maths</p><h1 className="truncate text-base font-black sm:text-lg">See it. Think it. Solve it. 👀</h1></div><div className="rounded-2xl bg-[#fff4cf] px-3 py-2 text-xs font-black text-[#806a12]"><Crown size={14} className="mr-1 inline"/> {access.plan_name}</div></div></header>
  <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8"><section className="rounded-[2rem] bg-gradient-to-br from-[#197fe9] via-[#2877e8] to-[#695de7] p-5 text-white shadow-xl sm:p-7"><div className="flex items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"><Eye size={14}/> Visual Questions</div><h2 className="mt-2 text-2xl font-black sm:text-3xl">Learn by seeing & doing</h2><p className="mt-1 text-sm font-semibold text-blue-100">Question {index+1} of {questions.length} • {q.skill||"Visual Maths"}</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><p className="text-xl font-black">{remaining===null?"∞":remaining}</p><p className="text-[10px] font-black uppercase text-white/70">Remaining</p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{width:`${Math.max(5,progress)}%`}}/></div></section>
   <section className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100"><div className="border-b border-slate-100 px-5 py-4 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">{q.skill||"Visual Question"}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{q.difficulty}</span><span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-orange-700">⭐ +{q.points??10} XP</span></div></div><div className="px-5 py-7 sm:px-10 sm:py-10"><h2 className="text-2xl font-black leading-relaxed text-[#15233f] sm:text-3xl">{q.prompt}</h2><InteractiveQuestionEngine question={q as never} selected={selected} disabled={selected!==null} onAnswer={answer}/></div></section></div>
  <LearnerBottomNav/>
 </main>;
}
function Locked({plan}:{plan:string}){return <main className="min-h-screen bg-[#eef9ff] pb-24 lg:pb-0"><div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center p-5"><div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#fff4cf] text-[#f3a900]"><LockKeyhole size={40}/></div><h1 className="mt-5 text-3xl font-black text-[#083d78]">Visual Questions are Premium 👑</h1><p className="mt-3 font-semibold leading-6 text-[#6685a4]">Use Premium to unlock interactive visual maths activities including place value, number lines, patterns, shapes and more.</p><Link href="/subscription" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#197fe9] px-7 py-3.5 font-black text-white"><Crown size={18}/> View Premium</Link><p className="mt-4 text-xs font-bold text-slate-400">Current plan: {plan}</p></div></div><LearnerBottomNav/></main>}
function Limit({used,limit}:{used:number;limit:number|null}){return <main className="min-h-screen bg-[#eef9ff] pb-24 lg:pb-0"><div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center p-5"><div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#e8f4ff] text-4xl">🌟</div><h1 className="mt-5 text-3xl font-black text-[#083d78]">Great visual work today!</h1><p className="mt-3 font-semibold leading-6 text-[#6685a4]">You have used {used} of {limit??"your"} Visual Questions for today. Your limit resets tomorrow.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-[#197fe9] px-7 py-3.5 font-black text-white">Back to Dashboard</Link></div></div><LearnerBottomNav/></main>}
function Stat({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xl font-black text-[#15233f]">{value}</p><p className="mt-1 text-xs font-bold text-slate-400">{label}</p></div>}
