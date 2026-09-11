"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Flame, Lightbulb, Sparkles, Star, Target, Trophy, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import InteractiveQuestionEngine from "@/components/interactive-question-engine";

type Question = {
  id: string;
  topic_id?: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
  difficulty: string;
  skill?: string;
  points?: number;
  question_type?: string | null;
  interaction_config?: Record<string, unknown> | null;
  hint?: string | null;
  animation?: string | null;
  time_limit_seconds?: number | null;
  media_url?: string | null;
};

type MissionRow = Question & {
  mission_id: string;
  mission_date: string;
  status: string;
  target_questions: number;
  completed_questions: number;
  correct_questions: number;
  xp_earned: number;
  question_position: number;
};

const topics = [
  { name: "Place Value", emoji: "🔢", tone: "from-sky-400 to-cyan-400" },
  { name: "Addition & Subtraction", emoji: "➕", tone: "from-violet-400 to-fuchsia-400" },
  { name: "Multiplication", emoji: "✖️", tone: "from-orange-400 to-amber-400" },
  { name: "Fractions", emoji: "🍕", tone: "from-emerald-400 to-teal-400" },
];

function levelForXp(xp: number) { return Math.floor(Math.max(0, xp) / 100) + 1; }
function levelStart(level: number) { return (level - 1) * 100; }

export default function MissionPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [missionTarget, setMissionTarget] = useState(10);
  const [missionCompleted, setMissionCompleted] = useState(0);
  const [missionCorrect, setMissionCorrect] = useState(0);
  const [missionXp, setMissionXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [intro, setIntro] = useState(true);

  const q = questions[current];
  const level = useMemo(() => levelForXp(totalXp), [totalXp]);
  const levelProgress = Math.min(100, Math.round(((totalXp - levelStart(level)) / 100) * 100));
  const progress = missionTarget ? Math.min(100, (missionCompleted / missionTarget) * 100) : 0;
  const topicData = topics.find(t => q?.topic?.toLowerCase().includes(t.name.toLowerCase().split(" ")[0])) || topics[0];

  useEffect(() => { void loadMission(); }, []);

  async function loadMission() {
    setLoading(true);
    setError("");
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

    const [{ data, error: missionError }, { data: profile, error: profileError }] = await Promise.all([
      supabase.rpc("get_daily_mission", { p_target_questions: 10 }),
      supabase.from("profiles").select("xp,current_streak,best_streak").eq("id", auth.user.id).maybeSingle(),
    ]);

    if (missionError) {
      setError(missionError.message || "Today's mission could not be loaded.");
      setLoading(false);
      return;
    }
    if (profileError) console.warn("Profile stats unavailable", profileError.message);

    const rows = (data || []) as MissionRow[];
    if (!rows.length) {
      setQuestions([]);
      setError("Your Daily Mission has no available questions yet. Publish some approved questions and try again.");
      setLoading(false);
      return;
    }

    const first = rows[0];
    setMissionId(first.mission_id);
    setMissionTarget(first.target_questions || rows.length || 10);
    setMissionCompleted(first.completed_questions || 0);
    setMissionCorrect(first.correct_questions || 0);
    setMissionXp(first.xp_earned || 0);
    setQuestions(rows.sort((a, b) => a.question_position - b.question_position).map(row => ({
      ...row,
      options: Array.isArray(row.options) ? row.options : [],
    })));
    setTotalXp(profile?.xp ?? 0);
    setStreak(profile?.current_streak ?? 0);
    setBestStreak(profile?.best_streak ?? 0);
    setCurrent(0);
    setSelected(null);
    setFinished(first.status === "completed");
    setLoading(false);
  }

  async function choose(answer: string) {
    if (selected !== null || !q || !missionId || saving) return;
    setSelected(answer);
    setSaving(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Your learning account is not configured yet.");
      setSaving(false);
      return;
    }

    // Keep the existing answer pipeline so topic mastery, attempts and XP continue
    // to feed the adaptive engine, then record the same result in today's mission.
    const { data: answerData, error: answerError } = await supabase.rpc("submit_learning_answer", {
      p_question_id: q.id,
      p_selected_answer: answer,
    });

    if (answerError) {
      setSelected(null);
      setError("Your answer could not be saved. Please try again.");
      setSaving(false);
      return;
    }

    const result = answerData?.[0] || {};
    const isCorrect = Boolean(result.is_correct);
    const earnedXp = Number(result.xp_awarded || 0);

    const { error: missionError } = await supabase.rpc("record_daily_mission_answer", {
      p_question_id: q.id,
      p_is_correct: isCorrect,
      p_xp: earnedXp,
    });

    if (missionError) {
      setError("Answer saved, but Daily Mission progress could not be updated. Please refresh before continuing.");
    }

    if (isCorrect) {
      setCorrect(v => v + 1);
      setScore(v => v + earnedXp);
      setMissionCorrect(v => v + 1);
      setMissionXp(v => v + earnedXp);
    }
    setMissionCompleted(v => Math.min(missionTarget, v + 1));
    setTotalXp(v => v + earnedXp);
    setSaving(false);
  }

  function next() {
    if (selected === null) return;
    if (current >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setCurrent(v => v + 1);
    setSelected(null);
    setShowHint(false);
  }

  function restart() {
    setFinished(false);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setCorrect(0);
    setMissionCompleted(0);
    setMissionCorrect(0);
    setMissionXp(0);
    setError("");
    setIntro(true);
    void loadMission();
  }

  if (loading) return <main className="min-h-screen bg-[#eef4ff] p-5"><div className="mx-auto flex min-h-[85vh] max-w-lg items-center justify-center"><div className="w-full rounded-[2.5rem] bg-white p-10 text-center shadow-2xl"><div className="mx-auto flex h-24 w-24 animate-bounce items-center justify-center rounded-[2rem] bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 text-5xl shadow-xl">🚀</div><h1 className="mt-7 text-2xl font-black text-[#15233f]">Launching your Math Adventure!</h1><p className="mt-2 font-bold text-slate-500">Building today's mission from your adaptive question bank…</p></div></div></main>;

  if (!q || finished) return <FinishScreen score={score || missionXp} correct={correct || missionCorrect} total={questions.length} target={missionTarget} level={level} streak={streak} bestStreak={bestStreak} error={error} onRestart={restart} />;

  const difficulty = q.difficulty === "easy" ? "STARTER" : q.difficulty === "hard" ? "BOSS" : "CORE";

  return <main className="min-h-screen overflow-x-hidden bg-[#eef4ff] pb-8 lg:pl-16">
    {intro && current === 0 && selected === null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15233f]/60 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-4xl">🚀</div><p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-orange-500">FAHI VISSNUN MATHS</p><h1 className="mt-2 text-3xl font-black text-[#15233f]">Today's Math Quest</h1><p className="mt-3 text-sm font-bold leading-6 text-slate-500">Your mission is selected from your adaptive learning bank. Questions will respond to your progress over time.</p><button onClick={() => setIntro(false)} className="mt-6 w-full rounded-2xl bg-violet-600 px-6 py-4 font-black text-white shadow-lg">Start Mission 🚀</button></div></div>}

    <div className="fixed inset-x-0 top-0 z-40 h-1.5 bg-slate-200"><div className="h-full bg-gradient-to-r from-violet-500 via-orange-400 to-pink-500 transition-all duration-700" style={{ width: `${Math.max(progress, 5)}%` }} /></div>
    <header className="sticky top-1.5 z-30 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl"><div className="mx-auto flex max-w-[1450px] items-center gap-3 px-4 py-3 sm:px-6"><Link href="/dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><ArrowLeft size={18} /></Link><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.22em] text-orange-500">FAHI VISSNUN MATHS</p><p className="truncate text-sm font-black text-[#15233f]">Daily Mission · {q.topic}</p></div><div className="hidden items-center gap-2 sm:flex"><StatPill icon="⭐" value={`${score} XP`} /><StatPill icon="🔥" value={String(streak)} /></div><div className="flex items-center gap-2 rounded-2xl bg-violet-600 px-3 py-2 text-xs font-black text-white"><Star size={15} fill="currentColor" /> Lv {level}</div></div></header>

    <div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6"><div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-2xl sm:p-7"><div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em]"><Sparkles size={13} /> Today's Mission</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">Math Quest 🚀</h1><p className="mt-1 max-w-xl font-bold text-white/75">Adaptive challenges selected for today's practice.</p></div><div className="flex shrink-0 items-center gap-3"><div className="rounded-3xl bg-white/10 px-4 py-3 text-center"><p className="text-2xl font-black">{missionCompleted}<span className="text-white/50">/{missionTarget}</span></p><p className="text-[10px] font-black uppercase tracking-wider text-white/65">Completed</p></div><div className="hidden h-16 w-16 items-center justify-center rounded-3xl bg-white text-4xl shadow-xl sm:flex">{topicData.emoji}</div></div></div><div className="relative mt-6"><div className="mb-2 flex justify-between text-xs font-black text-white/80"><span>Mission progress</span><span>{Math.round(progress)}%</span></div><div className="h-4 overflow-hidden rounded-full bg-white/20 p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-700" style={{ width: `${Math.max(progress, 5)}%` }} /></div></div><div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-white/80"><span className="rounded-full bg-white/10 px-3 py-1.5">✓ {missionCorrect} correct</span><span className="rounded-full bg-white/10 px-3 py-1.5">⭐ {missionXp} XP earned</span><span className="rounded-full bg-white/10 px-3 py-1.5">Adaptive mode</span></div></div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_285px]"><section className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100"><div className="border-b border-slate-100 px-5 py-4 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`rounded-full bg-gradient-to-r ${topicData.tone} px-3 py-1.5 text-xs font-black text-white`}>{topicData.emoji} {q.topic}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{difficulty}</span></div><div className="flex items-center gap-2"><span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-orange-700">⭐ +{q.points || 10} XP</span>{q.hint && <button onClick={() => setShowHint(v => !v)} className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700"><Lightbulb size={14} /> {showHint ? "Hide hint" : "Hint"}</button>}</div></div></div>
        <div className="p-5 sm:p-8 lg:p-10"><div key={q.id} className="question-enter"><div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-50 via-white to-violet-50 px-5 py-8 text-center ring-2 ring-slate-100 sm:px-10 sm:py-10"><div className="absolute left-5 top-5 text-2xl animate-pulse">✨</div><div className="absolute right-7 top-8 text-xl">⭐</div><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-4xl shadow-lg">{topicData.emoji}</div><p className="mx-auto max-w-3xl text-2xl font-black leading-tight text-[#15233f] sm:text-4xl">{q.prompt}</p>{showHint && q.hint && <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-amber-50 p-4 text-left ring-1 ring-amber-200"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700"><Lightbulb size={15} /> Helpful hint</p><p className="mt-1 text-sm font-bold leading-6 text-amber-900">{q.hint}</p></div>}</div><InteractiveQuestionEngine question={q} selected={selected} disabled={Boolean(selected) || saving} onAnswer={choose} /></div>{error && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</p>}{selected !== null && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold text-slate-400">{saving ? "Saving your result…" : "Answer recorded in your Daily Mission."}</p><button onClick={next} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 font-black text-white disabled:opacity-50">{current === questions.length - 1 ? "Finish Mission" : "Next Challenge"} <span>→</span></button></div>}</div></section>

        <aside className="rounded-[2rem] bg-white p-5 shadow-xl sm:p-7"><div className="flex items-center gap-2"><Target size={18} className="text-violet-600" /><h2 className="font-black text-[#15233f]">Mission status</h2></div><div className="mt-5 space-y-3"><StatRow label="Questions" value={`${missionCompleted}/${missionTarget}`} /><StatRow label="Correct" value={String(missionCorrect)} /><StatRow label="XP earned" value={String(missionXp)} /><StatRow label="Current streak" value={`🔥 ${streak}`} /></div><div className="mt-6 rounded-2xl bg-violet-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-violet-700">Adaptive engine</p><p className="mt-1 text-xs font-bold leading-5 text-violet-900">Your answers update mastery and help select stronger next challenges.</p></div><div className="mt-4 rounded-2xl bg-orange-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-orange-700">Level progress</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-orange-400" style={{ width: `${levelProgress}%` }} /></div><p className="mt-2 text-[10px] font-bold text-orange-800">Level {level} · {levelProgress}% to next level</p></div><Link href="/mission/adaptive" className="mt-4 block rounded-2xl bg-slate-100 p-4 text-center text-xs font-black text-slate-700">View adaptive learning path →</Link></aside></div></div>
  </main>;
}

function StatPill({ icon, value }: { icon: string; value: string }) { return <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">{icon} {value}</div>; }
function StatRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs font-bold text-slate-500">{label}</span><span className="text-sm font-black text-slate-800">{value}</span></div>; }

function FinishScreen({ score, correct, total, target, level, streak, bestStreak, error, onRestart }: { score: number; correct: number; total: number; target: number; level: number; streak: number; bestStreak: number; error: string; onRestart: () => void }) {
  const completed = Math.min(target, total || target);
  return <main className="min-h-screen bg-[#eef4ff] p-5"><div className="mx-auto flex min-h-[85vh] max-w-lg items-center justify-center"><div className="w-full rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-10"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-yellow-300 to-orange-400 text-5xl shadow-xl">🏆</div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-orange-500">Mission Complete</p><h1 className="mt-2 text-3xl font-black text-[#15233f]">Amazing work! 🎉</h1><p className="mt-2 font-bold text-slate-500">You completed {completed} of {target} mission challenges.</p><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-violet-50 p-4"><p className="text-2xl font-black text-violet-700">{correct}</p><p className="text-[10px] font-black uppercase text-violet-500">Correct</p></div><div className="rounded-2xl bg-yellow-50 p-4"><p className="text-2xl font-black text-orange-600">{score}</p><p className="text-[10px] font-black uppercase text-orange-500">XP</p></div></div><div className="mt-4 flex justify-center gap-3 text-xs font-black text-slate-500"><span>🔥 Streak {streak}</span><span>⭐ Level {level}</span><span>🏅 Best {bestStreak}</span></div>{error && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-700">{error}</p>}<div className="mt-7 grid gap-3"><button onClick={onRestart} className="rounded-2xl bg-violet-600 px-6 py-4 font-black text-white">Practice Again</button><Link href="/dashboard" className="rounded-2xl bg-slate-100 px-6 py-4 font-black text-slate-700">Back to Dashboard</Link></div></div></div></main>;
}
