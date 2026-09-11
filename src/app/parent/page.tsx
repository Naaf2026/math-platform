"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Flame, Gem, GraduationCap, Medal, ShieldCheck, Sparkles, Target, TrendingUp, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Report = {
  student_id: string; display_name: string; grade: string | null; learning_level: string | null;
  school_name: string | null; class_name: string | null; xp: number; current_streak: number;
  best_streak: number; total_questions: number; total_correct: number; accuracy: number;
  average_mastery: number; topics_explored: number; missions_completed: number; best_combo: number;
  coins: number; gems: number;
};
type Topic = { topic_id: string; topic_title: string; questions_answered: number; correct_answers: number; mastery: number };
type WeeklyDay = { activity_date: string; questions_answered: number; correct_answers: number; xp_earned: number; practice_minutes: number };

export default function ParentPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [status, setStatus] = useState("Loading family report…");
  const [weeklyAvailable, setWeeklyAvailable] = useState(true);
  const [authDebug, setAuthDebug] = useState<{ id: string; email: string | null; name: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const s = createClient();
      if (!s) { setStatus("Supabase is not configured yet."); return; }
      const { data: { user } } = await s.auth.getUser();
      if (!user) { location.href = "/login"; return; }
      const { data: profile } = await s.from("profiles").select("full_name,display_name").eq("id", user.id).maybeSingle();
      setAuthDebug({ id: user.id, email: user.email ?? null, name: profile?.display_name || profile?.full_name || null });
      const { data: links, error: linkError } = await s.from("student_relationships").select("student_id").eq("related_user_id", user.id).eq("relationship", "parent").eq("status", "active");
      const studentId = links?.[0]?.student_id;
      if (linkError) { setStatus(`Relationship lookup failed: ${linkError.message}`); return; }
      if (!studentId) { setStatus("No linked student found. A parent account must be explicitly linked to a student first."); return; }
      const [{ data, error }, { data: tp }, { data: wa, error: weeklyError }] = await Promise.all([
        s.rpc("get_learning_report", { p_student_id: studentId }),
        s.rpc("get_linked_student_topics", { p_student_id: studentId }),
        s.rpc("get_parent_weekly_activity", { p_student_id: studentId }),
      ]);
      if (error || !data?.[0]) { setStatus(error?.message || "The linked student report is unavailable."); return; }
      setReport(data[0] as Report);
      setTopics((tp ?? []) as Topic[]);
      if (weeklyError) setWeeklyAvailable(false); else setWeekly((wa ?? []) as WeeklyDay[]);
      setStatus("");
    })();
  }, []);

  const strongest = useMemo(() => [...topics].sort((a, b) => b.mastery - a.mastery).slice(0, 3), [topics]);
  const support = useMemo(() => [...topics].sort((a, b) => a.mastery - b.mastery).slice(0, 3), [topics]);
  const accuracyProgress = Math.min(100, Math.max(0, report?.accuracy ?? 0));
  const masteryProgress = Math.min(100, Math.max(0, report?.average_mastery ?? 0));
  const weekQuestions = weekly.reduce((n, d) => n + Number(d.questions_answered || 0), 0);
  const weekCorrect = weekly.reduce((n, d) => n + Number(d.correct_answers || 0), 0);
  const weekXp = weekly.reduce((n, d) => n + Number(d.xp_earned || 0), 0);
  const practiceDays = weekly.filter(d => Number(d.questions_answered || 0) > 0).length;
  const weekAccuracy = weekQuestions ? Math.round((weekCorrect / weekQuestions) * 100) : 0;
  const maxDayQuestions = Math.max(1, ...weekly.map(d => Number(d.questions_answered || 0)));

  if (status && !report) return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Parent & Guardian Report</h1><p className="mt-3 text-sm leading-6 text-slate-500">{status}</p>{authDebug && <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-xs text-slate-600"><p className="font-black text-slate-800">Authentication diagnostic</p><p className="mt-2 break-all"><b>User ID:</b> {authDebug.id}</p><p className="mt-1"><b>Email:</b> {authDebug.email || "Not available"}</p><p className="mt-1"><b>Profile:</b> {authDebug.name || "Not found"}</p></div>}<Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-28 sm:p-8"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Family Learning Report</span></header>
    <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10"><div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><ShieldCheck size={14}/> Secure family view</div><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{report?.display_name}'s learning journey</h1><p className="mt-3 text-indigo-100">{report?.grade || "Grade not set"} · {report?.learning_level || "Learning level not set"}{report?.class_name ? ` · ${report.class_name}` : ""}</p>{report?.school_name && <p className="mt-1 text-sm text-indigo-200">{report.school_name}</p>}</div><div className="rounded-3xl bg-white/10 p-5 text-center backdrop-blur"><Flame className="mx-auto text-amber-300" size={24}/><p className="mt-1 text-xs text-indigo-100">Current streak</p><p className="text-4xl font-black">{report?.current_streak}</p><p className="text-xs text-indigo-100">Best: {report?.best_streak} days</p></div></div></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<GraduationCap/>} value={`${report?.xp ?? 0}`} label="Total XP"/><Metric icon={<CheckCircle2/>} value={`${report?.accuracy ?? 0}%`} label="Accuracy"/><Metric icon={<Target/>} value={`${report?.average_mastery ?? 0}%`} label="Average mastery"/><Metric icon={<Trophy/>} value={`${report?.missions_completed ?? 0}`} label="Missions completed"/></section>

    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><CalendarDays className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Weekly learning</p><h2 className="text-2xl font-black text-[#071b3a]">Last 7 days</h2></div></div><div className="flex gap-2 text-xs font-black"><span className="rounded-full bg-violet-50 px-3 py-2 text-violet-700">{practiceDays}/7 practice days</span><span className="rounded-full bg-cyan-50 px-3 py-2 text-cyan-700">{weekXp} XP earned</span></div></div>{weeklyAvailable ? <><div className="mt-6 grid gap-3 sm:grid-cols-3"><MiniStat label="Questions this week" value={weekQuestions}/><MiniStat label="Weekly accuracy" value={`${weekAccuracy}%`}/><MiniStat label="Practice days" value={practiceDays}/></div><div className="mt-7 flex h-32 items-end gap-2 sm:gap-3">{weekly.map(d => { const count = Number(d.questions_answered || 0); const height = count ? Math.max(12, Math.round((count / maxDayQuestions) * 100)) : 5; const label = new Date(`${d.activity_date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }); return <div key={d.activity_date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-slate-500">{count || ""}</span><div className={`w-full max-w-12 rounded-t-xl ${count ? "bg-gradient-to-t from-violet-600 to-cyan-400" : "bg-slate-100"}`} style={{height: `${height}%`}}/><span className="text-[10px] font-bold text-slate-400">{label}</span></div>; })}</div></> : <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Weekly analytics is ready in the app code but the new Supabase function still needs to be applied.</div>}</section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Overall progress</p><h2 className="text-2xl font-black text-[#071b3a]">How learning is going</h2></div><Sparkles className="text-cyan-500"/><TrendingUp className="text-violet-500"/></div><Progress label="Accuracy" value={accuracyProgress} suffix="%"/><Progress label="Average mastery" value={masteryProgress} suffix="%"/><div className="mt-6 grid gap-3 sm:grid-cols-3"><MiniStat label="Questions" value={report?.total_questions ?? 0}/><MiniStat label="Topics explored" value={report?.topics_explored ?? 0}/><MiniStat label="Best combo" value={report?.best_combo ?? 0}/></div></div><div className="rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-50 p-6 ring-1 ring-cyan-100 sm:p-7"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">Learning snapshot</p><h2 className="mt-2 text-2xl font-black text-[#071b3a]">{masteryProgress >= 75 ? "Strong progress" : masteryProgress >= 50 ? "Building steadily" : "Keep strengthening foundations"}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{masteryProgress >= 75 ? "The learner is showing strong overall mastery. Keep reinforcing regular practice and challenging them with new topics." : "Short, consistent practice sessions can help strengthen foundations and build confidence over time."}</p><div className="mt-5 grid grid-cols-2 gap-3"><Reward icon={<Medal/>} label="Coins" value={report?.coins ?? 0}/><Reward icon={<Gem/>} label="Gems" value={report?.gems ?? 0}/></div></div></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><BarChart3 className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Topic mastery</p><h2 className="text-2xl font-black text-[#071b3a]">Learning progress</h2></div></div><div className="mt-6 space-y-4">{topics.length ? topics.map(t => <TopicBar key={t.topic_id} topic={t}/> ) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Topic detail will appear after the student completes practice.</p>}</div></div><div className="space-y-6"><TopicList title="Strengths" tone="emerald" topics={strongest}/><TopicList title="Needs more practice" tone="amber" topics={support}/></div></section>
    <section className="mt-6 grid gap-6 sm:grid-cols-2"><div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex items-center gap-3"><Trophy className="text-amber-500"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Achievements</p><h2 className="text-xl font-black text-[#071b3a]">Learning milestones</h2></div></div><div className="mt-5 grid grid-cols-2 gap-3"><Milestone label="Missions" value={report?.missions_completed ?? 0}/><Milestone label="Best streak" value={`${report?.best_streak ?? 0} days`}/><Milestone label="Best combo" value={report?.best_combo ?? 0}/><Milestone label="Topics" value={report?.topics_explored ?? 0}/></div></div><div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Parent view</p><h2 className="mt-2 text-xl font-black text-[#071b3a]">A simple picture of progress</h2><p className="mt-3 text-sm leading-6 text-slate-600">Use this report to celebrate consistency, notice topics that need support, and encourage regular practice. Detailed teacher interventions remain protected inside the teacher workspace.</p><div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-800">Tip: celebrate effort and consistency, not only high scores.</div></div></section>
  </div></main>;
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>; }
function MiniStat({ label, value }: { label: string; value: number | string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-[#071b3a]">{value}</p></div>; }
function Progress({ label, value, suffix }: { label: string; value: number; suffix: string }) { return <div className="mt-6"><div className="flex justify-between text-sm font-black"><span className="text-slate-600">{label}</span><span className="text-violet-700">{Math.round(value)}{suffix}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${value}%` }}/></div></div>; }
function TopicBar({ topic }: { topic: Topic }) { return <div className="rounded-2xl border border-slate-100 p-4"><div className="flex justify-between gap-3"><div><p className="font-black text-[#071b3a]">{topic.topic_title}</p><p className="text-xs text-slate-500">{topic.correct_answers}/{topic.questions_answered} correct</p></div><b className="text-violet-700">{topic.mastery}%</b></div><div className="mt-3 h-3 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(100, Math.max(0, topic.mastery))}%` }}/></div></div>; }
function TopicList({ title, tone, topics }: { title: string; tone: "emerald" | "amber"; topics: Topic[] }) { const cls = tone === "emerald" ? "bg-emerald-50 ring-emerald-100 text-emerald-700" : "bg-amber-50 ring-amber-100 text-amber-700"; return <div className={`rounded-3xl p-6 ring-1 ${cls}`}><p className="text-xs font-black uppercase tracking-wider">{title}</p><div className="mt-4 space-y-3">{topics.length ? topics.map(t => <div key={t.topic_id} className="rounded-2xl bg-white/80 p-4"><div className="flex justify-between gap-3"><span className="font-black text-[#071b3a]">{t.topic_title}</span><b>{t.mastery}%</b></div><p className="mt-1 text-xs text-slate-500">{t.questions_answered} questions attempted</p></div>) : <p className="text-sm text-slate-500">More topic data will appear with practice.</p>}</div></div>; }
function Reward({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-violet-600">{icon}<span className="text-xs font-black text-slate-500">{label}</span></div><p className="mt-1 text-2xl font-black text-[#071b3a]">{value}</p></div>; }
function Milestone({ label, value }: { label: string; value: number | string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-[#071b3a]">{value}</p></div>; }
