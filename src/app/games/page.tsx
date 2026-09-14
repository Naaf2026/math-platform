"use client";

import Link from "next/link";
import { ArrowLeft, Gamepad2, Lock, Sparkles, Star, Trophy, Zap } from "lucide-react";

const games = [
  {
    title: "Number Catcher",
    world: "Number Town · Level 1",
    description: "Explore Number Town and catch the correct numbers in this quick math adventure.",
    href: "/number-town",
    emoji: "🔢",
    badge: "PLAY NOW",
    active: true,
  },
  {
    title: "Coming Soon",
    world: "Logic Valley · Level 2",
    description: "A new math adventure is being prepared. Unlock it by progressing through the Math World.",
    href: "#",
    emoji: "🧩",
    badge: "COMING SOON",
    active: false,
  },
  {
    title: "Coming Soon",
    world: "Fraction Island · Level 3",
    description: "Explore fractions through an interactive game built for the next stage of your journey.",
    href: "#",
    emoji: "🏝️",
    badge: "COMING SOON",
    active: false,
  },
];

export default function GamesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#073b73] text-white shadow-sm">
        <div className="mx-auto flex h-[82px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-2 font-black hover:bg-white/10">
            <ArrowLeft size={23} />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black sm:text-base">
            <Gamepad2 size={20} /> Games
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0a8] text-4xl shadow-md">🎮</div>
          <h1 className="text-[42px] font-black tracking-tight sm:text-[58px]">Math Games</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold text-[#6685a4] sm:text-xl">
            Choose a game and continue your math adventure. More worlds and games will be added here.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-[#d7eaf7] bg-white p-5 shadow-sm"><div className="mb-2 flex items-center gap-2 font-black"><Zap size={20} /> Your Progress</div><p className="text-sm font-semibold text-[#6685a4]">Explore games to earn XP and level up.</p></div>
          <div className="rounded-3xl border border-[#d7eaf7] bg-white p-5 shadow-sm"><div className="mb-2 flex items-center gap-2 font-black"><Star size={20} /> Rewards</div><p className="text-sm font-semibold text-[#6685a4]">Complete games to earn stars, coins and badges.</p></div>
          <div className="rounded-3xl border border-[#d7eaf7] bg-white p-5 shadow-sm"><div className="mb-2 flex items-center gap-2 font-black"><Trophy size={20} /> Adventure</div><p className="text-sm font-semibold text-[#6685a4]">New worlds will unlock as your level grows.</p></div>
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game, index) => (
            <div key={`${game.title}-${index}`} className={`group overflow-hidden rounded-[32px] border-2 bg-white shadow-lg transition ${game.active ? "border-[#43bdf4] hover:-translate-y-1 hover:shadow-2xl" : "border-[#dcecf6]"}`}>
              <div className={`relative flex h-[220px] items-center justify-center overflow-hidden ${game.active ? "bg-gradient-to-br from-[#65d4ff] via-[#4db7f5] to-[#197fe9]" : "bg-[#e9f3f8]"}`}>
                <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/20" />
                <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-white/20" />
                <span className={`relative text-[92px] drop-shadow-lg ${game.active ? "animate-bounce" : "grayscale opacity-60"}`}>{game.emoji}</span>
                {!game.active && <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-[#55708b] shadow"><Lock size={14} className="mr-1 inline" /> LOCKED</div>}
              </div>
              <div className="p-6 sm:p-7">
                <div className="text-sm font-black uppercase tracking-wide text-[#197fe9]">{game.world}</div>
                <h2 className="mt-2 text-3xl font-black">{game.title}</h2>
                <p className="mt-3 min-h-[72px] text-base font-semibold leading-7 text-[#6685a4]">{game.description}</p>
                {game.active ? (
                  <Link href={game.href} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#197fe9] px-6 py-4 text-lg font-black text-white shadow-md transition hover:bg-[#1269c5]">
                    <Gamepad2 size={21} /> Play Game
                  </Link>
                ) : (
                  <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#edf4f8] px-6 py-4 text-lg font-black text-[#7891a5]">
                    <Sparkles size={20} /> Coming Soon
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[32px] border-2 border-dashed border-[#b9d8ea] bg-white/70 p-7 text-center sm:p-9">
          <div className="text-4xl">🌟</div>
          <h2 className="mt-3 text-2xl font-black">Your Math World is Growing</h2>
          <p className="mx-auto mt-2 max-w-2xl font-semibold text-[#6685a4]">This page is the central game hub. Every new game can be added here without changing the dashboard navigation.</p>
        </div>
      </section>
    </main>
  );
}
