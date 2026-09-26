"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Crown, Gamepad2, Gift, GraduationCap, Home, Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/learner-notification-bell";

type Learner = { id:string; full_name:string|null; xp:number; current_streak:number; challenge_points:number; avatar_url?:string|null; avatar_emoji?:string|null };
type Profile = { full_name:string|null; grade:string|null; avatar_url:string|null; avatar_emoji:string|null; xp:number; current_streak:number };
function gradeLabel(v:string|null|undefined){const m=String(v||"").match(/[1-7]/);return m?`Grade ${m[0]}`:"Student";}

export default function LeaderboardPage(){
 const [rows,setRows]=useState<Learner[]>([]); const [profile,setProfile]=useState<Profile|null>(null); const [userId,setUserId]=useState(""); const [loading,setLoading]=useState(true); const [sort,setSort]=useState<"xp"|"challenge_points"|"current_streak">("xp");
 useEffect(()=>{(async()=>{const s=createClient(); if(!s){setLoading(false);return;} const {data:a}=await s.auth.getUser(); if(!a.user){window.location.href="/login";return;}
 setUserId(a.user.id); const [{data:p},{data:r}]=await Promise.all([s.from("profiles").select("full_name,grade,avatar_url,avatar_emoji,xp,current_streak").eq("id",a.user.id).maybeSingle(),s.from("profiles").select("id,full_name,xp,current_streak,challenge_points,avatar_url,avatar_emoji").order("xp",{ascending:false}).limit(50)]);
 setProfile(p as Profile|null);setRows((r??[]) as Learner[]);setLoading(false);})();},[]);
 const ranked=[...rows].sort((a,b)=>(b[sort]??0)-(a[sort]??0)||(b.xp??0)-(a.xp??0)); const myRank=ranked.findIndex(r=>r.id===userId)+1; const top=ranked.slice(0,3);
 const Avatar=({src,emoji,size="h-12 w-12"}:{src?:string|null;emoji?:string|null;size?:string})=>src?<img src={src} alt="" className={`${size} rounded-full object-cover`}/>:<div className={`${size} grid place-items-center rounded-full bg-[#dff7ff] text-2xl`}>{emoji||"🧑‍🎓"}</div>;
 return <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#102b51]">
 <header className="hidden bg-white shadow-sm lg:block"><div className="mx-auto flex h-[74px] max-w-[1400px] items-center justify-between gap-5 px-7">
 <Link href="/dashboard"><img src="/fahi-hisaabu-logo-optimized.webp" alt="Fahi Hisaabu" className="h-14 max-w-[180px] object-contain"/></Link>
 <nav className="flex items-center gap-1 text-sm font-bold">{([{href:"/dashboard",label:"Home",Icon:Home},{href:"/brain-games",label:"Games",Icon:Gamepad2},{href:"/leaderboard",label:"Leaderboard",Icon:Trophy},{href:"/rewards",label:"Rewards",Icon:Gift},{href:"/progress",label:"Progress",Icon:BarChart3},{href:"/profile",label:"Profile",Icon:GraduationCap}]).map(({href,label,Icon})=><Link key={href} href={href} className={`flex items-center gap-2 rounded-xl px-3 py-3 ${href==="/leaderboard"?"bg-[#e2f3ff] text-[#007be5]":"text-[#425a78] hover:bg-sky-50"}`}><Icon size={18}/>{label}</Link>)}</nav><NotificationBell/></div></header>
 <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-7">
 <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#087bd9] via-[#25b4ed] to-[#6bdadf] px-6 py-8 text-white shadow-lg sm:px-10 sm:py-12">
 <div className="pointer-events-none absolute -right-8 -top-12 h-60 w-60 rounded-full border-[35px] border-white/10"/><div className="pointer-events-none absolute bottom-[-70px] right-32 h-44 w-44 rounded-full bg-white/10"/>
 <div className="relative max-w-xl"><div className="inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">🏆 Fahi Hisaabu Champions</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Leaderboard</h1><p className="mt-3 text-lg font-semibold text-white/95">Every maths adventure counts. Celebrate your progress and cheer on fellow learners!</p></div>
 <div className="absolute bottom-0 right-[7%] hidden text-[125px] drop-shadow-xl sm:block" aria-hidden="true">🏆</div>
 </section>
 <section className="grid gap-3 sm:grid-cols-3">
 <div className="flex items-center gap-4 rounded-2xl bg-[#fff8e9] p-5"><span className="text-4xl">🏅</span><div><p className="text-3xl font-black">{loading?"—":myRank?`#${myRank}`:"—"}</p><p className="font-bold text-[#52647c]">My rank</p></div></div>
 <div className="flex items-center gap-4 rounded-2xl bg-[#f4eefe] p-5"><span className="text-4xl">⭐</span><div><p className="text-3xl font-black">{loading?"—":profile?.xp??0}</p><p className="font-bold text-[#52647c]">My total XP</p></div></div>
 <div className="flex items-center gap-4 rounded-2xl bg-[#e9f7ff] p-5"><span className="text-4xl">🔥</span><div><p className="text-3xl font-black">{loading?"—":profile?.current_streak??0}</p><p className="font-bold text-[#52647c]">My day streak</p></div></div>
 </section>
 <section className="rounded-[26px] border border-[#d7eafa] bg-white p-5 shadow-sm sm:p-7">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black">Hall of Champions</h2><p className="mt-1 text-sm text-[#607994]">Celebrate our leading maths learners.</p></div><div className="flex flex-wrap gap-2">{([{key:"xp",label:"⭐ Total XP"},{key:"challenge_points",label:"🏆 Challenge points"},{key:"current_streak",label:"🔥 Streak"}] as const).map(t=><button key={t.key} type="button" onClick={()=>setSort(t.key)} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${sort===t.key?"bg-[#087bd9] text-white shadow-md":"bg-[#edf6ff] text-[#40729b] hover:bg-[#dbefff]"}`}>{t.label}</button>)}</div></div>
 {loading?<p className="py-16 text-center font-bold text-[#607994]">Loading champions…</p>:top.length?<div className="mt-7 grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
 {[top[1],top[0],top[2]].filter(Boolean).map((r)=>{const rank=ranked.findIndex(x=>x.id===r.id)+1;return <div key={r.id} className={`relative flex flex-col items-center rounded-[24px] border p-5 text-center ${rank===1?"order-first border-[#f9d574] bg-gradient-to-b from-[#fff8dc] to-[#fffdf5] sm:order-none sm:min-h-[300px]":"border-[#d9e6f2] bg-[#f7fbff] sm:min-h-[260px]"}`}><span className="absolute right-4 top-3 text-3xl">{rank===1?"👑":rank===2?"🥈":"🥉"}</span><span className="mb-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#607994]">#{rank}</span><div className={`rounded-full p-1 ${rank===1?"bg-[#f4cb4c]":"bg-[#c8e9fc]"}`}><Avatar src={r.avatar_url} emoji={r.avatar_emoji} size={rank===1?"h-20 w-20":"h-16 w-16"}/></div><h3 className="mt-3 max-w-full truncate text-lg font-black">{r.full_name||"Learner"}{r.id===userId?" (You)":""}</h3><p className="mt-1 text-sm text-[#647d95]">🔥 {r.current_streak??0} day streak</p><div className="mt-4 rounded-full bg-white px-5 py-2 font-black text-[#087bd9]">{sort==="xp"?`⭐ ${r.xp??0} XP`:sort==="challenge_points"?`🏆 ${r.challenge_points??0} points`:`🔥 ${r.current_streak??0} days`}</div></div>})}
 </div>:<p className="py-14 text-center font-bold text-[#607994]">No rankings yet. Your maths journey starts here!</p>}
 </section>
 <section className="overflow-hidden rounded-[26px] border border-[#d7eafa] bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black">All Learners</h2><p className="mt-1 text-sm text-[#607994]">Showing {ranked.length} learners ranked by {sort==="xp"?"total XP":sort==="challenge_points"?"challenge points":"current streak"}.</p></div><Link href="/rewards" className="rounded-full bg-[#e9f6ff] px-4 py-2 text-sm font-extrabold text-[#087bd9]">🎁 My Rewards →</Link></div>
 <div className="space-y-2">{ranked.map((r,i)=><div key={r.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 sm:gap-4 sm:px-5 ${r.id===userId?"border-[#67c3f4] bg-[#eaf7ff]":"border-[#edf2f8] bg-[#fbfdff]"}`}><div className="w-9 shrink-0 text-center text-lg font-black text-[#497294]">{i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}</div><Avatar src={r.avatar_url} emoji={r.avatar_emoji} size="h-12 w-12"/><div className="min-w-0 flex-1"><p className="truncate font-black">{r.full_name||"Learner"}{r.id===userId&&<span className="ml-2 rounded-full bg-[#cceeff] px-2 py-1 text-xs text-[#087bd9]">You</span>}</p><p className="mt-1 text-xs font-semibold text-[#7890a7]">🔥 {r.current_streak??0} day streak</p></div><div className="text-right"><p className="font-black text-[#087bd9]">{sort==="xp"?`${r.xp??0} XP`:sort==="challenge_points"?`${r.challenge_points??0} points`:`${r.current_streak??0} days`}</p><p className="text-xs text-[#7890a7]">{r.xp??0} total XP</p></div></div>)}</div>
 </section>
 <p className="pb-4 text-center text-xs text-[#7691a9]">Rankings reflect available learner records and update when you revisit this page.</p>
 </div></main>;
}
