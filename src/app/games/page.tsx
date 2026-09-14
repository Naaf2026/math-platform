"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Gamepad2, Lock, Play, Search, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const games = [
  { title: "Number Catcher", world: "Number Town", level: 1, category: "Number Games", description: "Explore Number Town and catch the correct numbers in a quick math adventure.", href: "/number-town", emoji: "🔢", active: true, progress: 0, stars: 0 },
  { title: "Logic Valley", world: "Logic Valley", level: 2, category: "Logic", description: "Solve clever puzzles and train your mathematical thinking.", href: "#", emoji: "🧩", active: false, progress: 0, stars: 0 },
  { title: "Fraction Island", world: "Fraction Island", level: 3, category: "Fractions", description: "Discover fractions through interactive challenges and island adventures.", href: "#", emoji: "🏝️", active: false, progress: 0, stars: 0 },
  { title: "Multiplication Mountain", world: "Multiplication Mountain", level: 4, category: "Multiplication", description: "Climb the mountain by mastering multiplication challenges.", href: "#", emoji: "⛰️", active: false, progress: 0, stars: 0 },
  { title: "Geometry Park", world: "Geometry Park", level: 5, category: "Geometry", description: "Explore shapes, space and geometry through playful challenges.", href: "#", emoji: "📐", active: false, progress: 0, stars: 0 },
  { title: "Algebra Castle", world: "Algebra Castle", level: 6, category: "Algebra", description: "Enter the castle and begin your journey into algebra.", href: "#", emoji: "🏰", active: false, progress: 0, stars: 0 },
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
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#073b73] text-white shadow-sm">
        <div className="mx-auto flex h-[82px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-2 font-black hover:bg-white/10"><ArrowLeft size={23} /><span>Back to Dashboard</span></Link>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black sm:text-base"><Gamepad2 size={20} /> Games</div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="rounded-[36px] bg-gradient-to-br from-[#073b73] via-[#1269c5] to-[#43bdf4] p-6 text-white shadow-xl sm:p-9 lg:p-11">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black"><Sparkles size={17} /> MATH ADVENTURE</div><h1 className="text-[42px] font-black leading-none tracking-tight sm:text-[58px]">Math Games</h1><p className="mt-4 max-w-2xl text-lg font-semibold text-white/85 sm:text-xl">Choose an adventure, earn rewards and unlock new worlds as you progress.</p></div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]"><div className="rounded-2xl bg-white/12 p-4 text-center"><Gamepad2 className="mx-auto" size={23}/><b className="mt-2 block text-2xl">{games.length}</b><span className="text-xs font-bold text-white/75">Games</span></div><div className="rounded-2xl bg-white/12 p-4 text-center"><Star className="mx-auto" size={23}/><b className="mt-2 block text-2xl">0</b><span className="text-xs font-bold text-white/75">Stars</span></div><div className="rounded-2xl bg-white/12 p-4 text-center"><Trophy className="mx-auto" size={23}/><b className="mt-2 block text-2xl">1</b><span className="text-xs font-bold text-white/75">Unlocked</span></div></div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black transition ${category === item ? "bg-[#197fe9] text-white shadow" : "bg-white text-[#55708b] shadow-sm hover:bg-[#e8f5ff]"}`}>{item}</button>)}</div>
          <label className="flex h-11 items-center gap-2 rounded-full border border-[#d7eaf7] bg-white px-4 shadow-sm lg:w-[270px]"><Search size={18} className="text-[#7891a5]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#9bb0c0]"/></label>
        </div>

        <div className="mt-8 rounded-[30px] border border-[#d7eaf7] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">Continue Playing</h2><p className="mt-1 text-sm font-semibold text-[#6685a4]">Jump back into your latest available adventure.</p></div><Link href="/number-town" className="inline-flex items-center gap-2 font-black text-[#197fe9]">Open Number Town <Play size={17} fill="currentColor"/></Link></div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e6f1f7]"><div className="h-full w-0 rounded-full bg-[#197fe9]"/></div>
        </div>

        <div className="mt-8 flex items-end justify-between"><div><h2 className="text-3xl font-black sm:text-4xl">Game Library</h2><p className="mt-1 font-semibold text-[#6685a4]">Explore worlds from Level 1 onward.</p></div><span className="hidden rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm sm:block">{filteredGames.length} games</span></div>

        <div className="mt-6 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
            <article key={game.title} className={`group overflow-hidden rounded-[32px] border-2 bg-white shadow-lg transition ${game.active ? "border-[#43bdf4] hover:-translate-y-1 hover:shadow-2xl" : "border-[#dcecf6]"}`}>
              <div className={`relative h-[220px] overflow-hidden ${game.active ? "bg-gradient-to-br from-[#65d4ff] via-[#4db7f5] to-[#197fe9]" : "bg-gradient-to-br from-[#edf5f9] to-[#dbeaf2]"}`}>
                <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-white/20"/><div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-white/20"/>
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#55708b] shadow">LEVEL {game.level}</div>
                {!game.active && <div className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#55708b] shadow"><Lock size={13} className="mr-1 inline"/> LOCKED</div>}
                <div className={`absolute inset-0 flex items-center justify-center text-[88px] drop-shadow-xl ${game.active ? "animate-bounce" : "grayscale opacity-60"}`}>{game.emoji}</div>
              </div>
              <div className="p-6 sm:p-7">
                <div className="text-xs font-black uppercase tracking-wider text-[#197fe9]">{game.category} · {game.world}</div>
                <h3 className="mt-2 text-2xl font-black sm:text-3xl">{game.title}</h3>
                <p className="mt-3 min-h-[68px] text-sm font-semibold leading-6 text-[#6685a4]">{game.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm font-black text-[#6685a4]"><span className="flex items-center gap-1.5"><Star size={16}/> {game.stars}/3 stars</span><span className="flex items-center gap-1.5"><Zap size={16}/> {game.progress}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8f2f7]"><div className={`h-full rounded-full ${game.active ? "w-0 bg-[#197fe9]" : "w-0 bg-[#b7cad6]"}`}/></div>
                {game.active ? <Link href={game.href} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#197fe9] px-6 py-4 text-lg font-black text-white shadow-md transition hover:bg-[#1269c5]"><Play size={20} fill="currentColor"/> Play Game</Link> : <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#edf4f8] px-6 py-4 text-lg font-black text-[#7891a5]"><Lock size={18}/> Unlock at Level {game.level}</div>}
              </div>
            </article>
          ))}
        </div>

        {filteredGames.length === 0 && <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm"><Search className="mx-auto" size={35}/><h3 className="mt-3 text-xl font-black">No games found</h3><p className="mt-1 font-semibold text-[#6685a4]">Try another search or category.</p></div>}

        <div className="mt-10 rounded-[32px] border-2 border-dashed border-[#b9d8ea] bg-white/70 p-7 text-center sm:p-9"><CheckCircle2 className="mx-auto text-[#197fe9]" size={30}/><h2 className="mt-3 text-2xl font-black">Your Math World is Growing</h2><p className="mx-auto mt-2 max-w-2xl font-semibold text-[#6685a4]">Every new adventure can be added to this library with its own world, level, category, rewards and progress.</p></div>
      </section>
    </main>
  );
}
