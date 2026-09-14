"use client";

import Link from "next/link";
import { ArrowLeft, Brain, CalendarDays, Coins, Lock, Play, Sparkles, Star, Target, Zap } from "lucide-react";
import { useState } from "react";

const games = [
  { title: "Memory Tiles", href: "/brain-games/memory-tiles", active: true, pos: "0% 0%", reward: 10, category: "Memory" },
  { title: "Number Rush", href: "/brain-games/number-rush", active: true, pos: "33.333% 0%", reward: 15, category: "Speed" },
  { title: "Even or Odd", href: "/brain-games/even-odd", active: true, pos: "66.667% 0%", reward: 10, category: "Attention" },
  { title: "Flash Memory", href: "/brain-games/flash-memory", active: true, pos: "100% 0%", reward: 15, category: "Memory" },
  { title: "Number Order", href: "/brain-games/number-order", active: true, pos: "0% 100%", reward: 10, category: "Flexibility" },
  { title: "Pattern Quest", href: "/brain-games/pattern-quest", active: true, pos: "33.333% 100%", reward: 15, category: "Problem Solving" },
  { title: "Hidden Numbers", href: "#", active: false, pos: "66.667% 100%", reward: 20, category: "Attention", level: 5 },
  { title: "What's Missing?", href: "#", active: false, pos: "100% 100%", reward: 20, category: "Problem Solving", level: 7 },
];

const filters = ["All", "Memory", "Speed", "Attention", "Flexibility", "Problem Solving"];

export default function BrainGamesPage() {
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? games : games.filter((g) => g.category === filter);

  return (
    <main className="min-h-screen overflow-hidden bg-[#08b8e7] text-slate-800">
      <div className="min-h-screen bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,.2),transparent_30%),linear-gradient(180deg,#12bfe9_0%,#04aee1_55%,#079bd2_100%)]">
        <header className="sticky top-0 z-30 border-b border-white/20 bg-[#0878c5]/95 px-3 py-2 text-white backdrop-blur sm:px-5">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/games" className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25" aria-label="Back to games"><ArrowLeft size={21} /></Link>
              <div className="hidden h-8 w-px bg-white/30 sm:block" />
              <div className="flex items-center gap-2 text-base font-black sm:text-lg"><Brain size={22} /> Brain Games</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-black"><Coins size={18} className="text-yellow-300" fill="currentColor" /> 320</div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-black"><Star size={18} className="text-yellow-300" fill="currentColor" /> 5</div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-3 pb-10 sm:px-5">
          <section className="relative mt-3 min-h-[230px] overflow-hidden rounded-[30px] border-4 border-white/80 bg-[linear-gradient(180deg,#55d9f4_0%,#14bde8_50%,#09a9dc_100%)] shadow-[0_14px_35px_rgba(0,70,120,.2)]">
            <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_12%_22%,white_0_22px,transparent_23px),radial-gradient(circle_at_84%_18%,white_0_28px,transparent_29px)]" />
            <div className="absolute -bottom-24 left-0 h-48 w-full bg-[radial-gradient(ellipse_at_center,rgba(16,139,103,.75),rgba(16,139,103,0)_68%)]" />
            <div className="relative grid gap-5 px-5 py-6 sm:px-9 sm:py-8 lg:grid-cols-[1fr_390px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-white"><Sparkles size={14} /> Brain Arena</div>
                <h1 className="mt-3 text-4xl font-black leading-none tracking-tight text-white drop-shadow-[0_4px_0_rgba(0,83,135,.25)] sm:text-6xl">Brain Games</h1>
                <p className="mt-3 max-w-xl text-sm font-bold text-white/90 sm:text-lg">Train your memory, speed, focus and problem-solving skills through quick, fun math games.</p>
              </div>
              <Link href="/brain-games/memory-tiles" className="group rounded-[24px] border-2 border-white/70 bg-[#087ed0]/85 p-4 text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#0873c0]">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#087ed0]"><CalendarDays size={27} /></div><div><div className="text-xs font-black uppercase tracking-widest text-white/70">Daily Challenge</div><div className="text-xl font-black">Memory Challenge</div></div></div><Play size={24} fill="currentColor" className="transition group-hover:translate-x-1" /></div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2"><span className="font-black">Today's reward</span><span className="flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-sm font-black text-slate-900"><Coins size={15} /> +20</span></div>
              </Link>
            </div>
          </section>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Brain game categories">
            {filters.map((item) => {
              const Icon = item === "Memory" ? Brain : item === "Speed" ? Zap : item === "Attention" ? Target : item === "Problem Solving" ? Sparkles : Star;
              return <button key={item} onClick={() => setFilter(item)} className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-black shadow-sm transition ${filter === item ? "border-white bg-white text-[#0878c5]" : "border-white/20 bg-[#0878c5]/80 text-white hover:bg-[#0878c5]"}`}><Icon size={18} fill={filter === item && item !== "Problem Solving" ? "currentColor" : "none"} />{item}</button>;
            })}
          </nav>

          <div className="mt-6 flex items-end justify-between text-white"><div><div className="text-xs font-black uppercase tracking-[.22em] text-white/70">Game Arena</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Choose your game</h2></div><div className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#0878c5]">{shown.length} games</div></div>

          <section className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((game) => (
              <article key={game.title} className="group overflow-hidden rounded-[26px] border-4 border-white bg-white shadow-[0_9px_0_rgba(0,67,100,.16)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_14px_28px_rgba(0,65,100,.22)]">
                <div className="relative aspect-[1.55] overflow-hidden bg-sky-200">
                  <div role="img" aria-label={`${game.title} game illustration`} className="absolute inset-0 bg-no-repeat transition duration-300 group-hover:scale-[1.035]" style={{ backgroundImage: "url('/assets/brain-games-art-rich.svg')", backgroundSize: "400% 200%", backgroundPosition: game.pos }} />
                  {!game.active && <div className="absolute inset-0 bg-slate-900/40"><div className="absolute inset-0 grid place-items-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-slate-600 shadow-xl"><Lock size={25} /></div></div></div>}
                  {game.active && <Link href={game.href} aria-label={`Play ${game.title}`} className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full bg-[#079fe0] text-white shadow-lg transition hover:scale-110"><Play size={21} fill="currentColor" /></Link>}
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3"><h3 className="text-[17px] font-black text-[#124c82]">{game.title}</h3><span className="flex shrink-0 items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-black text-amber-700"><Coins size={14} /> +{game.reward}</span></div>
                {game.active ? <Link href={game.href} className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#079fe0] py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#078bc4]"><Play size={15} fill="currentColor" /> Play Game</Link> : <div className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-black text-slate-400"><Lock size={14} /> Level {game.level} Required</div>}
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
