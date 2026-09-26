"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Flame, GraduationCap, History, Lightbulb, ListChecks, Plus, Sparkles, Target, TrendingUp, Trophy, UserRound, Users, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";
import ParentActionCenter from "@/components/parent-action-center";

type Summary = { questions_answered: number; accuracy: number; practice_days: number; xp_earned: number };
type Insight = { insight_type: string; title: string; message: string; priority: number };
type ActivityDay = { activity_date: string; questions_answered: number };

export default function ParentPage() {
  const searchParams = useSearchParams();
  const requestedLearnerId = searchParams.get("learner");
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [parentName, setParentName] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    async function loadParentName() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile, error: profileError } = await supabase.from("profiles")
        .select("display_name,full_name").eq("id", user.id).maybeSingle();
      if (!cancelled && !profileError) setParentName((profile?.display_name || profile?.full_name || "").trim());
    }
    void loadParentName();
    return () => { cancelled = true; };
  }, []);

  const selectedLearner = learners.find((learner) => learner.learner_id === requestedLearnerId) ?? learners[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshot() {
      if (!selectedLearner) { setSummary(null); setInsights([]); setActivity([]); return; }
      const supabase = createClient();
      if (!supabase) return;
      setSummary(null); setInsights([]); setActivity([]);
      setSnapshotLoading(true);
      try {
        const [summaryResult, insightsResult, activityResult] = await Promise.all([
          supabase.rpc("get_parent_learning_summary", { p_student_id: selectedLearner.learner_id }),
          supabase.rpc("get_parent_learning_insights", { p_student_id: selectedLearner.learner_id }),
          supabase.rpc("get_parent_weekly_activity", { p_student_id: selectedLearner.learner_id }),
        ]);
        if (cancelled) return;
        if (summaryResult.error) throw new Error(summaryResult.error.message);
        if (insightsResult.error) throw new Error(insightsResult.error.message);
        setSummary((summaryResult.data?.[0] ?? null) as Summary | null);
        setInsights((insightsResult.data ?? []) as Insight[]);
        setActivity(activityResult.error ? [] : (activityResult.data ?? []) as ActivityDay[]);
      } catch {
        if (!cancelled) { setSummary(null); setInsights([]); setActivity([]); }
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    }
    void loadSnapshot();
    return () => { cancelled = true; };
  }, [selectedLearner]);

  return (
    <main className="min-h-screen bg-[#f3f8fd] px-4 py-7 text-[#10294b] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#087b92]">Parent dashboard</p>
            <h1 className="mt-1 break-words text-3xl font-black tracking-tight text-[#0c2c51] sm:text-4xl">{parentName ? `Welcome, ${parentName}` : "Welcome to your dashboard"}</h1>
            <p className="mt-2 max-w-xl text-base text-slate-600">A clear view of progress, goals and access in one place.</p>
          </div>
          <Link href="/parent/learners" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dbe8f2] bg-white px-4 py-3 text-sm font-black text-[#174b7b] hover:bg-[#eff8fb]"><Users size={18} /> Manage learners</Link>
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
          {learners.length > 1 && <section className="mt-6 rounded-3xl border border-[#d8e7f4] bg-white p-4 shadow-sm sm:p-5 lg:hidden" aria-label="Choose a learner">
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

          <section className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#063e78] via-[#0b72aa] to-[#0a9ca6] text-white shadow-[0_15px_33px_#073b7329]">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_235px] lg:items-center lg:p-8">
              <div><div className="flex min-w-0 items-center gap-4">
                <span className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-[19px] bg-white/20 text-4xl" aria-hidden="true">{selectedLearner.avatar_emoji || "🧑‍🎓"}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#aee4ff]">CURRENT LEARNER</p>
                  <h2 className="mt-1 break-words text-2xl font-black sm:text-3xl">{selectedLearner.display_name}</h2>
                  <p className="mt-1 text-sm text-[#cae9ff]">{selectedLearner.grade || "Grade not set"} · {selectedLearner.account_status === "active" ? "Account enabled" : "Account disabled"}</p>
                </div>
              </div><SubscriptionLine learner={selectedLearner} /></div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Link href="/parent/upgrade" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ffc436] to-[#ff9d25] px-4 py-3.5 text-sm font-black text-[#2f2b2a] shadow-md hover:brightness-105"><Sparkles size={18} /> {selectedLearner.subscription_status === "active" ? "Manage subscription" : "Upgrade to Premium"}</Link>
                <Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/20"><History size={18} /> Learning history</Link>
              </div>
            </div>
          </section>

          <div className="mt-7 flex items-center justify-between gap-3"><h2 className="text-xl font-black text-[#113354]">This week at a glance</h2><Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="text-sm font-black text-[#0a74d2] hover:underline">See full history →</Link></div>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4"><SnapshotMetric icon={ListChecks} color="blue" label="Questions answered" value={summary ? Number(summary.questions_answered) : 0} /><SnapshotMetric icon={CheckCircle2} color="green" label="Accuracy" value={summary ? `${Math.round(Number(summary.accuracy))}%` : "0%"} /><SnapshotMetric icon={CalendarDays} color="orange" label="Practice days" value={summary ? `${Number(summary.practice_days)} / 7` : "0 / 7"} /><SnapshotMetric icon={Zap} color="teal" label="XP earned" value={summary ? Number(summary.xp_earned) : 0} /></div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,.9fr)]">
            <section className="rounded-[19px] border border-[#e0eaf3] bg-white p-5 sm:p-6" aria-labelledby="activity-title">
              <div className="flex items-center justify-between gap-3"><h2 id="activity-title" className="text-lg font-black text-[#113354]">Learning activity</h2><span className="text-xs font-semibold text-slate-500">Last 7 days</span></div>
              <ActivityChart days={activity} loading={snapshotLoading} />
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#eff8ff] p-3 text-sm text-[#36526c]"><TrendingUp size={18} className="shrink-0 text-[#147de2]" /><span>{summary && Number(summary.practice_days) > 0 ? `Practised on ${Number(summary.practice_days)} of the last 7 days.` : "Practice will appear here as your learner answers questions."}</span></div>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-slate-600"><span className="inline-flex items-center gap-1"><Flame size={16} className="text-[#e89021]" /> {selectedLearner.current_streak} day streak</span><span className="inline-flex items-center gap-1"><Trophy size={16} className="text-[#147de2]" /> {selectedLearner.xp} total XP</span></p>
            </section>
            <section className="rounded-[19px] border border-[#e0eaf3] bg-white p-5 sm:p-6" aria-labelledby="attention-title">
              <div className="flex items-center justify-between gap-3"><h2 id="attention-title" className="text-lg font-black text-[#113354]">Needs attention</h2><Link href={`/parent/history?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="text-sm font-black text-[#0a74d2]">View all →</Link></div>
              <div className="mt-4 space-y-2">{insights.some(item => item.priority <= 2) ? insights.filter(item => item.priority <= 2).slice(0, 2).map((item, index) => <div key={`${item.insight_type}-${index}`} className="flex gap-3 rounded-xl bg-[#fff8e9] p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#ffe5ad] text-[#925000]"><Lightbulb size={17} /></span><div><p className="text-sm font-black text-[#3b4657]">{item.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{item.message}</p></div></div>) : <div className="flex gap-2 rounded-xl bg-[#eaf8e9] p-4 text-sm font-semibold text-[#226e45]"><CheckCircle2 size={18} className="shrink-0" /> No priority learning signals right now.</div>}</div>
              <h3 className="mt-6 text-lg font-black text-[#113354]">Quick actions</h3><div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><Link href={`/parent/goals?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="inline-flex items-center gap-2 rounded-xl bg-[#eaf8f8] px-3 py-3 text-sm font-black text-[#087b83]"><Target size={17} /> Goals</Link><Link href="/parent/learners" className="inline-flex items-center gap-2 rounded-xl bg-[#eaf8f8] px-3 py-3 text-sm font-black text-[#087b83]"><Users size={17} /> Learners</Link><Link href="/parent/profile" className="inline-flex items-center gap-2 rounded-xl bg-[#eaf8f8] px-3 py-3 text-sm font-black text-[#087b83]"><UserRound size={17} /> Profile</Link></div>
            </section>
          </div>
          <Link href={`/parent/revision?learner=${encodeURIComponent(selectedLearner.learner_id)}`} className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#bce7dc] bg-[#e9faf3] p-6 text-[#103f4e] shadow-sm hover:bg-[#def5ec]"><span><span className="block text-xs font-black uppercase tracking-[.12em] text-[#168877]">Parent-assigned revision</span><span className="mt-1 block text-xl font-black">Create a revision paper</span><span className="mt-1 block text-sm text-[#46736f]">Choose weak skills, assign questions and track results.</span></span><span className="rounded-xl bg-[#0a9c91] px-5 py-3 text-sm font-black text-white">Create revision →</span></Link>
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

function SubscriptionLine({ learner }: { learner: LearnerAccount }) {
  const status = learner.subscription_status;
  const days = learner.subscription_days_left;
  const label = status === "trialing" ? `Free trial · ${days} ${days === 1 ? "day" : "days"} left` : status === "active" ? `Premium active · ${days} ${days === 1 ? "day" : "days"} left` : status === "expired" || status === "cancelled" ? "Subscription expired" : "Demo access";
  const date = status === "trialing" ? learner.trial_ends_at : status === "active" ? learner.period_ends_at : null;
  return <div className="mt-6 flex flex-wrap items-center gap-3"><span className="rounded-lg bg-[#fff0c8] px-3 py-2 text-xs font-black text-[#805000]">{label}</span>{date && <span className="text-sm text-[#d9efff]">{status === "trialing" ? "Trial ends" : "Active until"} {formatDate(date)}</span>}</div>;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MV", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function SnapshotMetric({ icon: Icon, label, value, color }: { icon: typeof ListChecks; label: string; value: string | number; color: "blue" | "green" | "orange" | "teal" }) {
  const colors = { blue: "bg-[#eaf5ff] text-[#1682dd]", green: "bg-[#eaf8e9] text-[#2ca355]", orange: "bg-[#fff3db] text-[#dd8c19]", teal: "bg-[#e7f8f6] text-[#0ca89e]" };
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e0eaf3] bg-white p-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[color]}`}><Icon size={20} /></span><div className="min-w-0"><p className="text-2xl font-black text-[#103456]">{value}</p><p className="text-xs font-semibold text-slate-600">{label}</p></div></div>;
}

function ActivityChart({ days, loading }: { days: ActivityDay[]; loading: boolean }) {
  if (loading && !days.length) return <div className="mt-5 flex h-32 items-center justify-center text-sm font-semibold text-slate-500">Loading activity…</div>;
  if (!days.length) return <div className="mt-5 flex h-32 items-center justify-center text-sm font-semibold text-slate-500">Activity is unavailable right now.</div>;
  const max = Math.max(1, ...days.map(day => Number(day.questions_answered || 0)));
  return <div className="mt-5 grid h-36 grid-cols-7 items-end gap-2 sm:gap-3" aria-label="Questions answered each day over the last seven days">{days.map(day => { const count = Number(day.questions_answered || 0); const label = new Date(`${day.activity_date}T12:00:00`).toLocaleDateString("en-MV", { weekday: "short" }); return <div key={day.activity_date} className="flex h-full min-w-0 flex-col items-center justify-end gap-2" title={`${count} questions on ${day.activity_date}`}><div className="flex h-24 w-full max-w-8 items-end overflow-hidden rounded-lg bg-[#eef5fb]"><div className="w-full rounded-t-lg bg-gradient-to-t from-[#1582d6] to-[#13b9a9]" style={{ height: `${count ? Math.max(8, count / max * 100) : 0}%` }} /></div><span className="text-xs font-bold text-slate-500">{label}</span><span className="sr-only">{count} questions</span></div>; })}</div>;
}
