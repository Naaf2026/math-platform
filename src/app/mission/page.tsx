"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Gift, Heart, Lightbulb, RotateCcw, Sparkles, Star, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import InteractiveQuestionEngine from "@/components/interactive-question-engine";

type Question = {
  id:string; topicId:string; topic:string; prompt:string; options:string[]; answer:string;
  explanation:string; difficulty:string; skill:string; points:number;
  interaction_type?:string|null; question_type?:string|null; hint?:string|null;
  interaction_config?:Record<string,unknown>|null;
};

const topics=[
  {name:"Place Value",emoji:"🔢",tone:"from-sky-400 to-cyan-400"},
  {name:"Addition & Subtraction",emoji:"➕",tone:"from-violet-400 to-fuchsia-400"},
  {name:"Multiplication",emoji:"✖️",tone:"from-orange-400 to-amber-400"},
  {name:"Fractions",emoji:"🍕",tone:"from-emerald-400 to-teal-400"},
];
function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}
function levelStart(level:number){return (level-1)*100;}

export default function MissionPage(){
 const[questions,setQuestions]=useState<Question[]>([]),[loading,setLoading]=useState(true),[current,setCurrent]=useState(0),[selected,setSelected]=useState<string|null>(null),[score,setScore]=useState(0),[correct,setCorrect]=useState(0),[finished,setFinished]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(""),[totalXp,setTotalXp]=useState(0),[streak,setStreak]=useState(0),[bestStreak,setBestStreak]=useState(0),[showIntro,setShowIntro]=useState(true),[showHint,setShowHint]=useState(false),[combo,setCombo]=useState(0),[perfectEligible,setPerfectEligible]=useState(true),[retryCount,setRetryCount]=useState(0);
 const q=questions[current];
 const level=useMemo(()=>levelForXp(totalXp),[totalXp]);
 const levelStartXp=levelStart(level),levelProgress=Math.min(100,Math.round(((totalXp-levelStartXp)/100)*100));
 const progress=questions.length?((current+(selected?1:0))/questions.length)*100:0;
 useEffect(()=>{loadMission();},[]);
 useEffect(()=>{
  const onRetry=(event:Event)=>{
   const id=(event as CustomEvent<{id?:string}>).detail?.id;
   if(id&&q?.id&&id!==q.id)return;
   setSelected(null);setSaving(false);setShowHint(false);setRetryCount(v=>v+1);setPerfectEligible(false);setError("");
  };
  window.addEventListener("fv:retry-question",onRetry);
  return()=>window.removeEventListener("fv:retry-question",onRetry);
 },[q?.id]);
 async function loadMission(){
  const supabase=createClient();if(!supabase){setError("Your learning account is not configured yet.");setLoading(false);return;}
  const{data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return;}
  const[{data,error},{data:profile}]=await Promise.all([supabase.rpc("get_adaptive_questions",{p_limit:10}),supabase.from("profiles").select("xp,current_streak,best_streak").eq("id",user.id).maybeSingle()]);
  if(error||!data?.length){setError(error?.message||"No practice questions are available yet.");setLoading(false);return;}
  setQuestions(data.map((item:Question)=>({...item,options:Array.isArray(item.options)?item.options:[]})));setTotalXp(profile?.xp??0);setStreak(profile?.current_streak??0);setBestStreak(profile?.best_streak??0);setLoading(false);
 }
 async function choose(answer:string){
  if(selected||!q)return;setSelected(answer);setSaving(true);setError("");
  const supabase=createClient();if(!supabase){setError("Your learning account is not configured yet.");setSaving(false);return;}
  const{data,error}=await supabase.rpc("submit_learning_answer",{p_question_id:q.id,p_selected_answer:answer});
  if(error){setError("Your answer could not be saved. Please try again.");setSaving(false);return;}
  const result=data?.[0];
  if(result?.is_correct){
   const earned=result.xp_awarded||0;
   const nextCombo=combo+1;
   const multiplier=Math.min(3,1+Math.floor(nextCombo/2)*0.5);
   const bossMultiplier=q.difficulty==='hard'?1.5:1;
   const hintMultiplier=showHint?0.5:1;
   const bonusEarned=Math.round(earned*multiplier*bossMultiplier*hintMultiplier);
   setCombo(nextCombo);setCorrect(v=>v+1);setScore(v=>v+bonusEarned);setTotalXp(v=>v+earned);
   if(showHint)setPerfectEligible(false);
  } else {
   setCombo(0);setPerfectEligible(false);
  }
  const{data:profile}=await supabase.from("profiles").select("xp,current_streak,best_streak").maybeSingle();if(profile){setTotalXp(profile.xp??0);setStreak(profile.current_streak??0);setBestStreak(profile.best_streak??0);}setSaving(false);
 }
 function next(){if(!selected)return;if(current===questions.length-1){setFinished(true);return;}setCurrent(v=>v+1);setSelected(null);setShowHint(false);}
 function restart(){setQuestions([]);setCurrent(0);setSelected(null);setScore(0);setCorrect(0);setFinished(false);setError("");setLoading(true);setShowIntro(true);setCombo(0);setPerfectEligible(true);setRetryCount(0);loadMission();}
 if(loading)return <main className="min-h-screen bg-[#eef4ff] p-5"><div className="mx-auto flex min-h-[85vh] max-w-lg items-center justify-center"><div className="w-full rounded-[2.5rem] bg-white p-10 text-center shadow-2xl"><div className="mx-auto flex h-24 w-24 animate-bounce items-center justify-center rounded-[2rem] bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 text-5xl shadow-xl">🚀</div><h1 className="mt-7 text-2xl font-black text-[#15233f]">Launching your Math Adventure!</h1><p className="mt-2 font-bold text-slate-500">Finding challenges made for you…</p><div className="mx-auto mt-7 h-3 max-w-xs overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-orange-400"/></div></div></div></main>;
 if(!q)return <main className="min-h-screen bg-[#eef4ff] p-6"><div className="mx-auto max-w-lg rounded-[2.5rem] bg-white p-10 text-center shadow-2xl"><Target className="mx-auto text-orange-500" size={48}/><h1 className="mt-4 text-2xl font-black text-[#15233f]">Adventure unavailable</h1><p className="mt-2 text-slate-500">{error||"Please try again later."}</p><button onClick={restart} className="mt-7 rounded-2xl bg-orange-500 px-6 py-4 font-black text-white">Try again</button></div></main>;
 if(finished)return <FinishScreen score={score} correct={correct} total={questions.length} level={level} streak={streak} bestStreak={bestStreak} perfect={perfectEligible&&correct===questions.length&&retryCount===0} combo={combo} onRestart={restart}/>;
 const difficulty=q.difficulty==='easy'?"STARTER":q.difficulty==='hard'?"BOSS": "CORE";
 const topic=q.topic.toLowerCase();const topicData=topics.find(t=>topic.includes(t.name.toLowerCase().split(" ")[0]))||topics[0];
 const comboMultiplier=Math.min(3,1+Math.floor(combo/2)*0.5);
 return <main className="min-h-screen overflow-x-hidden bg-[#eef4ff] pb-8 lg:pl-16">
  {showIntro&&current===0&&!selected&&<IntroOverlay onStart={()=>setShowIntro(false)}/>} 
  <div className="fixed inset-x-0 top-0 z-40 h-1.5 bg-slate-200"><div className="h-full bg-gradient-to-r from-violet-500 via-orange-400 to-pink-500 transition-all duration-700" style={{width:`${Math.max(progress,6)}%`}}/></div>
  <header className="sticky top-1.5 z-30 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl"><div className="mx-auto flex max-w-[1450px] items-center gap-3 px-4 py-3 sm:px-6"><Link href="/dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-200"><ArrowLeft size={18}/></Link><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.22em] text-orange-500">FAHI VISSNUN MATHS</p><p className="truncate text-sm font-black text-[#15233f]">Math Adventure · {q.topic}</p></div><div className="hidden items-center gap-2 sm:flex"><StatPill icon="⭐" value={`${score} XP`}/><StatPill icon="🔥" value={String(streak)}/><StatPill icon="💎" value={String(Math.max(0,Math.floor(totalXp/25)))}/></div><div className="flex items-center gap-2 rounded-2xl bg-violet-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-violet-200"><Star size={15} fill="currentColor"/> Lv {level}</div></div></header>
  <div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6">
   <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-2xl sm:p-7">
    <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"/><div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl"/>
    <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] ring-1 ring-white/20"><Sparkles size={13}/> Today's Adventure</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">Math Quest 🚀</h1><p className="mt-1 max-w-xl font-bold text-white/75">Solve 10 challenges, collect XP and unlock your next maths power.</p></div><div className="flex shrink-0 items-center gap-3"><div className="rounded-3xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15"><p className="text-2xl font-black">{current+1}<span className="text-white/50">/10</span></p><p className="text-[10px] font-black uppercase tracking-wider text-white/65">Challenge</p></div><div className="hidden h-16 w-16 items-center justify-center rounded-3xl bg-white text-4xl shadow-xl sm:flex">{topicData.emoji}</div></div></div>
    <div className="relative mt-6"><div className="mb-2 flex justify-between text-xs font-black text-white/80"><span>Adventure progress</span><span>{Math.round(progress)}%</span></div><div className="h-4 overflow-hidden rounded-full bg-white/20 p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 shadow-lg transition-all duration-700" style={{width:`${Math.max(progress,5)}%`}}/></div></div>
   </div>
   <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_285px]">
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100">
     <div className="border-b border-slate-100 px-5 py-4 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`rounded-full bg-gradient-to-r ${topicData.tone} px-3 py-1.5 text-xs font-black text-white shadow-sm`}>{topicData.emoji} {q.topic}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{difficulty}</span></div><div className="flex items-center gap-2"><span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-orange-700">⭐ +{q.points} XP</span><span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">🔥 Combo {combo} · ×{comboMultiplier.toFixed(1)}</span><button onClick={()=>{setShowHint(v=>!v);if(!showHint)setPerfectEligible(false)}} className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100"><Lightbulb size={14}/>{showHint?"Hide hint":"Hint"}</button></div></div></div>
     <div className="p-5 sm:p-8 lg:p-10"><div key={q.id} className="question-enter">
       <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-50 via-white to-violet-50 px-5 py-8 text-center ring-2 ring-slate-100 sm:px-10 sm:py-10"><div className="absolute left-5 top-5 text-2xl animate-pulse">✨</div><div className="absolute right-7 top-8 text-xl">⭐</div><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-4xl shadow-lg ring-1 ring-slate-100">{topicData.emoji}</div><p className="mx-auto max-w-3xl text-2xl font-black leading-tight text-[#15233f] sm:text-4xl">{q.prompt}</p>{showHint&&q.hint&&<div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-amber-50 p-4 text-left ring-1 ring-amber-200"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700"><Lightbulb size={15}/> Helpful hint</p><p className="mt-1 text-sm font-bold leading-6 text-amber-900">{q.hint}</p></div>}<div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] font-black text-slate-400"><span className="rounded-full bg-white px-3 py-1.5 shadow-sm">🧠 Think step by step</span><span className="rounded-full bg-white px-3 py-1.5 shadow-sm">💪 You can do it</span>{q.difficulty==='hard'&&<span className="rounded-full bg-yellow-100 px-3 py-1.5 text-yellow-800 shadow-sm">👑 Boss challenge</span>}</div></div>
       <InteractiveQuestionEngine question={q} selected={selected} disabled={Boolean(selected)||saving} onAnswer={choose}/>
      </div>{error&&<p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Heart size={15} className="text-rose-400"/> Learning is an adventure — mistakes help you grow.</div>{selected&&<button onClick={next} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-7 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-1 hover:shadow-xl">{current===questions.length-1?"Finish Adventure":"Next Challenge"}<ArrowRight size={19} className="transition group-hover:translate-x-1"/></button>}</div>
     </div>
    </section>
    <aside className="space-y-5">
      <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-slate-100"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your power</p><p className="mt-1 text-xl font-black text-[#15233f]">Level {level}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">⚡</div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-500" style={{width:`${Math.max(levelProgress,3)}%`}}/></div><p className="mt-2 text-xs font-bold text-slate-500">{Math.max(0,totalXp-levelStartXp)} / 100 XP to Level {level+1}</p></div>
      <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-slate-100"><div className="flex items-center gap-2"><Trophy size={18} className="text-orange-500"/><p className="font-black text-[#15233f]">Adventure map</p></div><div className="mt-5 space-y-3">{questions.map((_,i)=><div key={i} className="flex items-center gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all ${i<current?"bg-emerald-400 text-white":i===current?"bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg scale-110":"bg-slate-100 text-slate-400"}`}>{i<current?"✓":i===current?"★":i+1}</div><div className={`h-1.5 flex-1 rounded-full ${i<current?"bg-emerald-300":"bg-slate-100"}`}/>{i===4&&<span className="text-lg">👑</span>}{i===9&&<span className="text-lg">🏆</span>}</div>)}</div></div>
      <div className="rounded-[2rem] bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 p-5 shadow-xl"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow">🎁</div><div><p className="text-[10px] font-black uppercase tracking-wider text-orange-900">Today's reward</p><p className="font-black text-[#15233f]">Finish the quest</p></div></div><p className="mt-4 text-sm font-bold text-orange-950/70">Build combos, beat boss challenges and finish with no hints for the Perfect Run bonus.</p></div>
    </aside>
   </div>
  </div>
 </main>;
}

function IntroOverlay({onStart}:{onStart:()=>void}){return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 p-5 backdrop-blur-md"><div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"><div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-yellow-200 blur-2xl"/><div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 py-9 text-center text-white sm:px-10"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-5xl shadow-2xl">🚀</div><p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-white/70">FAHI VISSNUN</p><h1 className="mt-1 text-4xl font-black">Math Adventure</h1><p className="mt-2 font-bold text-white/75">Today's challenge is ready!</p></div><div className="p-6 sm:p-8"><div className="grid grid-cols-3 gap-3 text-center"><MiniReward icon="🎯" label="10 Challenges"/><MiniReward icon="⭐" label="Earn XP"/><MiniReward icon="🎁" label="Unlock Prize"/></div><div className="mt-6 rounded-2xl bg-slate-50 p-4"><p className="text-sm font-black text-[#15233f]">Ready, explorer?</p><p className="mt-1 text-xs font-bold leading-5 text-slate-500">Use hints when you need them. Every question is a step forward.</p></div><button onClick={onStart} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-4 text-lg font-black text-white shadow-xl shadow-orange-200 transition hover:-translate-y-1"><Sparkles size={20}/> Start Adventure <ArrowRight size={20}/></button></div></div></div>}
function MiniReward({icon,label}:{icon:string;label:string}){return <div className="rounded-2xl bg-slate-50 p-3"><div className="text-2xl">{icon}</div><p className="mt-1 text-[10px] font-black text-slate-600">{label}</p></div>}
function StatPill({icon,value}:{icon:string;value:string}){return <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600"><span>{icon}</span>{value}</div>}
function FinishScreen({score,correct,total,level,streak,bestStreak,perfect,combo,onRestart}:{score:number;correct:number;total:number;level:number;streak:number;bestStreak:number;perfect:boolean;combo:number;onRestart:()=>void}){return <main className="min-h-screen bg-[#eef4ff] p-5 sm:p-8 lg:pl-20"><div className="mx-auto max-w-4xl"><section className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"><div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 py-12 text-center text-white sm:px-10"><div className="absolute inset-0 opacity-30"><div className="absolute left-10 top-8 text-3xl">⭐</div><div className="absolute right-16 top-12 text-4xl">✨</div><div className="absolute bottom-8 left-1/4 text-2xl">🎉</div><div className="absolute bottom-10 right-1/4 text-2xl">💎</div></div><div className="relative mx-auto flex h-28 w-28 animate-pulse items-center justify-center rounded-[2rem] bg-white text-6xl shadow-2xl">{perfect?"🌟":"🏆"}</div><p className="relative mt-5 text-xs font-black uppercase tracking-[.25em] text-yellow-200">Adventure complete</p><h1 className="relative mt-2 text-4xl font-black sm:text-5xl">{perfect?"PERFECT RUN! 🌟":"Math Champion! 🎉"}</h1><p className="relative mx-auto mt-2 max-w-xl font-bold text-white/75">{perfect?"No hints, no retries — your perfect bonus is unlocked.":"You made it through today's Math Adventure."}</p></div><div className="p-6 sm:p-10"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Result icon={<Zap/>} value={String(score)} label="XP earned"/><Result icon={<CheckCircle2/>} value={`${correct}/${total}`} label="Correct"/><Result icon={<Flame/>} value={String(streak)} label="Day streak"/><Result icon={<Trophy/>} value={`×${Math.min(3,1+Math.floor(combo/2)*0.5).toFixed(1)}`} label="Best combo"/></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 p-5"><div className="flex items-center gap-3"><Gift className="text-orange-500"/><p className="font-black text-[#15233f]">{perfect?"Perfect bonus unlocked!":"Treasure unlocked!"}</p></div><p className="mt-2 text-sm font-bold text-slate-600">{perfect?"You completed the adventure without hints or retries.":"You earned a special reward for completing the adventure."}</p></div><div className="rounded-3xl bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Best streak</p><p className="mt-1 text-2xl font-black text-[#15233f]">🔥 {bestStreak} days</p><p className="mt-1 text-xs font-bold text-slate-500">Keep your learning adventure going!</p></div></div><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><button onClick={onRestart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-7 py-4 font-black text-white shadow-lg shadow-orange-200"><RotateCcw size={18}/> Play Again</button><Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-7 py-4 font-black text-slate-700">Back to Home <ArrowRight size={18}/></Link></div></div></section></div></main>}
function Result({icon,value,label}:{icon:ReactNode;value:string;label:string}){return <div className="rounded-3xl bg-slate-50 p-4 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">{icon}</div><p className="mt-2 text-xl font-black text-[#15233f]">{value}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p></div>}
