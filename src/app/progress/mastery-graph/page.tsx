"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, LockKeyhole, Sparkles, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Row = {
  topic_id: string; topic: string; level: string; mastery: number; mastery_band: string;
  prerequisite_topic_id: string; prerequisite_topic: string; prerequisite_mastery: number;
  prerequisite_band: string; blocked: boolean; gap: number; recommendation: string;
};

export default function MasteryGraphPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured yet."); setLoading(false); return; }
    supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (authError || !data.user) { window.location.href = "/login"; return; }
      const { data: graph, error: graphError } = await supabase.rpc("get_mastery_graph");
      if (graphError) setError(graphError.message);
      else setRows((graph ?? []) as Row[]);
      setLoading(false);
    });
  }, []);

  const blocked = rows.filter(r => r.blocked);
  const ready = rows.filter(r => !r.blocked);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><Sparkles className="mx-auto text-violet-500"/><p className="mt-3 font-bold text-[#071b3a]">Building your prerequisite graph…</p></div></main>;
  if (error) return <main className="flex min-h-screen items-center justify-center p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><p className="font-bold text-red-600">{error}</p><Link href="/dashboard/mastery" className="mt-4 inline-block font-bold text-violet-600">Back to mastery</Link></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href="/dashboard/mastery" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-violet-50"><ArrowLeft size={17}/> Mastery</Link><div className="flex items-center gap-2 font-black text-[#071b3a]"><Brain size={19} className="text-violet-600"/> Prerequisite Graph</div><Link href="/mission" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Practice <ArrowRight size={16}/></Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      <section className="rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-9"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-100">Stage 11 · Mastery intelligence</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Learn in the right order.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100 sm:text-base">The platform now checks prerequisite mastery before pushing a learner into a downstream topic. Weak foundations can trigger remediation before progression.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{rows.length}</p><p className="text-xs text-indigo-100">Prerequisite links</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{blocked.length}</p><p className="text-xs text-indigo-100">Blocked paths</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{ready.length}</p><p className="text-xs text-indigo-100">Ready paths</p></div></div></section>
      <section className="mt-7 space-y-4">
        {rows.length === 0 && <div className="rounded-3xl bg-white p-8 text-center shadow-sm"><Target className="mx-auto text-violet-500"/><h2 className="mt-3 text-xl font-black text-[#071b3a]">No prerequisite links yet</h2><p className="mt-2 text-sm text-slate-500">As curriculum prerequisites are added, they will appear here.</p></div>}
        {rows.map((r, i) => <article key={`${r.topic_id}-${r.prerequisite_topic_id}-${i}`} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Target topic</p><h2 className="mt-1 text-xl font-black text-[#071b3a]">{r.topic}</h2><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{width:`${r.mastery}%`}}/></div><p className="mt-2 text-xs font-bold text-slate-500">{r.mastery}% mastery · {r.mastery_band}</p></div><div className="hidden lg:block text-slate-300"><ArrowRight size={26}/></div><div className={`rounded-2xl p-4 ${r.blocked ? "bg-amber-50" : "bg-emerald-50"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Prerequisite</p><h3 className="mt-1 font-black text-[#071b3a]">{r.prerequisite_topic}</h3></div>{r.blocked ? <LockKeyhole className="text-amber-600"/> : <CheckCircle2 className="text-emerald-600"/>}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className={`h-full rounded-full ${r.blocked ? "bg-amber-500" : "bg-emerald-500"}`} style={{width:`${r.prerequisite_mastery}%`}}/></div><p className="mt-2 text-xs font-bold text-slate-600">{r.prerequisite_mastery}% mastery · {r.prerequisite_band}</p><p className="mt-3 text-sm font-bold text-slate-700">{r.recommendation}</p>{r.blocked && <p className="mt-1 text-xs text-amber-700">{r.gap} points needed to reach readiness.</p>}</div></div></article>)}
      </section>
    </div>
  </main>;
}
