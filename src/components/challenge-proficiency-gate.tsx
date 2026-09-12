"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, Sparkles, X } from "lucide-react";

export type ChallengeStage = 0 | 1 | 2 | 3;

export const challengeStages = [
  { name: "Elementary", unlock: 0, icon: "🌱", description: "Foundational maths and confidence building.", hint: "Best when you want to strengthen the basics." },
  { name: "Intermediate", unlock: 15, icon: "🚀", description: "A balanced challenge with more problem solving.", hint: "Good when the basics feel comfortable." },
  { name: "Advanced", unlock: 50, icon: "🦊", description: "More complex questions and strategies.", hint: "For learners ready to stretch their thinking." },
  { name: "Master", unlock: 100, icon: "👑", description: "The highest level of Daily Challenge difficulty.", hint: "For confident learners seeking a serious challenge." },
];

export default function ChallengeProficiencyGate({ xp, onStart, onClose }: { xp: number; onStart: (stage: ChallengeStage) => void; onClose?: () => void }) {
  const [selected, setSelected] = useState<ChallengeStage>(0);

  useEffect(() => {
    const recommended: ChallengeStage = xp >= 100 ? 3 : xp >= 50 ? 2 : xp >= 15 ? 1 : 0;
    setSelected(recommended);
  }, [xp]);

  const unlocked = challengeStages.map((item, index) => index === 0 || xp >= item.unlock);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#d8eef2]">
      <div className="min-h-full px-4 py-5 sm:px-7 sm:py-8">
        <div className="relative mx-auto max-w-4xl rounded-[2.2rem] border-4 border-yellow-400 bg-white p-5 shadow-2xl sm:p-8">
          <button
            type="button"
            onClick={onClose ?? (() => { window.location.href = "/dashboard"; })}
            aria-label="Close challenge level selection"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800 sm:right-5 sm:top-5"
          >
            <X size={21} strokeWidth={2.5} />
          </button>

          <div className="pr-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-100 text-2xl">🎯</div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[.2em] text-cyan-600">Before you start</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Choose your challenge level</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">Adjust today's Daily Challenge to match your proficiency. We recommend a level based on your current progress, but you can choose any unlocked level.</p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-cyan-50 px-4 py-2.5 text-xs font-bold text-cyan-800">
            <Sparkles size={15}/><span>Current progress: <strong>{xp} XP</strong></span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {challengeStages.map((item, index) => {
              const available = unlocked[index];
              const active = selected === index;
              const recommended = index === (xp >= 100 ? 3 : xp >= 50 ? 2 : xp >= 15 ? 1 : 0);
              return (
                <button key={item.name} type="button" disabled={!available} onClick={() => setSelected(index as ChallengeStage)} className={`relative rounded-2xl border-2 p-4 text-left transition ${active ? "border-cyan-500 bg-cyan-50 shadow-md ring-2 ring-cyan-100" : "border-slate-200 bg-white hover:border-cyan-300"} ${!available ? "cursor-not-allowed opacity-45" : ""}`}>
                  {recommended && available && <span className="absolute right-3 top-3 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">Recommended</span>}
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-2xl">{available ? item.icon : <LockKeyhole size={20}/>}</div>
                    <div className="min-w-0"><div className="text-lg font-black">{item.name}</div><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{index === 0 ? "Available now" : available ? "Unlocked" : `${item.unlock} XP to unlock`}</div></div>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-600">{item.description}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <div className="text-sm font-bold text-slate-500">Selected: <strong className="text-slate-800">{challengeStages[selected].name}</strong></div>
            <button type="button" onClick={() => onStart(selected)} className="w-full rounded-2xl bg-orange-500 px-7 py-3.5 text-sm font-black text-white shadow-lg hover:bg-orange-600 sm:w-auto">Start Daily Challenge →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
