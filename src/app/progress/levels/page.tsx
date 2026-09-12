"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Crown, Sparkles, Trophy } from "lucide-react";
import { checkLearningLevelUp, getMyLevelHistory, getMyLevelProgress, type LevelHistoryItem, type LevelProgress } from "@/lib/levels";

export default function LevelsPage() {
  const [progress, setProgress] = useState<LevelProgress | null>(null);
  const [history, setHistory] = useState<LevelHistoryItem[]>([]);
  const [newLevel, setNewLevel] = useState<{ newly_reached_level: number; title: string; icon: string; xp_at_level: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const [p, h, up] = await Promise.all([getMyLevelProgress(), getMyLevelHistory(), checkLearningLevelUp()]);
      setProgress(p);
      setHistory(h);
      if (up.length) setNewLevel(up[up.length - 1]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Level progress could not be loaded.");
    } finally { setLoading(false); }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-amber-50 p-6"><div className="rounded-3xl bg-white p-9 text-center shadow-xl"><Crown className="mx-auto text-amber-500" size={32}/><p className="mt-3 font-black text-[#071b3a]">Loading your level…</p></div></main>;
  if (error || !progress) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><p className="font-black text-red-600">{error || "Level progress is unavailable."}</p><Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 font-black text-violet-600">Back to dashboard <ArrowRight size={16}/></Link></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-violet-50/70 via-white to-amber-50/70">
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-violet-50"><ArrowLeft size={17}/> Dashboard</Link><div className="flex items-center gap-2 font-black text-[#071b3a]"><Crown size={19} className="text-amber-500"/> Levels</div><Link href="/progress/rewards" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Rewards <ArrowRight size={16}/></Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-amber-500 p-7 text-white shadow-2xl sm:p-10"><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl"/><div className="relative"><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Your progression</div><div className="mt-5 flex items-center gap-5"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] bg-white/15 text-5xl shadow-inner">{progress.level_icon}</div><div><p className="text-sm font-bold text-violet-100">Level {progress.current_level}</p><h1 className="text-3xl font-black sm:text-5xl">{progress.level_title}</h1><p className="mt-1 text-sm text-violet-100">{progress.lifetime_xp.toLocaleString()} lifetime XP</p></div></div><div className="mt-7"><div className="mb-2 flex justify-between text-xs font-black"><span>{progress.xp_into_level} XP into this level</span><span>{progress.progress_percent}%</span></div><div className="h-4 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress.progress_percent}%` }}/></div></div>{progress.next_level ? <p className="mt-3 text-sm text-violet-100">{progress.xp_needed} XP to Level {progress.next_level} · {progress.next_level_title}</p> : <p className="mt-3 text-sm font-black text-amber-100">Maximum level reached — you are a Math Legend.</p>}</div></section>
      {newLevel && <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">{newLevel.icon}</div><div><p className="font-black text-amber-900">🎉 Level {newLevel.newly_reached_level} unlocked!</p><p className="mt-1 text-sm text-amber-800">You reached {newLevel.title} with {newLevel.xp_at_level} XP.</p></div></div></section>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-[1.8rem] border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-[#071b3a]">Level milestones</h2><p className="mt-1 text-sm text-slate-500">Your progression is based on lifetime XP.</p></div><Trophy className="text-amber-500" size={24}/></div><div className="mt-5 space-y-3">{history.map((item)=><div key={item.level} className={`flex items-center gap-4 rounded-2xl border p-4 ${item.level===progress.current_level?"border-violet-200 bg-violet-50":"border-slate-100 bg-slate-50/50"}`}><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">{item.icon}</div><div className="min-w-0 flex-1"><p className="font-black text-[#071b3a]">Level {item.level} · {item.title}</p><p className="text-xs text-slate-500">Reached with {item.xp_at_level.toLocaleString()} XP</p></div><span className="text-xs font-black text-slate-400">{new Date(item.reached_at).toLocaleDateString()}</span></div>)}</div>{!history.length&&<p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Your first level milestone will be recorded after your first level evaluation.</p>}</section>
        <aside className="space-y-4"><Link href="/progress/rewards" className="block rounded-[1.8rem] border border-slate-100 bg-white p-6 shadow-sm hover:border-violet-200"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Economy</p><h2 className="mt-2 text-xl font-black text-[#071b3a]">Rewards & XP</h2><p className="mt-2 text-sm leading-6 text-slate-500">See coins, gems, lifetime XP and your reward history.</p><span className="mt-4 inline-flex items-center gap-2 font-black text-violet-600">Open rewards <ArrowRight size={16}/></span></Link><Link href="/progress/achievements" className="block rounded-[1.8rem] border border-slate-100 bg-white p-6 shadow-sm hover:border-amber-200"><p className="text-xs font-black uppercase tracking-wider text-amber-600">Milestones</p><h2 className="mt-2 text-xl font-black text-[#071b3a]">Achievements</h2><p className="mt-2 text-sm leading-6 text-slate-500">Turn learning consistency into badges and bonus XP.</p><span className="mt-4 inline-flex items-center gap-2 font-black text-amber-600">View achievements <ArrowRight size={16}/></span></Link></aside>
      </div>
    </div>
  </main>;
}
