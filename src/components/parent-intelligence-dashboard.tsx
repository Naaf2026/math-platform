"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, CheckCircle2, CircleAlert, Clock3, Lightbulb, Target, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Summary = { week_start: string; week_end: string; questions_answered: number; correct_answers: number; accuracy: number; practice_days: number; xp_earned: number; previous_questions: number; previous_accuracy: number; previous_practice_days: number; previous_xp: number; };
type Insight = { insight_type: string; title: string; message: string; priority: number; };
type Recommendation = { recommendation_id: string; goal_type: string; title: string; description: string; target_value: number; topic_title: string | null; reason: string; priority: number; };
type Goal = { goal_id: string; title: string; goal_type: string; target_value: number; current_value: number; progress_percent: number; topic_title: string | null; start_date: string; due_date: string; days_remaining: number; status: string; };

function delta(current: number, previous: number) { if (!previous) return current > 0 ? 100 : 0; return Math.round(((current - previous) / previous) * 100); }
function formatGoalValue(goal: Goal) { if (goal.goal_type === "accuracy") return `${Math.round(goal.current_value)}% / ${Math.round(goal.target_value)}%`; if (goal.goal_type === "xp") return `${Math.round(goal.current_value)} / ${Math.round(goal.target_value)} XP`; if (goal.goal_type === "practice_days") return `${Math.round(goal.current_value)} / ${Math.round(goal.target_value)} days`; return `${Math.round(goal.current_value)} / ${Math.round(goal.target_value)} questions`; }

function goalPacing(goal: Goal) {
  const start = new Date(`${goal.start_date}T00:00:00`).getTime();
  const due = new Date(`${goal.due_date}T23:59:59`).getTime();
  const now = Date.now();
  const total = Math.max(1, due - start);
  const elapsed = Math.min(total, Math.max(0, now - start));
  const expected = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  const actual = Math.min(100, Math.max(0, Number(goal.progress_percent || 0)));
  const gap = actual - expected;
  if (actual >= 100) return { label: "Achieved", tone: "emerald", expected, actual, gap, message: "Great work — this goal has been reached." };
  if (goal.days_remaining <= 0) return { label: "Needs attention", tone: "amber", expected, actual, gap, message: "The goal is due. A short focused practice can help finish it." };
  if (gap >= -10) return { label: "On track", tone: "emerald", expected, actual, gap, message: `Progress is close to where it should be for this point in the goal.` };
  return { label: "Needs attention", tone: "amber", expected, actual, gap, message: `Progress is about ${Math.abs(gap)} points behind the expected pace.` };
}

export default function ParentIntelligenceDashboard() {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [savingRecommendation, setSavingRecommendation] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (pathname !== "/parent") return;
    let cancelled = false;
    (async () => {
      const s = createClient();
      if (!s) { if (!cancelled) { setAvailable(false); setLoading(false); } return; }
      const { data: { user } } = await s.auth.getUser();
      if (!user) { if (!cancelled) { setAvailable(false); setLoading(false); } return; }
      const { data: links, error: linkError } = await s.from("student_relationships").select("student_id").eq("related_user_id", user.id).in("relationship", ["parent", "guardian"]).eq("status", "active").limit(1);
      const id = links?.[0]?.student_id;
      if (linkError || !id) { if (!cancelled) { setAvailable(false); setLoading(false); } return; }
      setStudentId(id);
      const [summaryResult, insightsResult, recommendationsResult, goalsResult] = await Promise.all([
        s.rpc("get_parent_learning_summary", { p_student_id: id }),
        s.rpc("get_parent_learning_insights", { p_student_id: id }),
        s.rpc("get_parent_goal_recommendations", { p_student_id: id }),
        s.rpc("get_parent_learning_goals", { p_student_id: id }),
      ]);
      if (cancelled) return;
      if (summaryResult.error || !summaryResult.data?.[0]) { setAvailable(false); setLoading(false); return; }
      setSummary(summaryResult.data[0] as Summary);
      setInsights((insightsResult.data ?? []) as Insight[]);
      setRecommendations((recommendationsResult.data ?? []) as Recommendation[]);
      setGoals(((goalsResult.data ?? []) as Goal[]).filter(g => g.status === "active"));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  const comparisons = useMemo(() => !summary ? [] : [
    { label: "Questions", current: summary.questions_answered, previous: summary.previous_questions, suffix: "", icon: Activity },
    { label: "Accuracy", current: summary.accuracy, previous: summary.previous_accuracy, suffix: "%", icon: CheckCircle2 },
    { label: "Practice days", current: summary.practice_days, previous: summary.previous_practice_days, suffix: "/ 7", icon: Target },
    { label: "XP earned", current: summary.xp_earned, previous: summary.previous_xp, suffix: " XP", icon: ArrowUpRight },
  ], [summary]);

  async function acceptRecommendation(item: Recommendation) {
    if (!studentId || savingRecommendation) return;
    const s = createClient(); if (!s) return;
    setSavingRecommendation(item.recommendation_id); setMessage("");
    const start = new Date(); const due = new Date(start); due.setDate(due.getDate() + 6);
    const { error } = await s.rpc("create_parent_learning_goal", { p_student_id: studentId, p_title: item.title, p_description: item.description, p_goal_type: item.goal_type, p_target_value: Number(item.target_value), p_topic_title: item.topic_title, p_start_date: start.toISOString().slice(0, 10), p_due_date: due.toISOString().slice(0, 10) });
    if (error) setMessage("We could not add that goal right now. Please try again.");
    else { setMessage("Goal added. It will now appear in Goal Progress."); const { data } = await s.rpc("get_parent_learning_goals", { p_student_id: studentId }); setGoals(((data ?? []) as Goal[]).filter(g => g.status === "active")); const { data: nextRecommendations } = await s.rpc("get_parent_goal_recommendations", { p_student_id: studentId }); setRecommendations((nextRecommendations ?? []) as Recommendation[]); }
    setSavingRecommendation(null);
  }

  if (pathname !== "/parent") return null;
  if (loading) return <section className="mx-auto mt-6 max-w-6xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100"><div className="h-5 w-48 animate-pulse rounded bg-slate-100"/><div className="mt-5 grid gap-3 sm:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-50"/>)}</div></section>;
  if (!available || !summary) return null;

  return <section className="mx-auto mt-6 max-w-6xl space-y-6">
    <div className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Lightbulb size={14}/> Learning intelligence</div><h2 className="mt-3 text-2xl font-black sm:text-3xl">What we are seeing this week</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">A simple parent-friendly view of learning progress, consistency, goals and the next best steps.</p></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur"><p className="text-xs text-indigo-100">This week</p><p className="text-lg font-black">{summary.questions_answered} questions</p></div></div></div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{comparisons.map(item => { const Icon = item.icon; const change = delta(item.current, item.previous); const positive = change >= 0; return <div key={item.label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between"><div className="rounded-2xl bg-violet-50 p-2.5 text-violet-600"><Icon size={18}/></div><span className={`inline-flex items-center gap-1 text-xs font-black ${positive ? "text-emerald-600" : "text-rose-600"}`}>{positive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {change > 0 ? "+" : ""}{change}%</span></div><p className="mt-4 text-sm font-bold text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-black text-[#071b3a]">{Math.round(item.current)}{item.suffix}</p><p className="mt-1 text-xs text-slate-400">Last week: {Math.round(item.previous)}{item.suffix}</p></div>; })}</div>

    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">What we are seeing</p><h3 className="mt-1 text-xl font-black text-[#071b3a]">Learning signals</h3></div><CircleAlert className="text-violet-500" size={21}/></div><div className="mt-5 space-y-3">{insights.length ? insights.slice(0, 6).map((item, index) => <div key={`${item.insight_type}-${index}`} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start gap-3"><span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.priority <= 1 ? "bg-amber-500" : "bg-violet-500"}`}/><div><p className="font-black text-slate-800">{item.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p></div></div></div>) : <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">No concerns are showing right now. Keep the learning routine going.</p>}</div></div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Goal progress</p><h3 className="mt-1 text-xl font-black text-[#071b3a]">Pacing</h3></div><Clock3 className="text-violet-500" size={21}/></div><div className="mt-5 space-y-4">{goals.length ? goals.slice(0, 4).map(goal => { const pacing = goalPacing(goal); const progress = pacing.actual; const tone = pacing.tone === "emerald" ? "emerald" : "amber"; return <div key={goal.goal_id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black text-slate-800">{goal.title}</p>{goal.topic_title && <p className="mt-1 text-xs font-semibold text-violet-600">{goal.topic_title}</p>}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{pacing.label}</span></div><div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{formatGoalValue(goal)}</span><span>{goal.days_remaining <= 0 ? "Due now" : `${goal.days_remaining} days left`}</span></div><div className="relative mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="absolute inset-y-0 left-0 rounded-full bg-slate-300" style={{ width: `${pacing.expected}%` }}/><div className={`absolute inset-y-0 left-0 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${progress}%` }}/></div><div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>Expected {pacing.expected}%</span><span>Actual {pacing.actual}%</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{pacing.message}</p></div>; }) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No active goals yet. The recommendations below can help you choose a simple next goal.</p>}</div></div>
    </div>

    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Smart recommendations</p><h3 className="mt-1 text-xl font-black text-[#071b3a]">Good next steps</h3></div><TrendingUp className="text-violet-500" size={22}/></div>{message && <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}<div className="mt-5 grid gap-4 md:grid-cols-3">{recommendations.slice(0, 3).map(item => <div key={item.recommendation_id} className="rounded-2xl bg-gradient-to-br from-violet-50 to-cyan-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">{item.topic_title || item.goal_type.replaceAll("_", " ")}</p><h4 className="mt-2 font-black text-slate-800">{item.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p><div className="mt-3 rounded-xl bg-white/80 p-3 text-xs font-semibold text-slate-600"><span className="font-black text-slate-800">Why:</span> {item.reason}</div><button type="button" onClick={() => acceptRecommendation(item)} disabled={savingRecommendation !== null} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">{savingRecommendation === item.recommendation_id ? "Adding…" : "Add as a goal"}</button></div>)}{!recommendations.length && <p className="md:col-span-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">There are no new recommendations right now. Continue with the current routine.</p>}</div></div>
  </section>;
}
