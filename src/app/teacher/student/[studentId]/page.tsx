"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, Flame, GraduationCap, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Topic = {
  topic_id: string;
  questions: number;
  correct: number;
  accuracy: number;
  mastery: number;
  completed: boolean;
};

type Activity = {
  date: string;
  questions: number;
  correct: number;
};

type Detail = {
  profile: {
    id: string;
    name: string;
    full_name: string | null;
    grade: string | null;
    learning_level: string | null;
    xp: number;
    current_streak: number;
    best_streak: number;
  };
  classes: Array<{
    id: number;
    name: string;
    class_code: string;
    grade: string | null;
    learning_level: string | null;
  }>;
  overall: {
    questions: number;
    correct: number;
    accuracy: number;
    active_days_30d: number;
    last_activity: string | null;
  };
  lessons: { completed: number; total: number };
  topics: Topic[];
  recent_activity: Activity[];
  rewards: {
    missions_completed: number;
    best_combo: number;
    coins: number;
    gems: number;
  } | null;
};

export default function TeacherStudentPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const s = createClient();
      if (!s) {
        setError("Supabase is not configured yet.");
        setLoading(false);
        return;
      }

      const { data: { user } } = await s.auth.getUser();
      if (!user) {
        location.href = "/login";
        return;
      }

      const { data, error: rpcError } = await s.rpc("get_teacher_student_detail", {
        p_student_id: studentId,
      });

      if (rpcError) setError(rpcError.message);
      else setDetail(data as Detail);
      setLoading(false);
    }

    if (studentId) void load();
  }, [studentId]);

  const topicStats = useMemo(() => {
    const topics = detail?.topics ?? [];
    if (!topics.length) return { strongest: null, weakest: null, completed: 0 };
    return {
      strongest: [...topics].sort((a, b) => b.mastery - a.mastery)[0],
      weakest: [...topics].sort((a, b) => a.mastery - b.mastery)[0],
      completed: topics.filter((topic) => topic.completed).length,
    };
  }, [detail]);

  if (loading) return <Shell><div className="rounded-3xl bg-white p-10 text-center shadow-sm"><ShieldCheck className="mx-auto text-violet-600" size={42}/><p className="mt-4 font-bold text-slate-500">Loading learner analytics…</p></div></Shell>;
  if (error || !detail) return <Shell><div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700"><p className="font-black">Unable to load learner analytics</p><p className="mt-2 text-sm">{error || "Student not found."}</p><Link href="/teacher" className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 font-black text-white">Back to Teacher Dashboard</Link></div></Shell>;

  const p = detail.profile;
  const status = p.current_streak >= 7 && detail.overall.accuracy >= 70 ? "Extend" : p.current_streak >= 2 || detail.overall.questions >= 10 ? "Reinforce" : "Needs Review";

  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Teacher Dashboard</Link>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Teacher Dashboard 4.1</span>
      </header>

      <section className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><GraduationCap size={14}/> Learner analytics</div>
            <h1 className="mt-4 text-4xl font-black">{p.name}</h1>
            <p className="mt-2 text-indigo-100">{p.grade || "Grade not set"} · {p.learning_level || "Level not set"}</p>
          </div>
          <div className="rounded-3xl bg-white/10 px-6 py-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-100">Recommendation</p>
            <p className="mt-1 text-2xl font-black">{status}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<BarChart3/>} value={`${detail.overall.accuracy}%`} label="Accuracy"/>
        <Metric icon={<Target/>} value={`${detail.overall.questions}`} label="Questions answered"/>
        <Metric icon={<Sparkles/>} value={`${p.xp}`} label="XP"/>
        <Metric icon={<Flame/>} value={`${p.current_streak} days`} label="Current streak"/>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><BarChart3 className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">7-day trend</p><h2 className="text-xl font-black text-[#071b3a]">Learning activity</h2></div></div>
          <div className="mt-6 grid grid-cols-7 gap-2 items-end min-h-[190px]">
            {detail.recent_activity.map((day) => {
              const height = Math.max(12, Math.min(150, day.questions * 14));
              const accuracy = day.questions ? Math.round(day.correct / day.questions * 100) : 0;
              return <div key={day.date} className="flex h-[180px] flex-col items-center justify-end gap-2"><span className="text-[10px] font-black text-slate-400">{day.questions}</span><div title={`${accuracy}% accuracy`} className="w-full max-w-10 rounded-t-xl bg-violet-500" style={{height}}/><span className="text-[10px] font-bold text-slate-400">{new Date(day.date).toLocaleDateString(undefined,{weekday:"short"}).slice(0,2)}</span></div>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500"><span>{detail.overall.active_days_30d} active days in 30 days</span><span>•</span><span>{detail.overall.correct} correct answers overall</span></div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 p-6 ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><Sparkles className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Intervention</p><h2 className="text-xl font-black text-[#071b3a]">Teacher focus</h2></div></div>
          <div className="mt-6 grid gap-3"><Mini label="Weakest topic" value={topicStats.weakest ? `${topicStats.weakest.topic_id} · ${topicStats.weakest.mastery}%` : "No topic data"}/><Mini label="Strongest topic" value={topicStats.strongest ? `${topicStats.strongest.topic_id} · ${topicStats.strongest.mastery}%` : "No topic data"}/><Mini label="Lessons" value={`${detail.lessons.completed}/${detail.lessons.total} completed`}/><Mini label="Topics completed" value={`${topicStats.completed}/${detail.topics.length}`}/></div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-600"/><div><p className="text-xs font-black uppercase tracking-wider text-emerald-600">Topic performance</p><h2 className="text-xl font-black text-[#071b3a]">Mastery breakdown</h2></div></div>
          {detail.topics.length ? <div className="mt-6 space-y-4">{detail.topics.map((topic) => <div key={topic.topic_id}><div className="flex justify-between gap-4 text-sm"><span className="font-black text-[#071b3a]">{topic.topic_id}</span><span className="font-bold text-slate-500">{topic.mastery}% mastery · {topic.accuracy}% accuracy</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{width:`${Math.max(0,Math.min(100,topic.mastery))}%`}}/></div><p className="mt-1 text-xs text-slate-400">{topic.questions} questions · {topic.correct} correct {topic.completed ? "· Completed" : ""}</p></div>)}</div> : <p className="mt-5 text-sm text-slate-500">No topic progress recorded yet.</p>}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><Trophy className="text-orange-500"/><div><p className="text-xs font-black uppercase tracking-wider text-orange-500">Learner snapshot</p><h2 className="text-xl font-black text-[#071b3a]">Progress & rewards</h2></div></div>
          <div className="mt-6 grid grid-cols-2 gap-3"><Mini label="Best streak" value={`${p.best_streak} days`}/><Mini label="Missions" value={`${detail.rewards?.missions_completed ?? 0}`}/><Mini label="Best combo" value={`${detail.rewards?.best_combo ?? 0}`}/><Mini label="Coins / Gems" value={`${detail.rewards?.coins ?? 0} / ${detail.rewards?.gems ?? 0}`}/></div>
          <div className="mt-5 flex flex-wrap gap-2">{detail.classes.map((c) => <span key={c.id} className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">{c.name} · {c.class_code}</span>)}</div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Secure reporting</p><h2 className="text-xl font-black text-[#071b3a]">Teacher-only learner analytics</h2></div></div><p className="mt-3 text-sm leading-6 text-slate-600">This view is protected by the teacher/admin role and class membership. It reports performance summaries without exposing the learner's submitted answer text.</p></section>
    </Shell>
  );
}

function Shell({children}:{children:React.ReactNode}){return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-28 sm:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>}
function Metric({icon,value,label}:{icon:React.ReactNode;value:string;label:string}){return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-[#071b3a]">{value}</p></div>}
