"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, Gem, History, Sparkles, Trophy, Zap } from "lucide-react";
import { getMyRewardHistory, getMyRewardWallet, type RewardHistoryItem, type RewardWallet } from "@/lib/rewards";

export default function RewardsPage() {
  const [wallet, setWallet] = useState<RewardWallet | null>(null);
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, []);
  async function load() {
    try { const [w,h] = await Promise.all([getMyRewardWallet(), getMyRewardHistory(50)]); setWallet(w); setHistory(h); }
    catch (e) { setError(e instanceof Error ? e.message : "Rewards could not be loaded."); }
  }

  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-violet-50"><ArrowLeft size={17}/> Dashboard</Link><div className="flex items-center gap-2 font-black text-[#071b3a]"><Zap size={19} className="text-violet-600"/> Rewards</div><Link href="/progress/achievements" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-black text-white">Achievements</Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <section className="rounded-[2.2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-7 text-white shadow-2xl sm:p-10"><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Reward economy</div><h1 className="mt-4 text-3xl font-black sm:text-5xl">Your learning rewards.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base">XP, coins, gems and milestone rewards are tracked in one persistent reward history.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["XP",wallet?.xp??0,"⚡"],["Lifetime XP",wallet?.lifetime_xp??0,"🏆"],["Coins",wallet?.coins??0,"🪙"],["Gems",wallet?.gems??0,"💎"]].map(([label,value,icon])=><div key={String(label)} className="rounded-2xl bg-white/15 p-4"><div className="text-2xl">{icon}</div><div className="mt-2 text-2xl font-black">{value}</div><div className="text-xs font-bold text-violet-100">{label}</div></div>)}</div></section>
      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
      <section className="mt-8 rounded-[1.8rem] border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><History size={20} className="text-violet-600"/><h2 className="text-xl font-black text-[#071b3a]">Reward history</h2></div><div className="mt-5 divide-y divide-slate-100">{history.map((item,i)=><div key={`${item.created_at}-${i}`} className="flex items-center justify-between gap-4 py-4"><div><p className="font-black text-slate-800">{item.reason}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.source} · {new Date(item.created_at).toLocaleDateString()}</p></div><div className="flex shrink-0 gap-3 text-sm font-black"><span className="text-violet-600">{item.xp>0?`+${item.xp} XP`:""}</span>{item.coins>0&&<span className="text-amber-600">+{item.coins} 🪙</span>}{item.gems>0&&<span className="text-cyan-600">+{item.gems} 💎</span>}</div></div>)}{!history.length&&<div className="py-10 text-center text-sm font-semibold text-slate-400">No rewards recorded yet. Start learning to build your reward history.</div>}</div></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white p-5 shadow-sm"><Trophy className="text-amber-500"/><p className="mt-3 text-2xl font-black text-[#071b3a]">{wallet?.missions_completed??0}</p><p className="text-sm font-bold text-slate-500">Missions completed</p></div><div className="rounded-2xl bg-white p-5 shadow-sm"><Zap className="text-violet-500"/><p className="mt-3 text-2xl font-black text-[#071b3a]">{wallet?.best_combo??0}</p><p className="text-sm font-bold text-slate-500">Best combo</p></div><div className="rounded-2xl bg-white p-5 shadow-sm"><Coins className="text-amber-500"/><Gem className="ml-2 inline text-cyan-500"/><p className="mt-3 text-sm font-bold text-slate-500">Rewards will expand as the learning economy grows.</p></div></div>
    </div>
  </main>;
}
