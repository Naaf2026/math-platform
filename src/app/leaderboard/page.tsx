"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Medal, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Learner = { id: string; full_name: string | null; xp: number; current_streak: number; challenge_points: number };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("id,full_name,xp,current_streak,challenge_points").order("xp", { ascending: false }).limit(50);
      setRows((data ?? []) as Learner[]);
      setLoading(false);
    }
    void load();
  }, []);

  return <main className="min-h-screen bg-gradient-to-br from-[#f6f7ff] via-white to-[#eefbff] pb-24 lg:pl-20"><div className="mx-auto max-w-5xl px-5 py-7 lg:px-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Community</p><h1 className="mt-1 text-3xl font-black text-[#15233f]">Leaderboard</h1><p className="mt-2 text-sm font-semibold text-slate-500">Celebrate progress, consistency and learning effort.</p></div><Link href="/training" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200"><ArrowLeft size={16}/> Training</Link></div>
    <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-7 text-white shadow-xl"><div className="grid gap-5 sm:grid-cols-3"><div className="sm:col-span-2"><Trophy size={32}/><h2 className="mt-4 text-3xl font-black">Top learners</h2><p className="mt-1 text-sm font-semibold text-indigo-100">Track learning XP and Challenge Points earned from Buddy Challenges.</p></div><div className="rounded-3xl bg-white/10 p-5"><Zap size={22}/><p className="mt-3 text-2xl font-black">{rows.length}</p><p className="text-xs font-bold text-indigo-100">Learners ranked</p></div></div></section>
    <section className="mt-6 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">{loading ? <div className="p-8 text-center font-black text-slate-500">Loading leaderboard…</div> : rows.length ? <div className="space-y-2">{rows.map((row, index) => <div key={row.id} className={`flex items-center gap-4 rounded-2xl p-4 ${index < 3 ? "bg-violet-50" : "bg-slate-50"}`}><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white font-black text-slate-600 shadow-sm">{index === 0 ? <Crown size={20} className="text-yellow-500"/> : index === 1 ? <Medal size={20} className="text-slate-500"/> : index === 2 ? <Medal size={20} className="text-orange-500"/> : index + 1}</div><div className="min-w-0 flex-1"><p className="truncate font-black text-[#15233f]">{row.full_name || "Learner"}</p><p className="text-xs font-bold text-slate-400">🔥 {row.current_streak ?? 0} day streak</p></div><div className="text-right"><p className="font-black text-violet-700">{row.xp ?? 0} XP</p><p className="text-xs font-black text-orange-600">🏆 {row.challenge_points ?? 0} CP</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rank {index + 1}</p></div></div>)}</div> : <div className="p-8 text-center"><p className="font-black text-slate-700">No rankings yet</p><p className="mt-1 text-sm text-slate-500">Complete practice to appear here.</p></div>}</section>
  </div></main>;
}
