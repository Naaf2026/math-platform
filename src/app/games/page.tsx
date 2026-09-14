"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Gamepad2, Lock, Play, Search, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const games = [
  { title: "Number Catcher", world: "Number Town", level: 1, category: "Number Games", description: "Explore Number Town and catch the correct numbers in a quick math adventure.", href: "/number-town", emoji: "🔢", active: true, progress: 0, stars: 0, accent: "from-cyan-300 via-sky-400 to-blue-500", button: "bg-blue-500 hover:bg-blue-600" },
  { title: "Logic Valley", world: "Logic Valley", level: 2, category: "Logic", description: "Solve clever puzzles and train your mathematical thinking.", href: "#", emoji: "🧩", active: false, progress: 0, stars: 0, accent: "from-violet-200 via-purple-300 to-fuchsia-400", button: "bg-purple-500" },
  { title: "Fraction Island", world: "Fraction Island", level: 3, category: "Fractions", description: "Discover fractions through interactive challenges and island adventures.", href: "#", emoji: "🏝️", active: false, progress: 0, stars: 0, accent: "from-emerald-200 via-teal-300 to-cyan-400", button: "bg-teal-500" },
  { title: "Multiplication Mountain", world: "Multiplication Mountain", level: 4, category: "Multiplication", description: "Climb the mountain by mastering multiplication challenges.", href: "#", emoji: "⛰️", active: false, progress: 0, stars: 0, accent: "from-amber-200 via-orange-300 to-rose-400", button: "bg-orange-500" },
  { title: "Geometry Park", world: "Geometry Park", level: 5, category: "Geometry", description: "Explore shapes, space and geometry through playful challenges.", href: "#", emoji: "📐", active: false, progress: 0, stars: 0, accent: "from-pink-200 via-rose-300 to-red-400", button: "bg-rose-500" },
  { title: "Algebra Castle", world: "Algebra Castle", level: 6, category: "Algebra", description: "Enter the castle and begin your journey into algebra.", href: "#", emoji: "🏰", active: false, progress: 0, stars: 0, accent: "from-indigo-200 via-blue-300 to-violet-400", button: "bg-indigo-500" },
];

const categories = ["All Games", "Number Games", "Logic", "Fractions", "Multiplication", "Geometry", "Algebra"];

export default function GamesPage() {
  const [category, setCategory] = useState("All Games");
  const [query, setQuery] = useState("");

  const filteredGames = useMemo(() => games.filter((game) => {
    const matchesCategory = category === "All Games" || game.category === category;
    const text = `${game.title} ${game.world} ${game.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [category, query]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,#fff7ad_0,transparent_22%),radial-gradient(circle_at_90%_20%,#c8f7ff_0,transparent_25%),linear-gradient(135deg,#fffaf0,#effbff_50%,#f7f0ff)] text-[#12345b]">
      <header className="sticky top-0 z-40 border-b-4 border-yellow-300 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="mx-auto flex h-[78px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl px-3 py-2 font-black transition hover:bg-white/15"><ArrowLeft size={22} /><span>Back to Dashboard</span></Link>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-5 py-2.5 text-sm font-black shadow-inner sm:text-base"><Gamepad2 size={20} /> GAME ZONE</div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="relative overflow-hidden rounded-[40px] border-4 border-white bg-gradient-to-br from-[#2563eb] via-[#7c3aed] to-[#ec4899] p-6 text-white shadow-[0_18px_45px_rgba(79,70,229,.25)] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-yellow-300/30 blur-sm" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-black shadow-sm"><Sparkles size={17} /> MATH ADVENTURE</div>
              <h1 className="text-[44px] font-black leading-none tracking-tight drop-shadow-sm sm:text-[64px]">Math Games 🎮</h1>
              <p className="mt-4 max-w-2xl text-lg font-bold text-white/90 sm:text-xl">Play, learn, collect stars ⭐ and unlock amazing new worlds!</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
              <div className="rounded-3xl border border-white/20 bg-white/15 p-4 text-center shadow-inner"><Gamepad2 className="mx-auto" size={23}/><b className="mt-2 block text-2xl">{games.length}</b><span className="text-xs font-bold text-white/80">Games</span></div>
              <div className="rounded-3xl border border-white/20 bg-white/15 p-4 text-center shadow-inner"><Star className="mx-auto" size={23} fill="currentColor"/><b className="mt-2 block text-2xl">0</b><span className="text-xs font-bold text-white/80">Stars</span></div>
              <div className="rounded-3xl border border-white/20 bg-white/15 p-4 text-center shadow-inner"><Trophy className="mx-auto" size={23}/><b className="mt-2 block text-2xl">1</b><span className="text-xs font-bold text-white/80">Unlocked</span></div>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item, index) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border-2 px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5 ${category === item ? "border-blue-500 bg-blue-500 text-white shadow-lg" : index % 3 === 0 ? "border-yellow-200 bg-yellow-50 text-amber-700 hover:bg-yellow-100" : index % 3 === 1 ? "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>{item}</button>)}</div>
          <label className="flex h-12 items-center gap-2 rounded-full border-2 border-purple-100 bg-white px-4 shadow-md lg:w-[280px]"><Search size={18} className="text-purple-500"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔎 Search games" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#9bb0c0]"/></label>
        </div>

        <div className="mt-8 rounded-[32px] border-4 border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-cyan-50 p-5 shadow-md sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-yellow-200 px-3 py-1 text-xs font-black text-amber-800">⭐ YOUR NEXT ADVENTURE</div><h2 className="mt-2 text-2xl font-black">Continue Playing</h2><p className="mt-1 text-sm font-semibold text-[#6685a4]">Jump back into your latest available adventure.</p></div><Link href="/number-town" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-3 font-black text-white shadow-md transition hover:scale-105">Open Number Town <Play size={17} fill="currentColor"/></Link></div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-yellow-100"><div className="h-full w-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"/></div>
        </div>

        <div className="mt-10 flex items-end justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">🚀 ADVENTURE MAP</div><h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose Your Game</h2><p className="mt-1 font-semibold text-[#6685a4]">Explore colorful worlds from Level 1 onward.</p></div><span className="hidden rounded-full bg-white px-4 py-2 text-sm font-black shadow-md sm:block">{filteredGames.length} games</span></div>

        <div className="mt-6 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
            <article key={game.title} className={`group overflow-hidden rounded-[34px] border-4 bg-white shadow-[0_12px_30px_rgba(30,80,120,.12)] transition duration-300 ${game.active ? "border-cyan-300 hover:-translate-y-2 hover:rotate-[.3deg] hover:shadow-[0_20px_40px_rgba(14,165,233,.25)]" : "border-white hover:-translate-y-1"}`}>
              <div className={`relative h-[220px] overflow-hidden bg-gradient-to-br ${game.accent}`}>
                <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/30"/><div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-white/25"/><div className="absolute right-6 top-6 text-2xl">✨</div>
                <div className="absolute left-5 top-5 rounded-full border-2 border-white/70 bg-white/95 px-3 py-1.5 text-xs font-black text-[#55708b] shadow">LEVEL {game.level}</div>
                {!game.active && <div className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-[#55708b] shadow"><Lock size={13} className="mr-1 inline"/> LOCKED</div>}
                <div className={`absolute inset-0 flex items-center justify-center text-[88px] drop-shadow-xl ${game.active ? "animate-bounce" : "grayscale opacity-60"}`}>{game.emoji}</div>
              </div>
              <div className="p-6 sm:p-7">
                <div className="text-xs font-black uppercase tracking-wider text-purple-500">{game.category} · {game.world}</div>
                <h3 className="mt-2 text-2xl font-black sm:text-3xl">{game.title}</h3>
                <p className="mt-3 min-h-[68px] text-sm font-semibold leading-6 text-[#6685a4]">{game.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm font-black text-[#6685a4]"><span className="flex items-center gap-1.5"><Star size={16} className="text-yellow-400" fill="currentColor"/> {game.stars}/3 stars</span><span className="flex items-center gap-1.5"><Zap size={16} className="text-orange-400"/> {game.progress}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8f2f7]"><div className={`h-full rounded-full ${game.active ? "w-0 bg-gradient-to-r from-cyan-400 to-blue-500" : "w-0 bg-[#b7cad6]"}`}/></div>
                {game.active ? <Link href={game.href} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-black text-white shadow-md transition hover:scale-[1.02] ${game.button}`}><Play size={20} fill="currentColor"/> Play Game 🚀</Link> : <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-4 text-lg font-black text-[#7891a5]"><Lock size={18}/> Unlock at Level {game.level}</div>}
              </div>
            </article>
          ))}
        </div>

        {filteredGames.length === 0 && <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm"><Search className="mx-auto text-purple-500" size={35}/><h3 className="mt-3 text-xl font-black">No games found</h3><p className="mt-1 font-semibold text-[#6685a4]">Try another search or category.</p></div>}

        <div className="mt-10 overflow-hidden rounded-[32px] border-4 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 via-white to-pink-50 p-7 text-center shadow-sm sm:p-9"><CheckCircle2 className="mx-auto text-purple-500" size={30}/><h2 className="mt-3 text-2xl font-black">Your Math World is Growing 🌈</h2><p className="mx-auto mt-2 max-w-2xl font-semibold text-[#6685a4]">Every new adventure can be added to this library with its own world, level, category, rewards and progress.</p></div>
      </section>
    </main>
  );
}
