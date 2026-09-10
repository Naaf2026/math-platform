"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, LockKeyhole, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic={id:string;title:string;description:string;icon:string;sort_order:number};
type TopicProgress={topic_id:string;questions_answered:number;correct_answers:number;mastery:number};
type Profile={xp:number;current_streak:number;best_streak:number};

function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}
function masteryLabel(value:number){if(value>=90)return "Master";if(value>=75)return "Strong";if(value>=50)return "Growing";return "Getting started";}

export default function ProgressPage(){
 const[profile,setProfile]=useState<Profile>({xp:0,current_streak:0,best_streak:0});
 const[topics,setTopics]=useState<Topic[]>([]);
 const[progress,setProgress]=useState<TopicProgress[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");

 useEffect(()=>{load();},[]);

 async function load(){
  const supabase=createClient();
  if(!supabase){setError("Your learning account is not configured yet.");setLoading(false);return;}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){window.location.href="/login";return;}
  const[{data:p,error:pe},{data:t,error:te},{data:tp,error:tpe}]=await Promise.all([
   supabase.from("profiles").select("xp,current_streak,best_streak").eq("id",user.id).maybeSingle(),
   supabase.from("learning_topics").select("id,title,description,icon,sort_order").order("sort_order"),
   supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers,mastery").eq("user_id",user.id)
  ]);
  if(pe||te||tpe){setError(pe?.message||te?.message||tpe?.message||"Progress could not be loaded.");setLoading(false);return;}
  setProfile({xp:p?.xp??0,current_streak:p?.current_streak??0,best_streak:p?.best_streak??0});
  setTopics((t??[]) as Topic[]);setProgress((tp??[]) as TopicProgress[]);setLoading(false);
 }

 const level=levelForXp(profile.xp),levelStart=(level-1)*100,nextLevel=level*100;
 const levelProgress=Math.min(100,Math.round(((profile.xp-levelStart)/100)*100));
 const map=new Map(progress.map(p=>[p.topic_id,p]));
 const averageMastery=topics.length?Math.round(topics.reduce((sum,t)=>sum+(map.get(t.id)?.mastery??0),0)/topics.length):0;
 const totalQuestions=progress.reduce((s,p)=>s+p.questions_answered,0);
 const totalCorrect=progress.reduce((s,p)=>s+p.correct_answers,0);
 const accuracy=totalQuestions?Math.round((totalCorrect/totalQuestions)*100):0;
 const milestones=useMemo(()=>[3,7,14,30],[]);
 const nextStreak=milestones.find(n=>n>profile.current_streak)||30;

 if(loading)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600"/><p className="mt-5 font-black text-[#071b3a]">Loading your progress…</p></div></div></main>;
 if(error)return <main className="min-h-screen bg-violet-50 p-6"><div className="mx-auto mt-20 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><Sparkles className="mx-auto text-violet-600" size={42}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Progress unavailable</h1><p className="mt-2 text-slate-500">{error}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;

 return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 sm:p-8">
  <div className="mx-auto max-w-6xl">
   <header className="flex items-center justify-between"><Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">My Progress</span></header>

   <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
    <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
     <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Target size={14}/> Maths adventure map</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Level {level} <span className="text-yellow-300">Hero</span> 🚀</h1><p className="mt-3 max-w-xl text-indigo-100">You are building real maths skills one mission at a time. Keep exploring every maths world and grow your mastery.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/challenge" className="rounded-2xl bg-yellow-300 px-5 py-3 font-black text-[#071b3a] shadow-lg">Daily Challenge 🎯</Link><Link href="/rewards" className="rounded-2xl bg-white/15 px-5 py-3 font-black text-white backdrop-blur">View Rewards 🏆</Link></div></div>
     <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-indigo-100">XP</p><p className="text-4xl font-black">{profile.xp}</p></div><p className="font-black">{nextLevel} XP</p></div><div className="mt-4 h-4 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{width:`${levelProgress}%`}}/></div><p className="mt-2 text-xs text-indigo-100">{nextLevel-profile.xp} XP to Level {level+1}</p></div>
    </div>
   </section>

   <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100"><Zap className="text-violet-600" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{profile.xp}</p><p className="text-sm text-slate-500">Total XP</p></div>
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-orange-100"><Flame className="text-orange-500" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{profile.current_streak}</p><p className="text-sm text-slate-500">Day streak</p><p className="mt-2 text-xs font-bold text-orange-600">Best: {profile.best_streak} days</p></div>
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cyan-100"><Target className="text-cyan-500" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{accuracy}%</p><p className="text-sm text-slate-500">Answer accuracy</p></div>
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-yellow-100"><Trophy className="text-yellow-500" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{averageMastery}%</p><p className="text-sm text-slate-500">Average mastery</p></div>
   </section>

   <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
    <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">Learning map</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Your maths worlds</h2></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{averageMastery}% overall</span></div><div className="mt-6 space-y-5">{topics.map((topic,index)=>{const p=map.get(topic.id);const mastery=Math.max(0,Math.min(100,p?.mastery??0));const answered=p?.questions_answered??0;return <div key={topic.id} className="rounded-3xl border border-slate-100 bg-gradient-to-r from-white to-violet-50/60 p-5"><div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-violet-100">{topic.icon||["🔢","➕","✖️","🍕"][index%4]}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black text-[#071b3a]">{topic.title}</h3><p className="text-xs text-slate-500">{masteryLabel(mastery)} · {answered} questions answered</p></div><span className="text-lg font-black text-violet-700">{mastery}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{width:`${mastery}%`}}/></div><div className="mt-3 flex justify-between text-[11px] font-bold text-slate-400"><span>Starting</span><span>Growing</span><span>Strong</span><span>Master</span></div></div></div></div>})}</div></div>

    <div className="space-y-6">
     <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-yellow-50 p-6 ring-1 ring-orange-100"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-orange-600">Streak journey</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">{profile.current_streak} days 🔥</h2></div><Flame className="text-orange-500" size={34}/></div><p className="mt-3 text-sm text-slate-600">Reach {nextStreak} days to hit your next streak milestone.</p><div className="mt-5 grid grid-cols-4 gap-2">{milestones.map(m=><div key={m} className={`rounded-2xl p-3 text-center ${profile.current_streak>=m?"bg-orange-500 text-white":"bg-white text-slate-400"}`}><div className="text-lg">{profile.current_streak>=m?"🔥":"🔒"}</div><p className="mt-1 text-xs font-black">{m}d</p></div>)}</div></div>
     <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Your learning stats</p><div className="mt-5 space-y-4"><div className="flex justify-between"><span className="text-sm text-slate-500">Questions answered</span><b className="text-[#071b3a]">{totalQuestions}</b></div><div className="flex justify-between"><span className="text-sm text-slate-500">Correct answers</span><b className="text-[#071b3a]">{totalCorrect}</b></div><div className="flex justify-between"><span className="text-sm text-slate-500">Topics explored</span><b className="text-[#071b3a]">{topics.filter(t=>(map.get(t.id)?.questions_answered??0)>0).length}/{topics.length}</b></div></div><Link href="/learn" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Continue learning 🚀</Link></div>
    </div>
   </section>
  </div>
 </main>;
}
