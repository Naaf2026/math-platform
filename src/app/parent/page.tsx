"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Flame, GraduationCap, History, Plus, ShieldCheck, Target, Trophy, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";
import ParentActionCenter from "@/components/parent-action-center";

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
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-6 text-[#102a4d] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#197fe9]">Parent dashboard</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Your family’s learning</h1>
            <p className="mt-2 max-w-xl text-base text-slate-600">Follow each learner’s progress and plan what comes next.</p>
          </div>
          <Link href="/parent/learners" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073b73] px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-[#12518d]"><Plus size={18} /> Manage learners</Link>
        </header>

        {error && <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

        {loading ? <section className="mt-6 rounded-3xl bg-white p-8 text-center font-bold text-slate-600 shadow-sm">Loading your learners…</section> : learners.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-7 shadow-sm sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf5ff] text-[#197fe9]"><GraduationCap size={30} /></div>
            <h2 className="mt-5 text-2xl font-black">Add your first learner</h2>
            <p className="mt-2 max-w-lg text-base text-slate-600">Create a learner account to see practice, progress, and access in one place.</p>
            <Link href="/parent/learners" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#197fe9] px-5 py-3 font-black text-white"><Plus size={18} /> Add learner</Link>
          </section>
        ) : selectedLearner && <>
          {learners.length > 1 && <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-4 shadow-sm sm:p-5" aria-label="Choose a learner">
            <p className="mb-3 text-sm font-black text-slate-600">Choose a learner</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{learners.map(learner => {
              const selected = learner.learner_id === selectedLearner.learner_id;
              return <Link key={learner.learner_id} href={`/parent?learner=${encodeURIComponent(learner.learner_id)}`} aria-current={selected ? "page" : undefined} className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 transition ${selected ? "border-[#197fe9] bg-[#eaf5ff] text-[#073b73]" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-2xl" aria-hidden="true">{learner.avatar_emoji || "🧑‍🎓"}</span>
                <span className="min-w-0"><span className="block truncate font-black">{learner.display_name}</span><span className="block text-sm font-semibold text-slate-500">{learner.grade || "Grade not set"}</span></span>
                {selected && <CheckCircle2 size={18} className="ml-auto shrink-0 text-[#197fe9]" aria-label="Selected" />}
              </Link>;
            })}</div>
          </section>}

          <section className="mt-6 overflow-hidden rounded-[30px] bg-[#073b73] text-white shadow-lg">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-9">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-4xl" aria-hidden="true">{selectedLearner.avatar_emoji || "🧑‍🎓"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#aee2ff]">Learning overview</p>
                  <h2 className="mt-1 break-words text-2xl font-black sm:text-3xl">{selectedLearner.display_name}</h2>
                  <p className="mt-1 text-base text-white/80">{selectedLearner.grade || "Grade not set"} · {selectedLearner.account_status === "active" ? "Account enabled" : "Account disabled"}</p>
                  <SubscriptionBadge learner={selectedLearner} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#073b73] hover:bg-[#eaf5ff]"><History size={18} /> View learning history</Link>
                <Link href="/parent/upgrade" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 px-5 py-3 text-sm font-black text-white hover:bg-white/10"><ShieldCheck size={18} /> {selectedLearner.subscription_status === "active" ? "Manage subscription" : "View Premium options"}</Link>
              </div>
            </div>
            <div className="border-t border-white/20 bg-white/10 px-5 py-4 sm:px-7 lg:px-9"><SubscriptionDetails learner={selectedLearner} /></div>
          </section>

          <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="weekly-progress-title">
            <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm font-black uppercase tracking-wide text-[#197fe9]">This week</p><h2 id="weekly-progress-title" className="mt-1 text-xl font-black sm:text-2xl">Learning progress</h2></div>{snapshotLoading && <span className="text-sm font-semibold text-slate-500">Updating…</span>}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><SnapshotMetric label="Questions answered" value={summary ? Number(summary.questions_answered) : 0} /><SnapshotMetric label="Accuracy" value={summary ? `${Math.round(Number(summary.accuracy))}%` : "0%"} /><SnapshotMetric label="Practice days" value={summary ? `${Number(summary.practice_days)}/7` : "0/7"} /><SnapshotMetric label="XP earned" value={summary ? Number(summary.xp_earned) : 0} /></div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-600"><span className="inline-flex items-center gap-1.5"><Flame size={17} className="text-amber-500" /> {selectedLearner.current_streak} day streak</span><span className="inline-flex items-center gap-1.5"><Trophy size={17} className="text-[#197fe9]" /> {selectedLearner.xp} total XP</span></div>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,1fr)]">
            <section className="rounded-3xl border border-[#d8e7f4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="attention-title">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="attention-title" className="text-xl font-black">What needs attention</h2><Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="text-sm font-black text-[#197fe9] hover:underline">Full history</Link></div>
              <div className="mt-4 space-y-3">{insights.length ? insights.slice(0, 3).map((item, index) => <div key={`${item.insight_type}-${index}`} className="rounded-2xl bg-[#f4f9ff] p-4"><p className="font-black">{item.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p></div>) : <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /> No priority learning signals right now.</div>}</div>
            </section>
            <section className="rounded-3xl border border-[#d8e7f4] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="quick-actions-title">
              <h2 id="quick-actions-title" className="text-xl font-black">Quick actions</h2>
              <div className="mt-4 grid gap-3"><Link href={`/parent/goals?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="flex items-center gap-3 rounded-2xl bg-[#eaf5ff] px-4 py-3.5 font-black text-[#073b73] hover:bg-[#dff0ff]"><Target size={20} /> Learning goals</Link><Link href={`/parent/notifications?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="flex items-center gap-3 rounded-2xl bg-[#eaf5ff] px-4 py-3.5 font-black text-[#073b73] hover:bg-[#dff0ff]"><Bell size={20} /> Alerts</Link><Link href="/parent/profile" className="flex items-center gap-3 rounded-2xl bg-[#eaf5ff] px-4 py-3.5 font-black text-[#073b73] hover:bg-[#dff0ff]"><UserRound size={20} /> Parent profile</Link></div>
            </section>
          </div>
          <ParentActionCenter studentId={selectedLearner.learner_id} />
        </>}

        <footer className="px-4 pb-8 pt-10 text-center text-xs font-medium text-slate-500">
          <p>© 2026 Fahi Hisaabu. All rights reserved.</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"><Link href="/about" className="hover:text-[#073b73]">About</Link><Link href="/privacy" className="hover:text-[#073b73]">Privacy Policy</Link><Link href="/terms" className="hover:text-[#073b73]">Terms of Service</Link><Link href="/payment-policy" className="hover:text-[#073b73]">Payment Policy</Link></div>
        </footer>
      </div>
    </main>
  );
}

function SubscriptionBadge({ learner }: { learner: LearnerAccount }) {
  const status = learner.subscription_status;
  const trial = status === "trialing";
  const active = status === "active";
  const expired = status === "expired" || status === "cancelled";
  const demo = !status || status === "demo";
  const styles = trial
    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
    : active
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
      : expired
        ? "bg-red-50 text-red-700 ring-1 ring-red-100"
        : "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  const label = trial ? "Free Trial" : active ? "Active Subscription" : expired ? "Expired" : "Demo Access";
  return <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ${styles}`}>{label}</span>;
}

function SubscriptionDetails({ learner }: { learner: LearnerAccount }) {
  const status = learner.subscription_status;
  if (status === "trialing") {
    return <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-wide text-amber-700">Trial access</p><span className="text-xs font-black text-amber-700">{learner.subscription_days_left} {learner.subscription_days_left === 1 ? "day" : "days"} left</span></div><p className="mt-1 text-xs font-semibold text-slate-600">Trial ends {formatDate(learner.trial_ends_at)}.</p></div>;
  }
  if (status === "active") {
    return <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-wide text-blue-700">Monthly access</p><span className="text-xs font-black text-blue-700">{learner.subscription_days_left} {learner.subscription_days_left === 1 ? "day" : "days"} left</span></div><p className="mt-1 text-xs font-semibold text-slate-600">Active until {formatDate(learner.period_ends_at)}.</p></div>;
  }
  if (status === "expired" || status === "cancelled") {
    return <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3"><p className="text-xs font-black uppercase tracking-wide text-red-700">Subscription expired</p><p className="mt-1 text-xs font-semibold text-slate-600">Please complete the monthly payment to restore access.</p></div>;
  }
  return <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3"><p className="text-xs font-black uppercase tracking-wide text-violet-700">Demo access</p><p className="mt-1 text-xs font-semibold text-slate-600">This existing demo account keeps full access.</p></div>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MV", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function SnapshotMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#071b3a]">{value}</p></div>;
}
