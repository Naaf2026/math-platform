"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Flame, LockKeyhole, Sparkles, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile={xp:number;current_streak:number;best_streak:number};
type Achievement={id:string;title:string;description:string;icon:string;sort_order:number};

function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}

export default function RewardsPage(){
 const[profile,setProfile]=useState<Profile>({xp:0,current_streak:0,best_streak:0});
 const[achievements,setAchievements]=useState<Achievement[]>([]);
 const[earned,setEarned]=useState<Set<string>>(new Set());
 const[loading,setLoading]=useState(true);
 const[level,setLevel]=useState(1);
 const[error,setError]=useState("");

 useEffect(()=>{load();},[]);

 async function load(){
  const supabase=createClient();
  if(!supabase){setError("Your learning account is not configured yet.");setLoading(false);return;}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){window.location.href="/login";return;}
  const[{data:profileRow,error:profileError},{data:allAchievements,error:achievementError},{data:earnedRows}]=await Promise.all([
   supabase.from("profiles").select("xp,current_streak,best_streak").eq("id",user.id).maybeSingle(),
   supabase.from("learning_achievements").select("id,title,description,icon,sort_order").order("sort_order"),
   supabase.from("student_achievements").select("achievement_id").eq("user_id",user.id)
  ]);
  if(profileError||achievementError){setError(profileError?.message||achievementError?.message||"Rewards could not be loaded.");setLoading(false);return;}
  const xp=profileRow?.xp??0;
  setProfile({xp,current_streak:profileRow?.current_streak??0,best_streak:profileRow?.best_streak??0});
  setLevel(levelForXp(xp));
  setAchievements((allAchievements??[]) as Achievement[]);
  setEarned(new Set((earnedRows??[]).map((row:{achievement_id:string})=>row.achievement_id)));
  setLoading(false);
 }

 const levelStart=(level-1)*100;
 const nextLevelXp=level*100;
 const levelProgress=Math.min(100,Math.round(((profile.xp-levelStart)/100)*100));
 const remaining=Math.max(0,nextLevelXp-profile.xp);
 const earnedCount=earned.size;
 const badgeProgress=achievements.length?Math.round((earnedCount/achievements.length)*100):0;
 const message=useMemo(()=>profile.current_streak>=7?"Amazing! Your learning habit is on fire. 🔥":profile.current_streak>=3?"Great streak! Keep your maths adventure moving.":"Start a daily mission to build your streak.",[profile.current_streak]);

 if(loading)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600"/><p className="mt-5 font-black text-[#071b3a]">Loading your rewards…</p></div></div></main>;

 if(error)return <main className="min-h-screen bg-violet-50 p-6"><div className="mx-auto mt-20 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><Sparkles className="mx-auto text-violet-600" size={42}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Rewards unavailable</h1><p className="mt-2 text-slate-500">{error}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;

 return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 sm:p-8">
  <div className="mx-auto max-w-5xl">
   <header className="flex items-center justify-between"><Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Rewards Centre</span></header>

   <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
    <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
     <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Student rewards</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Level {level} <span className="text-yellow-300">Maths Hero</span> 🏆</h1><p className="mt-3 max-w-xl text-indigo-100">{message}</p></div>
     <div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-indigo-100">Current XP</p><p className="text-3xl font-black">{profile.xp}</p></div><div className="text-right"><p className="text-xs font-bold text-indigo-100">Next level</p><p className="font-black">{nextLevelXp} XP</p></div></div><div className="mt-4 h-4 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{width:`${levelProgress}%`}}/></div><p className="mt-2 text-xs text-indigo-100">{remaining} XP to Level {level+1}</p></div>
    </div>
   </section>

   <section className="mt-6 grid gap-4 sm:grid-cols-3">
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100"><Zap className="text-violet-600" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{profile.xp}</p><p className="text-sm text-slate-500">Total XP</p></div>
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-orange-100"><Flame className="text-orange-500" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{profile.current_streak}</p><p className="text-sm text-slate-500">Current streak</p><p className="mt-2 text-xs font-bold text-orange-600">Best: {profile.best_streak} days</p></div>
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-yellow-100"><Trophy className="text-yellow-500" size={24}/><p className="mt-4 text-3xl font-black text-[#071b3a]">{earnedCount}/{achievements.length}</p><p className="text-sm text-slate-500">Badges earned</p><p className="mt-2 text-xs font-bold text-yellow-600">{badgeProgress}% complete</p></div>
   </section>

   <section className="mt-8 rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">Achievement journey</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Your badge collection</h2></div><Trophy className="text-yellow-500"/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{achievements.map(a=>{const isEarned=earned.has(a.id);return <div key={a.id} className={`rounded-3xl border-2 p-5 transition ${isEarned?"border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50":"border-slate-100 bg-slate-50"}`}><div className="flex items-start justify-between"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${isEarned?"bg-white shadow-sm":"bg-slate-200 grayscale"}`}>{isEarned?a.icon:"🔒"}</div>{isEarned?<CheckCircle2 className="text-emerald-500"/>:<LockKeyhole className="text-slate-400" size={20}/>}</div><h3 className="mt-4 font-black text-[#071b3a]">{a.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{a.description}</p><p className={`mt-4 text-xs font-black uppercase tracking-wider ${isEarned?"text-emerald-600":"text-slate-400"}`}>{isEarned?"Unlocked":"Keep learning"}</p></div>})}</div></section>

   <section className="mt-6 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-violet-50 p-6 ring-1 ring-amber-100 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-orange-600">Keep the adventure going</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Earn more XP today</h2><p className="mt-2 text-sm text-slate-600">Complete a Daily Mission, finish lessons and build your streak to unlock more rewards.</p></div><Link href="/learn" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700">Start learning 🚀</Link></div></section>
  </div>
 </main>;
}
