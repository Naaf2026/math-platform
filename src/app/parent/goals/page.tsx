"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Plus, Sparkles, Target, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Goal = {
  goal_id: string; title: string; description: string | null; goal_type: string;
  target_value: number; current_value: number; progress_percent: number; topic_title: string | null;
  start_date: string; due_date: string; status: string; days_remaining: number;
};

type Recommendation = {
  recommendation_id: string; goal_type: string; title: string; description: string;
  target_value: number; topic_title: string | null; reason: string; priority: number;
};

const labels: Record<string, string> = { questions: "Questions", accuracy: "Accuracy", xp: "XP", practice_days: "Practice days" };

export default function ParentGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", description: "", goal_type: "questions", target_value: "20", topic_title: "", due_date: "" });

  const load = useCallback(async () => {
    const s = createClient();
    if (!s) return;
    setLoading(true); setError("");
    const { data: { user } } = await s.auth.getUser();
    if (!user) { location.href = "/login"; return; }
    const { data: links, error: linkError } = await s.from("student_relationships").select("student_id").eq("related_user_id", user.id).in("relationship", ["parent", "guardian"]).eq("status", "active").limit(1);
    const id = links?.[0]?.student_id;
    if (linkError || !id) { setError(linkError?.message || "No linked student found."); setLoading(false); return; }
    setStudentId(id);
    const [goalResult, recommendationResult] = await Promise.all([
      s.rpc("get_parent_learning_goals", { p_student_id: id }),
      s.rpc("get_parent_goal_recommendations", { p_student_id: id }),
    ]);
    if (goalResult.error) setError(goalResult.error.message); else setGoals((goalResult.data ?? []) as Goal[]);
    if (!recommendationResult.error) setRecommendations((recommendationResult.data ?? []) as Recommendation[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createGoal(e: React.FormEvent) {
    e.preventDefault(); if (!studentId) return;
    const target = Number(form.target_value);
    if (!form.title.trim() || !Number.isFinite(target) || target <= 0 || !form.due_date) { setError("Enter a title, positive target and due date."); return; }
    const s = createClient(); if (!s) return;
    setSaving(true); setError(""); setMessage("");
    const { error: saveError } = await s.rpc("create_parent_learning_goal", {
      p_student_id: studentId, p_title: form.title.trim(), p_description: form.description.trim() || null,
      p_goal_type: form.goal_type, p_target_value: target, p_topic_title: form.topic_title.trim() || null,
      p_start_date: new Date().toISOString().slice(0, 10), p_due_date: form.due_date,
    });
    if (saveError) setError(saveError.message);
    else { setMessage("Goal created successfully."); setForm({ title: "", description: "", goal_type: "questions", target_value: "20", topic_title: "", due_date: "" }); await load(); }
    setSaving(false);
  }

  async function acceptRecommendation(rec: Recommendation) {
    if (!studentId) return;
    const s = createClient(); if (!s) return;
    setAccepting(rec.recommendation_id); setError(""); setMessage("");
    const start = new Date();
    const due = new Date(start); due.setDate(due.getDate() + 6);
    const { error: saveError } = await s.rpc("create_parent_learning_goal", {
      p_student_id: studentId, p_title: rec.title, p_description: rec.description,
      p_goal_type: rec.goal_type, p_target_value: rec.target_value, p_topic_title: rec.topic_title || null,
      p_start_date: start.toISOString().slice(0, 10), p_due_date: due.toISOString().slice(0, 10),
    });
    if (saveError) setError(saveError.message);
    else { setMessage(`Added “${rec.title}” as a learning goal.`); await load(); }
    setAccepting(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-24 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/parent" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700"><ArrowLeft size={18}/> Parent dashboard</Link>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-violet-700 shadow-sm">Goal management</span>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Target size={14}/> Family goals</div><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Goal management center</h1><p className="mt-3 max-w-2xl text-indigo-100">Create measurable learning goals, or use smart recommendations to turn learning signals into a focused next step.</p></div>
            <div className="rounded-3xl bg-white/10 p-5 text-center backdrop-blur"><p className="text-xs text-indigo-100">Active goals</p><p className="text-4xl font-black">{goals.filter(g => g.status === "active").length}</p></div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-7">
            <div className="flex items-center gap-3"><Plus className="text-violet-600"/><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Create</p><h2 className="text-xl font-black text-[#071b3a]">New learning goal</h2></div></div>
            <form onSubmit={createGoal} className="mt-5 space-y-4">
              <input value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} placeholder="Goal title" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400" />
              <textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} placeholder="What should the learner focus on?" rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400" />
              <div className="grid grid-cols-2 gap-3"><select value={form.goal_type} onChange={e => setForm(v => ({ ...v, goal_type: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"><option value="questions">Questions</option><option value="accuracy">Accuracy</option><option value="xp">XP</option><option value="practice_days">Practice days</option></select><input type="number" min="1" value={form.target_value} onChange={e => setForm(v => ({ ...v, target_value: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Target" /></div>
              <input value={form.topic_title} onChange={e => setForm(v => ({ ...v, topic_title: e.target.value }))} placeholder="Topic (optional)" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.due_date} onChange={e => setForm(v => ({ ...v, due_date: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              {error && <div className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{error}</div>}
              {message && <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}
              <button disabled={saving} className="w-full rounded-2xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-700 disabled:opacity-50">{saving ? "Creating…" : "Create goal"}</button>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-cyan-100 sm:p-7">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-cyan-600">Smart recommendations</p><h2 className="text-xl font-black text-[#071b3a]">Suggested next goals</h2></div><Sparkles className="text-cyan-500"/></div>
              <div className="mt-5 space-y-3">
                {recommendations.length === 0 ? <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No new recommendations right now. Keep learning and check back after more activity.</div> : recommendations.map(rec => <article key={rec.recommendation_id} className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-800">{rec.title}</h3>{rec.topic_title && <p className="mt-1 text-xs font-bold text-cyan-700">{rec.topic_title}</p>}</div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-cyan-700">Priority {rec.priority}</span></div><p className="mt-2 text-sm leading-5 text-slate-600">{rec.description}</p><p className="mt-2 text-xs font-semibold text-slate-500">Why: {rec.reason}</p><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-black text-slate-500">{labels[rec.goal_type] || rec.goal_type}: {Math.round(rec.target_value)}</span><button onClick={() => void acceptRecommendation(rec)} disabled={accepting === rec.recommendation_id} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-50">{accepting === rec.recommendation_id ? "Adding…" : "Add as goal"}</button></div></article>)}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-7">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Progress</p><h2 className="text-xl font-black text-[#071b3a]">All learning goals</h2></div><TrendingUp className="text-violet-500"/></div>
              <div className="mt-5 space-y-3">{loading ? <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">Loading goals…</div> : goals.length === 0 ? <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No goals yet. Create the first one on the left.</div> : goals.map(goal => <article key={goal.goal_id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-800">{goal.title}</h3>{goal.topic_title && <p className="mt-1 text-xs font-bold text-violet-600">{goal.topic_title}</p>}</div><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${goal.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>{goal.status}</span></div><div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{labels[goal.goal_type] || goal.goal_type}</span><span>{Math.round(goal.current_value)} / {Math.round(goal.target_value)}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, Number(goal.progress_percent || 0)))}%` }}/></div><div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{Math.round(goal.progress_percent)}% complete</span><span>{goal.days_remaining <= 0 ? "Due" : `${goal.days_remaining} days left`}</span></div>{goal.status === "completed" && <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> Goal achieved</div>}</article>)}</div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
