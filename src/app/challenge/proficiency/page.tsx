"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";

const stages = [
  { name: "Elementary", unlock: 0, icon: "🌱", description: "Build confidence with foundational maths skills.", hint: "Great for warming up and strengthening basics.", color: "from-emerald-300 to-lime-300" },
  { name: "Intermediate", unlock: 15, icon: "🚀", description: "Practise with a balanced level of challenge.", hint: "Recommended when the basics feel comfortable.", color: "from-sky-300 to-cyan-300" },
  { name: "Advanced", unlock: 50, icon: "🦊", description: "Take on more complex problems and strategies.", hint: "For learners ready to stretch their thinking.", color: "from-violet-300 to-fuchsia-300" },
  { name: "Master", unlock: 100, icon: "👑", description: "Push your problem-solving skills to the highest level.", hint: "For confident learners looking for a serious challenge.", color: "from-amber-300 to-orange-300" },
];

export default function ProficiencyPage() {
  const [xp, setXp] = useState(0);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem("dailyChallengeXp") || 0);
      if (Number.isFinite(saved)) setXp(saved);
    } catch {}
  }, []);

  const unlocked = stages.map((item, index) => index === 0 || xp >= item.unlock);

  function start() {
    try { window.localStorage.setItem("dailyChallengeStage", String(selected)); } catch {}
    window.location.href = "/challenge/play";
  }

  return (
    <main className="min-h-screen bg-[#d8eef2] text-slate-800">
      <header className="bg-[#13b7d2] text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-7">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-black"><ArrowLeft size={18}/>Back</Link>
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl font-black text-cyan-600">FV</div><span className="hidden text-lg font-black sm:inline">FAHI VISSNUN MATHS</span></div>
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black">⚡ {xp} XP</span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-12">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border-4 border-yellow-400 bg-white p-6 shadow-2xl sm:p-10">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-100 text-3xl">🎯</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-cyan-600">Before you start</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Choose your challenge level</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Adjust today's Daily Challenge to match how confident you feel. We recommend a level, but you can choose another unlocked level whenever you want.</p>
          </div>

          <div className="mt-8 rounded-2xl bg-cyan-50 px-4 py-3 text-center text-sm font-bold text-cyan-800">
            <Sparkles className="mr-1 inline" size={16}/> Your current XP is <strong>{xp}</strong>. Choose the level that feels right for you today.
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {stages.map((item, index) => {
              const isUnlocked = unlocked[index];
              const isSelected = selected === index;
              const recommended = index === 0 && xp < 15;
              return (
                <button key={item.name} disabled={!isUnlocked} onClick={() => setSelected(index)} className={`relative rounded-3xl border-2 p-5 text-left transition ${isSelected ? "border-cyan-500 bg-cyan-50 shadow-lg ring-2 ring-cyan-100" : "border-slate-200 bg-white hover:border-cyan-300"} ${!isUnlocked ? "cursor-not-allowed opacity-50" : ""}`}>
                  {recommended && <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">Recommended</span>}
                  <div className="flex items-center gap-4">
                    <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${item.color} text-3xl`}>{isUnlocked ? item.icon : <LockKeyhole size={26}/>}</div>
                    <div><div className="text-xl font-black">{item.name}</div><div className="mt-1 text-xs font-black uppercase tracking-wider text-slate-400">{index === 0 ? "Start here" : `${item.unlock} XP to unlock`}</div></div>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-7 sm:flex-row">
            <div className="text-sm font-bold text-slate-500">Selected: <span className="font-black text-slate-800">{stages[selected].name}</span></div>
            <button onClick={start} className="w-full rounded-2xl bg-orange-500 px-8 py-4 text-base font-black text-white shadow-lg transition hover:bg-orange-600 sm:w-auto">Start Daily Challenge →</button>
          </div>
        </div>
      </section>
    </main>
  );
}
