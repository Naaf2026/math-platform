"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CheckCircle2, Flame, Gamepad2, Gift, GraduationCap, Home, LockKeyhole, Map, Sparkles, Trophy, Zap } from "lucide-react";
import NotificationBell from "@/components/learner-notification-bell";
import { createClient } from "@/lib/supabase/client";

type Profile={full_name:string|null;grade:string|null;avatar_url:string|null;avatar_emoji:string|null;xp:number;current_streak:number;best_streak:number};
type Achievement={id:string;title:string;description:string;icon:string;sort_order:number};

function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}

export default function RewardsPage(){
 const[profile,setProfile]=useState<Profile>({full_name:null,grade:null,avatar_url:null,avatar_emoji:null,xp:0,current_streak:0,best_streak:0});
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
   supabase.from("profiles").select("full_name,grade,avatar_url,avatar_emoji,xp,current_streak,best_streak").eq("id",user.id).maybeSingle(),
   supabase.from("learning_achievements").select("id,title,description,icon,sort_order").order("sort_order"),
   supabase.from("student_achievements").select("achievement_id").eq("user_id",user.id)
  ]);
  if(profileError||achievementError){setError(profileError?.message||achievementError?.message||"Rewards could not be loaded.");setLoading(false);return;}
  const xp=profileRow?.xp??0;
  setProfile({full_name:profileRow?.full_name??null,grade:profileRow?.grade??null,avatar_url:profileRow?.avatar_url??null,avatar_emoji:profileRow?.avatar_emoji??null,xp,current_streak:profileRow?.current_streak??0,best_streak:profileRow?.best_streak??0});
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
 const message=useMemo(()=>profile.current_streak>=30?"30 days! You are building an incredible maths habit. 🏆":profile.current_streak>=14?"Two weeks strong! Your consistency is becoming a superpower. 🔥":profile.current_streak>=7?"Amazing! Your learning habit is on fire. 🔥":profile.current_streak>=3?"Great streak! Keep your maths adventure moving.":"Start a daily mission to build your streak.",[profile.current_streak]);

 const streakMilestones=[3,7,14,30];
 const nextStreak=streakMilestones.find(n=>n>profile.current_streak)||30;
 const streakProgress=Math.min(100,Math.round((profile.current_streak/nextStreak)*100));

 if(loading)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600"/><p className="mt-5 font-black text-[#071b3a]">Loading your rewards…</p></div></div></main>;

 if(error)return <main className="min-h-screen bg-violet-50 p-6"><div className="mx-auto mt-20 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><Sparkles className="mx-auto text-violet-600" size={42}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Rewards unavailable</h1><p className="mt-2 text-slate-500">{error}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;

 return <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
  <header className="sticky top-0 z-40 h-[76px] bg-[#073b73] text-white shadow-sm lg:h-[90px]"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12"><Link href="/dashboard" className="flex min-w-0 shrink-0 items-center rounded-2xl bg-white px-3 py-1.5 shadow-md ring-1 ring-white/40 transition hover:shadow-lg"><img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[44px] w-auto max-w-[200px] object-contain lg:h-[57px] lg:max-w-[220px]" /></Link><nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Home size={25}/>Home</Link><Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gamepad2 size={25}/>Games</Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Trophy size={25}/>Leaderboard</Link><Link href="/rewards" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><Gift size={25}/>Rewards<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400"/></Link><Link href="/progress" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><BarChart3 size={25}/>Progress</Link><Link href="/profile" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><GraduationCap size={25}/>Profile</Link></nav><NotificationBell/></div></header>
  <div className="mx-auto flex max-w-[1680px]"><section className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-12 lg:py-10"><div className="mx-auto max-w-[1340px]"><div className="mb-7"><p className="text-sm font-black uppercase tracking-[.18em] text-[#735fe6]">Rewards Centre</p><h1 className="mt-1 text-[38px] font-black sm:text-[48px] lg:text-[54px]">Your Rewards 🎁</h1><p className="mt-2 text-[18px] font-semibold text-[#6685a4] sm:text-[21px]">Celebrate your progress, streaks and achievements.</p></div>

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

   <section className="mt-6 grid gap-4 sm:grid-cols-3">
    <Link href="/challenge" className="group rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 p-5 text-white shadow-lg shadow-pink-100 transition hover:-translate-y-1"><Zap size={22}/><h2 className="mt-4 text-xl font-black">Daily Challenge</h2><p className="mt-1 text-sm text-pink-50">Take today's maths sprint and earn XP.</p><span className="mt-4 inline-flex text-sm font-black">Play now →</span></Link>
    <Link href="/progress" className="group rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 p-5 text-white shadow-lg shadow-cyan-100 transition hover:-translate-y-1"><Map size={22}/><h2 className="mt-4 text-xl font-black">Progress Map</h2><p className="mt-1 text-sm text-cyan-50">See your topic mastery and learning journey.</p><span className="mt-4 inline-flex text-sm font-black">View progress →</span></Link>
    <Link href="/learn" className="group rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 p-5 text-white shadow-lg shadow-violet-100 transition hover:-translate-y-1"><BarChart3 size={22}/><h2 className="mt-4 text-xl font-black">Keep Learning</h2><p className="mt-1 text-sm text-violet-100">Continue lessons and build your skills.</p><span className="mt-4 inline-flex text-sm font-black">Open lessons →</span></Link>
   </section>

   <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-orange-600">Streak journey</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Next milestone: {nextStreak} days 🔥</h2></div><Flame className="text-orange-500"/></div><div className="mt-5 h-4 overflow-hidden rounded-full bg-orange-50"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all" style={{width:`${streakProgress}%`}}/></div><div className="mt-4 grid grid-cols-4 gap-2">{streakMilestones.map(m=><div key={m} className={`rounded-2xl p-3 text-center ${profile.current_streak>=m?"bg-orange-100 text-orange-700":"bg-slate-50 text-slate-400"}`}><p className="text-lg font-black">{m}</p><p className="text-[10px] font-bold uppercase">days</p></div>)}</div></section>

   <section className="mt-8 rounded-3xl border border-white bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">Achievement journey</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Your badge collection</h2></div><Trophy className="text-yellow-500"/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{achievements.map(a=>{const isEarned=earned.has(a.id);return <div key={a.id} className={`rounded-3xl border-2 p-5 transition ${isEarned?"border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50":"border-slate-100 bg-slate-50"}`}><div className="flex items-start justify-between"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${isEarned?"bg-white shadow-sm":"bg-slate-200 grayscale"}`}>{isEarned?a.icon:"🔒"}</div>{isEarned?<CheckCircle2 className="text-emerald-500"/>:<LockKeyhole className="text-slate-400" size={20}/>}</div><h3 className="mt-4 font-black text-[#071b3a]">{a.title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{a.description}</p><p className={`mt-4 text-xs font-black uppercase tracking-wider ${isEarned?"text-emerald-600":"text-slate-400"}`}>{isEarned?"Unlocked":"Keep learning"}</p></div>})}</div></section>

   <section className="mt-6 rounded-3xl bg-gradient-to-r from-amber-50 via-white to-violet-50 p-6 ring-1 ring-amber-100 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-orange-600">Keep the adventure going</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Earn more XP today</h2><p className="mt-2 text-sm text-slate-600">Complete a Daily Challenge, finish lessons and build your streak to unlock more rewards.</p></div><Link href="/challenge" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700">Take today's challenge 🚀</Link></div></section>
  </div></section></div>
  <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#cfe4f2] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 shadow-[0_-6px_20px_rgba(8,61,120,.10)] lg:hidden"><div className="mx-auto grid max-w-lg grid-cols-6"><Link href="/dashboard" className="flex flex-col items-center gap-1 py-1.5 text-[#526f89]"><Home size={22}/><span className="text-[11px] font-black">Home</span></Link><Link href="/brain-games" className="flex flex-col items-center gap-1 py-1.5 text-[#526f89]"><Gamepad2 size={22}/><span className="text-[11px] font-black">Games</span></Link><Link href="/leaderboard" className="flex flex-col items-center gap-1 py-1.5 text-[#526f89]"><Trophy size={22}/><span className="text-[11px] font-black">Leaderboard</span></Link><Link href="/rewards" className="flex flex-col items-center gap-1 py-1.5 text-[#197fe9]"><Gift size={22}/><span className="text-[11px] font-black">Rewards</span></Link><Link href="/progress" className="flex flex-col items-center gap-1 py-1.5 text-[#526f89]"><BarChart3 size={22}/><span className="text-[11px] font-black">Progress</span></Link><Link href="/profile" className="flex flex-col items-center gap-1 py-1.5 text-[#526f89]"><GraduationCap size={22}/><span className="text-[11px] font-black">Profile</span></Link></div></nav>
 </main>;
}
