"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, RefreshCw, Target, TrendingUp, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

type DayRow = { activity_date: string; questions_answered: number; correct_answers: number; xp_earned: number; practice_minutes: number };
type Summary = { week_start: string; week_end: string; questions_answered: number; correct_answers: number; accuracy: number; practice_days: number; xp_earned: number; previous_questions: number; previous_accuracy: number; previous_practice_days: number; previous_xp: number };
type Insight = { insight_type: string; title: string; message: string; priority: number };

export default function ParentHistoryPage() {
  const searchParams = useSearchParams();
  const requestedLearner = searchParams.get("learner");
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [learner, setLearner] = useState<LearnerAccount | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (showSpinner = false) => {
    const s = createClient();
    if (!s) { setError("Supabase is not configured yet."); setLoading(false); return; }
    if (showSpinner) setRefreshing(true);
    setError("");
    try {
      const availableLearners = await getMyLearners();
      setLearners(availableLearners);
      const selected = availableLearners.find((item) => item.learner_id === requestedLearner) ?? availableLearners[0] ?? null;
      setLearner(selected);
      if (!selected) { setDays([]); setSummary(null); setInsights([]); return; }

      const [historyResult, summaryResult, insightsResult] = await Promise.all([
        s.rpc("get_parent_weekly_activity", { p_student_id: selected.learner_id }),
        s.rpc("get_parent_learning_summary", { p_student_id: selected.learner_id }),
        s.rpc("get_parent_learning_insights", { p_student_id: selected.learner_id }),
      ]);
      if (historyResult.error) throw new Error(historyResult.error.message);
      if (summaryResult.error) throw new Error(summaryResult.error.message);
      if (insightsResult.error) throw new Error(insightsResult.error.message);
      setDays((historyResult.data ?? []) as DayRow[]);
      setSummary((summaryResult.data?.[0] ?? null) as Summary | null);
      setInsights((insightsResult.data ?? []) as Insight[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load learning history.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [requestedLearner]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => {
    const questions = days.reduce((n, d) => n + Number(d.questions_answered || 0), 0);
    const correct = days.reduce((n, d) => n + Number(d.correct_answers || 0), 0);
    const xp = days.reduce((n, d) => n + Number(d.xp_earned || 0), 0);
    const minutes = days.reduce((n, d) => n + Number(d.practice_minutes || 0), 0);
    return { questions, accuracy: questions ? Math.round((correct / questions) * 100) : 0, xp, minutes, practiceDays: days.filter((d) => Number(d.questions_answered || 0) > 0).length };
  }, [days]);

  const maxQuestions = Math.max(1, ...days.map((d) => Number(d.questions_answered || 0)));
  const change = (current: number, previous: number) => !previous ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-24 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/parent" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700"><ArrowLeft size={18} /> Parent dashboard</Link>
          <div className="flex flex-wrap items-center gap-2">
            {learners.length > 0 && <label className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200"><UserRound size={15} className="text-violet-600" /><select value={learner?.learner_id ?? ""} onChange={(e) => { if (e.target.value) window.location.href = `/parent/history?learner=${encodeURIComponent(e.target.value)}`; }} className="bg-transparent outline-none"><option value="" disabled>Select learner</option>{learners.map((item) => <option key={item.learner_id} value={item.learner_id}>{item.display_name} · @{item.username}</option>)}</select></label>}
            <Link href={learner ? `/parent/goals?learner=${encodeURIComponent(learner.learner_id)}` : "/parent/goals"} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-violet-700 shadow-sm ring-1 ring-violet-100"><Target size={15} /> Goals</Link>
            <Link href={learner ? `/parent/notifications?learner=${encodeURIComponent(learner.learner_id)}` : "/parent/notifications"} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-amber-700 shadow-sm ring-1 ring-amber-100">Learning alerts</Link>
          </div>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><CalendarDays size={14} /> Learning history</div><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{learner ? `${learner.display_name}'s learning journey` : "Practice history & follow-up"}</h1><p className="mt-3 max-w-2xl text-indigo-100">Review recent practice, accuracy, XP and learning signals for the selected learner.</p></div>
            <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black backdrop-blur hover:bg-white/15 disabled:opacity-50"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> Refresh history</button>
          </div>
        </section>

        {error && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}
        {loading ? <div className="mt-6 rounded-3xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">Loading learning history…</div> : !learner ? <div className="mt-6 rounded-3xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">No learner accounts are linked to this parent account yet.</div> : <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<CheckCircle2 />} label="Questions" value={String(totals.questions)} /><Metric icon={<TrendingUp />} label="Accuracy" value={`${totals.accuracy}%`} /><Metric icon={<Target />} label="Practice days" value={`${totals.practiceDays}/7`} /><Metric icon={<Clock3 />} label="Practice time" value={`${totals.minutes} min`} /></section>

          {summary && <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Performance intelligence</p><h2 className="text-2xl font-black text-[#071b3a]">This week vs last week</h2></div><span className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">{summary.week_start} → {summary.week_end}</span></div><div className="mt-6 grid gap-4 md:grid-cols-4"><Compare label="Questions" current={Number(summary.questions_answered)} previous={Number(summary.previous_questions)} suffix="" delta={change(Number(summary.questions_answered), Number(summary.previous_questions))} /><Compare label="Accuracy" current={Number(summary.accuracy)} previous={Number(summary.previous_accuracy)} suffix="%" delta={change(Number(summary.accuracy), Number(summary.previous_accuracy))} /><Compare label="Practice days" current={Number(summary.practice_days)} previous={Number(summary.previous_practice_days)} suffix=" / 7" delta={change(Number(summary.practice_days), Number(summary.previous_practice_days))} /><Compare label="XP earned" current={Number(summary.xp_earned)} previous={Number(summary.previous_xp)} suffix=" XP" delta={change(Number(summary.xp_earned), Number(summary.previous_xp))} /></div></section>}

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Weekly activity</p><h2 className="text-2xl font-black text-[#071b3a]">Last 7 days</h2></div><span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700">{totals.xp} XP earned</span></div><div className="mt-7 space-y-3">{days.length === 0 ? <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">No recent learning activity is available yet.</div> : days.map((day) => { const questions = Number(day.questions_answered || 0); const correct = Number(day.correct_answers || 0); const accuracy = questions ? Math.round((correct / questions) * 100) : 0; const width = questions ? Math.max(8, Math.round((questions / maxQuestions) * 100)) : 3; const date = new Date(`${day.activity_date}T12:00:00`); return <article key={day.activity_date} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#071b3a]">{date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p><p className="mt-1 text-xs font-semibold text-slate-500">{questions ? `${questions} questions · ${accuracy}% accuracy` : "No questions completed"}</p></div><div className="text-right text-xs font-black text-slate-500"><p>{Number(day.xp_earned || 0)} XP</p><p className="mt-1">{Number(day.practice_minutes || 0)} min</p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${width}%` }} /></div></article>; })}</div></section>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8"><div><p className="text-xs font-black uppercase tracking-wider text-amber-600">Learner performance intelligence</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Signals to act on</h2><p className="mt-2 text-sm text-slate-500">These signals are generated from the learner's recent activity and are intended to guide the next practice decision.</p></div><div className="mt-5 grid gap-3 md:grid-cols-2">{insights.length ? insights.slice(0, 6).map((item, index) => <article key={`${item.insight_type}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex gap-3"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.priority <= 1 ? "bg-amber-500" : "bg-violet-500"}`} /><div><h3 className="font-black text-slate-800">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p></div></div></article>) : <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-800 md:col-span-2">No concerns are showing right now. Keep the learning routine going.</div>}</div></section>

          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cyan-100 sm:p-8"><div className="flex items-start gap-3"><div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Target size={22} /></div><div><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Follow-up centre</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Turn intelligence into action</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Use the selected learner's performance signals together with goals and alerts to choose the next focused learning step.</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/parent/goals?learner=${encodeURIComponent(learner.learner_id)}`} className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-700">Review goals</Link><Link href={`/parent/notifications?learner=${encodeURIComponent(learner.learner_id)}`} className="rounded-2xl bg-amber-50 px-5 py-3 font-black text-amber-800 hover:bg-amber-100">Review alerts</Link></div></div></div></section>
        </>}
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100"><div className="flex items-center gap-3 text-violet-600"><span className="rounded-xl bg-violet-50 p-2">{icon}</span><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span></div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p></div>; }
function Compare({ label, current, previous, suffix, delta }: { label: string; current: number; previous: number; suffix: string; delta: number }) { const positive = delta >= 0; return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#071b3a]">{Math.round(current)}{suffix}</p><p className={`mt-1 text-xs font-black ${positive ? "text-emerald-600" : "text-rose-600"}`}>{positive ? "+" : ""}{delta}% vs last week</p><p className="mt-1 text-xs text-slate-400">Last week: {Math.round(previous)}{suffix}</p></div>; }
