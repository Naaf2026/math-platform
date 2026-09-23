"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CheckCircle2, Flame, Gamepad2, Gift, GraduationCap, Home, Sparkles, Target, Trophy, Zap } from "lucide-react";
import NotificationBell from "@/components/learner-notification-bell";
import { createClient } from "@/lib/supabase/client";

type Topic={id:string;title:string;description:string;level:string;lessons:number;sort_order:number};
type TopicProgress={topic_id:string;questions_answered:number;correct_answers:number;mastery:number};
type Profile={full_name:string|null;grade:string|null;avatar_url:string|null;avatar_emoji:string|null;xp:number;current_streak:number;best_streak:number};
type RewardHistory={created_at:string;xp:number;combo:number;coins:number;gems:number;reason:string};

const topicIcons=["🔢","➕","✖️","🍕","📐","💰"];
function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}
function masteryLabel(value:number){if(value>=90)return "Master";if(value>=75)return "Strong";if(value>=50)return "Growing";return "Getting started";}
function dayKey(date:Date){return date.toISOString().slice(0,10);}

export default function ProgressPage(){
 const[profile,setProfile]=useState<Profile>({full_name:null,grade:null,avatar_url:null,avatar_emoji:null,xp:0,current_streak:0,best_streak:0});
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
   supabase.from("profiles").select("full_name,grade,avatar_url,avatar_emoji,xp,current_streak,best_streak").eq("id",user.id).maybeSingle(),
   supabase.from("learning_topics").select("id,title,description,level,lessons,sort_order").order("sort_order"),
   supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers,mastery").eq("user_id",user.id),
   supabase.from("student_reward_history").select("created_at,xp,combo,coins,gems,reason").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30)
  ]);
  if(pe||te||tpe){setError(pe?.message||te?.message||tpe?.message||"Progress could not be loaded.");setLoading(false);return;}
  setProfile({full_name:p?.full_name??null,grade:p?.grade??null,avatar_url:p?.avatar_url??null,avatar_emoji:p?.avatar_emoji??null,xp:p?.xp??0,current_streak:p?.current_streak??0,best_streak:p?.best_streak??0});
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

 return <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
 <header className="sticky top-0 z-40 h-[76px] bg-[#073b73] text-white shadow-sm lg:h-[90px]"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12"><Link href="/dashboard"><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN Math Learning Platform" className="h-[44px] w-auto max-w-[220px] lg:h-[57px] lg:max-w-none"/></Link><nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Home size={25}/>Home</Link><Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gamepad2 size={25}/>Games</Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Trophy size={25}/>Leaderboard</Link><Link href="/rewards" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gift size={25}/>Rewards</Link><Link href="/progress" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><BarChart3 size={25}/>Progress<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400"/></Link><Link href="/profile" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><GraduationCap size={25}/>Profile</Link></nav><NotificationBell/></div></header>
 <div className="mx-auto flex max-w-[1680px]"><aside className="hidden min-h-[calc(100vh-90px)] w-[245px] shrink-0 flex-col border-r border-[#dcecf6] bg-[#f5fbff] px-7 py-9 lg:flex"><div className="flex flex-col items-center text-center">{profile.avatar_url?<img src={profile.avatar_url} alt="" className="h-[148px] w-[148px] rounded-full border-4 border-white object-cover shadow-lg"/>:<div className="grid h-[148px] w-[148px] place-items-center rounded-full border-4 border-white bg-[#dff7ff] text-5xl shadow-lg">{profile.avatar_emoji||"🧑‍🎓"}</div>}<h2 className="mt-5 text-[34px] font-black">{(profile.full_name||"Learner").split(" ")[0]}</h2><p className="mt-1 text-[19px] font-bold"><GraduationCap size={22} className="mr-2 inline"/>{profile.grade||"Student"}</p></div><div className="mt-7 border-t border-[#dcecf6] pt-5"><p className="py-2 text-[17px] font-black">🔥 {profile.current_streak} Day Streak</p><p className="py-2 text-[17px] font-black">⭐ {profile.xp} XP</p></div></aside>
 <section className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-12 lg:pb-10"><div className="mx-auto max-w-[1340px]"><div className="mb-7"><p className="text-sm font-black uppercase tracking-[.18em] text-[#197fe9]">Learning Progress</p><h1 className="mt-1 text-[38px] font-black tracking-tight sm:text-[48px] lg:text-[54px]">Your Progress 📈</h1><p className="mt-2 text-[18px] font-semibold text-[#6685a4] sm:text-[21px]">See how your maths skills are growing.</p></div>
