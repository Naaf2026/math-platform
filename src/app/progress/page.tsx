"use client";
// Dashboard-aligned progress page

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
 const[earned,setEarned]=useState<string[]>([]); const[loading,setLoading]=useState(true); const[filter,setFilter]=useState<"all"|"not-started"|"in-progress"|"completed">("all");
 const[error,setError]=useState("");

 useEffect(()=>{load();},[]);

 async function load(){
  const supabase=createClient();
  if(!supabase){setError("Your learning account is not configured yet.");setLoading(false);return;}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){window.location.href="/login";return;}
  const[{data:p,error:pe},{data:t,error:te},{data:tp,error:tpe},{data:rh},{data:badges}]=await Promise.all([
   supabase.from("profiles").select("full_name,grade,avatar_url,avatar_emoji,xp,current_streak,best_streak").eq("id",user.id).maybeSingle(),
   supabase.from("learning_topics").select("id,title,description,level,lessons,sort_order").order("sort_order"),
   supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers,mastery").eq("user_id",user.id),
   supabase.from("student_reward_history").select("created_at,xp,combo,coins,gems,reason").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30),
   supabase.from("student_achievements").select("achievement_key").eq("user_id",user.id).eq("completed",true)
  ]);
  if(pe||te||tpe){setError(pe?.message||te?.message||tpe?.message||"Progress could not be loaded.");setLoading(false);return;}
  setProfile({full_name:p?.full_name??null,grade:p?.grade??null,avatar_url:p?.avatar_url??null,avatar_emoji:p?.avatar_emoji??null,xp:p?.xp??0,current_streak:p?.current_streak??0,best_streak:p?.best_streak??0});
  setTopics((t??[]) as Topic[]);setProgress((tp??[]) as TopicProgress[]);setHistory((rh??[]) as RewardHistory[]);setEarned((badges??[]).map(b=>b.achievement_key));setLoading(false);
 }

 const gradeNumber=String(profile.grade??"").match(/[1-7]/)?.[0]??null;
 const gradeTopics=topics.filter(t=>gradeNumber && (String(t.level).match(/[1-7]/)?.[0]===gradeNumber));
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

 return <main className="min-h-screen overflow-x-hidden bg-[#f0f8ff] text-[#102650]">
  return <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
  <header className="sticky top-0 z-40 hidden h-[76px] lg:block bg-[#073b73] text-white shadow-sm lg:h-[90px]"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12"><Link href="/dashboard" className="flex min-w-0 shrink-0 items-center rounded-2xl bg-white px-3 py-1.5 shadow-md ring-1 ring-white/40 transition hover:shadow-lg"><img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[44px] w-auto max-w-[200px] object-contain lg:h-[57px] lg:max-w-[220px]" /></Link><nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Home size={25}/>Home</Link><Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gamepad2 size={25}/>Games</Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Trophy size={25}/>Leaderboard</Link><Link href="/rewards" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gift size={25}/>Rewards</Link><Link href="/progress" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><BarChart3 size={25}/>Progress<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400"/></Link><Link href="/profile" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><GraduationCap size={25}/>Profile</Link></nav><NotificationBell/></div></header>

 <div className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-7">
 <section className="mt-4 overflow-hidden rounded-[22px] bg-gradient-to-r from-[#27b4f4] to-[#86dfff]"><img src="/progress-assets/progress-hero.webp" alt="My Progress — See how much you've learned and keep going!" className="block w-full object-cover" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.classList.add("min-h-[180px]");}}/></section>
 <section className="mt-4 grid gap-3 rounded-[22px] border border-[#dceaf8] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
 {([{icon:"⭐",label:"Total XP",value:profile.xp.toLocaleString(),detail:`+${weeklyXp} this week`},{icon:"🎯",label:"Topics explored",value:`${gradeTopics.filter(t=>(map.get(t.id)?.questions_answered??0)>0).length} / ${gradeTopics.length}`,detail:"Your grade"},{icon:"🏆",label:"Answer accuracy",value:`${accuracy}%`,detail:`${totalCorrect} correct answers`},{icon:"🔥",label:"Current streak",value:`${profile.current_streak} days`,detail:`Best: ${profile.best_streak} days`}]).map(item=><div key={item.label} className="flex items-center gap-4 rounded-2xl bg-[#fbfdff] p-3"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#fff2e9] text-4xl">{item.icon}</span><div><p className="text-sm font-bold">{item.label}</p><p className="text-3xl font-black">{item.value}</p><p className="text-xs font-semibold text-[#6a82a0]">{item.detail}</p></div></div>)}
 </section>
 <div className="mt-5 grid gap-5 lg:grid-cols-[215px_minmax(0,1fr)_300px]">
 <aside className="rounded-[22px] border border-[#dceaf8] bg-white p-4 shadow-sm"><h2 className="mb-4 text-lg font-black">Select Subject</h2><div className="rounded-xl bg-[#137be9] px-4 py-3 font-bold text-white">✦ Maths</div><p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#7891ab]">Your enrolled grade</p>{gradeNumber?<div className="mt-2 rounded-xl bg-[#e2f0ff] px-4 py-3 font-black text-[#0872d8]">📘 Grade {gradeNumber}</div>:<div className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Grade not set in your profile.</div>}<p className="mt-5 text-sm text-[#6b819a]">Your progress is shown for your registered grade only.</p></aside>
 <section className="min-w-0 rounded-[22px] border border-[#dceaf8] bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-black">{gradeNumber?`Grade ${gradeNumber} Progress`:"My Maths Progress"}</h2><p className="mt-1 text-sm text-[#7489a4]">Your saved topic progress</p></div><div className="min-w-[155px]"><p className="text-sm font-black">Overall progress <span className="float-right">{gradeTopics.length?Math.round(gradeTopics.reduce((s,t)=>s+(map.get(t.id)?.mastery??0),0)/gradeTopics.length):0}%</span></p><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e4edf7]"><div className="h-full rounded-full bg-[#36c779]" style={{width:`${gradeTopics.length?Math.round(gradeTopics.reduce((s,t)=>s+(map.get(t.id)?.mastery??0),0)/gradeTopics.length):0}%`}}/></div></div></div>
 <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{([{key:"all",label:"All Topics"},{key:"not-started",label:"Not Started"},{key:"in-progress",label:"In Progress"},{key:"completed",label:"Completed"}] as const).map(t=>{const count=gradeTopics.filter(topic=>{const p=map.get(topic.id);const v=p?.mastery??0;return t.key==="all"||t.key==="not-started"?(t.key==="all"||!p?.questions_answered):t.key==="completed"?v>=100:(p?.questions_answered??0)>0&&v<100;}).length;return <button key={t.key} onClick={()=>setFilter(t.key)} className={`rounded-xl px-2 py-3 text-sm font-bold ${filter===t.key?"bg-[#137be9] text-white":"bg-[#eaf3fd] text-[#456582]"}`}>{t.label} ({count})</button>})}</div>
 <div className="mt-4 space-y-2">{gradeTopics.filter(t=>{const p=map.get(t.id);const v=p?.mastery??0;return filter==="all"||filter==="not-started"?! (filter==="not-started"&&(p?.questions_answered??0)>0):filter==="completed"?v>=100:(p?.questions_answered??0)>0&&v<100;}).map((t,i)=>{const p=map.get(t.id);const value=Math.max(0,Math.min(100,p?.mastery??0));return <div key={t.id} className="grid grid-cols-[24px_minmax(0,1fr)_58px] items-center gap-3 rounded-xl border border-[#e5eef8] px-3 py-3 sm:grid-cols-[24px_minmax(120px,1fr)_minmax(70px,1fr)_50px_90px]"><span className="text-sm font-bold text-[#6683a2]">{i+1}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{t.title}</p><p className="text-xs text-[#8498ac] sm:hidden">{p?.questions_answered??0} answered</p></div><div className="hidden h-3 overflow-hidden rounded-full bg-[#e2ecf7] sm:block"><div className={`h-full rounded-full ${value>=100?"bg-[#44c982]":value>0?"bg-[#168ef0]":"bg-[#e2ecf7]"}`} style={{width:`${value}%`}}/></div><span className="text-sm font-black">{value}%</span><Link href="/worksheets" className="hidden rounded-full bg-[#e9f5ff] px-2 py-2 text-center text-xs font-black text-[#096cda] sm:block">{value>=100?"✓ Completed":value>0?"▶ Continue":"▶ Start"}</Link></div>})}{!gradeTopics.length&&<p className="rounded-xl bg-[#f2f8ff] p-6 text-center text-sm text-[#6b819a]">No learning topics are currently mapped to your registered grade.</p>}</div></section>
 <aside className="space-y-4"><section className="rounded-[22px] border border-[#dceaf8] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-black">Recent Achievements</h2><Link href="/rewards" className="text-sm font-bold text-[#117ae9]">View All</Link></div><div className="mt-5 grid grid-cols-4 gap-2 text-center">{([{img:"badge-first-lesson.webp",label:"First Lesson",key:"first-lesson"},{img:"badge-ten-lessons.webp",label:"10 Lessons",key:"lessons-10"},{img:"badge-quiz-master.webp",label:"Quiz Master",key:"quiz-master"},{img:"badge-seven-day-streak.webp",label:"7-Day Streak",key:"streak-7"}]).map(x=><div key={x.label} className={earned.includes(x.key)?"":"opacity-50"}><img src={`/progress-assets/${x.img}`} alt={x.label} className="mx-auto h-14 w-14 object-contain"/><p className="mt-2 text-[10px] font-bold">{x.label}</p><p className="text-[10px] text-[#7b90a8]">{earned.includes(x.key)?"Earned":"Locked"}</p></div>)}</div><p className="mt-3 text-xs text-[#7489a4]">Only earned badges appear unlocked. Visit Rewards for details.</p></section>
 <section className="rounded-[22px] border border-[#dceaf8] bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Weekly Activity</h2><div className="mt-5 flex h-32 items-end gap-2">{weeklyDays.map((d,i)=><div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full max-w-8 rounded-t-md bg-[#27c57a]" style={{height:`${d.xp?Math.max(10,d.xp/maxDayXp*100):3}%`,backgroundColor:i%2?"#167df0":"#28c679"}}/><span className="text-xs font-bold text-[#526f90]">{d.label}</span></div>)}</div><p className="mt-3 text-center text-sm font-bold text-[#0874db]">{weeklyXp} XP earned this week</p></section>
 <section className="rounded-[22px] border border-[#dceaf8] bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Learning Journey</h2><div className="mt-4 flex items-center gap-3"><img src="/progress-assets/learning-time-boy.webp" alt="Student reading" className="h-24 w-24 rounded-xl object-cover"/><div><p className="text-sm text-[#7288a0]">Recorded activity</p><p className="text-2xl font-black">{missionsThisWeek} sessions</p><p className="text-xs text-[#7288a0]">This week · Time tracking coming soon</p></div></div></section></aside>
 </div></div></main>;
}
