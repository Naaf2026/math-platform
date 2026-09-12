"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Clock3, PlayCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Action = {
  action_id: string; source_type: string; source_key: string; title: string; description: string;
  priority: number; status: "open" | "in_progress" | "completed" | "dismissed";
  due_at: string | null; completed_at: string | null; completed_note: string | null; created_at: string;
};

type Recommendation = { recommendation_id: string; title: string; description: string; reason: string; priority: number };

export default function ParentActionCenter({ studentId }: { studentId: string }) {
  const [actions, setActions] = useState<Action[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const [a, r] = await Promise.all([
        supabase.rpc("get_parent_action_center", { p_student_id: studentId }),
        supabase.rpc("get_parent_goal_recommendations", { p_student_id: studentId }),
      ]);
      if (!a.error) setActions((a.data ?? []) as Action[]);
      if (!r.error) setRecommendations((r.data ?? []) as Recommendation[]);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [studentId]);

  async function createRecommendation(item: Recommendation) {
    const supabase = createClient(); if (!supabase) return;
    setWorking(item.recommendation_id);
    try {
      await supabase.rpc("sync_parent_action_from_recommendation", {
        p_student_id: studentId, p_recommendation_id: item.recommendation_id,
        p_title: item.title, p_description: `${item.description} ${item.reason}`, p_priority: item.priority,
      });
      await load();
    } finally { setWorking(""); }
  }

  async function setStatus(id: string, status: Action["status"]) {
    const supabase = createClient(); if (!supabase) return;
    setWorking(id);
    try {
      await supabase.rpc("set_parent_learning_action_status", { p_action_id: id, p_status: status, p_note: note || null });
      setNote(""); await load();
    } finally { setWorking(""); }
  }

  const open = actions.filter((a) => a.status === "open" || a.status === "in_progress");
  const completed = actions.filter((a) => a.status === "completed");
  const existingRecommendationKeys = new Set(actions.filter(a => a.source_type === "recommendation").map(a => a.source_key));

  return <section className="mt-5 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Parent action center</p><h3 className="mt-1 text-2xl font-black text-[#071b3a]">Turn learning signals into action</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose a recommended follow-up, track what you are doing, and mark it complete when the learner has received support.</p></div><CircleAlert className="hidden text-violet-500 sm:block" /></div>

    {loading ? <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Loading actions…</div> : <>
      {recommendations.filter(r => !existingRecommendationKeys.has(r.recommendation_id)).length > 0 && <div className="mt-6"><p className="text-sm font-black text-slate-800">Recommended follow-up</p><div className="mt-3 grid gap-3 lg:grid-cols-2">{recommendations.filter(r => !existingRecommendationKeys.has(r.recommendation_id)).map(r => <div key={r.recommendation_id} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4"><div className="flex gap-3"><div className="flex-1"><p className="font-black text-slate-800">{r.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{r.description}</p><p className="mt-2 text-xs font-semibold text-violet-700">{r.reason}</p></div><button onClick={() => void createRecommendation(r)} disabled={working === r.recommendation_id} className="h-fit rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700 disabled:opacity-50">{working === r.recommendation_id ? "Adding…" : "Add action"}</button></div></div>)}</div></div>}

      {open.length > 0 && <div className="mt-6"><p className="text-sm font-black text-slate-800">Open follow-ups <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{open.length}</span></p><div className="mt-3 space-y-3">{open.map(a => <div key={a.action_id} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><Clock3 className="mt-0.5 shrink-0 text-amber-600" size={18} /><div><p className="font-black text-slate-800">{a.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{a.description}</p>{a.due_at && <p className="mt-2 text-xs font-bold text-amber-700">Due {new Date(a.due_at).toLocaleDateString()}</p>}</div></div><div className="flex gap-2"><button onClick={() => void setStatus(a.action_id, "in_progress")} disabled={working === a.action_id} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-violet-700 ring-1 ring-violet-100 hover:bg-violet-50"><PlayCircle size={14} className="mr-1 inline" />Start</button><button onClick={() => void setStatus(a.action_id, "completed")} disabled={working === a.action_id} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"><CheckCircle2 size={14} className="mr-1 inline" />Complete</button><button onClick={() => void setStatus(a.action_id, "dismissed")} disabled={working === a.action_id} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200"><XCircle size={14} className="mr-1 inline" />Dismiss</button></div></div></div>)}</div><div className="mt-3"><input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional completion note" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /></div></div>}

      {completed.length > 0 && <div className="mt-6"><p className="text-sm font-black text-slate-800">Completed support</p><div className="mt-3 space-y-2">{completed.slice(0, 5).map(a => <div key={a.action_id} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3"><CheckCircle2 className="text-emerald-600" size={18} /><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{a.title}</p><p className="text-xs text-slate-500">Completed {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ""}{a.completed_note ? ` · ${a.completed_note}` : ""}</p></div></div>)}</div></div>}

      {!open.length && !recommendations.filter(r => !existingRecommendationKeys.has(r.recommendation_id)).length && !completed.length && <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">No parent follow-up actions are pending right now. Keep encouraging the learner’s progress.</div>}
    </>}
  </section>;
}
