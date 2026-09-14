"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Eye, Flame, Gamepad2, Lock, MemoryStick, Play, Sparkles, Zap } from "lucide-react";

const games = [
  { title: "Number Rush", category: "Speed", emoji: "⚡", href: "/brain-games/number-rush", active: true, description: "Race the clock, solve quick math challenges and build powerful combos.", gradient: "from-cyan-400 via-blue-500 to-indigo-600" },
  { title: "Memory Match", category: "Memory", emoji: "🧠", href: "#", active: false, description: "Remember numbers, equations and matching answers.", gradient: "from-violet-400 via-purple-500 to-fuchsia-500" },
  { title: "Number Detective", category: "Attention", emoji: "👀", href: "#", active: false, description: "Spot the number, pattern or rule that does not belong.", gradient: "from-amber-300 via-orange-400 to-rose-500" },
  { title: "Rule Switch", category: "Flexibility", emoji: "🔄", href: "#", active: false, description: "Adapt quickly when the sorting rule changes.", gradient: "from-emerald-400 via-teal-500 to-cyan-600" },
  { title: "Math Maze", category: "Problem Solving", emoji: "🧩", href: "#", active: false, description: "Think ahead and choose the mathematical path to the goal.", gradient: "from-pink-400 via-rose-500 to-red-600" },
];

export default function BrainGamesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,#fff6a8,transparent_22%),radial-gradient(circle_at_90%_20%,#c8f7ff,transparent_25%),linear-gradient(135deg,#f4fbff,#fff4fb)] px-4 py-6 text-[#16365a] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/games" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm"><ArrowLeft size={18}/> Game Zone</Link>
        <section className="relative mt-5 overflow-hidden rounded-[42px] border-4 border-white bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-7 text-white shadow-[0_25px_70px_rgba(99,60,190,.25)] sm:p-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-300/20"/><div className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-cyan-300/15"/>
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black"><Brain size={18}/> BRAIN GAMES</div><h1 className="mt-4 text-5xl font-black leading-none sm:text-7xl">Train Your Math Brain! 🧠</h1><p className="mt-4 max-w-2xl text-lg font-bold text-white/90">Short, exciting challenges for speed, memory, attention, flexibility and problem solving.</p></div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]"><div className="rounded-3xl bg-white/15 p-4 text-center"><Zap className="mx-auto"/><b className="mt-2 block text-2xl">5</b><span className="text-xs font-bold">Skills</span></div><div className="rounded-3xl bg-white/15 p-4 text-center"><Gamepad2 className="mx-auto"/><b className="mt-2 block text-2xl">1</b><span className="text-xs font-bold">Ready</span></div><div className="rounded-3xl bg-white/15 p-4 text-center"><Sparkles className="mx-auto"/><b className="mt-2 block text-2xl">+XP</b><span className="text-xs font-bold">Rewards</span></div></div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => <article key={game.title} className={`overflow-hidden rounded-[34px] border-4 bg-white shadow-[0_15px_35px_rgba(40,80,120,.12)] transition ${game.active ? "border-cyan-300 hover:-translate-y-2" : "border-white"}`}>
            <div className={`relative h-48 bg-gradient-to-br ${game.gradient}`}><div className="absolute inset-0 flex items-center justify-center text-[88px] drop-shadow-xl">{game.emoji}</div>{!game.active && <div className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-600"><Lock size={13} className="mr-1 inline"/> COMING SOON</div>}</div>
            <div className="p-6"><div className="text-xs font-black uppercase tracking-widest text-purple-500">{game.category}</div><h2 className="mt-2 text-2xl font-black">{game.title}</h2><p className="mt-3 min-h-14 text-sm font-semibold leading-6 text-[#718ba5]">{game.description}</p>{game.active ? <Link href={game.href} className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 font-black text-white shadow-md hover:scale-[1.02]"><Play size={19} fill="currentColor"/> Play Now 🚀</Link> : <div className="mt-5 rounded-2xl bg-slate-100 px-5 py-4 text-center font-black text-slate-500"><Lock size={17} className="mr-2 inline"/> Unlocking soon</div>}</div>
          </article>)}
        </div>

        <section className="mt-8 rounded-[32px] border-4 border-dashed border-purple-200 bg-white/80 p-7 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600"><Brain size={28}/></div><h2 className="mt-3 text-2xl font-black">Your Brain Power grows with practice ✨</h2><p className="mx-auto mt-2 max-w-2xl font-semibold text-[#718ba5]">Every completed brain game earns XP, coins and stars, so thinking becomes part of your Math World adventure.</p></section>
      </div>
    </main>
  );
}
