"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Award, Sparkles, Trophy } from "lucide-react";
import { evaluateLearningAchievements, getMyAchievements, type Achievement } from "@/lib/achievements";

export default function AchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const evaluated = await evaluateLearningAchievements();
      setNewKeys(evaluated.filter((x) => x.newly_earned).map((x) => x.achievement_key));
      setItems(await getMyAchievements());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Achievements could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-violet-50 p-6"><div className="rounded-3xl bg-white p-9 text-center shadow-xl"><Trophy className="mx-auto text-amber-500" size={30}/><p className="mt-3 font-black text-[#071b3a]">Checking your achievements…</p></div></main>;
  if (error) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><p className="font-black text-red-600">{error}</p><Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 font-black text-violet-600">Back to dashboard <ArrowRight size={16}/></Link></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-amber-50/70 via-white to-violet-50/70">
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-violet-50"><ArrowLeft size={17}/> Dashboard</Link><div className="flex items-center gap-2 font-black text-[#071b3a]"><Trophy size={19} className="text-amber-500"/> Achievements</div><Link href="/progress/path" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Learning Path <ArrowRight size={16}/></Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-amber-400 via-orange-500 to-violet-600 p-7 text-white shadow-2xl sm:p-10"><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl"/><div className="relative"><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Your milestones</div><h1 className="mt-4 text-3xl font-black sm:text-5xl">Every step counts.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">Celebrate correct answers, topic mastery, learning-path progress and streaks as your skills grow.</p><div className="mt-6 flex flex-wrap gap-3"><span className="rounded-2xl bg-white/15 px-4 py-2 font-black">🏆 {items.length} earned</span><span className="rounded-2xl bg-white/15 px-4 py-2 font-black">⚡ {items.reduce((s,a)=>s+a.xp_awarded,0)} bonus XP</span></div></div></section>
      {newKeys.length > 0 && <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><div className="rounded-2xl bg-white p-3 text-2xl shadow-sm">🎉</div><div><p className="font-black text-amber-900">New achievement unlocked!</p><p className="mt-1 text-sm text-amber-800">You earned {newKeys.length} new milestone{newKeys.length === 1 ? "" : "s"}. Keep going!</p></div></div></section>}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((a)=><article key={a.achievement_key} className={`rounded-[1.8rem] border bg-white p-5 shadow-sm ${newKeys.includes(a.achievement_key)?"border-amber-300 shadow-lg shadow-amber-100":"border-slate-100"}`}><div className="flex items-start justify-between gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-3xl">{a.icon}</div>{newKeys.includes(a.achievement_key)&&<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">New</span>}</div><h2 className="mt-4 text-lg font-black text-[#071b3a]">{a.title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{a.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-black"><span className="text-slate-400">{a.achievement_type}</span><span className="text-violet-600">+{a.xp_awarded} XP</span></div></article>)}</section>
      {!items.length && <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm"><Award className="mx-auto text-slate-300" size={42}/><h2 className="mt-4 text-xl font-black text-[#071b3a]">Your first badge is waiting</h2><p className="mt-2 text-sm text-slate-500">Complete an adaptive question to start your achievement journey.</p><Link href="/mission" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Start learning <ArrowRight size={16}/></Link></section>}
    </div>
  </main>;
}
