"use client";

import Link from "next/link";
import { ArrowLeft, Brain, CalendarDays, Check, Coins, Lock, Play, Sparkles, Star, Target, Trophy, Zap } from "lucide-react";
import { useState } from "react";

const games = [
  { title: "Memory Tiles", href: "/brain-games/memory-tiles", active: true, pos: "0% 0%", reward: 10, category: "Memory", difficulty: "Easy", progress: 72 },
  { title: "Number Rush", href: "/brain-games/number-rush", active: true, pos: "33.333% 0%", reward: 15, category: "Speed", difficulty: "Fast", progress: 46 },
  { title: "Even or Odd", href: "/brain-games/even-odd", active: true, pos: "66.667% 0%", reward: 10, category: "Attention", difficulty: "Easy", progress: 88 },
  { title: "Flash Memory", href: "/brain-games/flash-memory", active: true, pos: "100% 0%", reward: 15, category: "Memory", difficulty: "Medium", progress: 31 },
  { title: "Number Order", href: "/brain-games/number-order", active: true, pos: "0% 100%", reward: 10, category: "Flexibility", difficulty: "Medium", progress: 60 },
  { title: "Pattern Quest", href: "/brain-games/pattern-quest", active: true, pos: "33.333% 100%", reward: 15, category: "Problem Solving", difficulty: "Medium", progress: 24 },
  { title: "Hidden Numbers", href: "#", active: false, pos: "66.667% 100%", reward: 20, category: "Attention", level: 5, difficulty: "Hard", progress: 0 },
  { title: "What's Missing?", href: "#", active: false, pos: "100% 100%", reward: 20, category: "Problem Solving", level: 7, difficulty: "Hard", progress: 0 },
];

const filters = ["All", "Memory", "Speed", "Attention", "Flexibility", "Problem Solving"];

export default function BrainGamesPage() {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? games : games.filter((g) => g.category === filter);

  return (
    <main className="min-h-screen overflow-hidden bg-[#079fd9] text-slate-800">
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(255,255,255,.22),transparent_22%),radial-gradient(circle_at_88%_30%,rgba(255,255,255,.12),transparent_20%),linear-gradient(180deg,#18c6ed_0%,#08b1e3_52%,#0799d0_100%)]">
        <div className="pointer-events-none absolute -left-20 top-36 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -right-24 top-[42%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <header className="sticky top-0 z-40 border-b border-white/20 bg-[#0878c5]/95 px-3 py-1 text-white shadow-md backdrop-blur-md sm:px-5">
          <div className="mx-auto flex h-8 max-w-[1500px] items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Link href="/games" className="grid h-6 w-6 place-items-center rounded-md bg-white/15 transition hover:bg-white/25 active:scale-95" aria-label="Back to games"><ArrowLeft size={14} /></Link>
              <div className="h-4 w-px bg-white/25" />
              <div className="flex items-center gap-1 text-xs font-black"><Brain size={15} /> Brain Games</div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-black"><Coins size={11} className="text-yellow-300" fill="currentColor" /> 320</div>
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-black"><Star size={11} className="text-yellow-300" fill="currentColor" /> 5</div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-3 pb-12 sm:px-5 landscape:px-4 landscape:pb-8">
          <nav className="mt-2 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/25 bg-white/15 p-1.5 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-black transition ${filter === item ? "bg-white text-[#0878c5] shadow-sm" : "text-white/90 hover:bg-white/15"}`}>
                {item}
              </button>
            ))}
          </nav>

          <section className="relative mt-3 min-h-[245px] overflow-hidden rounded-[30px] border-4 border-white/80 bg-[linear-gradient(180deg,#55d9f4_0%,#14bde8_50%,#09a9dc_100%)] shadow-[0_16px_40px_rgba(0,70,120,.24)] landscape:mt-2 landscape:min-h-[190px] landscape:rounded-[22px] landscape:border-[3px]">
            <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_12%_22%,white_0_22px,transparent_23px),radial-gradient(circle_at_84%_18%,white_0_28px,transparent_29px),radial-gradient(circle_at_56%_8%,white_0_12px,transparent_13px)]" />
            <div className="absolute -bottom-24 left-0 h-48 w-full bg-[radial-gradient(ellipse_at_center,rgba(16,139,103,.8),rgba(16,139,103,0)_68%)]" />
            <div className="absolute bottom-0 left-0 h-14 w-full bg-[linear-gradient(180deg,transparent,rgba(0,117,160,.08))]" />
            <div className="relative grid gap-5 px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-[1fr_410px] lg:items-center landscape:grid-cols-[1fr_340px] landscape:gap-4 landscape:px-6 landscape:py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-white shadow-sm landscape:px-2.5 landscape:py-1 landscape:text-[10px]"><Sparkles size={14} className="landscape:h-3 landscape:w-3" /> Brain Arena</div>
                <h1 className="mt-3 text-4xl font-black leading-none tracking-tight text-white drop-shadow-[0_4px_0_rgba(0,83,135,.25)] sm:text-6xl landscape:mt-2 landscape:text-4xl">Brain Games</h1>
                <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-white/90 sm:text-lg landscape:mt-2 landscape:text-xs">Train your memory, speed, focus and problem-solving skills through quick, fun math games.</p>
                <div className="mt-5 flex flex-wrap gap-2 landscape:mt-3 landscape:gap-1.5"><div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black text-white landscape:px-2 landscape:py-1.5 landscape:text-[10px]"><Trophy size={15} /> 6 games ready</div><div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black text-white landscape:px-2 landscape:py-1.5 landscape:text-[10px]"><Zap size={15} /> Earn coins & XP</div></div>
              </div>
              <Link href="/brain-games/memory-tiles" className="group relative overflow-hidden rounded-[24px] border-2 border-white/70 bg-[#087ed0]/90 p-4 text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#0873c0] landscape:rounded-[18px] landscape:p-3">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#087ed0] shadow-md landscape:h-9 landscape:w-9 landscape:rounded-xl"><CalendarDays size={27} /></div><div><div className="text-xs font-black uppercase tracking-widest text-white/70">Daily Challenge</div><div className="text-xl font-black landscape:text-base">Memory Challenge</div></div></div><Play size={24} fill="currentColor" /></div>
                <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2.5"><span className="font-black">Today's reward</span><span className="flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-sm font-black text-slate-900"><Coins size={15} /> +20</span></div>
              </Link>
            </div>
          </section>

          <div className="mt-7 flex items-end justify-between text-white"><div><div className="text-xs font-black uppercase tracking-[.22em] text-white/70">Game Arena</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Choose your game</h2></div><div className="rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-black text-[#0878c5]">{shown.length} games</div></div>

          <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 landscape:mt-2 landscape:gap-3 landscape:grid-cols-3">
            {shown.map((game) => (
              <article key={game.title} className={`group overflow-hidden rounded-[26px] border-4 border-white bg-white shadow-[0_9px_0_rgba(0,67,100,.16)] transition duration-200 landscape:rounded-[18px] landscape:border-[3px] ${game.active ? "hover:-translate-y-1.5" : ""}`}>
                <div className="relative aspect-[1.55] overflow-hidden bg-sky-200"><div role="img" aria-label={`${game.title} game illustration`} className="absolute inset-0 bg-no-repeat transition duration-300 group-hover:scale-[1.035]" style={{ backgroundImage: "url('/assets/brain-games-art-rich.svg')", backgroundSize: "400% 200%", backgroundPosition: game.pos }} /><div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase text-[#176a9c]">{game.difficulty}</div>{!game.active && <div className="absolute inset-0 bg-slate-900/45"><div className="absolute inset-0 grid place-items-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-slate-600"><Lock size={25} /></div></div><div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/75 px-3 py-1.5 text-xs font-black text-white">Level {game.level} required</div></div>}{game.active && <Link href={game.href} aria-label={`Play ${game.title}`} className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full bg-[#079fe0] text-white shadow-lg hover:scale-110"><Play size={21} fill="currentColor" /></Link>}</div>
                <div className="px-4 pt-3"><div className="flex items-start justify-between gap-2"><h3 className="text-[17px] font-black leading-tight text-[#124c82]">{game.title}</h3><span className="flex shrink-0 items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-black text-amber-700"><Coins size={14} /> +{game.reward}</span></div>{game.active && <div className="mt-3"><div className="mb-1 flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Progress</span><span>{game.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#10b9df]" style={{ width: `${game.progress}%` }} /></div></div>}</div>
                {game.active ? <Link href={game.href} className="mx-4 mb-4 mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#079fe0] py-2.5 text-sm font-black text-white"><Play size={15} fill="currentColor" /> Play Game</Link> : <div className="mx-4 mb-4 mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-black text-slate-400"><Lock size={14} /> Locked</div>}
              </article>
            ))}
          </section>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-white/75"><Check size={15} /> Complete games to earn rewards and build your Brain Arena progress.</div>
        </div>
      </div>
    </main>
  );
}
