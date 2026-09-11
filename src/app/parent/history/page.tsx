"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, RefreshCw, Target, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DayRow = {
  activity_date: string;
  questions_answered: number;
  correct_answers: number;
  xp_earned: number;
  practice_minutes: number;
};

export default function ParentHistoryPage() {
  const [days, setDays] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (showSpinner = false) => {
    const s = createClient();
    if (!s) {
      setError("Supabase is not configured yet.");
      setLoading(false);
      return;
    }
    if (showSpinner) setRefreshing(true);
    setError("");

    const { data: { user } } = await s.auth.getUser();
    if (!user) {
      location.href = "/login";
      return;
    }

    const { data: links, error: linkError } = await s
      .from("student_relationships")
      .select("student_id")
      .eq("related_user_id", user.id)
      .in("relationship", ["parent", "guardian"])
      .eq("status", "active")
      .limit(1);

    const studentId = links?.[0]?.student_id;
    if (linkError || !studentId) {
      setError(linkError?.message || "No linked student found.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error: historyError } = await s.rpc("get_parent_weekly_activity", {
      p_student_id: studentId,
    });

    if (historyError) setError(historyError.message);
    else setDays((data ?? []) as DayRow[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const questions = days.reduce((n, d) => n + Number(d.questions_answered || 0), 0);
    const correct = days.reduce((n, d) => n + Number(d.correct_answers || 0), 0);
    const xp = days.reduce((n, d) => n + Number(d.xp_earned || 0), 0);
    const minutes = days.reduce((n, d) => n + Number(d.practice_minutes || 0), 0);
    const practiceDays = days.filter((d) => Number(d.questions_answered || 0) > 0).length;
    return {
      questions,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
      xp,
      minutes,
      practiceDays,
    };
  }, [days]);

  const maxQuestions = Math.max(1, ...days.map((d) => Number(d.questions_answered || 0)));

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-24 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/parent" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700">
            <ArrowLeft size={18} /> Parent dashboard
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/parent/goals" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-violet-700 shadow-sm ring-1 ring-violet-100">
              <Target size={15} /> Manage goals
            </Link>
            <Link href="/parent/notifications" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-amber-700 shadow-sm ring-1 ring-amber-100">
              Learning alerts
            </Link>
          </div>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                <CalendarDays size={14} /> Learning history
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Practice history & follow-up</h1>
              <p className="mt-3 max-w-2xl text-indigo-100">
                Review the learner&apos;s recent practice pattern, accuracy, XP and time spent, then use goals and alerts to decide the next action.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black backdrop-blur hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /> Refresh history
            </button>
          </div>
        </section>

        {error && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}

        {loading ? (
          <div className="mt-6 rounded-3xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">Loading learning history…</div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={<CheckCircle2 />} label="Questions" value={String(totals.questions)} />
              <Metric icon={<TrendingUp />} label="Accuracy" value={`${totals.accuracy}%`} />
              <Metric icon={<Target />} label="Practice days" value={`${totals.practiceDays}/7`} />
              <Metric icon={<Clock3 />} label="Practice time" value={`${totals.minutes} min`} />
            </section>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-600">Weekly activity</p>
                  <h2 className="text-2xl font-black text-[#071b3a]">Last 7 days</h2>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700">{totals.xp} XP earned</span>
              </div>

              <div className="mt-7 space-y-3">
                {days.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                    No recent learning activity is available yet.
                  </div>
                ) : days.map((day) => {
                  const questions = Number(day.questions_answered || 0);
                  const correct = Number(day.correct_answers || 0);
                  const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
                  const width = questions ? Math.max(8, Math.round((questions / maxQuestions) * 100)) : 3;
                  const date = new Date(`${day.activity_date}T12:00:00`);
                  return (
                    <article key={day.activity_date} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-[#071b3a]">
                            {date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {questions ? `${questions} questions · ${accuracy}% accuracy` : "No questions completed"}
                          </p>
                        </div>
                        <div className="text-right text-xs font-black text-slate-500">
                          <p>{Number(day.xp_earned || 0)} XP</p>
                          <p className="mt-1">{Number(day.practice_minutes || 0)} min</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${width}%` }} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cyan-100 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Target size={22} /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-700">Follow-up centre</p>
                  <h2 className="mt-1 text-2xl font-black text-[#071b3a]">Turn history into the next step</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Use the recent activity above together with goal pacing and smart alerts to decide whether the learner needs more practice, a new target, or a short focused session.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/parent/goals" className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-700">Review goals</Link>
                    <Link href="/parent/notifications" className="rounded-2xl bg-amber-50 px-5 py-3 font-black text-amber-800 hover:bg-amber-100">Review alerts</Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
      <div className="flex items-center gap-3 text-violet-600"><span className="rounded-xl bg-violet-50 p-2">{icon}</span><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span></div>
      <p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p>
    </div>
  );
}
