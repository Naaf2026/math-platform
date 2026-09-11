"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileClock, Filter, History, MessageSquareText, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ClassRow = { id: number; name: string; class_code: string };
type StudentRow = { id: string; name: string };
type EventRow = { id: number; event_type: "created" | "completed" | "reopened" | "follow_up_updated"; event_note: string; actor_id: string; created_at: string; metadata: Record<string, string | null> };
type ActionRow = { id: number; class_id: number; class_name: string; student_id: string; student_name: string; action: "review" | "reinforce" | "extend"; topic_id: string | null; note: string; status: "open" | "completed"; created_at: string; completed_at: string | null; follow_up_status: "not_required" | "pending" | "in_progress" | "completed"; follow_up_due_at: string | null; follow_up_completed_at: string | null; follow_up_note: string; events: EventRow[]; follow_up_activity_7d: number };

const actionLabel: Record<ActionRow["action"], string> = { review: "Needs Review", reinforce: "Reinforce", extend: "Extend" };
const followUpLabel: Record<ActionRow["follow_up_status"], string> = { not_required: "No follow-up", pending: "Follow-up pending", in_progress: "Follow-up in progress", completed: "Follow-up completed" };

export default function TeacherActionHistoryPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [items, setItems] = useState<ActionRow[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "completed">("all");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [followStatus, setFollowStatus] = useState<ActionRow["follow_up_status"]>("pending");
  const [followDue, setFollowDue] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  async function loadHistory(showSpinner = false) {
    const supabase = createClient();
    if (!supabase) { setError("Supabase is not configured yet."); setLoading(false); return; }
    if (showSpinner) setRefreshing(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("get_teacher_action_history", {
      p_class_id: classId ? Number(classId) : null,
      p_student_id: studentId || null,
      p_status: status === "all" ? null : status,
      p_topic: topic.trim() || null,
      p_limit: 200,
    });
    if (rpcError) setError(rpcError.message);
    else {
      const rows = Array.isArray(data) ? (data as ActionRow[]) : [];
      setItems(rows);
      setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null);
    }
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => {
    async function loadBase() {
      const supabase = createClient();
      if (!supabase) { setError("Supabase is not configured yet."); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { location.href = "/login"; return; }
      const { data, error: classError } = await supabase.from("classes").select("id,name,class_code").eq("status", "active").order("name");
      if (classError) setError(classError.message);
      else { const rows = (data ?? []) as ClassRow[]; setClasses(rows); setClassId(rows[0] ? String(rows[0].id) : ""); }
      setLoading(false);
    }
    void loadBase();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (!classId) { setStudents([]); return; }
      const supabase = createClient(); if (!supabase) return;
      const { data, error: rosterError } = await supabase.rpc("get_class_roster_report", { p_class_id: Number(classId) });
      if (rosterError) { setError(rosterError.message); setStudents([]); return; }
      const rows = ((data ?? []) as { student_id: string; display_name: string | null }[]).map((row) => ({ id: row.student_id, name: row.display_name || "Student" }));
      setStudents(rows);
      setStudentId((current) => rows.some((row) => row.id === current) ? current : "");
    }
    void loadStudents();
  }, [classId]);

  useEffect(() => { void loadHistory(); }, [classId, studentId, status]);

  function openFollowUp(item: ActionRow) {
    setSelectedId(item.id);
    setFollowStatus(item.follow_up_status === "not_required" ? "pending" : item.follow_up_status);
    setFollowDue(item.follow_up_due_at ? item.follow_up_due_at.slice(0, 10) : "");
    setFollowNote(item.follow_up_note || "");
  }

  async function saveFollowUp() {
    if (!selected) return;
    const supabase = createClient(); if (!supabase) return;
    setSavingFollowUp(true); setError("");
    const { error: rpcError } = await supabase.rpc("update_teacher_follow_up", {
      p_intervention_id: selected.id,
      p_status: followStatus,
      p_due_at: followDue ? new Date(`${followDue}T23:59:59`).toISOString() : null,
      p_note: followNote,
    });
    if (rpcError) setError(rpcError.message); else await loadHistory();
    setSavingFollowUp(false);
  }

  const openCount = items.filter((item) => item.status === "open").length;
  const completedCount = items.filter((item) => item.status === "completed").length;
  const followUpCount = items.filter((item) => item.follow_up_status === "pending" || item.follow_up_status === "in_progress").length;

  if (loading) return <Shell><div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">Loading teacher action history…</div></Shell>;

  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Teacher Dashboard</Link>
        <div className="flex flex-wrap gap-2"><Link href="/teacher/interventions" className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Intervention Center</Link><span className="rounded-full bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm">Teacher Dashboard 4.4</span></div>
      </header>

      <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><History size={14}/> Action history</div><h1 className="mt-4 text-4xl font-black">Review, follow up, improve</h1><p className="mt-2 max-w-3xl text-indigo-100">A complete audit trail of teacher support actions—what was identified, what was done, what was completed, and what needs follow-up.</p></div><button onClick={() => void loadHistory(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-black backdrop-blur hover:bg-white/15"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""}/> Refresh history</button></div>
      </section>

      {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

      <section className="mt-6 grid gap-4 sm:grid-cols-3"><Metric icon={<Clock3/>} label="Open actions" value={String(openCount)}/><Metric icon={<CheckCircle2/>} label="Completed actions" value={String(completedCount)}/><Metric icon={<RefreshCw/>} label="Awaiting follow-up" value={String(followUpCount)}/></section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"><div className="flex items-center gap-2 text-violet-600"><Filter size={18}/><p className="text-xs font-black uppercase tracking-wider">History filters</p></div><div className="mt-4 grid gap-3 md:grid-cols-4"><Select label="Class" value={classId} onChange={setClassId}><option value="">All classes</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.class_code}</option>)}</Select><Select label="Student" value={studentId} onChange={setStudentId}><option value="">All students</option>{students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Status" value={status} onChange={(value) => setStatus(value as typeof status)}><option value="all">All actions</option><option value="open">Open</option><option value="completed">Completed</option></Select><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Topic</span><input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadHistory(true); }} className="input" placeholder="Search topic"/></label></div></section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Support history</p><h2 className="text-2xl font-black text-[#071b3a]">Every intervention</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{items.length} records</span></div><div className="mt-5 space-y-3">{items.length ? items.map((item) => <button key={item.id} onClick={() => openFollowUp(item)} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedId === item.id ? "border-violet-300 bg-violet-50" : "border-slate-100 bg-slate-50"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-white p-2 text-violet-600 shadow-sm"><UserRound size={17}/></div><div><p className="font-black text-[#071b3a]">{item.student_name}</p><p className="mt-0.5 text-xs font-bold text-slate-500">{actionLabel[item.action]}{item.topic_id ? ` · ${item.topic_id}` : " · General support"}</p></div></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${item.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span><p className="mt-1 text-[11px] text-slate-400">{formatDate(item.created_at)}</p></div></div>{item.note && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.note}</p>}<div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold"><span className="rounded-full bg-white px-2.5 py-1 text-slate-500">{followUpLabel[item.follow_up_status]}</span>{item.follow_up_activity_7d > 0 && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">{item.follow_up_activity_7d} practice events after completion</span>}</div></button>) : <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-bold text-slate-500">No intervention history matches the selected filters.</div>}</div></div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100"><div className="flex items-center gap-3"><RefreshCw className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Follow-up workflow</p><h2 className="text-xl font-black text-[#071b3a]">{selected ? selected.student_name : "Select an action"}</h2></div></div>{selected ? <><div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Action</p><p className="mt-1 font-black text-[#071b3a]">{actionLabel[selected.action]}{selected.topic_id ? ` · ${selected.topic_id}` : ""}</p><p className="mt-2 text-sm leading-6 text-slate-600">{selected.note || "No teacher note was recorded."}</p></div><div className="mt-5 space-y-4"><Select label="Follow-up status" value={followStatus} onChange={(value) => setFollowStatus(value as ActionRow["follow_up_status"])}><option value="not_required">No follow-up</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></Select><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Follow-up due</span><input type="date" value={followDue} onChange={(e) => setFollowDue(e.target.value)} className="input"/></label><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Follow-up note</span><textarea value={followNote} onChange={(e) => setFollowNote(e.target.value)} className="input min-h-24 resize-y" placeholder="What should be checked next?"/></label><div className="flex flex-wrap gap-2"><button onClick={() => void saveFollowUp()} disabled={savingFollowUp} className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-50">{savingFollowUp ? "Saving…" : "Save follow-up"}</button><Link href={`/teacher/student/${selected.student_id}`} className="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700">Learner analytics</Link></div></div></> : <p className="mt-4 text-sm leading-6 text-slate-500">Select a history record to review the support action and schedule the next teacher follow-up.</p>}</div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex items-center gap-3"><FileClock className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Audit trail</p><h2 className="text-xl font-black text-[#071b3a]">Support lifecycle</h2></div></div>{selected ? <div className="mt-5 space-y-3">{selected.events.length ? selected.events.map((event) => <div key={event.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><div className="mt-0.5 rounded-lg bg-white p-2 text-violet-600"><MessageSquareText size={15}/></div><div className="min-w-0"><p className="text-sm font-black text-[#071b3a]">{eventLabel(event.event_type)}</p><p className="text-xs text-slate-500">{event.event_note || "Lifecycle event recorded."}</p><p className="mt-1 text-[11px] text-slate-400">{formatDateTime(event.created_at)}</p></div></div>) : <p className="text-sm text-slate-500">No audit events have been recorded yet.</p>}</div> : <p className="mt-4 text-sm text-slate-500">Select an action to view its immutable lifecycle events.</p>}</div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><ShieldCheck className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Teacher-only audit</p><h2 className="text-xl font-black text-[#071b3a]">Identify → Analyse → Intervene → Complete → Review → Follow up</h2></div></div><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">The history center keeps support decisions traceable while preserving class-scoped access. Teachers can jump directly back to the learner analytics view whenever a completed action needs another review.</p></section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-28 sm:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>; }
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="text-violet-600">{icon}</div><p className="mt-3 text-3xl font-black text-[#071b3a]">{value}</p><p className="text-sm text-slate-500">{label}</p></div>; }
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="input">{children}</select></label>; }
function formatDate(value: string) { return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
function formatDateTime(value: string) { return new Date(value).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function eventLabel(type: EventRow["event_type"]) { return type === "follow_up_updated" ? "Follow-up updated" : type === "created" ? "Intervention created" : type === "completed" ? "Intervention completed" : "Intervention reopened"; }
