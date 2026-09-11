"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, RefreshCw, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = { id: number; name: string; class_code: string };
type Daily = { date: string; questions: number; correct: number };
type Attention = { student_id: string; student_name: string; mastery: number; accuracy: number; questions: number; open_interventions: number; reason: string };
type Topic = { topic: string; count: number; open: number; completed: number };
type Insights = {
  class: { id: number; name: string; class_code: string; grade: string | null; learning_level: string | null };
  summary: { students: number; active_learners_14d: number; questions_14d: number; accuracy_14d: number; open_interventions: number; completed_interventions: number };
  daily_activity: Daily[];
  interventions: { open: number; completed: number; total: number; completion_rate: number; completed_with_followup: number };
  support_topics: Topic[];
  attention: Attention[];
};

export default function TeacherInsightsPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadClasses() {
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured yet."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { location.href = "/login"; return; }
    const { data: rows, error: classError } = await supabase
      .from("classes")
      .select("id,name,class_code")
      .eq("status", "active")
      .order("name");
    if (classError) { setError(classError.message); setLoading(false); return; }
    const next = (rows ?? []) as ClassRow[];
    setClasses(next);
    setClassId((current) => current || String(next[0]?.id ?? ""));
    setLoading(false);
  }

  async function loadInsights(id = classId) {
    if (!id) return;
    const supabase = createClient();
    if (!supabase) return;
    setRefreshing(true); setError("");
    const { data: result, error: rpcError } = await supabase.rpc("get_teacher_insights", { p_class_id: Number(id) });
    if (rpcError) setError(rpcError.message);
    else setData(result as Insights);
    setRefreshing(false);
  }

  useEffect(() => { void loadClasses(); }, []);
  useEffect(() => { if (classId) void loadInsights(classId); }, [classId]);

  const maxQuestions = useMemo(() => Math.max(...(data?.daily_activity ?? []).map((d) => d.questions), 1), [data]);

  if (loading) return <Shell><Loading/></Shell>;
  if (!classes.length) return <Shell><Empty message={error || "No active classes are assigned to this teacher."}/></Shell>;

  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Teacher Dashboard</Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/teacher/interventions" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Interventions</Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Teacher Dashboard 4.3</span>
        </div>
      </header>

      <section className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Progress & intervention insights</div>
            <h1 className="mt-4 text-4xl font-black">What should I do next?</h1>
            <p className="mt-2 max-w-2xl text-indigo-100">Turn class activity and intervention history into practical teaching priorities.</p>
          </div>
          <div className="min-w-[260px]">
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-indigo-100">Select class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 font-bold text-white outline-none backdrop-blur">
              {classes.map((c) => <option key={c.id} value={c.id} className="text-slate-900">{c.name} · {c.class_code}</option>)}
            </select>
          </div>
        </div>
      </section>

      {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

      {data && <>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Users/>} value={String(data.summary.students)} label="Students"/>
          <Metric icon={<BarChart3/>} value={`${data.summary.accuracy_14d}%`} label="14-day accuracy"/>
          <Metric icon={<Target/>} value={String(data.summary.questions_14d)} label="Questions · 14 days"/>
          <Metric icon={<ClipboardList/>} value={String(data.summary.open_interventions)} label="Open interventions"/>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <Panel title="Practice trend" kicker="Last 14 days" icon={<BarChart3 className="text-violet-600"/>}>
            <div className="mt-5 flex h-56 items-end gap-1 overflow-hidden rounded-2xl bg-slate-50 px-3 pt-5 sm:gap-2">
              {data.daily_activity.map((day) => {
                const height = Math.max(5, Math.round((day.questions / maxQuestions) * 100));
                const accuracy = day.questions ? Math.round((day.correct / day.questions) * 100) : 0;
                return <div key={day.date} className="group flex h-full flex-1 flex-col justify-end" title={`${day.date}: ${day.questions} questions, ${accuracy}% accuracy`}><div className="mx-auto w-full max-w-8 rounded-t-lg bg-violet-500 transition group-hover:bg-violet-700" style={{ height: `${height}%` }}/><p className="mt-2 text-center text-[9px] font-bold text-slate-400">{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined,{day:"numeric"})}</p></div>;
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">Bars show daily question volume. Hover a bar for questions and accuracy.</p>
          </Panel>

          <Panel title="Intervention health" kicker="Action follow-through" icon={<CheckCircle2 className="text-emerald-600"/>}>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Mini label="Total" value={data.interventions.total}/><Mini label="Open" value={data.interventions.open}/><Mini label="Completed" value={data.interventions.completed}/><Mini label="Completion" value={`${data.interventions.completion_rate}%`}/>
            </div>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Follow-up activity</p><p className="mt-1 text-2xl font-black text-[#071b3a]">{data.interventions.completed_with_followup}</p><p className="mt-1 text-xs leading-5 text-emerald-800">Completed interventions followed by learner practice within 7 days.</p></div>
            <Link href="/teacher/interventions" className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Manage interventions</Link>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Topics needing support" kicker="Most intervention activity" icon={<Target className="text-orange-500"/>}>
            <div className="mt-5 space-y-3">
              {data.support_topics.length ? data.support_topics.map((topic) => <div key={topic.topic} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="font-black text-[#071b3a]">{topic.topic}</p><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">{topic.count}</span></div><div className="mt-2 flex gap-3 text-xs font-bold text-slate-500"><span>{topic.open} open</span><span>{topic.completed} completed</span></div></div>) : <Empty message="No intervention topics recorded yet."/>}
            </div>
          </Panel>

          <Panel title="Learners to watch" kicker="Priority teaching list" icon={<Users className="text-rose-500"/>}>
            <div className="mt-5 space-y-3">
              {data.attention.length ? data.attention.slice(0, 8).map((student) => <Link key={student.student_id} href={`/teacher/student/${student.student_id}`} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-violet-50"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#071b3a]">{student.student_name}</p><p className="mt-1 text-xs font-bold text-slate-500">{student.reason} · {student.questions} questions</p></div><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">{student.accuracy}% accuracy</span></div><div className="mt-3 flex gap-4 text-xs font-bold text-slate-500"><span>Mastery {student.mastery}%</span><span>{student.open_interventions} open action{student.open_interventions === 1 ? "" : "s"}</span></div></Link>) : <Empty message="No learners currently require attention."/>}
            </div>
          </Panel>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Secure teacher insights</p><h2 className="text-xl font-black text-[#071b3a]">Class-scoped decision support</h2></div></div><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">All figures are calculated through the secure teacher insights RPC. The view is limited to active learners in the selected class and does not expose student answer text.</p><button onClick={() => void loadInsights()} disabled={refreshing} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/> {refreshing ? "Refreshing…" : "Refresh insights"}</button></section>
      </>}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-28 sm:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>; }
function Panel({ title, kicker, icon, children }: { title: string; kicker: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><div className="flex items-center gap-3">{icon}<div><p className="text-xs font-black uppercase tracking-wider text-violet-600">{kicker}</p><h2 className="text-xl font-black text-[#071b3a]">{title}</h2></div></div>{children}</div>; }
function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>; }
function Mini({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-[#071b3a]">{value}</p></div>; }
function Empty({ message }: { message: string }) { return <div className="rounded-2xl bg-slate-50 p-7 text-center text-sm font-bold text-slate-500">{message}</div>; }
function Loading() { return <div className="mt-24 rounded-3xl bg-white p-10 text-center font-bold text-slate-500">Loading teacher insights…</div>; }
