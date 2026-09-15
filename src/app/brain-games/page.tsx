"use client";

import Link from "next/link";
import { Brain, CalendarDays, Coins, Home, Lock, Play, Settings, Star, Target, Zap } from "lucide-react";
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

const filters = ["Memory", "Speed", "Attention", "Flexibility", "Problem Solving"];

export default function BrainGamesPage() {
  const [filter, setFilter] = useState("Memory");
  const shown = filter === "Memory" ? games : games.filter((g) => g.category === filter);

  return (
    <main className="min-h-screen overflow-hidden bg-[#08b9e8] text-slate-800">
      <div className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,.28),transparent_20%),linear-gradient(180deg,#08c5ee_0%,#12bde9_52%,#0799d3_100%)]">
        <header className="h-14 border-b border-white/15 bg-[#086fbd]/95 text-white shadow-lg">
          <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-4"><Link href="/games" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20"><Brain size={23} /></Link><div className="h-7 w-px bg-white/25" /><Link href="/dashboard" aria-label="Home" className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/10"><Home size={23} fill="currentColor" /></Link></div>
            <div className="flex items-center gap-2 sm:gap-4"><div className="flex items-center gap-2 rounded-full bg-[#075ca5] px-3 py-1.5 font-black"><Coins size={21} className="text-yellow-300" fill="currentColor" /> 320</div><div className="flex items-center gap-2 rounded-full bg-[#075ca5] px-3 py-1.5 font-black"><Star size={22} className="text-yellow-300" fill="currentColor" /> 5</div><div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 bg-[#ffd1b3] text-lg">🧒</div><Settings size={27} /></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-8">
          <section className="relative grid min-h-[205px] items-center gap-6 overflow-hidden py-5 lg:grid-cols-[1fr_390px]">
            <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_6%_65%,white_0_32px,transparent_34px),radial-gradient(circle_at_55%_25%,white_0_16px,transparent_18px),radial-gradient(circle_at_80%_72%,white_0_24px,transparent_26px)]" />
            <div className="relative flex items-center gap-4 sm:gap-8"><div className="hidden h-32 w-32 shrink-0 rounded-full bg-[#ff8fc5] shadow-[inset_0_-8px_0_rgba(0,0,0,.08)] sm:block"><div className="mx-auto mt-8 h-16 w-20 rounded-[45%] bg-[#ffb0d4]" /><div className="mx-auto -mt-9 h-5 w-24 rounded-full bg-[#2779d4]" /></div><div><div className="text-sm font-black uppercase tracking-[.22em] text-white/75">Brain Arena</div><h1 className="mt-1 text-5xl font-black leading-none text-white drop-shadow-[0_5px_0_rgba(0,74,130,.25)] sm:text-7xl">Brain Games</h1><p className="mt-3 max-w-xl text-sm font-bold text-white/90 sm:text-base">Quick, fun math games that train memory, speed, focus and problem solving.</p></div></div>
            <Link href="/brain-games/memory-tiles" className="relative rounded-[24px] border-2 border-white/60 bg-[#0879d0]/90 p-4 text-white shadow-xl transition hover:-translate-y-1"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0879d0]"><CalendarDays size={27} /></div><div><div className="text-xs font-black uppercase tracking-widest text-white/70">Daily Challenge</div><div className="text-xl font-black">Memory Challenge</div></div></div><span className="text-3xl">›</span></div><div className="mt-3 flex items-center justify-end gap-2 rounded-xl bg-white/10 px-3 py-2"><span className="text-sm font-black">Bonus reward</span><span className="flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-sm font-black text-slate-900"><Coins size={15} /> +20</span></div></Link>
          </section>

          <nav className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{filters.map((item) => { const Icon = item === "Memory" ? Brain : item === "Speed" ? Zap : item === "Attention" ? Target : item === "Flexibility" ? Star : Brain; return <button key={item} onClick={() => setFilter(item)} className={`flex min-w-[155px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black shadow-md transition ${filter === item ? "bg-white text-[#0870ba]" : "bg-[#0875c5]/90 text-white hover:bg-[#0869b2]"}`}><Icon size={22} /> {item}</button>; })}</nav>

          <div className="mt-1 mb-3 flex items-end justify-between text-white"><div><div className="text-xs font-black uppercase tracking-[.2em] text-white/70">Game Arena</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Choose a game</h2></div><div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#0870ba]">{shown.length} games</div></div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{shown.map((game) => (<article key={game.title} className="group overflow-hidden rounded-[25px] border-4 border-white bg-white shadow-[0_8px_0_rgba(0,72,110,.18)] transition duration-200 hover:-translate-y-1"><div className="relative aspect-[1.52] overflow-hidden bg-sky-200"><div role="img" aria-label={`${game.title} illustration`} className="absolute inset-0 bg-no-repeat transition duration-300 group-hover:scale-[1.035]" style={{ backgroundImage: "url('/assets/brain-games-art-rich.svg')", backgroundSize: "400% 200%", backgroundPosition: game.pos }} />{!game.active && <div className="absolute inset-0 bg-slate-900/50"><div className="absolute inset-0 grid place-items-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-600 shadow-xl"><Lock size={27} /></div></div><div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#477aa3]/90 px-4 py-1.5 text-xs font-black text-white"><Lock size={13} className="mr-1 inline" /> Level {game.level} Required</div></div>}</div><div className="flex items-center justify-between gap-2 px-4 py-3"><h3 className="text-[17px] font-black text-[#12528b]">{game.title}</h3>{game.active && <span className="flex items-center gap-1 text-sm font-black text-[#12528b]"><Coins size={17} className="text-yellow-400" fill="currentColor" /> +{game.reward}</span>}</div>{game.active ? <Link href={game.href} className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-full bg-[#159fe8] py-2.5 text-sm font-black text-white shadow-md hover:bg-[#078bd0]"><Play size={16} fill="currentColor" /> Play</Link> : <div className="mx-4 mb-4 rounded-full bg-slate-100 py-2.5 text-center text-xs font-black text-slate-400">Coming Soon</div>}</article>))}</section>
        </div>
      </div>
    </main>
  );
}
