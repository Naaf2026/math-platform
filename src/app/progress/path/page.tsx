"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, ChevronRight, LockKeyhole, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PathStep = {
  step_number: number;
  step_type: "remediate" | "practice" | "mastery_check" | "advance" | "challenge";
  action_type: string;
  objective_id: string;
  objective: string;
  topic_id: string;
  topic: string;
  level: string | null;
  mastery: number;
  mastery_band: string;
  prerequisite_topic_id: string | null;
  prerequisite_topic: string | null;
  prerequisite_mastery: number;
  locked: boolean;
  available: boolean;
  question_id: string | null;
  question_prompt: string | null;
  question_type: string | null;
  difficulty: string | null;
  points: number | null;
  explanation: string | null;
  expected_milestone: string;
  reason: string;
  priority: number;
};

const stepMeta: Record<PathStep["step_type"], { emoji: string; label: string; tone: string; soft: string }> = {
  remediate: { emoji: "🧩", label: "Remediate", tone: "from-rose-500 to-orange-500", soft: "bg-rose-50 text-rose-700" },
  practice: { emoji: "🎯", label: "Practice", tone: "from-violet-500 to-indigo-500", soft: "bg-violet-50 text-violet-700" },
  mastery_check: { emoji: "🧠", label: "Mastery Check", tone: "from-cyan-500 to-blue-500", soft: "bg-cyan-50 text-cyan-700" },
  advance: { emoji: "🚀", label: "Advance", tone: "from-emerald-500 to-teal-500", soft: "bg-emerald-50 text-emerald-700" },
  challenge: { emoji: "🏆", label: "Challenge", tone: "from-amber-400 to-orange-500", soft: "bg-amber-50 text-amber-700" },
};

export default function PersonalizedLearningPath() {
  const [steps, setSteps] = useState<PathStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadPath();
  }, []);

  async function loadPath() {
    const supabase = createClient();
    if (!supabase) {
      setError("Your learning account is not configured yet.");
      setLoading(false);
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/login";
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("get_personalized_learning_path", { p_limit: 12 });
    if (rpcError) {
      setError(rpcError.message || "Your learning path could not be loaded.");
    } else {
      setSteps((data || []) as PathStep[]);
    }
    setLoading(false);
  }

  const available = useMemo(() => steps.filter(step => step.available), [steps]);
  const locked = useMemo(() => steps.filter(step => step.locked), [steps]);
  const firstAvailable = available[0];
  const mastered = steps.filter(step => step.mastery >= 80).length;

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="rounded-3xl bg-white p-9 text-center shadow-xl"><Sparkles className="mx-auto text-violet-500" size={28} /><p className="mt-3 font-black text-[#071b3a]">Building your learning path…</p><p className="mt-1 text-sm text-slate-500">Checking mastery, prerequisites and your next best actions.</p></div></main>;
  }

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><p className="font-black text-red-600">{error}</p><Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 font-black text-violet-600">Back to dashboard <ArrowRight size={16} /></Link></div></main>;
  }

  return <main className="min-h-screen bg-gradient-to-br from-[#f7f7ff] via-white to-[#effcff]">
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-violet-50"><ArrowLeft size={17} /> Dashboard</Link><div className="flex items-center gap-2 text-sm font-black text-[#071b3a]"><Brain size={19} className="text-violet-600" /> Learning Path</div><Link href="/mission" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-200">Practice <ArrowRight size={16} /></Link></div></header>

    <div className="mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl shadow-indigo-200 sm:p-10"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" /><div className="relative grid gap-7 lg:grid-cols-[1.3fr_.7fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14} /> Personalized learning</div><h1 className="mt-4 text-3xl font-black sm:text-5xl">Your path, one step at a time.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Your journey is ordered around what you need now: fix prerequisite gaps, build consistency, prove mastery, then unlock harder work.</p></div><div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="grid grid-cols-3 gap-3 text-center"><div><Target className="mx-auto text-cyan-200" size={21} /><p className="mt-2 text-2xl font-black">{steps.length}</p><p className="text-[11px] text-indigo-100">Steps</p></div><div><Zap className="mx-auto text-yellow-200" size={21} /><p className="mt-2 text-2xl font-black">{available.length}</p><p className="text-[11px] text-indigo-100">Ready</p></div><div><Trophy className="mx-auto text-amber-200" size={21} /><p className="mt-2 text-2xl font-black">{mastered}</p><p className="text-[11px] text-indigo-100">Strong</p></div></div></div></div></section>

      {!steps.length ? <section className="mt-7 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-3xl">🗺️</div><h2 className="mt-4 text-2xl font-black text-[#071b3a]">Your path is ready to grow</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Complete a few adaptive questions and your personalized journey will start filling in.</p><Link href="/mission" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white">Start your first mission <ArrowRight size={18} /></Link></section> : <>
        <div className="mb-5 mt-8 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Today → Mastery</p><h2 className="mt-1 text-2xl font-black text-[#071b3a] sm:text-3xl">Your next-best learning journey</h2></div><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline-flex">{available.length} ready now</span></div>
        <div className="relative space-y-4">{steps.map((step, index) => { const meta = stepMeta[step.step_type]; const isFirst = firstAvailable?.objective_id === step.objective_id && firstAvailable?.step_number === step.step_number; return <article key={`${step.objective_id}-${step.step_number}`} className={`relative overflow-hidden rounded-[1.8rem] border bg-white p-5 shadow-sm transition sm:p-6 ${step.locked ? "border-slate-200 opacity-80" : isFirst ? "border-violet-200 shadow-lg shadow-violet-100" : "border-slate-100"}`}><div className="flex gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.tone} text-2xl text-white shadow-md`}>{step.locked ? "🔒" : meta.emoji}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-wider text-slate-400">Step {index + 1}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${meta.soft}`}>{meta.label}</span>{step.locked && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">Locked</span>}{isFirst && <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-black text-orange-700">Next best action</span>}</div><div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><h3 className="text-xl font-black text-[#071b3a]">{step.objective}</h3><p className="mt-1 text-sm font-bold text-slate-500">{step.topic}{step.level ? ` · ${step.level}` : ""} · {step.mastery}% mastery</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{step.reason}</p>{step.prerequisite_topic && <p className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"><ChevronRight size={14} /> Prerequisite: {step.prerequisite_topic} · {step.prerequisite_mastery}%</p>}</div><div className="shrink-0 md:w-56"><div className="flex items-center justify-between text-xs font-black text-slate-500"><span>{step.mastery_band}</span><span>{step.mastery}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${meta.tone}`} style={{ width: `${Math.min(100, Math.max(0, step.mastery))}%` }} /></div></div></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold text-slate-500">🏁 {step.expected_milestone}</p>{step.available ? <Link href="/mission" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-violet-100 hover:bg-violet-700">Start this step <ArrowRight size={16} /></Link> : <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500"><LockKeyhole size={16} /> Unlock prerequisite first</span>}</div></div></div></article>; })}</div>

        <section className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Path logic</p><p className="mt-2 text-sm leading-6 text-slate-600"><strong>Remediate → Practice → Mastery Check → Advance → Challenge.</strong> Prerequisites are checked before progression, so the path adapts instead of simply moving through a fixed syllabus.</p></div><div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Keep learning</p><p className="mt-2 text-sm leading-6 text-slate-600">Complete the next available step and return here. Your mastery and next-best action will update from your latest results.</p><Link href="/progress/mastery-graph" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-cyan-700">View mastery graph <ArrowRight size={15} /></Link></div></section>
      </>}
    </div>
  </main>;
}
