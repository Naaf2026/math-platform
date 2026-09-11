"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, CheckCheck, Clock3, Flame, Info, Target, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Alert = {
  alert_id: string;
  alert_type: string;
  title: string;
  message: string;
  priority: number;
  related_goal_id: string | null;
  created_at: string;
  read_at: string | null;
};

type Filter = "all" | "unread" | "practice" | "accuracy" | "goals" | "streaks";

const filterTypes: Record<Exclude<Filter, "all" | "unread">, string[]> = {
  practice: ["practice_consistency", "no_recent_practice", "consistency", "consistency_attention", "engagement", "positive_momentum", "weekly_summary"],
  accuracy: ["accuracy_attention", "accuracy_positive", "accuracy_decline", "improvement", "topic_support"],
  goals: ["goal_deadline", "goal_achieved", "goal_behind", "goal_overdue"],
  streaks: ["streak_milestone"],
};

function iconFor(type: string) {
  if (type === "streak_milestone") return Flame;
  if (type === "goal_deadline" || type === "goal_achieved" || type === "goal_behind" || type === "goal_overdue") return Target;
  if (type === "accuracy_attention" || type === "accuracy_decline" || type === "topic_support") return TrendingDown;
  if (type === "accuracy_positive" || type === "improvement" || type === "consistency" || type === "engagement" || type === "positive_momentum") return TrendingUp;
  if (type === "practice_consistency" || type === "no_recent_practice" || type === "consistency_attention") return Clock3;
  return Info;
}

function priorityClass(priority: number) {
  if (priority === 1) return "border-amber-200 bg-amber-50 text-amber-950";
  if (priority === 3) return "border-emerald-200 bg-emerald-50 text-emerald-950";
  return "border-violet-100 bg-violet-50 text-violet-950";
}

export default function ParentNotificationsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");

  const load = useCallback(async () => {
    const s = createClient();
    if (!s) return;
    setLoading(true);
    setError("");
    setRefreshWarning("");

    const { data: { user } } = await s.auth.getUser();
    if (!user) { location.href = "/login"; return; }

    const { data: links, error: linkError } = await s
      .from("student_relationships")
      .select("student_id")
      .eq("related_user_id", user.id)
      .in("relationship", ["parent", "guardian"])
      .eq("status", "active")
      .limit(1);

    if (linkError) { setError(linkError.message); setLoading(false); return; }
    const studentId = links?.[0]?.student_id;
    if (!studentId) { setError("No linked student found."); setLoading(false); return; }

    // Alert generation is best-effort. Existing notifications should remain
    // visible even if a fresh smart-alert calculation temporarily fails.
    const { error: generationError } = await s.rpc("generate_parent_smart_alerts", { p_student_id: studentId });
    if (generationError) setRefreshWarning("New smart alerts could not be refreshed right now. Your existing alerts are still available.");

    const { data, error: alertError } = await s.rpc("get_parent_learning_alerts", {
      p_student_id: studentId,
      p_limit: 50,
    });

    if (alertError) setError(alertError.message);
    else setAlerts((data ?? []) as Alert[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead(alertId: string) {
    const s = createClient();
    if (!s) return;
    const { error: markError } = await s.rpc("mark_parent_learning_alert_read", { p_alert_id: alertId });
    if (markError) { setError(markError.message); return; }
    setAlerts(current => current.map(a => a.alert_id === alertId ? { ...a, read_at: new Date().toISOString() } : a));
  }

  async function markAllRead() {
    const unread = alerts.filter(a => !a.read_at);
    if (!unread.length) return;
    setBusy(true);
    for (const alert of unread) await markRead(alert.alert_id);
    setBusy(false);
  }

  const unreadCount = alerts.filter(a => !a.read_at).length;
  const filtered = useMemo(() => alerts.filter(alert => {
    if (filter === "unread") return !alert.read_at;
    if (filter === "all") return true;
    return filterTypes[filter].includes(alert.alert_type);
  }), [alerts, filter]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-24 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/parent" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700"><ArrowLeft size={18}/> Parent dashboard</Link>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-violet-700 shadow-sm">Notification center</span>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Bell size={14}/> Parent notifications</div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Smart learning alerts</h1>
              <p className="mt-3 max-w-2xl text-indigo-100">Learning patterns, weekly progress, goal pacing, and practical signals designed to help you support progress at home.</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 text-center backdrop-blur">
              <p className="text-xs text-indigo-100">Unread</p>
              <p className="text-4xl font-black">{unreadCount}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["all", "unread", "practice", "accuracy", "goals", "streaks"].map(value => (
                <button key={value} type="button" onClick={() => setFilter(value as Filter)} className={`rounded-full px-4 py-2 text-xs font-black capitalize transition ${filter === value ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`}>
                  {value === "all" ? "All" : value === "unread" ? `Unread (${unreadCount})` : value}
                </button>
              ))}
            </div>
            <button type="button" disabled={busy || unreadCount === 0} onClick={() => void markAllRead()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck size={15}/> Mark all as read</button>
          </div>
        </section>

        {error && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Some smart notifications are temporarily unavailable. Please refresh and try again.</div>}
        {refreshWarning && !error && <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-700">{refreshWarning}</div>}

        <section className="mt-5 space-y-3">
          {loading ? <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading notifications…</div> : filtered.length === 0 ? <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100"><Bell className="mx-auto text-slate-300" size={42}/><h2 className="mt-4 text-xl font-black text-slate-800">Nothing here yet</h2><p className="mt-2 text-sm text-slate-500">There are no alerts matching this view.</p></div> : filtered.map(alert => {
            const Icon = iconFor(alert.alert_type);
            return <article key={alert.alert_id} className={`rounded-3xl border p-5 shadow-sm transition ${priorityClass(alert.priority)} ${alert.read_at ? "opacity-75" : ""}`}>
              <div className="flex gap-4">
                <span className="shrink-0 rounded-2xl bg-white/80 p-3"><Icon size={20}/></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h2 className="text-lg font-black">{alert.title}</h2>{!alert.read_at && <span className="mt-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">New</span>}</div>
                    {!alert.read_at && <button type="button" onClick={() => void markRead(alert.alert_id)} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm hover:bg-slate-50"><Check size={14}/> Mark as read</button>}
                  </div>
                  <p className="mt-3 text-sm leading-6">{alert.message}</p>
                  <p className="mt-3 text-[11px] font-semibold opacity-60">{new Date(alert.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </div>
            </article>;
          })}
        </section>
      </div>
    </main>
  );
}
