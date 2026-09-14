"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Gamepad2, Lock, Play, Sparkles, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const games = [
  { title: "Memory Tiles", category: "Memory", emoji: "🧠", href: "/brain-games/memory-tiles", active: true, description: "Remember the tiles and match each math equation with its answer.", gradient: "from-cyan-400 via-sky-500 to-blue-600", tag: "NEW", level: 1, best: "—", progress: 0, reward: 20 },
  { title: "Number Rush", category: "Speed", emoji: "⚡", href: "/brain-games/number-rush", active: true, description: "Race the clock, solve quick math challenges and build powerful combos.", gradient: "from-yellow-300 via-orange-400 to-pink-500", tag: "SPEED", level: 1, best: "—", progress: 0, reward: 20 },
  { title: "Even or Odd", category: "Attention", emoji: "🔢", href: "/brain-games/even-odd", active: true, description: "Quickly identify whether numbers are even or odd before they disappear.", gradient: "from-violet-400 via-purple-500 to-fuchsia-500", tag: "NEW", level: 1, best: "—", progress: 0, reward: 20 },
  { title: "Flash Memory", category: "Memory", emoji: "✨", href: "/brain-games/flash-memory", active: true, description: "Watch a sequence of numbers and recreate it from memory.", gradient: "from-blue-400 via-cyan-500 to-teal-500", tag: "NEW", level: 2, best: "—", progress: 0, reward: 25 },
  { title: "Hidden Numbers", category: "Attention", emoji: "🔎", href: "#", active: false, description: "Find hidden numbers and mathematical patterns in a busy scene.", gradient: "from-emerald-400 via-teal-500 to-cyan-600", tag: "SOON", level: 2, best: "—", progress: 0, reward: 25 },
  { title: "Number Order", category: "Flexibility", emoji: "🔀", href: "/brain-games/number-order", active: true, description: "Remember the numbers, then rebuild the sequence from smallest to largest.", gradient: "from-amber-300 via-orange-400 to-rose-500", tag: "NEW", level: 2, best: "—", progress: 0, reward: 25 },
  { title: "Pattern Quest", category: "Problem Solving", emoji: "🧩", href: "/brain-games/pattern-quest", active: true, description: "Discover the rule behind a pattern and choose what comes next.", gradient: "from-pink-400 via-rose-500 to-red-600", tag: "NEW", level: 3, best: "—", progress: 0, reward: 30 },
  { title: "What's Missing?", category: "Attention", emoji: "👀", href: "#", active: false, description: "Study a group of numbers, then spot the one that has vanished.", gradient: "from-indigo-400 via-blue-500 to-violet-600", tag: "SOON", level: 3, best: "—", progress: 0, reward: 30 },
];

const categories = ["All", "Memory", "Speed", "Attention", "Flexibility", "Problem Solving"];
const skills = [
  ["Memory", 72, "🧠"], ["Speed", 58, "⚡"], ["Attention", 64, "👀"], ["Flexibility", 46, "🔄"], ["Problem Solving", 55, "🧩"],
];

export default function BrainGamesPage() {
  const [category, setCategory] = useState("All");
  const [dailySeconds, setDailySeconds] = useState(25 * 60);
  const filtered = useMemo(() => category === "All" ? games : games.filter((g) => g.category === category), [category]);
  const mins = Math.floor(dailySeconds / 60).toString().padStart(2, "0");
  const secs = (dailySeconds % 60).toString().padStart(2, "0");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_8%_5%,#fff59a,transparent_18%),radial-gradient(circle_at_92%_10%,#b9f5ff,transparent_20%),linear-gradient(135deg,#eefcff,#eef5ff_48%,#fbf0ff)] px-3 py-4 text-[#12375d] sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/games" className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white px-4 py-2 font-black shadow-sm transition hover:-translate-y-0.5"><ArrowLeft size={18}/> Game Zone</Link>

        <section className="relative mt-5 overflow-hidden rounded-[38px] border-4 border-white bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-6 text-white shadow-[0_25px_70px_rgba(14,116,200,.24)] sm:p-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-300/20"/><div className="absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-pink-300/15"/>
          <div className="relative grid gap-8 lg:grid-cols-[1fr_430px] lg:items-center">
            <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black"><Brain size={18}/> BRAIN GAMES ARENA</div><h1 className="mt-4 text-5xl font-black leading-[.95] sm:text-7xl">Train Your Math Brain! 🧠</h1><p className="mt-4 max-w-2xl text-lg font-bold text-white/90 sm:text-xl">Quick challenges for memory, speed, attention, flexibility and problem solving.</p></div>
            <div className="rounded-[30px] border border-white/20 bg-white/10 p-5 backdrop-blur"><div className="flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-widest text-white/70">Daily Brain Time</div><div className="mt-1 text-4xl font-black">{mins}:{secs}</div></div><div className="rounded-2xl bg-yellow-300 px-4 py-3 text-center text-slate-900"><div className="text-2xl font-black">5</div><div className="text-[10px] font-black">BRAIN TOKENS</div></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full w-full rounded-full bg-yellow-300"/></div><p className="mt-2 text-xs font-bold text-white/70">Short sessions keep the brain fresh. Complete a game to earn XP, coins and stars.</p></div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[28px] border-4 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="text-4xl">⭐</span><div><p className="text-xs font-black uppercase tracking-wider text-amber-600">Today's Challenge</p><h2 className="text-2xl font-black">Memory Tiles</h2></div></div><p className="mt-3 font-semibold text-slate-500">Match 6 math pairs before the timer runs out.</p><Link href="/brain-games/memory-tiles" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-black text-white shadow"><Play size={17} fill="currentColor"/> Play Daily Challenge</Link></div>
          <div className="rounded-[28px] border-4 border-cyan-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-cyan-600">Brain Power</p><h2 className="text-2xl font-black">Level 4</h2></div><span className="text-3xl">🧠</span></div><div className="mt-4 h-4 overflow-hidden rounded-full bg-cyan-50"><div className="h-full w-[68%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"/></div><div className="mt-2 flex justify-between text-xs font-black text-slate-400"><span>680 XP</span><span>1,000 XP</span></div></div>
          <div className="rounded-[28px] border-4 border-purple-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="text-4xl">🏆</span><div><p className="text-xs font-black uppercase tracking-wider text-purple-600">Arena Progress</p><h2 className="text-2xl font-black">6 / 8 Ready</h2></div></div><p className="mt-3 font-semibold text-slate-500">Two more challenges are waiting to be unlocked.</p><div className="mt-4 flex gap-1">{Array.from({length:8}).map((_,i)=><span key={i} className={`h-3 flex-1 rounded-full ${i<6 ? "bg-purple-400" : "bg-purple-100"}`}/>)}</div></div>
        </section>

        <section className="mt-6 rounded-[30px] border-4 border-white bg-white/90 p-5 shadow-md sm:p-6"><div className="flex items-center gap-2"><Sparkles size={19} className="text-purple-500"/><h2 className="text-2xl font-black">Brain Skills</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{skills.map(([name,value,icon])=><div key={name as string} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="font-black">{icon} {name}</span><b>{value}%</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" style={{width:`${value}%`}}/></div></div>)}</div></section>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1">{categories.map((item)=><button key={item} onClick={()=>setCategory(item)} className={`whitespace-nowrap rounded-full border-2 px-5 py-2.5 text-sm font-black transition ${category===item ? "border-blue-500 bg-blue-500 text-white shadow" : "border-white bg-white text-slate-600 hover:bg-cyan-50"}`}>{item}</button>)}</div>

        <div className="mt-6 flex items-end justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700"><Gamepad2 size={14}/> BRAIN ARENA</div><h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose Your Challenge</h2><p className="mt-1 font-semibold text-slate-500">Each game trains a different kind of mathematical thinking.</p></div><span className="hidden rounded-full bg-white px-4 py-2 text-sm font-black shadow sm:block">{filtered.length} games</span></div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((game)=><article key={game.title} className={`overflow-hidden rounded-[30px] border-4 bg-white shadow-[0_14px_32px_rgba(30,80,120,.12)] transition duration-300 ${game.active ? "border-cyan-200 hover:-translate-y-2 hover:shadow-xl" : "border-white"}`}>
          <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${game.gradient}`}><div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/25"/><div className="absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-white/20"/><div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-slate-600 shadow">{game.tag}</div><div className="absolute right-4 top-4 rounded-full bg-black/10 px-2.5 py-1 text-[10px] font-black text-white">{game.category}</div><div className="absolute inset-0 flex items-center justify-center text-[78px] drop-shadow-2xl">{game.emoji}</div></div>
          <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{game.title}</h3><p className="mt-1 text-xs font-black uppercase tracking-wider text-purple-500">Level {game.level}</p></div><span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-black text-amber-700">🪙 +{game.reward}</span></div><p className="mt-3 min-h-[58px] text-sm font-semibold leading-5 text-slate-500">{game.description}</p><div className="mt-4 flex items-center justify-between text-xs font-black text-slate-400"><span>Best: {game.best}</span><span>{game.progress}% complete</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{width:`${game.progress}%`}}/></div>{game.active ? <Link href={game.href} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3.5 font-black text-white shadow transition hover:scale-[1.02]"><Play size={17} fill="currentColor"/> Play Game</Link> : <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3.5 text-center font-black text-slate-500"><Lock size={16} className="mr-1 inline"/> Unlock at Level {game.level}</div>}</div>
        </article>)}</div>

        <section className="mt-8 rounded-[32px] border-4 border-dashed border-purple-200 bg-white/80 p-7 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600"><Brain size={28}/></div><h2 className="mt-3 text-2xl font-black">Your Brain Adventure is Growing 🌈</h2><p className="mx-auto mt-2 max-w-2xl font-semibold text-slate-500">Play regularly, improve your skills, collect rewards and unlock new original brain challenges.</p></section>
      </div>
    </main>
  );
}
