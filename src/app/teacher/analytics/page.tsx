"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, ChevronDown, Flame, Target, TrendingUp, Users, AlertTriangle, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = { id: number; name: string; class_code: string; grade: string | null; learning_level: string | null };
type Student = {
  student_id: string; display_name: string; grade: string | null; learning_level: string | null;
  xp: number; current_streak: number; best_streak: number; total_questions: number; total_correct: number;
  accuracy: number; average_mastery: number; topics_explored: number; missions_completed: number;
  best_combo: number; coins: number; gems: number; membership_status: string;
};
type Intervention = { id: number; student_id: string; student_name: string; intervention_type: "review" | "reinforce" | "extend"; topic_id: string | null; status: "open" | "completed"; created_at: string; completed_at: string | null };

export default function TeacherAnalyticsPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const s = createClient();
      if (!s) { setError("Supabase is not configured yet."); setLoading(false); return; }
      const { data: { user } } = await s.auth.getUser();
      if (!user) { location.href = "/login"; return; }
      const { data, error: e } = await s.from("classes").select("id,name,class_code,grade,learning_level").eq("status", "active").order("name");
      if (e) setError(e.message); else { const rows = (data ?? []) as ClassRow[]; setClasses(rows); setClassId(rows[0] ? String(rows[0].id) : ""); }
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      if (!classId) return;
      const s = createClient(); if (!s) return;
      setBusy(true); setError("");
      const [roster, open, completed] = await Promise.all([
        s.rpc("get_class_roster_report", { p_class_id: Number(classId) }),
        s.rpc("get_teacher_interventions", { p_class_id: Number(classId), p_student_id: null, p_status: "open" }),
        s.rpc("get_teacher_interventions", { p_class_id: Number(classId), p_student_id: null, p_status: "completed" }),
      ]);
      if (roster.error) setError(roster.error.message);
      setStudents((roster.data ?? []) as Student[]);
      const all = [...((open.data ?? []) as Intervention[]), ...((completed.data ?? []) as Intervention[])];
      setInterventions(all);
      setBusy(false);
    }
    void loadAnalytics();
  }, [classId]);

  const selectedClass = classes.find((c) => String(c.id) === classId);
  const analytics = useMemo(() => {
    const count = students.length;
    const mastery = count ? Math.round(students.reduce((a, s) => a + Number(s.average_mastery || 0), 0) / count) : 0;
    const accuracy = count ? Math.round(students.reduce((a, s) => a + Number(s.accuracy || 0), 0) / count) : 0;
    const questions = students.reduce((a, s) => a + Number(s.total_questions || 0), 0);
    const active = students.filter((s) => s.total_questions > 0).length;
    const struggling = students.filter((s) => s.average_mastery < 60 || s.accuracy < 60);
    const developing = students.filter((s) => s.average_mastery >= 60 && s.average_mastery < 80);
    const strong = students.filter((s) => s.average_mastery >= 80 && s.accuracy >= 80);
    const open = interventions.filter((i) => i.status === "open");
    const completed = interventions.filter((i) => i.status === "completed");
    const completionRate = interventions.length ? Math.round((completed.length / interventions.length) * 100) : 0;
    const avgStreak = count ? Math.round(students.reduce((a, s) => a + s.current_streak, 0) / count) : 0;
    return { mastery, accuracy, questions, active, struggling, developing, strong, open, completed, completionRate, avgStreak };
  }, [students, interventions]);

  const ranked = useMemo(() => [...students].sort((a, b) => (a.average_mastery - b.average_mastery) || (a.accuracy - b.accuracy)), [students]);
  const interventionByStudent = useMemo(() => {
    const map = new Map<string, { open: number; completed: number }>();
    interventions.forEach((i) => { const x = map.get(i.student_id) ?? { open: 0, completed: 0 }; i.status === "open" ? x.open++ : x.completed++; map.set(i.student_id, x); });
    return map;
  }, [interventions]);
  const interventionTopics = useMemo(() => {
    const map = new Map<string, number>();
    interventions.filter((i) => i.status === "open" && i.topic_id).forEach((i) => map.set(i.topic_id!, (map.get(i.topic_id!) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [interventions]);

  if (loading) return <Shell><Card><p className="text-center font-bold text-slate-500">Loading class analytics…</p></Card></Shell>;
  if (!classes.length) return <Shell><Card><h1 className="text-2xl font-black text-[#071b3a]">Teacher Analytics</h1><p className="mt-2 text-slate-500">{error || "No active classes are assigned to this teacher yet."}</p></Card></Shell>;

  return <Shell>
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/teacher" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Teacher Dashboard</Link>
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm"><BarChart3 size={16}/> Teacher Analytics 4.3</div>
    </header>

    <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-black uppercase tracking-wider text-indigo-100">Class insights</p><h1 className="mt-3 text-4xl font-black">See the whole class at a glance</h1><p className="mt-2 max-w-2xl text-indigo-100">Spot learning gaps, engagement patterns and support priorities before they become bigger problems.</p></div>
        <div className="relative min-w-[260px]"><label className="mb-2 block text-xs font-black uppercase tracking-wider text-indigo-100">Class</label><select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 pr-10 font-bold text-white outline-none backdrop-blur">{classes.map((c) => <option key={c.id} value={c.id} className="text-slate-900">{c.name} · {c.class_code}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 bottom-3" size={18}/></div>
      </div>
    </section>

    {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
    {busy && <div className="mt-4 rounded-2xl bg-white p-3 text-center text-xs font-bold text-slate-500 shadow-sm">Refreshing class insights…</div>}

    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Metric icon={<Users/>} value={String(students.length)} label="Learners"/><Metric icon={<Target/>} value={`${analytics.mastery}%`} label="Avg mastery"/><Metric icon={<CheckCircle2/>} value={`${analytics.accuracy}%`} label="Avg accuracy"/><Metric icon={<BarChart3/>} value={String(analytics.questions)} label="Questions"/><Metric icon={<Flame/>} value={`${analytics.avgStreak}d`} label="Avg streak"/>
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <Card><SectionTitle icon={<TrendingUp/>} eyebrow="Learning distribution" title="Class mastery profile"/><div className="mt-6 space-y-4"><Distribution label="Needs review" count={analytics.struggling.length} total={students.length} description="Mastery or accuracy below 60%"/><Distribution label="Developing" count={analytics.developing.length} total={students.length} description="Building consistency toward mastery"/><Distribution label="Strong / ready to extend" count={analytics.strong.length} total={students.length} description="Mastery and accuracy at 80%+"/></div><div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><b>{analytics.active}/{students.length}</b> learners have answered at least one question. Use engagement alongside mastery when planning support.</div></Card>
      <Card><SectionTitle icon={<ClipboardCheck/>} eyebrow="Intervention effectiveness" title="Support activity"/><div className="mt-6 grid grid-cols-2 gap-3"><Mini label="Open" value={analytics.open.length}/><Mini label="Completed" value={analytics.completed.length}/><Mini label="Completion" value={`${analytics.completionRate}%`}/><Mini label="Learners flagged" value={new Set(interventions.map(i => i.student_id)).size}/></div><div className="mt-6 rounded-2xl bg-violet-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Priority topics</p>{interventionTopics.length ? <div className="mt-3 space-y-2">{interventionTopics.map(([topic, n]) => <div key={topic} className="flex items-center justify-between rounded-xl bg-white px-3 py-2"><span className="text-sm font-bold text-slate-700">{topic}</span><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-black text-violet-700">{n} open</span></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No topic-specific open interventions yet.</p>}</div><Link href="/teacher/interventions" className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Open intervention center</Link></Card>
    </section>

    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><SectionTitle icon={<AlertTriangle/>} eyebrow="Learner risk radar" title="Who needs attention first?"/><div className="mt-6 grid gap-3 md:grid-cols-2">{ranked.slice(0, 8).map((s) => { const flags = interventionByStudent.get(s.student_id) ?? { open: 0, completed: 0 }; const urgent = s.average_mastery < 60 || s.accuracy < 60; return <Link key={s.student_id} href={`/teacher/students/profile?student=${encodeURIComponent(s.student_id)}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#071b3a]">{s.display_name}</p><p className="mt-1 text-xs font-bold text-slate-400">{s.total_questions} questions · {s.current_streak} day streak</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${urgent ? "bg-rose-100 text-rose-700" : s.average_mastery < 80 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{urgent ? "Priority" : s.average_mastery < 80 ? "Monitor" : "Extend"}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><Mini label="Mastery" value={`${Math.round(s.average_mastery)}%`}/><Mini label="Accuracy" value={`${Math.round(s.accuracy)}%`}/><Mini label="Open actions" value={flags.open}/></div></Link>})}</div>{!ranked.length && <p className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No learners are currently enrolled.</p>}</section>

    <section className="mt-6 rounded-3xl bg-gradient-to-r from-violet-50 to-blue-50 p-6 ring-1 ring-violet-100 sm:p-8"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Next action</p><h2 className="mt-1 text-xl font-black text-[#071b3a]">Turn these insights into teaching decisions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Open a learner support profile for targeted action, or review the intervention history to see what has already been tried.</p></div><div className="flex flex-wrap gap-2"><Link href="/teacher/students/profile" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Student profiles</Link><Link href="/teacher/interventions/history" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">Action history</Link></div></div></section>
  </Shell>;
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-28 sm:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>; }
function Card({ children }: { children: React.ReactNode }) { return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">{children}</div>; }
function SectionTitle({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) { return <div className="flex items-center gap-3"><span className="text-violet-600">{icon}</span><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">{eyebrow}</p><h2 className="mt-1 text-xl font-black text-[#071b3a]">{title}</h2></div></div>; }
function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-2xl font-black text-[#071b3a]">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div>; }
function Mini({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-[#071b3a]">{value}</p></div>; }
function Distribution({ label, count, total, description }: { label: string; count: number; total: number; description: string }) { const pct = total ? Math.round(count / total * 100) : 0; return <div><div className="flex justify-between gap-3"><div><p className="font-black text-slate-700">{label}</p><p className="text-xs text-slate-400">{description}</p></div><p className="font-black text-[#071b3a]">{count} <span className="text-xs text-slate-400">({pct}%)</span></p></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }}/></div></div>; }
