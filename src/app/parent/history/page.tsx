"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, RefreshCw, Target } from "lucide-react";
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

  const change = (current: number, previous: number) => !previous ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-6 text-[#102a4d] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-black uppercase tracking-[0.14em] text-[#197fe9]">Parent dashboard</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Learning history</h1><p className="mt-2 text-base text-slate-600">See when your learner practised and how learning is progressing.</p></div>
          <button type="button" onClick={() => void load(true)} disabled={refreshing || loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#073b73] shadow-sm ring-1 ring-[#d8e7f4] hover:bg-[#eaf5ff] disabled:opacity-50"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
        </header>

        {error && <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}
        {loading ? <div className="mt-6 rounded-3xl bg-white p-8 text-center font-bold text-slate-600">Loading learning history…</div> : !learner ? <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-7"><h2 className="text-xl font-black">No learners yet</h2><p className="mt-2 text-slate-600">Add a learner to see their practice history.</p><Link href="/parent/learners" className="mt-4 inline-flex rounded-xl bg-[#197fe9] px-5 py-3 font-black text-white">Add learner</Link></section> : <>
          {learners.length > 1 && <label className="mt-6 block rounded-2xl border border-[#d8e7f4] bg-white p-4"><span className="mb-2 block text-sm font-black text-slate-600">Choose a learner</span><select value={learner.learner_id} onChange={e => { if (e.target.value) window.location.href = `/parent/history?learner=${encodeURIComponent(e.target.value)}`; }} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold text-[#073b73]"><option value="" disabled>Select learner</option>{learners.map(item => <option key={item.learner_id} value={item.learner_id}>{item.display_name} · {item.grade || "Grade not set"}</option>)}</select></label>}

          <section className="mt-6 flex items-center gap-4 rounded-3xl bg-[#073b73] p-5 text-white shadow-lg sm:p-7" aria-label="Selected learner"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-4xl" aria-hidden="true">{learner.avatar_emoji || "🧑‍🎓"}</span><div className="min-w-0"><p className="text-sm font-bold text-[#aee2ff]">Learning history for</p><h2 className="break-words text-2xl font-black">{learner.display_name}</h2><p className="text-sm text-white/80">{learner.grade || "Grade not set"}</p></div></section>

          <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="history-week-title">
            <div><p className="text-sm font-black uppercase tracking-wide text-[#197fe9]">Last 7 days</p><h2 id="history-week-title" className="mt-1 text-xl font-black sm:text-2xl">Weekly overview</h2></div>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><HistoryMetric label="Questions answered" value={String(totals.questions)} /><HistoryMetric label="Accuracy" value={`${totals.accuracy}%`} /><HistoryMetric label="Practice days" value={`${totals.practiceDays}/7`} /><HistoryMetric label="XP earned" value={String(totals.xp)} /></div>
            {days.length > 0 && <div className="mt-5 grid grid-cols-7 gap-1.5 text-center" aria-label="Practice days in the last seven days">{days.map(day => { const practised = Number(day.questions_answered || 0) > 0; return <div key={day.activity_date} aria-label={`${new Date(`${day.activity_date}T12:00:00`).toLocaleDateString("en-MV", { weekday: "long", day: "numeric", month: "short" })}: ${practised ? "practised" : "no practice"}`}><span className={`flex h-9 items-center justify-center rounded-xl text-sm font-black ${practised ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{practised ? "✓" : "·"}</span><span className="mt-1 block text-xs font-bold text-slate-500">{new Date(`${day.activity_date}T12:00:00`).toLocaleDateString("en-MV", { weekday: "short" })}</span></div>; })}</div>}
          </section>

          <section className="mt-6" aria-labelledby="recent-activity-title">
            <div className="flex items-end justify-between gap-3"><h2 id="recent-activity-title" className="text-xl font-black sm:text-2xl">Recent activity</h2><span className="text-sm font-semibold text-slate-500">Newest first</span></div>
            <div className="mt-3 space-y-3">{days.filter(day => Number(day.questions_answered || 0) > 0).slice().reverse().map(day => { const questions = Number(day.questions_answered || 0); const correct = Number(day.correct_answers || 0); const accuracy = Math.round(correct / questions * 100); return <article key={day.activity_date} className="flex gap-3 rounded-2xl border border-[#d8e7f4] bg-white p-4 shadow-sm sm:p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ff] text-[#197fe9]"><CalendarDays size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-1"><h3 className="font-black">Maths practice</h3><time dateTime={day.activity_date} className="text-sm font-semibold text-slate-500">{new Date(`${day.activity_date}T12:00:00`).toLocaleDateString("en-MV", { day: "numeric", month: "short" })}</time></div><p className="mt-1 text-sm text-slate-600">{questions} questions answered · {Number(day.xp_earned || 0)} XP earned</p><span className="mt-3 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">{correct} correct · {accuracy}%</span></div></article>; })}{days.every(day => Number(day.questions_answered || 0) === 0) && <div className="rounded-2xl border border-[#d8e7f4] bg-white p-6 text-sm font-semibold text-slate-600">No practice recorded in the last seven days.</div>}</div>
          </section>

          {summary && <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="history-compare-title"><h2 id="history-compare-title" className="text-xl font-black">Compared with last week</h2><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Compare label="Questions" current={Number(summary.questions_answered)} previous={Number(summary.previous_questions)} suffix="" delta={change(Number(summary.questions_answered), Number(summary.previous_questions))} /><Compare label="Accuracy" current={Number(summary.accuracy)} previous={Number(summary.previous_accuracy)} suffix="%" delta={change(Number(summary.accuracy), Number(summary.previous_accuracy))} /><Compare label="Practice days" current={Number(summary.practice_days)} previous={Number(summary.previous_practice_days)} suffix=" / 7" delta={change(Number(summary.practice_days), Number(summary.previous_practice_days))} /><Compare label="XP earned" current={Number(summary.xp_earned)} previous={Number(summary.previous_xp)} suffix=" XP" delta={change(Number(summary.xp_earned), Number(summary.previous_xp))} /></div></section>}

          <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="history-insights-title"><h2 id="history-insights-title" className="text-xl font-black">What needs attention</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{insights.length ? insights.slice(0, 4).map((item, index) => <article key={`${item.insight_type}-${index}`} className="rounded-2xl bg-[#f4f9ff] p-4"><h3 className="font-black">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p></article>) : <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 md:col-span-2">No priority learning signals right now.</p>}</div></section>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={`/parent/goals?learner=${encodeURIComponent(learner.learner_id)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#197fe9] px-5 py-3 font-black text-white"><Target size={18} /> Learning goals</Link><Link href="/parent/notifications" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-[#073b73] ring-1 ring-[#d8e7f4]">View alerts</Link></div>
        </>}
      </div>
    </main>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f2f8ff] p-4"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-1 text-2xl font-black text-[#073b73]">{value}</p></div>; }
function Compare({ label, current, previous, suffix, delta }: { label: string; current: number; previous: number; suffix: string; delta: number }) { const positive = delta >= 0; return <div className="rounded-xl bg-[#f2f8ff] p-4"><p className="text-sm font-bold text-slate-600">{label}</p><p className="mt-1 text-xl font-black text-[#073b73]">{Math.round(current)}{suffix}</p><p className={`mt-1 text-xs font-bold ${positive ? "text-emerald-700" : "text-rose-700"}`}>{positive ? "+" : ""}{delta}% vs last week</p><p className="mt-1 text-xs text-slate-500">Last week: {Math.round(previous)}{suffix}</p></div>; }
