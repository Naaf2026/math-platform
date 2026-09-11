"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic={id:string;title:string;description:string;level:string;lessons:number;sort_order:number};
type TopicProgress={topic_id:string;questions_answered:number;correct_answers:number;mastery:number};
type Profile={xp:number;current_streak:number;best_streak:number};
type RewardHistory={created_at:string;xp:number;combo:number;coins:number;gems:number;reason:string};

const topicIcons=["🔢","➕","✖️","🍕","📐","💰"];
function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}
function masteryLabel(value:number){if(value>=90)return "Master";if(value>=75)return "Strong";if(value>=50)return "Growing";return "Getting started";}
function dayKey(date:Date){return date.toISOString().slice(0,10);}

export default function ProgressPage(){
 const[profile,setProfile]=useState<Profile>({xp:0,current_streak:0,best_streak:0});
 const[topics,setTopics]=useState<Topic[]>([]);
 const[progress,setProgress]=useState<TopicProgress[]>([]);
 const[history,setHistory]=useState<RewardHistory[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");

 useEffect(()=>{load();},[]);

 async function load(){
  const supabase=createClient();
  if(!supabase){setError("Your learning account is not configured yet.");setLoading(false);return;}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){window.location.href="/login";return;}
  const[{data:p,error:pe},{data:t,error:te},{data:tp,error:tpe},{data:rh}]=await Promise.all([
   supabase.from("profiles").select("xp,current_streak,best_streak").eq("id",user.id).maybeSingle(),
   supabase.from("learning_topics").select("id,title,description,level,lessons,sort_order").order("sort_order"),
   supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers,mastery").eq("user_id",user.id),
   supabase.from("student_reward_history").select("created_at,xp,combo,coins,gems,reason").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30)
  ]);
  if(pe||te||tpe){setError(pe?.message||te?.message||tpe?.message||"Progress could not be loaded.");setLoading(false);return;}
  setProfile({xp:p?.xp??0,current_streak:p?.current_streak??0,best_streak:p?.best_streak??0});
  setTopics((t??[]) as Topic[]);setProgress((tp??[]) as TopicProgress[]);setHistory((rh??[]) as RewardHistory[]);setLoading(false);
 }

 const level=levelForXp(profile.xp),levelStart=(level-1)*100,nextLevel=level*100;
 const levelProgress=Math.min(100,Math.round(((profile.xp-levelStart)/100)*100));
 const map=new Map(progress.map(p=>[p.topic_id,p]));
 const averageMastery=topics.length?Math.round(topics.reduce((sum,t)=>sum+(map.get(t.id)?.mastery??0),0)/topics.length):0;
 const totalQuestions=progress.reduce((s,p)=>s+p.questions_answered,0);
 const totalCorrect=progress.reduce((s,p)=>s+p.correct_answers,0);
 const accuracy=totalQuestions?Math.round((totalCorrect/totalQuestions)*100):0;
 const explored=topics.filter(t=>(map.get(t.id)?.questions_answered??0)>0).length;
 const strengths=[...topics].map(t=>({topic:t,mastery:map.get(t.id)?.mastery??0,answered:map.get(t.id)?.questions_answered??0})).filter(x=>x.answered>0).sort((a,b)=>b.mastery-a.mastery);
 const strongest=strengths[0], weakest=[...strengths].sort((a,b)=>a.mastery-b.mastery)[0];
 const missionsThisWeek=history.filter(h=>Date.now()-new Date(h.created_at).getTime()<7*86400000).length;
 const weeklyXp=history.filter(h=>Date.now()-new Date(h.created_at).getTime()<7*86400000).reduce((s,h)=>s+(h.xp||0),0);
 const weeklyDays=useMemo(()=>{const today=new Date();return Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-(6-i));const key=dayKey(d);const day=history.filter(h=>dayKey(new Date(h.created_at))===key);return {label:d.toLocaleDateString(undefined,{weekday:"short"}),xp:day.reduce((s,h)=>s+(h.xp||0),0),active:day.length>0};});},[history]);
 const maxDayXp=Math.max(1,...weeklyDays.map(d=>d.xp));
 const milestones=[3,7,14,30],nextStreak=milestones.find(n=>n>profile.current_streak)||30;

 if(loading)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600"/><p className="mt-5 font-black text-[#071b3a]">Loading your progress…</p></div></div></main>;
 if(error)return <main className="min-h-screen bg-violet-50 p-6"><div className="mx-auto mt-20 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><Sparkles className="mx-auto text-violet-600" size={42}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Progress unavailable</h1><p className="mt-2 text-slate-500">{error}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;

 return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-28 sm:p-8">
  <div className="mx-auto max-w-6xl">
   <header className="flex items-center justify-between"><Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Student Analytics 3.0</span></header>

   <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
    <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
     <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><BarChart3 size={14}/> Learning intelligence</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">See how you are <span className="text-yellow-300">growing</span> 🚀</h1><p className="mt-3 max-w-xl text-indigo-100">Track mastery, accuracy, weekly activity, strengths and the next skill to work on.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/mission" className="rounded-2xl bg-yellow-300 px-5 py-3 font-black text-[#071b3a] shadow-lg">Practise now 🎯</Link><Link href="/rewards" className="rounded-2xl bg-white/15 px-5 py-3 font-black text-white ring-1 ring-white/20">View rewards 🏆</Link></div></div>
     <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-indigo-100">Level</p><p className="text-4xl font-black">{level}</p></div><p className="font-black">{profile.xp} XP</p></div><div className="mt-4 h-4 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{width:`${levelProgress}%`}}/></div><p className="mt-2 text-xs text-indigo-100">{Math.max(0,nextLevel-profile.xp)} XP to Level {level+1}</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-3"><Flame size={20} className="text-orange-300"/><p className="mt-1 text-xl font-black">{profile.current_streak}</p><p className="text-[11px] text-indigo-100">Day streak</p></div><div className="rounded-2xl bg-white/10 p-3"><Target size={20} className="text-cyan-200"/><p className="mt-1 text-xl font-black">{averageMastery}%</p><p className="text-[11px] text-indigo-100">Avg mastery</p></div></div></div>
    </div>
   </section>

   <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Metric icon={<Zap/>} value={String(profile.xp)} label="Total XP" tone="violet"/>
    <Metric icon={<CheckCircle2/>} value={`${accuracy}%`} label="Answer accuracy" tone="cyan"/>
    <Metric icon={<Target/>} value={String(totalQuestions)} label="Questions answered" tone="orange"/>
    <Metric icon={<Trophy/>} value={`${explored}/${topics.length}`} label="Topics explored" tone="pink"/>
   </section>

   <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">Mastery map</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Your maths worlds</h2></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{averageMastery}% overall</span></div><div className="mt-6 space-y-5">{topics.map((topic,index)=>{const p=map.get(topic.id);const mastery=Math.max(0,Math.min(100,p?.mastery??0));const answered=p?.questions_answered??0;return <div key={topic.id} className="rounded-3xl border border-slate-100 bg-gradient-to-r from-white to-violet-50/60 p-5"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-violet-100">{topicIcons[index%topicIcons.length]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black text-[#071b3a]">{topic.title}</h3><p className="text-xs text-slate-500">{masteryLabel(mastery)} · {answered} questions answered</p></div><span className="text-lg font-black text-violet-700">{mastery}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{width:`${mastery}%`}}/></div><div className="mt-3 flex justify-between text-[11px] font-bold text-slate-400"><span>Starting</span><span>Growing</span><span>Strong</span><span>Master</span></div></div></div></div>})}</div></div>

    <div className="space-y-6">
     <div className="rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-50 p-6 ring-1 ring-cyan-100"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Skill signals</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">What to focus on</h2><div className="mt-5 rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black text-emerald-600">💪 Strongest</p><p className="mt-1 font-black text-[#071b3a]">{strongest?.topic.title||"Start a mission"}</p><p className="text-sm text-slate-500">{strongest?`${strongest.mastery}% mastery`:"Answer questions to build your profile."}</p></div><div className="mt-3 rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black text-orange-600">🎯 Next focus</p><p className="mt-1 font-black text-[#071b3a]">{weakest?.topic.title||topics[0]?.title||"Your first maths world"}</p><p className="text-sm text-slate-500">{weakest?`${weakest.mastery}% mastery — keep practising`:"Complete your first mission to unlock insights."}</p></div></div>
     <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-yellow-50 p-6 ring-1 ring-orange-100"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-orange-600">Streak journey</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">{profile.current_streak} days 🔥</h2></div><Flame className="text-orange-500" size={34}/></div><p className="mt-3 text-sm text-slate-600">Reach {nextStreak} days to hit your next milestone.</p><div className="mt-5 grid grid-cols-4 gap-2">{milestones.map(m=><div key={m} className={`rounded-2xl p-3 text-center ${profile.current_streak>=m?"bg-orange-500 text-white":"bg-white text-slate-400"}`}><div className="text-lg">{profile.current_streak>=m?"🔥":"🔒"}</div><p className="mt-1 text-xs font-black">{m}d</p></div>)}</div></div>
    </div>
   </section>

   <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Weekly activity</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Your last 7 days</h2></div><div className="text-right"><p className="text-2xl font-black text-violet-700">{weeklyXp} XP</p><p className="text-xs font-bold text-slate-400">{missionsThisWeek} mission records</p></div></div><div className="mt-7 grid grid-cols-7 items-end gap-2 sm:gap-4">{weeklyDays.map(day=><div key={day.label} className="flex flex-col items-center gap-2"><div className="flex h-36 w-full items-end justify-center rounded-2xl bg-slate-50 p-2"><div className={`w-full max-w-8 rounded-xl ${day.active?"bg-gradient-to-t from-violet-600 to-cyan-400":"bg-slate-200"}`} style={{height:`${day.xp?Math.max(12,Math.round((day.xp/maxDayXp)*100)):8}%`}}/></div><span className="text-[10px] font-black text-slate-400">{day.label}</span><span className="text-[10px] font-bold text-slate-500">{day.xp} XP</span></div>)}</div></div>

    <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-wider text-violet-200">Coach summary</p><h2 className="mt-1 text-2xl font-black">Your learning snapshot</h2><div className="mt-5 space-y-3 text-sm"><div className="rounded-2xl bg-white/10 p-4"><b>{totalCorrect}</b> correct answers from <b>{totalQuestions}</b> attempts.</div><div className="rounded-2xl bg-white/10 p-4"><b>{profile.current_streak}</b>-day current streak, best is <b>{profile.best_streak}</b>.</div><div className="rounded-2xl bg-white/10 p-4">You have explored <b>{explored}</b> of <b>{topics.length}</b> maths worlds.</div></div><Link href="/mission" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-yellow-300 px-5 py-3 font-black text-[#071b3a]">Keep improving 🚀</Link></div>
   </section>

   <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Recent activity</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Learning history</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Last 30 records</span></div>{history.length?<div className="mt-5 divide-y divide-slate-100">{history.slice(0,8).map((item,index)=><div key={`${item.created_at}-${index}`} className="flex items-center gap-4 py-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles size={19}/></div><div className="min-w-0 flex-1"><p className="truncate font-black text-[#071b3a]">{item.reason||"Maths activity"}</p><p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p></div><div className="text-right"><p className="font-black text-violet-700">+{item.xp} XP</p><p className="text-[11px] font-bold text-slate-400">Combo {item.combo}</p></div></div>)}</div>:<div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">Complete a Math Adventure to start building your learning history.</div>}</section>

   <p className="mt-6 text-center text-xs font-bold text-slate-400">Progress insights are based on your saved learning activity. Time-spent analytics will be added when session timing is persisted.</p>
  </div>
 </main>;
}

function Metric({icon,value,label,tone}:{icon:React.ReactNode;value:string;label:string;tone:"violet"|"cyan"|"orange"|"pink"}){
 const styles={violet:"bg-violet-50 text-violet-600",cyan:"bg-cyan-50 text-cyan-600",orange:"bg-orange-50 text-orange-600",pink:"bg-pink-50 text-pink-600"};
 return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles[tone]}`}>{icon}</div><p className="mt-4 text-3xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>;
}
