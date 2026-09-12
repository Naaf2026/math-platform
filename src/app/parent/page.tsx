"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, CheckCircle2, Flame, GraduationCap, History, Plus, ShieldCheck, Target, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

type Summary = { questions_answered: number; accuracy: number; practice_days: number; xp_earned: number };
type Insight = { insight_type: string; title: string; message: string; priority: number };

export default function ParentPage() {
  const searchParams = useSearchParams();
  const requestedLearnerId = searchParams.get("learner");
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setLearners(await getMyLearners()); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load your learners."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const selectedLearner = learners.find((learner) => learner.learner_id === requestedLearnerId) ?? learners[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshot() {
      if (!selectedLearner) { setSummary(null); setInsights([]); return; }
      const supabase = createClient();
      if (!supabase) return;
      setSnapshotLoading(true);
      try {
        const [summaryResult, insightsResult] = await Promise.all([
          supabase.rpc("get_parent_learning_summary", { p_student_id: selectedLearner.learner_id }),
          supabase.rpc("get_parent_learning_insights", { p_student_id: selectedLearner.learner_id }),
        ]);
        if (cancelled) return;
        if (summaryResult.error) throw new Error(summaryResult.error.message);
        if (insightsResult.error) throw new Error(insightsResult.error.message);
        setSummary((summaryResult.data?.[0] ?? null) as Summary | null);
        setInsights((insightsResult.data ?? []) as Insight[]);
      } catch {
        if (!cancelled) { setSummary(null); setInsights([]); }
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    }
    void loadSnapshot();
    return () => { cancelled = true; };
  }, [selectedLearner]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-28 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700"><ArrowLeft size={18} /> Dashboard</Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/parent/learners" className="inline-flex items-center gap-2 rounded-full bg-[#071b3a] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#0d2a52]"><Plus size={16} /> Manage learners</Link>
            <Link href={`/parent/history${selectedLearner ? `?learner=${encodeURIComponent(selectedLearner.learner_id)}` : ""}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm ring-1 ring-violet-100 hover:bg-violet-50"><History size={16} /> Learning history</Link>
          </div>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-white/15 p-3"><ShieldCheck size={28} /></div><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-100">Parent dashboard</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Your learners</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">Select a learner to see their individual learning activity, goals and alerts. Each learner keeps their own progress and history.</p></div></div>
        </section>

        {error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}

        {loading ? <section className="mt-6 rounded-3xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">Loading your learners…</section> : learners.length === 0 ? (
          <section className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-violet-100"><GraduationCap className="mx-auto text-violet-500" size={46} /><h2 className="mt-4 text-2xl font-black text-[#071b3a]">No learners yet</h2><p className="mt-2 text-sm text-slate-500">Add your first learner to start managing their learning journey.</p><Link href="/parent/learners" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-3 font-black text-white"><Plus size={17} /> Add learner</Link></section>
        ) : (
          <>
            <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {learners.map((learner) => {
                const active = learner.account_status === "active"; const selected = selectedLearner?.learner_id === learner.learner_id;
                return <article key={learner.learner_id} className={`rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${selected ? "ring-2 ring-violet-500" : "ring-1 ring-violet-100"}`}>
                  <div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-4xl">{learner.avatar_emoji || "🧑‍🎓"}</div><div className="min-w-0"><h2 className="truncate text-xl font-black text-[#071b3a]">{learner.display_name}</h2><p className="mt-1 text-sm font-bold text-violet-600">{learner.grade || "Grade not set"}</p><span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Active" : "Disabled"}</span></div></div>
                  <div className="mt-6 grid grid-cols-3 gap-2"><MiniStat icon={<Trophy size={18} />} value={learner.xp} label="XP" tone="violet" /><MiniStat icon={<Flame size={18} />} value={learner.current_streak} label="Streak" tone="amber" /><MiniStat icon={<CalendarDays size={18} />} value={learner.best_streak} label="Best" tone="cyan" /></div>
                  <div className="mt-6 flex gap-2"><Link href={`/parent?learner=${encodeURIComponent(learner.learner_id)}`} className={`inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-black ${selected ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>{selected ? "Selected learner" : `Select ${learner.display_name}`}</Link><Link href={`/parent/history?learner=${encodeURIComponent(learner.learner_id)}`} className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 hover:bg-slate-200" aria-label={`View ${learner.display_name}'s history`}><History size={18} /></Link></div>
                </article>;
              })}
            </section>

            {selectedLearner && <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-4xl">{selectedLearner.avatar_emoji || "🧑‍🎓"}</div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Selected learner</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">{selectedLearner.display_name}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{selectedLearner.grade || "Grade not set"} · {selectedLearner.account_status === "active" ? "Active account" : "Account disabled"}</p></div></div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3"><MiniStat icon={<Trophy size={18} />} value={selectedLearner.xp} label="XP" tone="violet" /><MiniStat icon={<Flame size={18} />} value={selectedLearner.current_streak} label="Streak" tone="amber" /><MiniStat icon={<CalendarDays size={18} />} value={selectedLearner.best_streak} label="Best" tone="cyan" /></div>
              </div>

              <div className="mt-6 rounded-3xl bg-slate-50 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Learning snapshot</p><h3 className="mt-1 text-xl font-black text-[#071b3a]">Recent performance</h3></div>{snapshotLoading && <span className="text-xs font-bold text-slate-400">Updating…</span>}</div><div className="mt-4 grid gap-3 sm:grid-cols-4"><SnapshotMetric label="Questions this week" value={summary ? Number(summary.questions_answered) : 0} /><SnapshotMetric label="Accuracy" value={summary ? `${Math.round(Number(summary.accuracy))}%` : "0%"} /><SnapshotMetric label="Practice days" value={summary ? `${Number(summary.practice_days)}/7` : "0/7"} /><SnapshotMetric label="XP this week" value={summary ? Number(summary.xp_earned) : 0} /></div></div>

              <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-amber-700">Learning signals</p><h3 className="mt-1 text-xl font-black text-[#071b3a]">What needs attention</h3></div><Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="text-sm font-black text-violet-700 hover:underline">View full history</Link></div><div className="mt-4 space-y-2">{insights.length ? insights.slice(0, 3).map((item, index) => <div key={`${item.insight_type}-${index}`} className="rounded-2xl bg-white p-4"><div className="flex gap-3"><span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.priority <= 1 ? "bg-amber-500" : "bg-violet-500"}`} /><div><p className="font-black text-slate-800">{item.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p></div></div></div>) : <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 className="mr-2 inline" size={17} /> No priority learning signals right now.</div>}</div></div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3"><Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white hover:bg-violet-700"><History size={18} /> Learning History</Link><Link href={`/parent/goals?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3.5 font-black text-emerald-700 hover:bg-emerald-100"><Target size={18} /> Goals</Link><Link href={`/parent/notifications?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-5 py-3.5 font-black text-amber-700 hover:bg-amber-100"><Bell size={18} /> Alerts</Link></div>
            </section>}
          </>
        )}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Learner accounts</p><h2 className="mt-1 text-xl font-black text-[#071b3a]">Need to manage an account?</h2><p className="mt-1 text-sm text-slate-500">Add learners, change passwords or enable and disable learner accounts.</p></div><Link href="/parent/learners" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700 hover:bg-slate-200">Manage learner accounts</Link></div></section>
      </div>
    </main>
  );
}

function MiniStat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "violet" | "amber" | "cyan" }) {
  const styles = { violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600", cyan: "bg-cyan-50 text-cyan-600" };
  return <div className={`rounded-2xl p-3 text-center ${styles[tone]}`}><span className="mx-auto block w-fit">{icon}</span><p className="mt-1 text-lg font-black text-[#071b3a]">{value}</p><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p></div>;
}

function SnapshotMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#071b3a]">{value}</p></div>;
}
