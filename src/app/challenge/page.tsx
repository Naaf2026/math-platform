"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, MessageCircle, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ChallengeProficiencyGate, { challengeStages, type ChallengeStage } from "@/components/challenge-proficiency-gate";

type Q = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  skill: string;
  points: number;
  question_type?: string;
  interaction_config?: { each?: number; groups?: number; target?: number; [key: string]: unknown };
};

type Profile = { xp: number; current_streak: number; best_streak: number };

export default function Challenge() {
  const [pool, setPool] = useState<Q[]>([]);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [earned, setEarned] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [built, setBuilt] = useState(0);
  const [stage, setStage] = useState<ChallengeStage>(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const current = questions[index];
  const isManipulative = current?.question_type === "manipulatives";
  const each = Number(current?.interaction_config?.each ?? 0);
  const groups = Number(current?.interaction_config?.groups ?? 0);
  const target = Number(current?.interaction_config?.target ?? current?.answer ?? 0);

  useEffect(() => { void load(); }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setError("Your learning account is not configured yet."); setLoading(false); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { window.location.href = "/login"; return; }

    const [{ data, error: questionError }, { data: profile }] = await Promise.all([
      supabase.rpc("get_adaptive_questions", { p_limit: 30 }),
      supabase.from("profiles").select("xp,current_streak,best_streak").eq("id", authData.user.id).maybeSingle(),
    ]);

    if (questionError || !data?.length) {
      setError(questionError?.message || "No challenge questions are available yet.");
      setLoading(false);
      return;
    }
    const normalized = data.map((item: Q) => ({ ...item, options: Array.isArray(item.options) ? item.options : [] }));
    setPool(normalized);
    setXp(profile?.xp ?? 0);
    setStreak(profile?.current_streak ?? 0);
    setLoading(false);
  }

  function startChallenge(selectedStage: ChallengeStage) {
    const aliases: Record<ChallengeStage, string[]> = {
      0: ["easy", "elementary", "beginner", "foundation"],
      1: ["medium", "intermediate", "development"],
      2: ["hard", "advanced", "proficiency"],
      3: ["expert", "master", "challenge"],
    };
    const wanted = aliases[selectedStage];
    const matching = pool.filter((item) => wanted.some((term) => item.difficulty?.toLowerCase().includes(term)));
    const chosen = (matching.length >= 5 ? matching : pool).slice(0, 10);
    setStage(selectedStage);
    setQuestions(chosen);
    setIndex(0); setDraft(""); setSubmitted(false); setResultCorrect(null); setShowAnswer(false); setBuilt(0);
    setCompleted([]); setCorrect(0); setEarned(0); setDone(false); setError(""); setStarted(true);
    try { window.localStorage.setItem("dailyChallengeStage", String(selectedStage)); } catch {}
  }

  function resetQuestion(nextIndex: number) {
    setIndex(nextIndex);
    setDraft(""); setSubmitted(false); setResultCorrect(null); setShowAnswer(false); setBuilt(0); setError("");
  }

  async function submitAnswer(answer = draft) {
    if (!current || !answer.trim() || submitted || saving) return;
    const supabase = createClient();
    if (!supabase) { setError("Your learning account is not configured yet."); return; }
    setSaving(true); setError("");
    const { data, error: submitError } = await supabase.rpc("submit_learning_answer", { p_question_id: current.id, p_selected_answer: answer.trim() });
    if (submitError) { setError(submitError.message || "Your answer could not be saved."); setSaving(false); return; }
    const result = data?.[0];
    const isCorrect = Boolean(result?.is_correct);
    setDraft(answer.trim()); setResultCorrect(isCorrect); setSubmitted(true); setShowAnswer(false);
    setCompleted((items) => items.includes(current.id) ? items : [...items, current.id]);
    if (isCorrect) { const amount = Number(result?.xp_awarded || 0); setCorrect((value) => value + 1); setEarned((value) => value + amount); }
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (userId) { const { data: profile } = await supabase.from("profiles").select("xp,current_streak,best_streak").eq("id", userId).maybeSingle(); if (profile) { setXp(profile.xp ?? 0); setStreak(profile.current_streak ?? 0); } }
    setSaving(false);
  }

  function buildGroup() {
    if (!isManipulative || submitted || saving) return;
    const next = Math.min(groups, built + 1);
    setBuilt(next);
    if (next === groups) setDraft(String(target));
  }

  function nextQuestion() {
    if (!submitted) return;
    if (index === questions.length - 1) { setDone(true); return; }
    resetQuestion(index + 1);
  }

  function changeQuestion() {
    if (!questions.length) return;
    resetQuestion((index + 1) % questions.length);
  }

  function restart() {
    setStarted(false); setQuestions([]); setIndex(0); setDraft(""); setSubmitted(false); setResultCorrect(null); setShowAnswer(false);
    setCorrect(0); setEarned(0); setCompleted([]); setBuilt(0); setDone(false); setError("");
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6"><div className="rounded-3xl bg-white p-10 text-center shadow-2xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-cyan-100 text-4xl">🚀</div><h1 className="mt-5 text-2xl font-black">Loading Daily Challenge</h1><p className="mt-2 text-slate-500">Preparing today's maths questions...</p></div></main>;

  if (error && !pool.length) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6"><div className="rounded-3xl bg-white p-9 text-center shadow-xl"><h1 className="text-2xl font-black">Challenge unavailable</h1><p className="mt-3 text-slate-500">{error}</p><button onClick={() => { setLoading(true); setError(""); void load(); }} className="mt-6 rounded-xl bg-cyan-600 px-6 py-3 font-black text-white">Try again</button></div></main>;

  if (!started) return <ChallengeProficiencyGate xp={xp} onStart={startChallenge} />;

  if (done) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6"><div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-yellow-100 text-yellow-500"><Trophy size={52}/></div><p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-600">Daily Challenge Complete</p><h1 className="mt-2 text-4xl font-black">Amazing work! 🎉</h1><div className="mt-7 grid grid-cols-3 gap-3"><Stat label="Correct" value={`${correct}/${questions.length}`}/><Stat label="XP earned" value={`+${earned}`}/><Stat label="Streak" value={`${streak} 🔥`}/></div><div className="mt-7 flex justify-center gap-3"><button onClick={restart} className="rounded-2xl bg-cyan-600 px-6 py-3 font-black text-white">Choose Level Again</button><Link href="/dashboard" className="rounded-2xl bg-slate-100 px-6 py-3 font-black">Dashboard</Link></div></div></main>;

  return (
    <main className="min-h-screen bg-[#d8eef2] text-slate-800">
      <header className="sticky top-0 z-50 bg-[#13b7d2] text-white shadow-md"><div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-black"><ArrowLeft size={18}/>Back</Link><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl font-black text-cyan-600">FV</div><span className="hidden text-lg font-black sm:inline">FAHI VISSNUN MATHS</span></div><div className="flex items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">⚡ {xp} XP</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">🔥 {streak}</span><span className="hidden rounded-full bg-white/20 px-3 py-1.5 text-xs font-black sm:inline">{challengeStages[stage].name}</span></div></div></header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden w-[250px] shrink-0 border-r border-slate-300 bg-white md:block"><div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><div className="text-xs font-black text-slate-500">PROFICIENCY</div><div className="mt-1 flex items-center justify-between"><span className="font-black">{challengeStages[stage].name}</span><span className="text-sm font-black text-slate-500">{completed.length} / {questions.length}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-500" style={{width:`${questions.length ? completed.length / questions.length * 100 : 0}%`}}/></div></div><div className="py-2">{questions.map((question,n)=>{const isCurrent=n===index;const isDone=completed.includes(question.id);return <button key={question.id} onClick={()=>resetQuestion(n)} className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${isCurrent?"bg-cyan-50":"hover:bg-slate-50"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-black ${isDone?"border-emerald-400 bg-emerald-400 text-white":isCurrent?"border-cyan-500 bg-cyan-500 text-white":"border-cyan-300 bg-white text-cyan-600"}`}>{isDone?<Check size={17}/>:n+1}</span><span className="min-w-0"><span className="block text-sm font-black">Question {n+1}</span><span className="block truncate text-[11px] text-slate-400">{question.skill||question.difficulty}</span><span className="text-[11px] font-bold text-slate-400">⚡ {n<5?1:n<8?2:3}</span></span></button>})}</div></aside>
        <section className="min-w-0 flex-1 bg-[#247f96] px-3 py-4 sm:px-7 sm:py-7"><div className="mx-auto max-w-[980px]"><div className="mb-4 flex items-center justify-between text-white"><button onClick={restart} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black"><ChevronLeft size={16}/>Change Level</button><div className="text-sm font-black opacity-80">{index+1} / {questions.length}</div></div><div className="rounded-[2rem] border-[7px] border-yellow-400 bg-[#f8ffff] shadow-[0_15px_0_rgba(11,60,72,.25)] sm:rounded-[2.5rem] sm:border-[9px]"><div className="relative min-h-[590px] overflow-hidden rounded-[1.4rem] bg-white sm:rounded-[1.8rem]"><div className="border-b border-slate-200 bg-gradient-to-b from-[#f3ffff] to-white px-5 pb-4 pt-4 sm:px-10"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><span className="text-2xl font-black text-slate-700">Question</span><span className="grid h-9 w-9 place-items-center rounded-full bg-lime-400 font-black text-white">{index+1}</span></div><div className="mt-1 flex items-center gap-2 text-xs font-black text-cyan-600"><span>{current.skill||"Mathematics"}</span><span className="text-slate-300">•</span><span>{current.difficulty||challengeStages[stage].name}</span></div></div><button onClick={changeQuestion} disabled={saving} className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-100 disabled:opacity-40">Change Question</button></div><div className="mt-4 flex gap-1"><span className={`h-2 w-2 rounded-full ${submitted?"bg-emerald-400":"bg-orange-400"}`}/><span className={`h-2 w-2 rounded-full ${submitted?"bg-emerald-400":"bg-slate-200"}`}/><span className={`h-2 w-2 rounded-full ${submitted?"bg-emerald-400":"bg-slate-200"}`}/><span className="ml-2 text-[10px] font-black text-slate-400">{submitted?"ANSWERED":"YOUR TURN"}</span></div></div><div className="min-h-[330px] px-6 py-8 sm:px-12 sm:py-10"><h2 className="max-w-4xl text-2xl font-bold leading-relaxed text-slate-800 sm:text-[27px]">{current.prompt}</h2>{isManipulative&&each>0&&groups>0?<div className="mt-8 rounded-3xl bg-slate-50 p-5"><div className="flex justify-between font-black"><span>Build the groups</span><span>{built} / {groups}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{Array.from({length:groups}).map((_,g)=><div key={g} className={`rounded-2xl border-2 bg-white p-3 ${g<built?"border-cyan-400":"border-dashed border-slate-200"}`}><div className="text-[10px] font-black text-slate-400">GROUP {g+1}</div><div className="mt-2 flex flex-wrap gap-1">{Array.from({length:each}).map((_,o)=><span key={o} className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${g<built?"bg-cyan-500 text-white":"bg-slate-100 text-slate-300"}`}>●</span>)}</div></div>)}</div><button onClick={buildGroup} disabled={submitted||saving||built>=groups} className="mt-5 rounded-xl bg-cyan-600 px-6 py-3 font-black text-white disabled:opacity-40">Build Group</button></div>:current.options.length>0?<div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">{current.options.map((option,n)=><button key={option} onClick={()=>setDraft(option)} disabled={submitted||saving} className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left font-bold transition ${draft===option?"border-cyan-500 bg-cyan-50 text-cyan-800":"border-slate-200 bg-white hover:border-cyan-300"} ${submitted&&option===current.answer?"border-emerald-400 bg-emerald-50":""}`}><span className="mr-3 inline-grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-black">{String.fromCharCode(65+n)}</span>{option}</button>)}</div>:<div className="mt-8 max-w-xl"><label className="mb-2 block text-sm font-black text-slate-500">Your answer</label><input value={draft} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void submitAnswer()}} disabled={submitted||saving} placeholder="Type your answer here" className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg outline-none focus:border-cyan-500 disabled:bg-slate-50"/></div>}{error&&<div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}{submitted&&<div className={`mt-6 max-w-3xl rounded-2xl p-4 ${resultCorrect?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}><div className="font-black text-lg">{resultCorrect?"✓ Correct! Great job!":"Not quite — keep going!"}</div><p className="mt-1 text-sm font-medium">{current.explanation}</p></div>}{showAnswer&&!submitted&&<div className="mt-5 max-w-3xl rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">Answer: <span className="font-black">{current.answer}</span></div>}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#f6ffff] px-5 py-4 sm:px-8"><div className="flex gap-2"><button onClick={()=>setShowAnswer(value=>!value)} disabled={submitted} className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-black text-cyan-700 disabled:opacity-40">{showAnswer?"Hide Answer":"Show Answer"}</button><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500"><MessageCircle size={14}/>Feedback</button></div><div className="flex gap-2">{!submitted&&<button onClick={()=>void submitAnswer()} disabled={!draft.trim()||saving} className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm hover:bg-orange-600 disabled:opacity-40">{saving?"Saving...":"Submit Answer"}</button>}{submitted&&<button onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 font-black text-white">{index===questions.length-1?"Finish":"Next Question"}<ArrowRight size={17}/></button>}</div></div></div></div><div className="mt-4 flex items-center justify-between text-white"><button onClick={()=>index>0&&resetQuestion(index-1)} disabled={index===0} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-30"><ChevronLeft size={15}/>Previous</button><div className="text-xs font-black opacity-80">⭐ {earned} XP earned today</div><button onClick={()=>index<questions.length-1&&resetQuestion(index+1)} disabled={index===questions.length-1} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-30">Next<ChevronRight size={15}/></button></div></div></section>
      </div>
      <div className="fixed right-3 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex"><div className="grid h-11 w-11 place-items-center rounded-full bg-orange-400 text-white shadow-lg">☷</div><div className="grid h-11 w-11 place-items-center rounded-full bg-lime-400 text-white shadow-lg">▰</div><div className="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-white shadow-lg">÷</div></div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black">{value}</div><div className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</div></div>; }
