"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = { id: number; name: string; class_code: string };
type StudentRow = { id: string; name: string };
type Intervention = {
  id: number;
  class_id: number;
  student_id: string;
  student_name: string;
  action: "review" | "reinforce" | "extend";
  topic_id: string | null;
  note: string;
  status: "open" | "completed";
  created_at: string;
  completed_at: string | null;
};

export default function TeacherInterventionsPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [items, setItems] = useState<Intervention[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [action, setAction] = useState<Intervention["action"]>("review");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedClass = useMemo(() => classes.find((c) => String(c.id) === classId), [classes, classId]);

  async function loadInterventions(s = classId) {
    const supabase = createClient();
    if (!supabase) return;
    const { data, error: rpcError } = await supabase.rpc("get_teacher_interventions", {
      p_class_id: s ? Number(s) : null,
      p_student_id: null,
      p_status: "open",
    });
    if (rpcError) setError(rpcError.message);
    else setItems((data ?? []) as Intervention[]);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase is not configured yet.");
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        location.href = "/login";
        return;
      }

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id,name,class_code")
        .eq("status", "active")
        .order("name");
      if (classError) setError(classError.message);
      else {
        const rows = (classData ?? []) as ClassRow[];
        setClasses(rows);
        if (rows.length) setClassId(String(rows[0].id));
      }
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (!classId) return;
      const supabase = createClient();
      if (!supabase) return;
      const { data, error: studentError } = await supabase
        .from("class_members")
        .select("student_id,profiles:student_id(id,display_name,full_name)")
        .eq("class_id", Number(classId))
        .eq("status", "active");
      if (studentError) {
        setError(studentError.message);
        return;
      }
      const rows = (data ?? []).map((row: any) => ({
        id: row.student_id,
        name: row.profiles?.display_name || row.profiles?.full_name || "Student",
      })) as StudentRow[];
      setStudents(rows);
      setStudentId(rows[0]?.id ?? "");
      void loadInterventions(classId);
    }
    void loadStudents();
  }, [classId]);

  async function createIntervention(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!classId || !studentId) {
      setError("Select a class and student first.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("create_teacher_intervention", {
      p_class_id: Number(classId),
      p_student_id: studentId,
      p_action: action,
      p_topic_id: topic || null,
      p_note: note,
    });
    if (rpcError) setError(rpcError.message);
    else {
      setMessage("Intervention added to the teacher action list.");
      setTopic("");
      setNote("");
      await loadInterventions(classId);
    }
    setSaving(false);
  }

  async function complete(id: number) {
    const supabase = createClient();
    if (!supabase) return;
    const { error: rpcError } = await supabase.rpc("complete_teacher_intervention", {
      p_intervention_id: id,
    });
    if (rpcError) setError(rpcError.message);
    else await loadInterventions(classId);
  }

  if (loading) return <Shell><div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">Loading intervention center…</div></Shell>;

  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Teacher Dashboard</Link>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Teacher Dashboard 4.2</span>
      </header>

      <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Intervention center</div>
            <h1 className="mt-4 text-4xl font-black">Teacher action plan</h1>
            <p className="mt-2 max-w-2xl text-indigo-100">Turn learner analytics into clear, trackable support actions: review, reinforce, or extend.</p>
          </div>
          <div className="rounded-3xl bg-white/10 px-6 py-5 backdrop-blur"><p className="text-xs font-black uppercase tracking-wider text-indigo-100">Open actions</p><p className="mt-1 text-3xl font-black">{items.length}</p></div>
        </div>
      </section>

      {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {message && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

      <section className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={createIntervention} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><Plus className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">New action</p><h2 className="text-xl font-black text-[#071b3a]">Create intervention</h2></div></div>
          <div className="mt-6 space-y-4">
            <Field label="Class"><select value={classId} onChange={(e) => setClassId(e.target.value)} className="input"><option value="">Select class</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.class_code}</option>)}</select></Field>
            <Field label="Student"><select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input"><option value="">Select student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Action"><select value={action} onChange={(e) => setAction(e.target.value as Intervention["action"])} className="input"><option value="review">Needs Review</option><option value="reinforce">Reinforce</option><option value="extend">Extend</option></select></Field>
            <Field label="Topic (optional)"><input value={topic} onChange={(e) => setTopic(e.target.value)} className="input" placeholder="e.g. Fractions"/></Field>
            <Field label="Teacher note"><textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-28 resize-y" placeholder="What should the learner practise or review?"/></Field>
            <button disabled={saving || !selectedClass || !studentId} className="w-full rounded-2xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Add intervention"}</button>
          </div>
        </form>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><ClipboardList className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Open actions</p><h2 className="text-xl font-black text-[#071b3a]">What to focus on</h2></div></div>
          <div className="mt-6 space-y-3">
            {items.length ? items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-[#071b3a]">{item.student_name}</p><p className="text-xs font-bold uppercase tracking-wider text-violet-600">{item.action}{item.topic_id ? ` · ${item.topic_id}` : ""}</p></div><button onClick={() => complete(item.id)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700"><CheckCircle2 size={15}/> Complete</button></div>
                {item.note && <p className="mt-3 text-sm leading-6 text-slate-600">{item.note}</p>}
                <p className="mt-2 text-xs text-slate-400">Created {new Date(item.created_at).toLocaleDateString()}</p>
              </article>
            )) : <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">No open interventions for this class.</div>}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Secure teacher actions</p><h2 className="text-xl font-black text-[#071b3a]">Class-scoped intervention records</h2></div></div><p className="mt-3 text-sm leading-6 text-slate-600">Teachers can create and complete interventions only for students actively enrolled in a class they teach. Administrators can manage interventions across the platform.</p></section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-28 sm:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>{children}</label>; }
