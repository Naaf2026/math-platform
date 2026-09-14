"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Coins, Lock, Play, Sparkles, Star, Timer, Zap } from "lucide-react";
import { useState } from "react";

const games = [
  { title: "Memory Tiles", href: "/brain-games/memory-tiles", active: true, pos: "0% 0%", reward: 10 },
  { title: "Number Rush", href: "/brain-games/number-rush", active: true, pos: "33.333% 0%", reward: 15 },
  { title: "Even or Odd", href: "/brain-games/even-odd", active: true, pos: "66.667% 0%", reward: 10 },
  { title: "Flash Memory", href: "/brain-games/flash-memory", active: true, pos: "100% 0%", reward: 15 },
  { title: "Number Order", href: "/brain-games/number-order", active: true, pos: "0% 100%", reward: 10 },
  { title: "Pattern Quest", href: "/brain-games/pattern-quest", active: true, pos: "33.333% 100%", reward: 15 },
  { title: "Hidden Numbers", href: "#", active: false, pos: "66.667% 100%", reward: 20 },
  { title: "What's Missing?", href: "#", active: false, pos: "100% 100%", reward: 20 },
];

const filters = ["All", "Memory", "Speed", "Attention", "Problem Solving"];

function gameMatches(title: string, filter: string) {
  if (filter === "All") return true;
  if (filter === "Memory") return ["Memory Tiles", "Flash Memory", "Number Order"].includes(title);
  if (filter === "Speed") return title === "Number Rush";
  if (filter === "Attention") return ["Even or Odd", "Hidden Numbers", "What's Missing?"].includes(title);
  if (filter === "Problem Solving") return title === "Pattern Quest";
  return true;
}

export default function BrainGamesPage() {
  const [filter, setFilter] = useState("All");
  const shown = games.filter((g) => gameMatches(g.title, filter));

  return (
    <main className="min-h-screen overflow-hidden bg-[#12bce8] px-3 py-3 text-slate-700 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-3 rounded-2xl bg-[#087fc7] px-3 py-2 text-white shadow-lg">
          <Link href="/games" aria-label="Back to games" className="rounded-xl p-2 transition hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex items-center gap-2 text-lg font-black"><Brain size={23} /> Brain Games</div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-black"><Timer size={16} /> 25:00</div>
        </header>

        <section className="relative mt-3 overflow-hidden rounded-[30px] border-4 border-white bg-gradient-to-r from-[#0aa9df] via-[#079bd8] to-[#176dcc] px-5 py-5 text-white shadow-[0_10px_30px_rgba(0,73,120,.22)] sm:px-8 sm:py-6">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-yellow-300/10" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.24em] text-white/75"><Sparkles size={14} /> Brain Arena</div>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">Play. Think. Get Smarter.</h1>
              <p className="mt-2 max-w-xl text-sm font-bold text-white/80 sm:text-base">Quick math games that train memory, speed, focus and problem solving.</p>
            </div>
            <div className="flex gap-2">
              <div className="min-w-[92px] rounded-2xl bg-white px-4 py-3 text-center text-slate-800 shadow-lg"><Star className="mx-auto text-yellow-400" size={22} fill="currentColor" /><div className="mt-1 text-xl font-black">680</div><div className="text-[10px] font-black uppercase text-slate-400">XP</div></div>
              <div className="min-w-[92px] rounded-2xl bg-yellow-300 px-4 py-3 text-center text-slate-900 shadow-lg"><Coins className="mx-auto" size={22} /><div className="mt-1 text-xl font-black">320</div><div className="text-[10px] font-black uppercase opacity-60">Coins</div></div>
            </div>
          </div>
        </section>

        <nav className="mt-3 flex gap-2 overflow-x-auto rounded-2xl bg-white/95 p-2 shadow-lg" aria-label="Brain game categories">
          {filters.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${filter === item ? "bg-[#079ddd] text-white shadow" : "text-slate-600 hover:bg-cyan-50"}`}>
              {item}
            </button>
          ))}
        </nav>

        <section className="mt-3 rounded-[26px] border-4 border-white bg-white/95 p-4 shadow-lg sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow"><Zap size={28} fill="currentColor" /></div>
              <div><div className="text-[11px] font-black uppercase tracking-[.2em] text-amber-600">Daily Challenge</div><h2 className="text-2xl font-black">Memory Challenge</h2><p className="text-sm font-bold text-slate-400">Finish today's challenge and earn bonus rewards.</p></div>
            </div>
            <Link href="/brain-games/memory-tiles" className="rounded-xl bg-[#08a6df] px-5 py-2.5 text-center font-black text-white shadow transition hover:-translate-y-0.5"><Play size={15} className="mr-1 inline" fill="currentColor" /> Play Now</Link>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-cyan-100"><div className="h-full w-[72%] rounded-full bg-[#09a8df]" /></div>
        </section>

        <div className="mt-5 mb-2 flex items-end justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.2em] text-white/80">Game Arena</div><h2 className="text-2xl font-black text-white sm:text-3xl">Choose a game</h2></div><div className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-500">{shown.length} games</div></div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((game) => (
            <article key={game.title} className="group overflow-hidden rounded-[25px] border-4 border-white bg-white shadow-[0_9px_0_rgba(0,70,100,.13)] transition duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-44 overflow-hidden bg-sky-200">
                <div role="img" aria-label={`${game.title} game illustration`} className="absolute inset-0 bg-no-repeat transition duration-300 group-hover:scale-[1.04]" style={{ backgroundImage: "url('/assets/brain-games-art.svg')", backgroundSize: "400% 200%", backgroundPosition: game.pos }} />
                {!game.active && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30"><span className="rounded-full bg-white/95 px-4 py-2 text-xs font-black shadow"><Lock size={14} className="mr-1 inline" /> Locked</span></div>}
              </div>
              <div className="flex items-center justify-between px-4 pt-3"><h3 className="text-lg font-black text-slate-700">{game.title}</h3><span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-black text-amber-700"><Coins size={13} /> +{game.reward}</span></div>
              {game.active ? <Link href={game.href} className="mx-4 mb-4 mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#08a6df] py-2.5 text-sm font-black text-white shadow transition hover:bg-[#078fc5]"><Play size={15} fill="currentColor" /> Play</Link> : <div className="mx-4 mb-4 mt-3 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-black text-slate-400">Coming Soon</div>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
