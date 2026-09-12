"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, ChevronRight, LockKeyhole, RefreshCw, Sparkles, Target, Trophy, XCircle, Zap } from "lucide-react";
import InteractiveQuestionEngine from "@/components/interactive-question-engine";
import { answersMatch, type InteractiveQuestion } from "@/lib/interactive-question";
import { getPathQuestion, getPersonalizedLearningPath, recordLearningPathStep, startLearningPathStep, submitLearningAnswer, type LearningPathStep, type PathQuestion } from "@/lib/learning-path";

const stepMeta: Record<LearningPathStep["step_type"], { emoji: string; label: string; tone: string; soft: string }> = {
  remediate: { emoji: "🧩", label: "Remediate", tone: "from-rose-500 to-orange-500", soft: "bg-rose-50 text-rose-700" },
  practice: { emoji: "🎯", label: "Practice", tone: "from-violet-500 to-indigo-500", soft: "bg-violet-50 text-violet-700" },
  mastery_check: { emoji: "🧠", label: "Mastery Check", tone: "from-cyan-500 to-blue-500", soft: "bg-cyan-50 text-cyan-700" },
  advance: { emoji: "🚀", label: "Advance", tone: "from-emerald-500 to-teal-500", soft: "bg-emerald-50 text-emerald-700" },
  challenge: { emoji: "🏆", label: "Challenge", tone: "from-amber-400 to-orange-500", soft: "bg-amber-50 text-amber-700" },
};

export default function PersonalizedLearningPath() {
  const [steps, setSteps] = useState<LearningPathStep[]>([]);
  const [active, setActive] = useState<LearningPathStep | null>(null);
  const [question, setQuestion] = useState<PathQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function loadPath() {
    try {
      setError("");
      const next = await getPersonalizedLearningPath(12);
      setSteps(next);
      setActive(current => current ? next.find(s => s.objective_id === current.objective_id && s.step_number === current.step_number) || null : null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Your learning path could not be loaded.";
      if (message.toLowerCase().includes("authentication")) { window.location.href = "/login"; return; }
      setError(message);
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadPath(); }, []);

  const available = useMemo(() => steps.filter(step => step.available && !step.locked), [steps]);
  const locked = useMemo(() => steps.filter(step => step.locked), [steps]);
  const firstAvailable = available[0];
  const mastered = steps.filter(step => step.mastery >= 80).length;

  async function startStep(step: LearningPathStep) {
    if (!step.available || step.locked || working) return;
    setWorking(true); setError(""); setSelected(null); setLastCorrect(null); setQuestion(null);
    try {
      await startLearningPathStep(step);
      if (!step.question_id) throw new Error("No published question is currently available for this step.");
      const q = await getPathQuestion(step.question_id);
      if (!q) throw new Error("The selected learning question is no longer available.");
      setActive(step); setQuestion(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "This step could not be started.");
    } finally { setWorking(false); }
  }

  async function answerStep(answer: string) {
    if (!active || !question || selected !== null || working) return;
    setSelected(answer); setWorking(true); setError("");
    try {
      const result = await submitLearningAnswer(question.id, answer);
      const correct = Boolean(result?.is_correct ?? answersMatch(answer, question.answer));
      setLastCorrect(correct);
      await recordLearningPathStep(active.objective_id, correct ? "completed" : "in_progress", active.step_type, question.id, correct);
      if (correct) await loadPath();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your answer could not be recorded.");
      setSelected(null); setLastCorrect(null);
    } finally { setWorking(false); }
  }

  function retryStep() { setSelected(null); setLastCorrect(null); }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="rounded-3xl bg-white p-9 text-center shadow-xl"><Sparkles className="mx-auto text-violet-500" size={28} /><p className="mt-3 font-black text-[#071b3a]">Building your learning path…</p><p className="mt-1 text-sm text-slate-500">Checking mastery, prerequisites and progress.</p></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-[#f7f7ff] via-white to-[#effcff]">
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-600 hover:bg-violet-50"><ArrowLeft size={17} /> Dashboard</Link><div className="flex items-center gap-2 text-sm font-black text-[#071b3a]"><Brain size={19} className="text-violet-600" /> Learning Path</div><Link href="/mission" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-200">Practice <ArrowRight size={16} /></Link></div></header>

    <div className="mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl shadow-indigo-200 sm:p-10"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" /><div className="relative grid gap-7 lg:grid-cols-[1.3fr_.7fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14} /> Personalized learning</div><h1 className="mt-4 text-3xl font-black sm:text-5xl">Your path, one step at a time.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Start the next recommended step, answer the live question, and your progress is saved automatically.</p></div><div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="grid grid-cols-3 gap-3 text-center"><div><Target className="mx-auto text-cyan-200" size={21} /><p className="mt-2 text-2xl font-black">{steps.length}</p><p className="text-[11px] text-indigo-100">Steps</p></div><div><Zap className="mx-auto text-yellow-200" size={21} /><p className="mt-2 text-2xl font-black">{available.length}</p><p className="text-[11px] text-indigo-100">Ready</p></div><div><Trophy className="mx-auto text-amber-200" size={21} /><p className="mt-2 text-2xl font-black">{mastered}</p><p className="text-[11px] text-indigo-100">Strong</p></div></div></div></div></section>

      {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      {active && question ? <section className="mt-7 rounded-[2rem] border border-violet-100 bg-white p-5 shadow-xl shadow-violet-100/60 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Live step · {stepMeta[active.step_type].label}</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">{active.objective}</h2><p className="mt-1 text-sm font-bold text-slate-500">{active.topic} · {active.mastery}% mastery</p></div><button onClick={() => { setActive(null); setQuestion(null); setSelected(null); setLastCorrect(null); }} className="rounded-xl px-3 py-2 text-sm font-black text-slate-500 hover:bg-slate-100">Back to path</button></div><div className="mt-6 rounded-[1.6rem] bg-slate-50 p-4 sm:p-6"><p className="mb-5 text-xl font-black leading-8 text-[#071b3a] sm:text-2xl">{question.prompt}</p><InteractiveQuestionEngine question={{ id: question.id, prompt: question.prompt, options: question.options, answer: question.answer, explanation: question.explanation || undefined, hint: question.hint, question_type: question.question_type, interaction_type: question.interaction_type, interaction_config: question.interaction_config, points: question.points }} selected={selected} disabled={working} onAnswer={(answer) => void answerStep(answer)} /></div>{lastCorrect === true && <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-4"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600" /><div><p className="font-black text-emerald-800">Step completed!</p><p className="text-sm font-semibold text-emerald-700">Your path has been recalculated and the next step can now unlock.</p></div></div><button onClick={() => { setActive(null); setQuestion(null); setSelected(null); setLastCorrect(null); }} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Continue path</button></div>}{lastCorrect === false && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-orange-50 p-4"><div className="flex items-center gap-3"><XCircle className="text-orange-600" /><div><p className="font-black text-orange-800">Keep practising this step.</p><p className="text-sm font-semibold text-orange-700">Your result was saved. Try the question again and strengthen this objective.</p></div></div><button onClick={retryStep} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white"><RefreshCw size={15} /> Try again</button></div>}</section> : <>
        {!steps.length ? <section className="mt-7 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-3xl">🗺️</div><h2 className="mt-4 text-2xl font-black text-[#071b3a]">Your path is ready to grow</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Complete a few adaptive questions and your personalized journey will start filling in.</p><Link href="/mission" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white">Start your first mission <ArrowRight size={18} /></Link></section> : <>
          <div className="mb-5 mt-8 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Today → Mastery</p><h2 className="mt-1 text-2xl font-black text-[#071b3a] sm:text-3xl">Your next-best learning journey</h2></div><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline-flex">{available.length} ready now</span></div>
          <div className="relative space-y-4">{steps.map((step, index) => { const meta = stepMeta[step.step_type]; const isFirst = firstAvailable?.objective_id === step.objective_id && firstAvailable?.step_number === step.step_number; return <article key={`${step.objective_id}-${step.step_number}`} className={`relative overflow-hidden rounded-[1.8rem] border bg-white p-5 shadow-sm transition sm:p-6 ${step.locked ? "border-slate-200 opacity-80" : isFirst ? "border-violet-200 shadow-lg shadow-violet-100" : "border-slate-100"}`}><div className="flex gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.tone} text-2xl text-white shadow-md`}>{step.locked ? "🔒" : meta.emoji}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-wider text-slate-400">Step {index + 1}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${meta.soft}`}>{meta.label}</span>{step.locked && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">Locked</span>}{isFirst && <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-black text-orange-700">Next best action</span>}</div><div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><h3 className="text-xl font-black text-[#071b3a]">{step.objective}</h3><p className="mt-1 text-sm font-bold text-slate-500">{step.topic}{step.level ? ` · ${step.level}` : ""} · {step.mastery}% mastery</p><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{step.reason}</p>{step.prerequisite_topic && <p className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"><ChevronRight size={14} /> Prerequisite: {step.prerequisite_topic} · {step.prerequisite_mastery}%</p>}</div><div className="shrink-0 md:w-56"><div className="flex items-center justify-between text-xs font-black text-slate-500"><span>{step.mastery_band}</span><span>{step.mastery}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${meta.tone}`} style={{ width: `${Math.min(100, Math.max(0, step.mastery))}%` }} /></div></div></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold text-slate-500">🏁 {step.expected_milestone}</p>{step.available && !step.locked ? <button onClick={() => void startStep(step)} disabled={working} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-violet-100 hover:bg-violet-700 disabled:opacity-50">Start this step <ArrowRight size={16} /></button> : <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-500"><LockKeyhole size={16} /> Unlock prerequisite first</span>}</div></div></div></article>; })}</div>

          <section className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Live progress</p><p className="mt-2 text-sm leading-6 text-slate-600">Starting a step creates persistent progress. Every answer is recorded through the learning engine, and a correct result completes the current step before the path is recalculated.</p></div><div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Keep learning</p><p className="mt-2 text-sm leading-6 text-slate-600">Prerequisites, mastery and next-best actions are checked again after completion, so your journey changes with your performance.</p><Link href="/progress/mastery-graph" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-cyan-700">View mastery graph <ArrowRight size={15} /></Link></div></section>
        </>}
      </>}
    </div>
  </main>;
}
