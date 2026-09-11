"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, ChevronDown, Flame, GraduationCap, ShieldCheck, Sparkles, Target, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = {
  id: number;
  name: string;
  class_code: string;
  grade: string | null;
  learning_level: string | null;
  description: string | null;
  status: string;
};

type StudentRow = {
  student_id: string;
  display_name: string;
  full_name: string | null;
  grade: string | null;
  learning_level: string | null;
  xp: number;
  current_streak: number;
  best_streak: number;
  total_questions: number;
  total_correct: number;
  accuracy: number;
  average_mastery: number;
  topics_explored: number;
  missions_completed: number;
  best_combo: number;
  coins: number;
  gems: number;
  membership_status: string;
};

export default function TeacherPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadClasses = async () => {
    const s = createClient();
    if (!s) {
      setStatus("Supabase is not configured yet.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await s.auth.getUser();
    if (!user) {
      location.href = "/login";
      return;
    }

    const { data, error } = await s
      .from("classes")
      .select("id,name,class_code,grade,learning_level,description,status")
      .eq("status", "active")
      .order("name");

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    const nextClasses = (data ?? []) as ClassRow[];
    setClasses(nextClasses);
    setSelectedClassId((current) => current ?? nextClasses[0]?.id ?? null);
    setLoading(false);
  };

  const loadRoster = async (classId: number) => {
    const s = createClient();
    if (!s) return;
    setRosterLoading(true);
    setStatus("");

    const { data, error } = await s.rpc("get_class_roster_report", { p_class_id: classId });
    if (error) {
      setStudents([]);
      setSelectedStudentId(null);
      setStatus(error.message);
      setRosterLoading(false);
      return;
    }

    const nextStudents = (data ?? []) as StudentRow[];
    setStudents(nextStudents);
    setSelectedStudentId((current) =>
      current && nextStudents.some((student) => student.student_id === current)
        ? current
        : nextStudents[0]?.student_id ?? null
    );
    setRosterLoading(false);
  };

  useEffect(() => {
    void loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId !== null) void loadRoster(selectedClassId);
  }, [selectedClassId]);

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null;
  const selectedStudent = students.find((item) => item.student_id === selectedStudentId) ?? null;

  const analytics = useMemo(() => {
    if (!students.length) {
      return { mastery: 0, accuracy: 0, questions: 0, active: 0, needsReview: 0, reinforce: 0, extend: 0 };
    }
    const mastery = Math.round(students.reduce((sum, s) => sum + s.average_mastery, 0) / students.length);
    const accuracy = Math.round(students.reduce((sum, s) => sum + s.accuracy, 0) / students.length);
    const questions = students.reduce((sum, s) => sum + s.total_questions, 0);
    const active = students.filter((s) => s.total_questions > 0).length;
    return {
      mastery,
      accuracy,
      questions,
      active,
      needsReview: students.filter((s) => s.average_mastery < 60 || s.accuracy < 60).length,
      reinforce: students.filter((s) => s.average_mastery >= 60 && s.average_mastery < 80 && s.accuracy >= 60).length,
      extend: students.filter((s) => s.average_mastery >= 80 && s.accuracy >= 80).length,
    };
  }, [students]);

  if (loading) {
    return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Teacher Dashboard</h1><p className="mt-3 text-sm text-slate-500">Loading your classes…</p></div></main>;
  }

  if (status && !classes.length) {
    return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Teacher Dashboard</h1><p className="mt-3 text-sm leading-6 text-slate-500">{status || "No active classes are assigned to this teacher yet."}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to dashboard</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-28 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Dashboard</Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Teacher Dashboard 4.0</span>
        </header>

        <section className="mt-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><GraduationCap size={14}/> Educator view</div>
              <h1 className="mt-4 text-4xl font-black">My Classes</h1>
              <p className="mt-2 max-w-2xl text-indigo-100">Monitor class progress, identify learners who need support, and celebrate strong mastery.</p>
            </div>
            <div className="min-w-[260px]">
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-indigo-100">Select class</label>
              <div className="relative">
                <select value={selectedClassId ?? ""} onChange={(e) => setSelectedClassId(Number(e.target.value))} className="w-full appearance-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 pr-10 font-bold text-white outline-none backdrop-blur placeholder:text-white/60">
                  {classes.map((item) => <option key={item.id} value={item.id} className="text-slate-900">{item.name} · {item.class_code}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={18}/>
              </div>
            </div>
          </div>
        </section>

        {status && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{status}</div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Users/>} value={`${students.length}`} label="Students"/>
          <Metric icon={<BarChart3/>} value={`${analytics.mastery}%`} label="Class mastery"/>
          <Metric icon={<CheckCircle2/>} value={`${analytics.accuracy}%`} label="Class accuracy"/>
          <Metric icon={<Target/>} value={`${analytics.questions}`} label="Questions answered"/>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Class roster</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">{selectedClass?.name ?? "Selected class"}</h2><p className="mt-1 text-sm text-slate-500">{selectedClass?.grade || "Grade not set"} · {selectedClass?.learning_level || "Level not set"}</p></div>
              <div className="rounded-2xl bg-violet-50 px-4 py-3 text-right"><p className="text-xs font-bold text-violet-600">Engaged learners</p><p className="text-xl font-black text-[#071b3a]">{analytics.active}/{students.length}</p></div>
            </div>
            {rosterLoading ? <div className="py-12 text-center text-sm font-semibold text-slate-500">Loading class analytics…</div> : students.length === 0 ? <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">No students are currently enrolled in this class.</div> : <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><th className="pb-3">Student</th><th className="pb-3">Mastery</th><th className="pb-3">Accuracy</th><th className="pb-3">Questions</th><th className="pb-3">XP</th><th className="pb-3">Status</th></tr></thead><tbody>{students.map((student) => { const flag = student.average_mastery < 60 || student.accuracy < 60 ? "Needs Review" : student.average_mastery < 80 ? "Reinforce" : "Extend"; return <tr key={student.student_id} onClick={() => setSelectedStudentId(student.student_id)} className={`cursor-pointer border-b border-slate-50 transition hover:bg-violet-50/60 ${selectedStudentId === student.student_id ? "bg-violet-50" : ""}`}><td className="py-4"><p className="font-black text-[#071b3a]">{student.display_name}</p><p className="text-xs text-slate-400">{student.grade || "Grade not set"}</p></td><td className="py-4 font-black">{student.average_mastery}%</td><td className="py-4 font-black">{student.accuracy}%</td><td className="py-4 font-semibold text-slate-600">{student.total_questions}</td><td className="py-4 font-semibold text-slate-600">{student.xp}</td><td className="py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${flag === "Needs Review" ? "bg-rose-100 text-rose-700" : flag === "Reinforce" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{flag}</span></td></tr>; })}</tbody></table></div>}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 p-6 ring-1 ring-slate-100 sm:p-8"><div className="flex items-center gap-3"><Sparkles className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Intervention board</p><h2 className="text-xl font-black text-[#071b3a]">Where to focus</h2></div></div><div className="mt-6 grid gap-3"><Flag label="Needs Review" count={analytics.needsReview} text="Low mastery or accuracy. Prioritise guided support."/><Flag label="Reinforce" count={analytics.reinforce} text="Developing learners. Use targeted practice."/><Flag label="Extend" count={analytics.extend} text="Strong learners. Add reasoning and challenge."/></div></div>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"><div className="flex items-center gap-3"><Trophy className="text-orange-500"/><div><p className="text-xs font-black uppercase tracking-wider text-orange-500">Selected learner</p><h2 className="text-xl font-black text-[#071b3a]">{selectedStudent?.display_name || "Choose a student"}</h2></div></div>{selectedStudent ? <><div className="mt-5 grid grid-cols-2 gap-3"><Mini label="Mastery" value={`${selectedStudent.average_mastery}%`}/><Mini label="Accuracy" value={`${selectedStudent.accuracy}%`}/><Mini label="Streak" value={`${selectedStudent.current_streak} days`}/><Mini label="Missions" value={`${selectedStudent.missions_completed}`}/></div><div className="mt-5 flex flex-wrap gap-2"><Link href="/progress" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Progress</Link><Link href="/mission" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">Mission</Link></div></> : <p className="mt-4 text-sm text-slate-500">Select a learner from the roster to inspect their performance snapshot.</p>}</div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Secure analytics</p><h2 className="text-xl font-black text-[#071b3a]">Teacher-only class reporting</h2></div></div><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">This dashboard reads class membership through the existing row-level security rules and uses the secure roster report RPC. It exposes performance summaries—not student answer text—to the teacher view.</p></section>
      </div>
    </main>
  );
}

function Metric({icon,value,label}:{icon:React.ReactNode;value:string;label:string}){return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-[#071b3a]">{value}</p></div>}
function Flag({label,count,text}:{label:string;count:number;text:string}){return <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white"><div className="flex items-center justify-between gap-3"><p className="font-black text-[#071b3a]">{label}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{count}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>}
