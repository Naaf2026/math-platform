"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";

export type AdaptiveFeedbackReason =
  | "Remediation: strengthen this skill"
  | "Practice: build consistency"
  | "Progression: increase difficulty"
  | "Challenge: extend mastery";

type Props = {
  reason?: string | null;
  topic?: string | null;
  mastery?: number | null;
};

const states: Record<AdaptiveFeedbackReason, { label: string; description: string; icon: typeof Brain }> = {
  "Remediation: strengthen this skill": {
    label: "Strengthen this skill",
    description: "This challenge reinforces a foundation before moving ahead.",
    icon: ShieldCheck,
  },
  "Practice: build consistency": {
    label: "Build consistency",
    description: "You are developing this skill. A little more practice will help.",
    icon: Target,
  },
  "Progression: increase difficulty": {
    label: "Ready to progress",
    description: "Your performance is strong enough for a more challenging step.",
    icon: TrendingUp,
  },
  "Challenge: extend mastery": {
    label: "Mastery challenge",
    description: "You are showing mastery. This challenge is designed to stretch you.",
    icon: Sparkles,
  },
};

function resolveReason(reason?: string | null, mastery?: number | null): AdaptiveFeedbackReason {
  if (reason && reason in states) return reason as AdaptiveFeedbackReason;
  const score = Number(mastery ?? 0);
  if (score < 50) return "Remediation: strengthen this skill";
  if (score < 70) return "Practice: build consistency";
  if (score < 90) return "Progression: increase difficulty";
  return "Challenge: extend mastery";
}

export default function AdaptiveMissionFeedback({ reason, topic, mastery }: Props) {
  const [visible, setVisible] = useState(true);
  const resolved = useMemo(() => resolveReason(reason, mastery), [reason, mastery]);
  const state = states[resolved];
  const Icon = state.icon;

  useEffect(() => setVisible(true), [resolved, topic]);

  if (!visible) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-blue-50 shadow-sm">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-200">
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[.14em] text-violet-700">Adaptive learning</p>
            {typeof mastery === "number" && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-100">
                {Math.round(Math.max(0, Math.min(100, mastery)))}% mastery
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-black text-slate-800">{state.label}{topic ? ` · ${topic}` : ""}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{state.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss adaptive learning message"
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-600"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
