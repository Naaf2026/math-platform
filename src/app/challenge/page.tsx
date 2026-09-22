"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, MessageCircle, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ChallengeProficiencyGate, { challengeStages, type ChallengeStage } from "@/components/challenge-proficiency-gate";

type ChallengeOption = { id: string; text: string };
type VisualRow = { id: string; label?: string; hundreds?: number; tens?: number; ones?: number; numberFormed?: number };
type VisualConfig = { variant?: string; columns?: string[]; rows?: VisualRow[]; instruction?: string; image_url?: string };

type Q = {
  id: string;
  prompt: string;
  options: ChallengeOption[];
  answer: string;
  explanation: string;
  difficulty: string;
  skill: string;
  points: number;
  question_type?: string;
  media_url?: string;
  interaction_config?: { each?: number; groups?: number; target?: number; visual?: VisualConfig; [key: string]: unknown };
};

type Profile = { xp: number; current_streak: number; best_streak: number };
type VisualAnswer = { hundreds: string; tens: string; ones: string; numberFormed: string };

export default function Challenge() {
  const [pool, setPool] = useState<Q[]>([]);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
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
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [visualAnswers, setVisualAnswers] = useState<Record<string, VisualAnswer>>({});
  const [challengeLimitReached, setChallengeLimitReached] = useState(false);
  const [challengeDailyLimit, setChallengeDailyLimit] = useState<number | null>(null);

  const current = questions[index];
  const isManipulative = current?.question_type === "manipulatives";
  const isOrdering = Boolean(current && (
    ["ordering", "order", "sequencing", "sequence", "ordering_sequence"].includes((current.question_type || "").toLowerCase()) ||
    /\b(order|ordering|sequence|sequenc|smallest to largest|largest to smallest|skip-counting)\b/i.test(current.prompt)
  ));
  const isVisual = Boolean(current && ["visual_question", "visual_table"].includes((current.question_type || "").toLowerCase()));
  const visualKind = String((current?.interaction_config?.visual as any)?.kind ?? "");
  const isCounterVisual = isVisual && visualKind === "counters_addition";
  const visualConfig = (current?.interaction_config?.visual || current?.interaction_config) as VisualConfig | undefined;
  const visualRows = Array.isArray(visualConfig?.rows) ? visualConfig.rows : [];
  const each = Number(current?.interaction_config?.each ?? 0);
  const groups = Number(current?.interaction_config?.groups ?? 0);
  const target = Number(current?.interaction_config?.target ?? current?.answer ?? 0);

  useEffect(() => { void load(); }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setError("Your learning account is not configured yet."); setLoading(false); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { window.location.href = "/login"; return; }
    const [{ data: accessState }, { data: profile }] = await Promise.all([
      supabase.rpc("get_daily_challenge_access_state").maybeSingle(),
      supabase.from("profiles").select("xp,current_streak,best_streak").eq("id", authData.user.id).maybeSingle(),
    ]);
    const dailyLimit = accessState?.daily_limit == null ? null : Number(accessState.daily_limit);
    const usedToday = Number(accessState?.used_today ?? 0);
    setChallengeDailyLimit(dailyLimit);
    if (Boolean(accessState?.blocked) || (dailyLimit !== null && usedToday >= dailyLimit)) {
      setChallengeLimitReached(true);
      setXp(profile?.xp ?? 0);
      setStreak(profile?.current_streak ?? 0);
      setLoading(false);
      return;
    }
    const { data, error: questionError } = await supabase.rpc("get_adaptive_questions", { p_limit: 10 });
    if (questionError || !data?.length) {
      setError(questionError?.message || "No challenge questions are available yet.");
      setLoading(false);
      return;
    }
    const normalized = data.map((item: any) => ({
      ...item,
      options: Array.isArray(item.options)
        ? item.options.map((option: any, optionIndex: number) => {
            if (option && typeof option === "object") return { id: String(option.id ?? String.fromCharCode(97 + optionIndex)), text: String(option.text ?? option.label ?? option.value ?? "") };
            return { id: String(option), text: String(option) };
          }).filter((option: ChallengeOption) => option.text.length > 0)
        : [],
    })) as Q[];
    setPool(normalized);
    setXp(profile?.xp ?? 0);
    setStreak(profile?.current_streak ?? 0);
    setLoading(false);
  }

  function shuffle<T>(items: T[]) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function startChallenge(selectedStage: ChallengeStage) {
    if (challengeDailyLimit !== null && challengeLimitReached) {
      return;
    }
    const aliases: Record<ChallengeStage, string[]> = {
      0: ["easy", "elementary", "beginner", "foundation"],
      1: ["medium", "intermediate", "development"],
      2: ["hard", "advanced", "proficiency"],
      3: ["expert", "master", "challenge"],
    };
    const wanted = aliases[selectedStage];
    const matching = pool.filter((item) => wanted.some((term) => item.difficulty?.toLowerCase().includes(term)));
    const other = pool.filter((item) => !matching.some((candidate) => candidate.id === item.id));
    const selected = shuffle(matching).slice(0, 10);
    const chosen = [...selected, ...shuffle(other).slice(0, Math.max(0, 10 - selected.length))];
    setStage(selectedStage);
    setQuestions(chosen);
    setIndex(0); setDraft(""); setSubmitted(false); setResultCorrect(null); setBuilt(0); setOrderedIds([]); setVisualAnswers({});
    setCompleted([]); setCorrect(0); setEarned(0); setDone(false); setError(""); setStarted(true);
    try { window.localStorage.setItem("dailyChallengeStage", String(selectedStage)); } catch {}
  }

  function resetQuestion(nextIndex: number) {
    setIndex(nextIndex);
    setDraft(""); setSubmitted(false); setResultCorrect(null); setBuilt(0); setOrderedIds([]); setVisualAnswers({}); setError("");
  }

  function moveOrderItem(from: number, to: number) {
    if (!isOrdering || submitted || saving || to < 0 || to >= orderedIds.length) return;
    setOrderedIds((items) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function initializeOrder() {
    if (!current || !isOrdering) return;
    const ids = current.options.map((option) => option.id);
    if (orderedIds.length !== ids.length || ids.some((id) => !orderedIds.includes(id))) setOrderedIds(shuffle(ids));
  }

  function orderingCanonicalAnswer(): string {
    if (!current) return "";
    const prompt = current.prompt.toLowerCase();
    const numeric = current.options.map((option) => ({ id: option.id, value: Number(String(option.text).replace(/,/g, "").trim()) }));
    const allNumeric = numeric.length > 0 && numeric.every((item) => Number.isFinite(item.value));
    if (allNumeric) {
      const descending = /largest to smallest|descending|greatest to least|biggest to smallest/i.test(prompt);
      return [...numeric].sort((a, b) => descending ? b.value - a.value : a.value - b.value).map((item) => item.id).join(",");
    }
    return current.options.map((option) => option.id).join(",");
  }

  function orderingAnswerText(ids: string[]) {
    if (!current) return "";
    return ids.map((id) => current.options.find((option) => option.id === id)?.text ?? id).join(", ");
  }

  function getVisualAnswer(rowId: string): VisualAnswer {
    return visualAnswers[rowId] || { hundreds: "", tens: "", ones: "", numberFormed: "" };
  }

  function setVisualAnswer(rowId: string, field: keyof VisualAnswer, value: string) {
    setVisualAnswers((previous) => ({ ...previous, [rowId]: { ...getVisualAnswer(rowId), [field]: value } }));
  }

  function visualCanonicalAnswer() {
    return JSON.stringify(visualRows.map((row) => ({
      id: row.id,
      hundreds: Number(row.hundreds ?? 0),
      tens: Number(row.tens ?? 0),
      ones: Number(row.ones ?? 0),
      numberFormed: Number(row.numberFormed ?? Number(row.hundreds ?? 0) * 100 + Number(row.tens ?? 0) * 10 + Number(row.ones ?? 0)),
    })));
  }

  function visualSubmittedAnswer() {
    return JSON.stringify(visualRows.map((row) => {
      const answer = getVisualAnswer(row.id);
      return { id: row.id, hundreds: Number(answer.hundreds || 0), tens: Number(answer.tens || 0), ones: Number(answer.ones || 0), numberFormed: Number(answer.numberFormed || 0) };
    }));
  }

  function visualIsCorrect() { return visualRows.length > 0 && visualSubmittedAnswer() === visualCanonicalAnswer(); }

  async function submitAnswer(answer = draft) {
    if (!current || submitted || saving) return;
    const normalizedAnswer = isVisual && !isCounterVisual ? visualSubmittedAnswer() : isOrdering ? orderedIds.join(",") : answer.trim();
    if (!normalizedAnswer) return;
    const supabase = createClient();
    if (!supabase) { setError("Your learning account is not configured yet."); return; }
    setSaving(true); setError("");
    let data: any[] | null = null;
    let submitError: any = null;
    let localCorrect: boolean | null = null;
    if (isVisual && !isCounterVisual) localCorrect = visualIsCorrect();
    if (isOrdering) localCorrect = normalizedAnswer === orderingCanonicalAnswer();
    const result = await supabase.rpc("submit_learning_answer", { p_question_id: current.id, p_selected_answer: normalizedAnswer });
    data = result.data;
    submitError = result.error;
    if (submitError) {
      const message = String(submitError.message || "");
      const limitMatch = message.match(/daily_limit_reached[:\s]+(\d+)/i);
      if (message.toLowerCase().includes("subscription_limit") && limitMatch) {
        setChallengeDailyLimit(Number(limitMatch[1]));
        setChallengeLimitReached(true);
        setSaving(false);
        return;
      }
      setError(message || "Your answer could not be saved.");
      setSaving(false);
      return;
    }
    const saved = data?.[0];
    const isCorrect = localCorrect === true ? true : Boolean(saved?.is_correct);
    setDraft(normalizedAnswer);
    setResultCorrect(isCorrect);
    setSubmitted(true);
    setCompleted((items) => items.includes(current.id) ? items : [...items, current.id]);
    if (isCorrect) {
      const amount = Number(saved?.xp_awarded || 0);
      setCorrect((value) => value + 1);
      setEarned((value) => value + amount);
    }
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (userId) {
      const { data: profile } = await supabase.from("profiles").select("xp,current_streak,best_streak").eq("id", userId).maybeSingle();
      if (profile) { setXp(profile.xp ?? 0); setStreak(profile.current_streak ?? 0); }
    }
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
    setStarted(false); setQuestions([]); setIndex(0); setDraft(""); setSubmitted(false); setResultCorrect(null);
    setCorrect(0); setEarned(0); setCompleted([]); setBuilt(0); setOrderedIds([]); setVisualAnswers({}); setDone(false); setError("");
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6"><div className="rounded-3xl bg-white p-10 text-center shadow-2xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-cyan-100 text-4xl">🚀</div><h1 className="mt-5 text-2xl font-black">Loading Daily Challenge</h1><p className="mt-2 text-slate-500">Preparing today's maths questions...</p></div></main>;

  if (challengeLimitReached) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-5"><div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-cyan-100 text-4xl">🏆</div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-cyan-600">🏆 Daily Challenge complete</p><h1 className="mt-2 text-3xl font-black text-slate-800">Great work today! 🎉</h1><p className="mt-3 text-sm font-semibold leading-6 text-slate-500">You have completed your {challengeDailyLimit} Daily Challenge questions for today. Your Daily Challenge will be available again tomorrow when the daily limit resets.</p><Link href="/dashboard" className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-6 py-3.5 font-black text-white shadow-lg">Go to Dashboard</Link></div></main>;
  if (error && !pool.length) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6"><div className="rounded-3xl bg-white p-9 text-center shadow-xl"><h1 className="text-2xl font-black">Challenge unavailable</h1><p className="mt-3 text-slate-500">{error}</p><button onClick={() => { setLoading(true); setError(""); void load(); }} className="mt-6 rounded-xl bg-cyan-600 px-6 py-3 font-black text-white">Try again</button></div></main>;
  if (!started) return (
    <>
      <ChallengeProficiencyGate xp={xp} onStart={startChallenge} />
      {challengeLimitReached && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="daily-challenge-limit-title">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-cyan-100 text-4xl">🏆</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-cyan-600">Daily Challenge complete</p>
            <h1 id="daily-challenge-limit-title" className="mt-2 text-3xl font-black text-slate-800">Great work today! 🎉</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">You have completed your {challengeDailyLimit} Daily Challenge questions for today. Your Daily Challenge will be available again tomorrow when the daily limit resets.</p>
            <Link href="/dashboard" className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-6 py-3.5 font-black text-white shadow-lg">Go to Dashboard</Link>
          </div>
        </div>
      )}
    </>
  );
  if (done) return <main className="grid min-h-screen place-items-center bg-[#e7f5f8] p-6"><div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-yellow-100 text-yellow-500"><Trophy size={52}/></div><p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-600">Daily Challenge Complete</p><h1 className="mt-2 text-4xl font-black">Amazing work! 🎉</h1><div className="mt-7 grid grid-cols-3 gap-3"><Stat label="Correct" value={`${correct}/${questions.length}`}/><Stat label="XP earned" value={`+${earned}`}/><Stat label="Streak" value={`${streak} 🔥`}/></div><div className="mt-7 flex justify-center gap-3"><button onClick={restart} className="rounded-2xl bg-cyan-600 px-6 py-3 font-black text-white">Choose Level Again</button><Link href="/dashboard" className="rounded-2xl bg-slate-100 px-6 py-3 font-black">Dashboard</Link></div></div></main>;

  const correctOption = current?.options.find((option) => option.id === current.answer);
  const correctAnswerText = isVisual && !isCounterVisual
    ? visualRows.map((row) => `${row.label || row.id}: ${row.numberFormed ?? Number(row.hundreds ?? 0) * 100 + Number(row.tens ?? 0) * 10 + Number(row.ones ?? 0)}`).join(" • ")
    : isOrdering ? orderingAnswerText(orderingCanonicalAnswer().split(",").filter(Boolean)) : (correctOption?.text || current.answer);
  if (isOrdering && orderedIds.length === 0) initializeOrder();

  return (
    <main className="min-h-screen bg-[#d8eef2] text-slate-800">
      <header className="sticky top-0 z-50 bg-[#13b7d2] text-white shadow-md"><div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-black"><ArrowLeft size={18}/>Back</Link><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl font-black text-cyan-600">FV</div><span className="hidden text-lg font-black sm:inline">FAHI VISSNUN MATHS</span></div><div className="flex items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">⚡ {xp} XP</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">🔥 {streak}</span><span className="hidden rounded-full bg-white/20 px-3 py-1.5 text-xs font-black sm:inline">{challengeStages[stage].name}</span></div></div></header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden w-[250px] shrink-0 border-r border-slate-300 bg-white md:block"><div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><div className="text-xs font-black text-slate-500">PROFICIENCY</div><div className="mt-1 flex items-center justify-between"><span className="font-black">{challengeStages[stage].name}</span><span className="text-sm font-black text-slate-500">{completed.length} / {questions.length}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-500" style={{width:`${questions.length ? completed.length / questions.length * 100 : 0}%`}}/></div></div><div className="py-2">{questions.map((question,n)=>{const isCurrent=n===index;const isDone=completed.includes(question.id);return <button key={question.id} onClick={()=>resetQuestion(n)} className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${isCurrent?"bg-cyan-50":"hover:bg-slate-50"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-black ${isDone?"border-emerald-400 bg-emerald-400 text-white":isCurrent?"border-cyan-500 bg-cyan-500 text-white":"border-cyan-300 bg-white text-cyan-600"}`}>{isDone?<Check size={17}/>:n+1}</span><span className="min-w-0"><span className="block text-sm font-black">Question {n+1}</span><span className="block truncate text-[11px] text-slate-400">{question.skill||question.difficulty}</span><span className="text-[11px] font-bold text-slate-400">⚡ {n<5?1:n<8?2:3}</span></span></button>})}</div></aside>
        <section className="min-w-0 flex-1 bg-[#247f96] px-3 py-4 sm:px-7 sm:py-7"><div className="mx-auto max-w-[980px]"><div className="mb-4 flex items-center justify-between text-white"><button onClick={restart} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-sm font-black"><ChevronLeft size={16}/>Change Level</button><div className="text-sm font-black opacity-80">{index+1} / {questions.length}</div></div><div className="rounded-[2rem] border-[7px] border-yellow-400 bg-[#f8ffff] shadow-[0_15px_0_rgba(11,60,72,.25)] sm:rounded-[2.5rem] sm:border-[9px]"><div className="relative min-h-[590px] overflow-hidden rounded-[1.4rem] bg-white sm:rounded-[1.8rem]"><div className="border-b border-slate-200 bg-gradient-to-b from-[#f3ffff] to-white px-5 pb-4 pt-4 sm:px-10"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><span className="text-2xl font-black text-slate-700">Question</span><span className="grid h-9 w-9 place-items-center rounded-full bg-lime-400 font-black text-white">{index+1}</span></div><div className="mt-1 flex items-center gap-2 text-xs font-black text-cyan-600"><span>{current.skill||"Mathematics"}</span><span className="text-slate-300">•</span><span>{current.difficulty||challengeStages[stage].name}</span></div></div><button onClick={changeQuestion} disabled={saving} className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-100 disabled:opacity-40">Change Question</button></div><div className="mt-4 flex gap-1"><span className={`h-2 w-2 rounded-full ${submitted?"bg-emerald-400":"bg-orange-400"}`}/><span className={`h-2 w-2 rounded-full ${submitted?"bg-emerald-400":"bg-slate-200"}`}/><span className={`h-2 w-2 rounded-full ${submitted?"bg-emerald-400":"bg-slate-200"}`}/><span className="ml-2 text-[10px] font-black text-slate-400">{submitted?"ANSWERED":"YOUR TURN"}</span></div></div><div className="min-h-[330px] px-5 py-7 sm:px-10 sm:py-9"><h2 className="max-w-4xl text-2xl font-bold leading-relaxed text-slate-800 sm:text-[27px]">{current.prompt}</h2>
          {isCounterVisual ? <CounterVisualQuestion config={visualConfig} options={current.options} draft={draft} setDraft={setDraft} submitted={submitted} saving={saving} answer={current.answer} /> : isVisual ? <VisualQuestionCard config={visualConfig} rows={visualRows} getAnswer={getVisualAnswer} setAnswer={setVisualAnswer} submitted={submitted} mediaUrl={current.media_url} /> : isManipulative&&each>0&&groups>0 ? <div className="mt-8 rounded-3xl bg-slate-50 p-5"><div className="flex justify-between font-black"><span>Build the groups</span><span>{built} / {groups}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{Array.from({length:groups}).map((_,g)=><div key={g} className={`rounded-2xl border-2 bg-white p-3 ${g<built?"border-cyan-400":"border-dashed border-slate-200"}`}><div className="text-[10px] font-black text-slate-400">GROUP {g+1}</div><div className="mt-2 flex flex-wrap gap-1">{Array.from({length:each}).map((_,o)=><span key={o} className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${g<built?"bg-cyan-500 text-white":"bg-slate-100 text-slate-300"}`}>●</span>)}</div></div>)}</div><button onClick={buildGroup} disabled={submitted||saving||built>=groups} className="mt-5 rounded-xl bg-cyan-600 px-6 py-3 font-black text-white disabled:opacity-40">Build Group</button></div> : isOrdering ? <div className="mt-8 max-w-3xl"><p className="mb-3 text-sm font-black text-cyan-700">Arrange the numbers in the correct order</p><div className="space-y-3">{orderedIds.map((id,n)=><div key={id} className="flex items-center gap-2"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-black text-slate-500">{n+1}</div><div className="flex min-h-14 flex-1 items-center justify-between rounded-xl border-2 border-slate-200 bg-white px-4 shadow-sm"><span className="text-lg font-black">{current.options.find((option)=>option.id===id)?.text ?? id}</span><div className="flex gap-1"><button type="button" aria-label="Move up" onClick={()=>moveOrderItem(n,n-1)} disabled={submitted||saving||n===0} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 font-black text-slate-600 disabled:opacity-30">↑</button><button type="button" aria-label="Move down" onClick={()=>moveOrderItem(n,n+1)} disabled={submitted||saving||n===orderedIds.length-1} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 font-black text-slate-600 disabled:opacity-30">↓</button></div></div></div>)}</div></div> : current.options.length>0 ? <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">{current.options.map((option,n)=><button key={option.id} onClick={()=>setDraft(option.id)} disabled={submitted||saving} className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left font-bold transition ${draft===option.id?"border-cyan-500 bg-cyan-50 text-cyan-800":"border-slate-200 bg-white hover:border-cyan-300"} ${submitted&&option.id===current.answer?"border-emerald-400 bg-emerald-50":""}`}><span className="mr-3 inline-grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-black">{String.fromCharCode(65+n)}</span>{option.text}</button>)}</div> : <div className="mt-8 max-w-xl"><label className="mb-2 block text-sm font-black text-slate-500">Your answer</label><input value={draft} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==="Enter")void submitAnswer()}} disabled={submitted||saving} placeholder="Type your answer here" className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg outline-none focus:border-cyan-500 disabled:bg-slate-50"/></div>}
          {error&&<div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
          {submitted&&<div className={`mt-6 max-w-4xl rounded-2xl p-4 ${resultCorrect?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}><div className="font-black text-lg">{resultCorrect?"✓ Correct! Great job!":"Not quite — keep going!"}</div><p className="mt-2 text-sm font-black">Correct answer: <span className="font-black">{correctAnswerText}</span></p><p className="mt-1 text-sm font-medium">{current.explanation}</p></div>}
        </div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#f6ffff] px-5 py-4 sm:px-8"><div className="flex gap-2"><span className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-black text-cyan-700">Answer shown after submission</span><button className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500"><MessageCircle size={14}/>Feedback</button></div><div className="flex gap-2">{!submitted&&<button onClick={()=>void submitAnswer()} disabled={(isVisual && !isCounterVisual ? visualRows.length===0 : isOrdering ? orderedIds.length===0 : !draft.trim())||saving} className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm hover:bg-orange-600 disabled:opacity-40">{saving?"Saving...":"Submit Answer"}</button>}{submitted&&<button onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 font-black text-white">{index===questions.length-1?"Finish":"Next Question"}<ArrowRight size={17}/></button>}</div></div></div></div><div className="mt-4 flex items-center justify-between text-white"><button onClick={()=>index>0&&resetQuestion(index-1)} disabled={index===0} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-30"><ChevronLeft size={15}/>Previous</button><div className="text-xs font-black opacity-80">⭐ {earned} XP earned today</div><button onClick={()=>index<questions.length-1&&resetQuestion(index+1)} disabled={index===questions.length-1} className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-30">Next<ChevronRight size={15}/></button></div></div></section>
      </div>
      <div className="fixed right-3 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex"><div className="grid h-11 w-11 place-items-center rounded-full bg-orange-400 text-white shadow-lg">☷</div><div className="grid h-11 w-11 place-items-center rounded-full bg-lime-400 text-white shadow-lg">▰</div><div className="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-white shadow-lg">÷</div></div>
    </main>
  );
}

function CounterVisualQuestion({ config, options, draft, setDraft, submitted, saving, answer }: { config?: VisualConfig; options: ChallengeOption[]; draft: string; setDraft: (value:string)=>void; submitted:boolean; saving:boolean; answer:string }) {
  const groups = Array.isArray((config as any)?.groups) ? (config as any).groups.map((v:any)=>Math.max(0,Math.min(12,Number(v)||0))) : [];
  return <div className="mt-7"><div className="grid gap-3 sm:grid-cols-2">{groups.map((count:number,g:number)=><div key={g} className="rounded-2xl border-2 border-cyan-100 bg-cyan-50/60 p-4"><div className="mb-3 text-xs font-black uppercase tracking-wide text-cyan-700">Group {g+1}</div><div className="flex min-h-12 flex-wrap gap-2">{Array.from({length:count}).map((_,i)=><span key={i} className="h-8 w-8 rounded-full bg-cyan-500 shadow-sm ring-4 ring-white" />)}</div></div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{options.map((option,n)=><button key={option.id} onClick={()=>setDraft(option.id)} disabled={submitted||saving} className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left font-bold transition ${draft===option.id?"border-cyan-500 bg-cyan-50 text-cyan-800":"border-slate-200 bg-white hover:border-cyan-300"} ${submitted&&(option.id===answer||option.text===answer)?"border-emerald-400 bg-emerald-50":""}`}><span className="mr-3 inline-grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-black">{String.fromCharCode(65+n)}</span>{option.text}</button>)}</div>{options.length===0&&<div className="mt-6 max-w-sm"><label className="mb-2 block text-sm font-black text-slate-500">Your answer</label><input inputMode="numeric" value={draft} onChange={e=>setDraft(e.target.value.replace(/[^0-9]/g,""))} disabled={submitted||saving} className="h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg font-black outline-none focus:border-cyan-500"/></div>}</div>;
}

function VisualQuestionCard({ config, rows, getAnswer, setAnswer, submitted, mediaUrl }: { config?: VisualConfig; rows: VisualRow[]; getAnswer: (id: string) => VisualAnswer; setAnswer: (id: string, field: keyof VisualAnswer, value: string) => void; submitted: boolean; mediaUrl?: string }) {
  const variant = config?.variant || "base_ten_table";
  const columns = config?.columns?.length ? config.columns : ["Hundreds", "Tens", "Ones", "Number formed"];
  return <div className="mt-7 space-y-5">{mediaUrl || config?.image_url ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><img src={mediaUrl || config?.image_url} alt="Question illustration" className="max-h-[360px] w-full object-contain" /></div> : null}<VisualTable variant={variant} columns={columns} rows={rows} getAnswer={getAnswer} setAnswer={setAnswer} submitted={submitted}/></div>;
}

function VisualTable({ variant, columns, rows, getAnswer, setAnswer, submitted }: { variant: string; columns: string[]; rows: VisualRow[]; getAnswer: (id: string) => VisualAnswer; setAnswer: (id: string, field: keyof VisualAnswer, value: string) => void; submitted: boolean }) {
  if (!rows.length) return <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center font-bold text-slate-500">This visual question has no illustration data yet.</div>;
  const isBaseTen = variant === "base_ten_table" || variant === "place_value";
  return <div className="mt-2 overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-sm"><table className="min-w-[760px] w-full border-collapse text-center"><thead><tr className="text-lg"><th className="w-12 border border-slate-300 bg-white px-2 py-3"></th><th className="border border-slate-300 bg-lime-50 px-3 py-3 text-lime-600">Illustration</th>{columns.map((column)=><th key={column} className="border border-slate-300 px-3 py-3 font-medium text-slate-700">{column}</th>)}</tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td className="border border-slate-300 px-2 py-3 font-black text-slate-700">{row.label || row.id}</td><td className="border border-slate-300 bg-slate-50 px-3 py-3"><div className="flex min-h-[100px] flex-wrap items-center justify-center gap-2">{isBaseTen && Number(row.hundreds||0)>0 && renderStaticBlocks(Number(row.hundreds||0), "hundreds")}{isBaseTen && Number(row.tens||0)>0 && renderStaticBlocks(Number(row.tens||0), "tens")}{isBaseTen && Number(row.ones||0)>0 && renderStaticBlocks(Number(row.ones||0), "ones")}</div></td>{columns.map((column)=><td key={column} className="border border-slate-300 px-2 py-3">{/hundreds/i.test(column)?<NumberCell value={getAnswer(row.id).hundreds} onChange={(v)=>setAnswer(row.id,"hundreds",v)} disabled={submitted}/>: /tens/i.test(column)?<NumberCell value={getAnswer(row.id).tens} onChange={(v)=>setAnswer(row.id,"tens",v)} disabled={submitted}/>: /ones/i.test(column)?<NumberCell value={getAnswer(row.id).ones} onChange={(v)=>setAnswer(row.id,"ones",v)} disabled={submitted}/>:<NumberCell value={getAnswer(row.id).numberFormed} onChange={(v)=>setAnswer(row.id,"numberFormed",v)} disabled={submitted}/>}</td>)}</tr>)}</tbody></table></div>;
}

function NumberCell({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) { return <input inputMode="numeric" value={value} onChange={(event)=>onChange(event.target.value.replace(/[^0-9]/g,""))} disabled={disabled} className="h-11 w-full min-w-[80px] rounded-lg border-2 border-slate-300 bg-white px-2 text-center text-lg font-black outline-none focus:border-cyan-500 disabled:bg-slate-50" />; }

function renderStaticBlocks(count: number, kind: "hundreds"|"tens"|"ones") { const safe=Math.max(0,Math.min(9,count)); if(kind==="hundreds") return <div className="grid h-20 w-20 grid-cols-10 gap-px rounded border border-lime-600 bg-lime-200 p-1">{Array.from({length:100}).map((_,i)=><span key={i} className="border border-lime-500 bg-lime-400"/>)}</div>; if(kind==="tens") return <div className="flex flex-wrap gap-1">{Array.from({length:safe}).map((_,i)=><span key={i} className="grid h-20 w-5 grid-rows-10 gap-px rounded border border-rose-500 bg-rose-300 p-px">{Array.from({length:10}).map((_,j)=><span key={j} className="border border-rose-500 bg-rose-400"/>)}</span>)}</div>; return <div className="flex flex-wrap gap-1">{Array.from({length:safe}).map((_,i)=><span key={i} className="h-6 w-6 rounded border border-indigo-500 bg-indigo-300"/>)}</div>; }

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 text-2xl font-black text-slate-800">{value}</div></div>; }
