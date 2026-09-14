"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Coins, Lock, Play, Star, Timer } from "lucide-react";
import { useState } from "react";

const games = [
  { title: "Memory Tiles", href: "/brain-games/memory-tiles", active: true, color: "from-cyan-400 to-blue-500", pos: "0% 0%" },
  { title: "Number Rush", href: "/brain-games/number-rush", active: true, color: "from-orange-300 to-pink-500", pos: "33.333% 0%" },
  { title: "Even or Odd", href: "/brain-games/even-odd", active: true, color: "from-purple-400 to-fuchsia-500", pos: "66.667% 0%" },
  { title: "Flash Memory", href: "/brain-games/flash-memory", active: true, color: "from-sky-400 to-teal-500", pos: "100% 0%" },
  { title: "Number Order", href: "/brain-games/number-order", active: true, color: "from-amber-300 to-rose-500", pos: "0% 100%" },
  { title: "Pattern Quest", href: "/brain-games/pattern-quest", active: true, color: "from-pink-400 to-red-500", pos: "33.333% 100%" },
  { title: "Hidden Numbers", href: "#", active: false, color: "from-emerald-400 to-cyan-600", pos: "66.667% 100%" },
  { title: "What's Missing?", href: "#", active: false, color: "from-indigo-400 to-violet-600", pos: "100% 100%" },
];

export default function BrainGamesPage() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Memory", "Speed", "Attention", "Problem Solving"];
  const shown = filter === "All" ? games : games.filter((g) => {
    if (filter === "Memory") return ["Memory Tiles", "Flash Memory"].includes(g.title);
    if (filter === "Speed") return g.title === "Number Rush";
    if (filter === "Attention") return ["Even or Odd", "Hidden Numbers", "What's Missing?"].includes(g.title);
    if (filter === "Problem Solving") return ["Pattern Quest", "Number Order"].includes(g.title);
    return true;
  });

  return (
    <main className="min-h-screen bg-[#17b9e5] px-3 py-3 text-slate-700 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#079bd2] px-3 py-2 text-white shadow-sm">
          <Link href="/games" className="rounded-xl p-2 hover:bg-white/10"><ArrowLeft size={21}/></Link>
          <div className="flex items-center gap-2 text-lg font-black"><Brain size={22}/> Brain Games</div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-black"><Timer size={16}/> 25:00</div>
        </div>

        <section className="relative mt-3 overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-r from-[#0aa7dc] to-[#0d83d0] px-5 py-5 text-white shadow-lg sm:px-8">
          <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full bg-white/10"/>
          <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-yellow-300/10"/>
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div><div className="text-xs font-black uppercase tracking-[.25em] text-white/70">Brain Arena</div><h1 className="mt-1 text-3xl font-black sm:text-5xl">Memory · Speed · Focus · Logic</h1></div>
            <div className="flex items-center gap-2"><div className="rounded-2xl bg-white px-4 py-3 text-center text-slate-800 shadow"><Star className="mx-auto text-yellow-400" size={21} fill="currentColor"/><div className="mt-1 text-xl font-black">680</div></div><div className="rounded-2xl bg-yellow-300 px-4 py-3 text-center text-slate-900 shadow"><div className="text-xl font-black">5</div><div className="text-[9px] font-black uppercase">Tokens</div></div></div>
          </div>
        </section>

        <div className="mt-3 flex gap-2 overflow-x-auto rounded-2xl bg-white/95 p-2 shadow">{filters.map((item)=><button key={item} onClick={()=>setFilter(item)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${filter===item ? "bg-[#079ddd] text-white" : "text-slate-600 hover:bg-cyan-50"}`}>{item}</button>)}</div>

        <section className="mt-3 rounded-[26px] border-4 border-white bg-[#f8fdff] p-4 shadow-lg sm:p-5">
          <div className="mb-3 flex items-center justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.2em] text-amber-600">Daily Challenge</div><h2 className="text-2xl font-black">Memory</h2></div><Link href="/brain-games/memory-tiles" className="rounded-xl bg-[#08a6df] px-4 py-2 font-black text-white shadow"><Play size={15} className="mr-1 inline" fill="currentColor"/> Play</Link></div>
          <div className="h-2 overflow-hidden rounded-full bg-cyan-100"><div className="h-full w-[72%] rounded-full bg-[#09a8df]"/></div>
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((game)=><article key={game.title} className="overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-[0_8px_0_rgba(0,70,100,.12)] transition hover:-translate-y-1 hover:shadow-xl">
            <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${game.color}`}>
              {game.title === "Memory Tiles" ? (
                <img src="/assets/memory-tiles-card.svg" alt="Memory Tiles" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-white/5"/>
                  <div aria-hidden="true" className="absolute inset-0 bg-no-repeat" style={{ backgroundImage: "url('/assets/brain-games-art.svg')", backgroundSize: "400% 200%", backgroundPosition: game.pos }} />
                </>
              )}
              {!game.active&&<div className="absolute inset-0 flex items-center justify-center bg-slate-900/10"><span className="rounded-full bg-white/95 px-4 py-2 text-xs font-black shadow"><Lock size={14} className="mr-1 inline"/> Locked</span></div>}
            </div>
            <div className="flex items-center justify-between px-4 py-3"><h3 className="text-lg font-black">{game.title}</h3><span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-black text-amber-700"><Coins size={13}/> 1</span></div>
            {game.active ? <Link href={game.href} className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#08a6df] py-2.5 text-sm font-black text-white shadow"><Play size={15} fill="currentColor"/> Play</Link> : <div className="mx-4 mb-4 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-black text-slate-400">Coming Soon</div>}
          </article>)}
        </div>
      </div>
    </main>
  );
}
