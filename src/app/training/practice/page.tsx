"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles, Trophy, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InteractiveQuestionEngine from "@/components/interactive-question-engine";

type Question = {
  id: string; topic_id?: string; topic?: string; skill?: string; difficulty: string; prompt: string;
  options?: string[]; answer: string; explanation?: string; question_type?: string | null;
  interaction_config?: Record<string, unknown> | null; hint?: string | null; animation?: string | null;
  points?: number; time_limit?: number; media_url?: string | null;
};

export default function TrainingPracticePage() {
  const params = useSearchParams();
  const topicId = params.get("topic") || "";
  const requestedSkill = params.get("skill") || "";
  const requestedGrade = params.get("grade") || "Grade 3";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [xp, setXp] = useState(0);
  const [earned, setEarned] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [limitReached, setLimitReached] = useState<number | null>(null);

  useEffect(() => { void load(); }, [requestedGrade, topicId, requestedSkill]);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setError("Your learning account is not configured yet."); setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/login"; return; }
    const [{ data: qs, error: qError }, { data: profile }] = await Promise.all([
      supabase.rpc("get_training_questions_by_grade", {
        p_grade_level: requestedGrade,
        p_topic_id: topicId || null,
        p_skill: requestedSkill || null,
        p_limit: 20,
      }),
      supabase.from("profiles").select("xp").eq("id", auth.user.id).maybeSingle(),
    ]);
    if (qError) { setError(qError.message); setLoading(false); return; }
    const unique = Array.from(new Map(((qs || []) as Question[]).map(q => [q.id, q])).values());
    setQuestions(unique.slice(0, 10));
    setXp(profile?.xp ?? 0);
    setLoading(false);
  }

  const q = questions[index];
  const title = requestedSkill || q?.skill || q?.topic || "Math Training";
  const progress = questions.length ? Math.round((index / questions.length) * 100) : 0;

  async function answer(value: string) {
    if (!q || selected !== null || saving) return;
    const supabase = createClient();
    if (!supabase) return;
    setSaving(true); setError(""); setSelected(value);
    const { data, error: submitError } = await supabase.rpc("submit_learning_answer", { p_question_id: q.id, p_selected_answer: value });
    if (submitError) {
      const message = String(submitError.message || "");
      const match = message.match(/subscription_limit[^:]*:daily_limit_reached:(\d+)/i);
      if (match) {
        setSelected(null);
        setLimitReached(Number(match[1]));
        setSaving(false);
        return;
      }
      setSelected(null);
      setError("Your answer could not be saved. Please try again.");
      setSaving(false);
      return;
    }
    const result = data?.[0] || {};
    const ok = Boolean(result.is_correct);
    const gained = Number(result.xp_awarded || 0);
    if (ok) { setCorrect(v => v + 1); setEarned(v => v + gained); setXp(v => v + gained); }
    setSaving(false);
    window.setTimeout(() => {
      if (index >= questions.length - 1) setFinished(true);
      else { setIndex(v => v + 1); setSelected(null); }
    }, 1000);
  }

  if (loading) return <main className="min-h-screen bg-[#f5f7ff] p-6"><div className="grid min-h-[80vh] place-items-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-3xl">📚</div><h1 className="mt-5 text-2xl font-black">Preparing practice</h1><p className="mt-2 text-sm font-bold text-slate-500">Selecting {requestedGrade} questions for {title}…</p></div></div></main>;

  if (error || !questions.length) return <main className="min-h-screen bg-[#f5f7ff] p-6"><div className="mx-auto grid min-h-[80vh] max-w-lg place-items-center"><div className="w-full rounded-[2rem] bg-white p-9 text-center shadow-xl"><XCircle className="mx-auto text-rose-500" size={44}/><h1 className="mt-4 text-2xl font-black">Practice is not ready</h1><p className="mt-2 text-sm font-bold text-slate-500">{error || `There are not enough ${requestedGrade} questions for this skill yet.`}</p><Link href="/training" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-6 py-3 font-black text-white">Back to Training</Link></div></div></main>;

  if (limitReached !== null) return <main className="min-h-screen bg-[#eef4ff] p-5 lg:pl-20"><div className="grid min-h-[85vh] place-items-center"><div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl ring-1 ring-slate-100"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-violet-100 text-4xl">🎉</div><p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-violet-600">Daily limit reached</p><h1 className="mt-2 text-3xl font-black text-[#15233f]">Great work today!</h1><p className="mt-3 text-sm font-semibold leading-6 text-slate-500">You have completed your {limitReached} Math Practice questions for today. Your daily practice limit will reset tomorrow.</p><Link href="/dashboard" className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-6 py-3.5 font-black text-white shadow-lg shadow-violet-200">Go to Dashboard</Link></div></div></main>;

  if (finished) return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 lg:pl-28"><div className="mx-auto flex min-h-[85vh] max-w-2xl items-center justify-center"><div className="w-full rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-12"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-yellow-100 text-yellow-500"><Trophy size={52}/></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-violet-600">Practice complete</p><h1 className="mt-2 text-4xl font-black text-[#15233f]">Great work! 🎉</h1><div className="mt-7 grid grid-cols-3 gap-3"><Stat label="Correct" value={`${correct}/${questions.length}`}/><Stat label="XP earned" value={`+${earned}`}/><Stat label="Total XP" value={String(xp)}/></div><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/training" className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white">Back to Training</Link><button onClick={() => { setIndex(0); setSelected(null); setCorrect(0); setEarned(0); setFinished(false); }} className="rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-700">Practise Again</button></div></div></div></main>;

  return <main className="min-h-screen bg-[#eef4ff] pb-10 lg:pl-20"><header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6"><Link href="/training" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><ArrowLeft size={18}/></Link><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.2em] text-violet-600">Math Training • {requestedGrade}</p><p className="truncate text-sm font-black text-[#15233f]">{title}</p></div><span className="rounded-2xl bg-yellow-50 px-3 py-2 text-xs font-black text-orange-700">⚡ {xp} XP</span></div></header><div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8"><section className="rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-xl sm:p-7"><div className="flex items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"><Sparkles size={13}/> Focus practice</div><h1 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h1><p className="mt-1 text-sm font-semibold text-indigo-100">Question {index + 1} of {questions.length}</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><p className="text-xl font-black">{correct}</p><p className="text-[10px] font-black uppercase text-white/70">Correct</p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{ width: `${Math.max(5, progress)}%` }}/></div></section><section className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100"><div className="border-b border-slate-100 px-5 py-4 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">{q.topic || requestedGrade}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{q.difficulty}</span><span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-orange-700">⭐ +{q.points || 10} XP</span></div></div><div className="px-5 py-7 sm:px-10 sm:py-10"><h2 className="text-2xl font-black leading-relaxed text-[#15233f] sm:text-3xl">{q.prompt}</h2><div className="mt-7"><InteractiveQuestionEngine question={q as never} selected={selected} disabled={saving || selected !== null} onAnswer={answer}/></div>{selected !== null && <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600"><CheckCircle2 className="mr-2 inline text-emerald-500" size={18}/> Answer recorded. Moving to the next question…</div>}{error && <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</p>}</div></section></div></main>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xl font-black text-[#15233f]">{value}</p><p className="mt-1 text-xs font-bold text-slate-400">{label}</p></div>; }
