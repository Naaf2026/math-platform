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

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#dff4f4]">
      <div className="min-h-full px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border-4 border-[#f5c542] bg-white shadow-[0_16px_45px_rgba(24,64,68,.22)]">
          <div className="relative bg-[#10aeb5] px-5 pb-7 pt-5 text-white sm:px-9 sm:pt-6">
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30">
                <X size={22} strokeWidth={3} />
              </button>
            )}
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-white/70 bg-[#f6c945] text-3xl shadow-lg">🎯</div>
              <div className="mt-3 text-[11px] font-black uppercase tracking-[.22em] text-white/80">Daily Challenge</div>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Choose your challenge level</h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-white/90">
                Choose a level that matches your proficiency. Your recommended level is based on your current progress.
              </p>
            </div>
          </div>

          <div className="bg-[#fffdf5] px-4 py-5 sm:px-8 sm:py-7">
            <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-2xl border-2 border-[#f3df9b] bg-[#fff7d8] px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
              <Sparkles className="text-orange-500" size={18} />
              <span>Current progress: <strong>{xp} XP</strong></span>
              <span className="hidden text-slate-400 sm:inline">•</span>
              <span className="hidden sm:inline">Recommended: <strong>{challengeStages[recommended].name}</strong></span>
            </div>

            <div className="mx-auto mt-7 max-w-4xl">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      className={`group relative min-h-[190px] rounded-[1.5rem] border-4 p-4 text-center transition-all ${
                        active
                          ? "-translate-y-1 border-[#f4b52b] bg-[#fff4bd] shadow-[0_10px_0_#e7b63d]"
                          : "border-slate-200 bg-white shadow-[0_5px_0_#dfe4e5] hover:-translate-y-1 hover:border-[#8edadd]"
                      } ${!available ? "cursor-not-allowed opacity-45 grayscale" : ""}`}
                    >
                      {isRecommended && available && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#f39b24] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                          Recommended
                        </span>
                      )}
                      {active && available && (
                        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white">
                          <Check size={16} strokeWidth={4} />
                        </span>
                      )}
                      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full border-4 ${active ? "border-white bg-[#f6ca45]" : "border-slate-100 bg-slate-50"} text-3xl shadow-sm`}>
                        {available ? item.icon : <LockKeyhole size={23} />}
                      </div>
                      <div className="mt-3 text-lg font-black text-slate-800">{item.name}</div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {index === 0 ? "Available now" : available ? "Unlocked" : `${item.unlock} XP to unlock`}
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-600">{item.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mx-auto mt-7 max-w-4xl rounded-2xl bg-[#eef9f8] px-5 py-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-teal-600">Selected level</div>
              <div className="mt-1 text-xl font-black text-slate-800">{challengeStages[selected].icon} {challengeStages[selected].name}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{challengeStages[selected].description}</div>
            </div>

            <div className="mx-auto mt-6 flex max-w-4xl flex-col-reverse items-center justify-between gap-3 border-t-2 border-dashed border-slate-200 pt-5 sm:flex-row">
              <button type="button" onClick={onClose} className="w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 sm:w-auto">
                Exit
              </button>
              <button type="button" onClick={() => onStart(selected)} className="w-full rounded-2xl bg-[#f28b20] px-8 py-3.5 text-sm font-black text-white shadow-[0_5px_0_#c96c10] transition hover:-translate-y-0.5 hover:bg-[#f59a31] active:translate-y-0 sm:w-auto">
                Start Daily Challenge →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
