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
  <header className="sticky top-0 z-40 h-[76px] border-b border-white/10 bg-[#073b73] text-white shadow-sm lg:h-[90px]"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12"><Link href="/dashboard"><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN Math Learning Platform" className="h-[44px] w-auto max-w-[220px] lg:h-[57px] lg:max-w-none"/></Link><nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Home size={25}/>Home</Link><Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gamepad2 size={25}/>Games</Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Trophy size={25}/>Leaderboard</Link><Link href="/rewards" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><Gift size={25}/>Rewards<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400"/></Link><Link href="/progress" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><BarChart3 size={25}/>Progress</Link><Link href="/profile" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><GraduationCap size={25}/>Profile</Link></nav><NotificationBell/></div></header>
  <div className="mx-auto flex max-w-[1680px]"><aside className="hidden min-h-[calc(100vh-90px)] w-[245px] shrink-0 flex-col border-r border-[#dcecf6] bg-[#f5fbff] px-7 py-9 lg:flex"><div className="flex flex-col items-center text-center">{profile.avatar_url?<img src={profile.avatar_url} alt="" className="h-[148px] w-[148px] rounded-full border-4 border-white object-cover shadow-lg"/>:<div className="grid h-[148px] w-[148px] place-items-center rounded-full border-4 border-white bg-[#dff7ff] text-5xl shadow-lg">{profile.avatar_emoji||"🧑‍🎓"}</div>}<h2 className="mt-5 text-[34px] font-black">{(profile.full_name||"Learner").split(" ")[0]}</h2><p className="mt-1 text-[19px] font-bold"><GraduationCap size={22} className="mr-2 inline"/>{profile.grade||"Student"}</p></div><div className="mt-7 border-t border-[#dcecf6] pt-5"><p className="py-2 text-[17px] font-black">🔥 {profile.current_streak} Day Streak</p><p className="py-2 text-[17px] font-black">⭐ {profile.xp} XP</p></div></aside>
  <section className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-12 lg:pb-10"><div className="mx-auto max-w-[1340px]"><div className="mb-7"><p className="text-sm font-black uppercase tracking-[.18em] text-[#735fe6]">Rewards Centre</p><h1 className="mt-1 text-[38px] font-black tracking-tight sm:text-[48px] lg:text-[54px]">Your Rewards 🎁</h1><p className="mt-2 text-[18px] font-semibold text-[#6685a4] sm:text-[21px]">Celebrate your progress, streaks and achievements.</p></div>
