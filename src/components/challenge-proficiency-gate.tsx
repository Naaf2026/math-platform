"use client";

import { useEffect, useState } from "react";
import { Check, LockKeyhole, Sparkles, X } from "lucide-react";

export type ChallengeStage = 0 | 1 | 2 | 3;

export const challengeStages = [
  { name: "Elementary", unlock: 0, icon: "🌱", subtitle: "Build strong foundations", description: "Foundational maths and confidence building." },
  { name: "Intermediate", unlock: 15, icon: "🚀", subtitle: "Level up your thinking", description: "A balanced challenge with more problem solving." },
  { name: "Advanced", unlock: 50, icon: "🦊", subtitle: "Stretch your skills", description: "More complex questions and strategies." },
  { name: "Master", unlock: 100, icon: "👑", subtitle: "Take on the toughest", description: "The highest level of Daily Challenge difficulty." },
];

export default function ChallengeProficiencyGate({ xp, onStart, onClose }: { xp: number; onStart: (stage: ChallengeStage) => void; onClose?: () => void }) {
  const recommended: ChallengeStage = xp >= 100 ? 3 : xp >= 50 ? 2 : xp >= 15 ? 1 : 0;
  const [selected, setSelected] = useState<ChallengeStage>(recommended);

  useEffect(() => setSelected(recommended), [recommended]);

  const unlocked = challengeStages.map((item, index) => index === 0 || xp >= item.unlock);

  // The gate is also used without an explicit onClose from the parent.
  // Keep Exit reliable in that case by returning directly to Dashboard.
  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#dff4f4]">
      <div className="flex min-h-full items-start justify-center px-2 py-2 sm:px-4 sm:py-3">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[1.5rem] border-[3px] border-[#f5c542] bg-white shadow-[0_12px_32px_rgba(24,64,68,.22)]">
          <div className="relative bg-[#10aeb5] px-4 pb-4 pt-3 text-white sm:px-7 sm:pb-5 sm:pt-4">
            <button type="button" onClick={handleClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30" title="Exit">
              <X size={20} strokeWidth={3} />
            </button>
            <div className="mx-auto max-w-3xl pr-8 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border-3 border-white/70 bg-[#f6c945] text-2xl shadow-md sm:h-12 sm:w-12">🎯</div>
              <div className="mt-1.5 text-[9px] font-black uppercase tracking-[.2em] text-white/80">Daily Challenge</div>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight sm:text-3xl">Choose your challenge level</h1>
              <p className="mx-auto mt-1 max-w-2xl text-xs font-medium leading-5 text-white/90 sm:text-sm">
                Choose a level that matches your proficiency. Your recommended level is based on your current progress.
              </p>
            </div>
          </div>

          <div className="bg-[#fffdf5] px-3 py-3 sm:px-6 sm:py-4">
            <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-xl border-2 border-[#f3df9b] bg-[#fff7d8] px-3 py-2 text-xs font-bold text-slate-700 sm:text-sm">
              <Sparkles className="text-orange-500" size={16} />
              <span>Current progress: <strong>{xp} XP</strong></span>
              <span className="hidden text-slate-400 sm:inline">•</span>
              <span className="hidden sm:inline">Recommended: <strong>{challengeStages[recommended].name}</strong></span>
            </div>

            <div className="mx-auto mt-4 max-w-4xl">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {challengeStages.map((item, index) => {
                  const available = unlocked[index];
                  const active = selected === index;
                  const isRecommended = recommended === index;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelected(index as ChallengeStage)}
                      className={`group relative min-h-[150px] rounded-2xl border-[3px] p-3 text-center transition-all ${
                        active
                          ? "-translate-y-0.5 border-[#f4b52b] bg-[#fff4bd] shadow-[0_6px_0_#e7b63d]"
                          : "border-slate-200 bg-white shadow-[0_3px_0_#dfe4e5] hover:-translate-y-0.5 hover:border-[#8edadd]"
                      } ${!available ? "cursor-not-allowed opacity-45 grayscale" : ""}`}
                    >
                      {isRecommended && available && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#f39b24] px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow-sm">
                          Recommended
                        </span>
                      )}
                      {active && available && (
                        <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                          <Check size={14} strokeWidth={4} />
                        </span>
                      )}
                      <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full border-3 ${active ? "border-white bg-[#f6ca45]" : "border-slate-100 bg-slate-50"} text-2xl shadow-sm`}>
                        {available ? item.icon : <LockKeyhole size={19} />}
                      </div>
                      <div className="mt-2 text-base font-black text-slate-800">{item.name}</div>
                      <div className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {index === 0 ? "Available now" : available ? "Unlocked" : `${item.unlock} XP to unlock`}
                      </div>
                      <div className="mt-1 text-[11px] font-bold text-slate-600">{item.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto mt-3 max-w-4xl rounded-xl bg-[#eef9f8] px-4 py-2.5 text-center">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-600">Selected level</div>
              <div className="mt-0.5 text-lg font-black text-slate-800">{challengeStages[selected].icon} {challengeStages[selected].name}</div>
              <div className="text-[11px] font-semibold text-slate-500">{challengeStages[selected].description}</div>
            </div>

            <div className="mx-auto mt-3 flex max-w-4xl flex-col-reverse items-center justify-between gap-2 border-t-2 border-dashed border-slate-200 pt-3 sm:flex-row">
              <button type="button" onClick={handleClose} className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 sm:w-auto">
                Exit
              </button>
              <button type="button" onClick={() => onStart(selected)} className="w-full rounded-xl bg-[#f28b20] px-7 py-2.5 text-xs font-black text-white shadow-[0_4px_0_#c96c10] transition hover:-translate-y-0.5 hover:bg-[#f59a31] active:translate-y-0 sm:w-auto">
                Start Daily Challenge →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
