"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Clock3, Flame, Info, Target, TrendingDown, X } from "lucide-react";
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

const iconFor = (type: string) => {
  if (type === "streak_milestone") return Flame;
  if (type === "goal_deadline") return Target;
  if (type === "accuracy_attention") return TrendingDown;
  if (type === "practice_consistency" || type === "no_recent_practice") return Clock3;
  return Info;
};

const priorityClass = (priority: number) => {
  if (priority === 1) return "border-amber-200 bg-amber-50 text-amber-900";
  if (priority === 3) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-violet-100 bg-violet-50 text-violet-900";
};

export default function ParentLearningAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const s = createClient();
    if (!s) return;

    const { data: { user } } = await s.auth.getUser();
    if (!user) return;

    const { data: links } = await s
      .from("student_relationships")
      .select("student_id")
      .eq("related_user_id", user.id)
      .in("relationship", ["parent", "guardian"])
      .eq("status", "active")
      .limit(1);

    const studentId = links?.[0]?.student_id;
    if (!studentId) {
      setLoading(false);
      return;
    }

    const { error: generationError } = await s.rpc("generate_parent_learning_alerts", {
      p_student_id: studentId,
    });

    if (generationError) {
      setError(generationError.message);
    }

    const { data, error: alertsError } = await s.rpc("get_parent_learning_alerts", {
      p_student_id: studentId,
      p_limit: 20,
    });

    if (alertsError) {
      setError(alertsError.message);
    } else {
      setAlerts((data ?? []) as Alert[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(alertId: string) {
    const s = createClient();
    if (!s) return;

    const { error: markError } = await s.rpc("mark_parent_learning_alert_read", {
      p_alert_id: alertId,
    });

    if (markError) {
      setError(markError.message);
      return;
    }

    setAlerts((current) =>
      current.map((alert) =>
        alert.alert_id === alertId
          ? { ...alert, read_at: new Date().toISOString() }
          : alert,
      ),
    );
  }

  const unread = alerts.filter((alert) => !alert.read_at).length;

  if (loading || (!alerts.length && !error)) return null;

  return (
    <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-6" aria-label="Learning alerts">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Bell size={21} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-black uppercase tracking-wider text-violet-600">Parent notifications</span>
            <span className="block truncate text-xl font-black text-[#071b3a]">Learning alerts</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-50"
          aria-expanded={open}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Alerts are temporarily unavailable. Please try refreshing the page.
        </div>
      )}

      {open && alerts.length > 0 && (
        <div className="mt-5 space-y-3">
          {alerts.map((alert) => {
            const Icon = iconFor(alert.alert_type);
            const unreadClass = alert.read_at ? "opacity-75" : "";
            return (
              <article
                key={alert.alert_id}
                className={`rounded-2xl border p-4 transition ${priorityClass(alert.priority)} ${unreadClass}`}
              >
                <div className="flex gap-3">
                  <span className="mt-0.5 shrink-0 rounded-xl bg-white/80 p-2">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black">{alert.title}</h3>
                        {!alert.read_at && (
                          <span className="mt-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      {!alert.read_at && (
                        <button
                          type="button"
                          onClick={() => void markRead(alert.alert_id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm hover:bg-slate-50"
                        >
                          <Check size={14} /> Mark as read
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6">{alert.message}</p>
                    <p className="mt-2 text-[11px] font-semibold opacity-70">
                      {new Date(alert.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && !alerts.length && !error && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
          No learning alerts right now. Keep encouraging steady practice!
        </div>
      )}
    </section>
  );
}
