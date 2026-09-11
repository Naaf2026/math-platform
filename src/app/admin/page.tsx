"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, BarChart3, BookOpenCheck, CheckCircle2, GraduationCap, RefreshCw, ShieldCheck, Sparkles, Target, Trophy, Users, UserRoundCheck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

type Analytics = {
  users: { total: number; students: number; teachers: number; parents: number; admins: number };
  classes: { total: number; active: number; archived: number; enrolments: number; teachers_assigned: number };
  learning: { active_learners_7d: number; learning_days_30d: number; questions_answered: number; correct_answers: number; lessons_completed: number; topics_completed: number; xp_total: number; average_streak: number };
  recent_activity: { date: string; learners: number; questions: number }[];
  top_students: { id: string; name: string; grade: string | null; xp: number; streak: number; questions: number; correct: number; accuracy: number }[];
};

const empty: Analytics = {
  users: { total: 0, students: 0, teachers: 0, parents: 0, admins: 0 },
  classes: { total: 0, active: 0, archived: 0, enrolments: 0, teachers_assigned: 0 },
  learning: { active_learners_7d: 0, learning_days_30d: 0, questions_answered: 0, correct_answers: 0, lessons_completed: 0, topics_completed: 0, xp_total: 0, average_streak: 0 },
  recent_activity: [],
  top_students: [],
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics>(empty);
  const [status, setStatus] = useState("Loading administrator dashboard…");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setStatus("Supabase is not configured yet."); return; }
    setRefreshing(true);
    setStatus("Loading administrator dashboard…");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.href = "/login"; return; }
    const role = await getUserRole(supabase, user.id);
    if (role !== "admin") { setStatus("Administrator access is required."); setRefreshing(false); return; }
    const { data: result, error } = await supabase.rpc("get_admin_dashboard_analytics");
    if (error) { setStatus(error.message); setRefreshing(false); return; }
    setData((result ?? empty) as Analytics);
    setStatus("");
    setRefreshing(false);
  }

  useEffect(() => { void load(); }, []);

  const learningAccuracy = data.learning.questions_answered
    ? Math.round((data.learning.correct_answers / data.learning.questions_answered) * 100)
    : 0;
  const maxQuestions = Math.max(1, ...data.recent_activity.map((item) => item.questions));
  const activityLabel = useMemo(() => data.recent_activity.map((item) => new Date(item.date).toLocaleDateString(undefined, { weekday: "short" })), [data.recent_activity]);

  if (status) return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-slate-100"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Admin Dashboard 4.0</h1><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">{status}</p><Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><ArrowLeft size={17}/> Dashboard</Link></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link>
        <div className="flex flex-wrap gap-2"><Link href="/admin/classes" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-slate-200">Class Management</Link><Link href="/admin/users" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-slate-200">User Management</Link><button onClick={() => void load()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/> Refresh</button></div>
      </header>

      <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-10">
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><ShieldCheck size={14}/> Secure administrator view</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">Admin Dashboard <span className="text-yellow-300">4.0</span></h1><p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100 sm:text-base">A high-level view of platform health, learners, classes and learning activity. Analytics are returned through an admin-only Supabase RPC.</p></div>
          <div className="rounded-3xl bg-white/10 p-5 text-center backdrop-blur"><Sparkles className="mx-auto text-yellow-300" size={25}/><p className="mt-2 text-3xl font-black">{data.learning.active_learners_7d}</p><p className="text-xs font-bold text-indigo-100">Active learners · 7 days</p></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<Users/>} value={data.users.students} label="Students" note={`${data.users.total} total profiles`}/>
        <Metric icon={<GraduationCap/>} value={data.users.teachers} label="Teachers" note={`${data.classes.teachers_assigned} class assignments`}/>
        <Metric icon={<BookOpenCheck/>} value={data.classes.active} label="Active classes" note={`${data.classes.enrolments} active enrolments`}/>
        <Metric icon={<Activity/>} value={data.learning.active_learners_7d} label="Active learners" note="Last 7 days"/>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Zap/>} value={data.learning.xp_total.toLocaleString()} label="Total XP earned"/>
        <Stat icon={<Target/>} value={data.learning.questions_answered.toLocaleString()} label="Questions answered"/>
        <Stat icon={<CheckCircle2/>} value={`${learningAccuracy}%`} label="Platform accuracy"/>
        <Stat icon={<Trophy/>} value={data.learning.lessons_completed.toLocaleString()} label="Lessons completed"/>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Learning activity</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Last 7 days</h2></div><div className="rounded-2xl bg-violet-50 px-4 py-3 text-right"><p className="text-xs font-bold text-violet-600">30-day learning days</p><p className="text-xl font-black text-[#071b3a]">{data.learning.learning_days_30d}</p></div></div>
          <div className="mt-7 grid grid-cols-7 items-end gap-2 sm:gap-4">
            {data.recent_activity.map((item, index) => <div key={item.date} className="flex min-w-0 flex-col items-center gap-2"><div className="flex h-40 w-full items-end justify-center rounded-2xl bg-slate-50 p-2"><div title={`${item.questions} questions`} className="w-full max-w-10 rounded-xl bg-gradient-to-t from-violet-600 to-cyan-400 transition-all" style={{height:`${Math.max(8, Math.round((item.questions / maxQuestions) * 100))}%`}}/></div><span className="text-[11px] font-black text-slate-400">{activityLabel[index]}</span><span className="text-xs font-bold text-slate-600">{item.questions}</span></div>)}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500"><span>Questions completed per day</span><span className="font-black text-violet-600">{data.learning.questions_answered.toLocaleString()} total</span></div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 ring-1 ring-violet-100 sm:p-8">
          <div className="flex items-center gap-3"><BarChart3 className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Platform health</p><h2 className="text-2xl font-black text-[#071b3a]">At a glance</h2></div></div>
          <div className="mt-6 space-y-3"><Health label="Students" value={data.users.students} total={Math.max(1,data.users.total)}/><Health label="Active classes" value={data.classes.active} total={Math.max(1,data.classes.total)}/><Health label="Lessons completed" value={data.learning.lessons_completed} total={Math.max(1,data.users.students)}/><Health label="Topics completed" value={data.learning.topics_completed} total={Math.max(1,data.learning.topics_completed + data.learning.lessons_completed)}/></div>
          <div className="mt-6 grid grid-cols-2 gap-3"><Mini label="Parents / guardians" value={data.users.parents}/><Mini label="Average streak" value={`${data.learning.average_streak} days`}/><Mini label="Archived classes" value={data.classes.archived}/><Mini label="Admins" value={data.users.admins}/></div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Learner momentum</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Top students by XP</h2></div><UserRoundCheck className="text-violet-500"/></div>
        {data.top_students.length === 0 ? <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No student learning data yet.</div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400"><th className="px-3 py-3">Student</th><th className="px-3 py-3">XP</th><th className="px-3 py-3">Streak</th><th className="px-3 py-3">Questions</th><th className="px-3 py-3">Accuracy</th></tr></thead><tbody>{data.top_students.map((student, index) => <tr key={student.id} className="border-b border-slate-50 last:border-0"><td className="px-3 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-sm font-black text-violet-700">{index+1}</span><div><p className="font-black text-[#071b3a]">{student.name}</p><p className="text-xs text-slate-400">{student.grade || "Grade not set"}</p></div></div></td><td className="px-3 py-4 font-black text-violet-700">{student.xp.toLocaleString()}</td><td className="px-3 py-4 font-semibold text-slate-600">🔥 {student.streak}</td><td className="px-3 py-4 font-semibold text-slate-600">{student.questions}</td><td className="px-3 py-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{student.accuracy}%</span></td></tr>)}</tbody></table></div>}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3"><Link href="/admin/classes" className="group rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-1"><BookOpenCheck size={25}/><h3 className="mt-4 text-xl font-black">Manage classes</h3><p className="mt-2 text-sm text-violet-100">Create learning classes and manage the class directory.</p><span className="mt-4 inline-flex text-sm font-black">Open class management →</span></Link><Link href="/admin/users" className="group rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 p-6 text-white shadow-lg shadow-cyan-200 transition hover:-translate-y-1"><Users size={25}/><h3 className="mt-4 text-xl font-black">Manage users</h3><p className="mt-2 text-sm text-cyan-50">Review users and assign approved public roles.</p><span className="mt-4 inline-flex text-sm font-black">Open user management →</span></Link><Link href="/teacher" className="group rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-[#3b2500] shadow-lg shadow-orange-100 transition hover:-translate-y-1"><BarChart3 size={25}/><h3 className="mt-4 text-xl font-black">Teacher analytics</h3><p className="mt-2 text-sm text-orange-950/70">Open educator reporting and class-level learner analytics.</p><span className="mt-4 inline-flex text-sm font-black">Open teacher view →</span></Link></section>

      <p className="mt-6 text-center text-xs text-slate-400">Administrator analytics are aggregate-only and do not expose student answer text or authentication credentials.</p>
    </div>
  </main>;
}

function Metric({icon,value,label,note}:{icon:React.ReactNode;value:number;label:string;note:string}){return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value.toLocaleString()}</p><p className="text-sm font-bold text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>}
function Stat({icon,value,label}:{icon:React.ReactNode;value:string;label:string}){return <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-2xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>}
function Mini({label,value}:{label:string;value:string|number}){return <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-[#071b3a]">{value}</p></div>}
function Health({label,value,total}:{label:string;value:number;total:number}){const pct=Math.min(100,Math.round((value/total)*100));return <div><div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-600">{label}</span><span className="font-black text-[#071b3a]">{value.toLocaleString()}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{width:`${pct}%`}}/></div></div>}
