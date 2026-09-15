"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  games: string[];
};

type Game = {
  id: string;
  title: string;
  category: string;
  image: string;
  href: string;
  xp: number;
  position: string;
};

const categories: Category[] = [
  { id: "all", name: "All Games", icon: "grid", color: "from-cyan-500 to-blue-500", games: [] },
  { id: "memory", name: "Memory", icon: "brain", color: "from-violet-500 to-indigo-500", games: ["memory-tiles", "flash-memory"] },
  { id: "speed", name: "Speed", icon: "bolt", color: "from-orange-400 to-rose-500", games: ["number-rush"] },
  { id: "attention", name: "Attention", icon: "target", color: "from-emerald-400 to-teal-600", games: ["even-odd", "hidden-numbers"] },
  { id: "flexibility", name: "Flexibility", icon: "shuffle", color: "from-sky-400 to-cyan-600", games: ["number-order", "whats-missing"] },
  { id: "problem-solving", name: "Problem Solving", icon: "puzzle", color: "from-fuchsia-400 to-purple-600", games: ["pattern-quest"] },
];

const games: Game[] = [
  { id: "memory-tiles", title: "Memory Tiles", category: "memory", image: "/assets/brain-games-cards/memory-tiles.png", href: "/brain-games/memory-tiles", xp: 10, position: "left-[8%] top-[23%]" },
  { id: "number-rush", title: "Number Rush", category: "speed", image: "/assets/brain-games-cards/number-rush.png", href: "/brain-games/number-rush", xp: 15, position: "left-[32%] top-[12%]" },
  { id: "even-odd", title: "Even or Odd", category: "attention", image: "/assets/brain-games-cards/even-odd.png", href: "/brain-games/even-odd", xp: 10, position: "left-[57%] top-[24%]" },
  { id: "flash-memory", title: "Flash Memory", category: "memory", image: "/assets/brain-games-cards/flash-memory.png", href: "/brain-games/flash-memory", xp: 15, position: "left-[78%] top-[15%]" },
  { id: "number-order", title: "Number Order", category: "flexibility", image: "/assets/brain-games-cards/number-order.png", href: "/brain-games/number-order", xp: 10, position: "left-[18%] top-[59%]" },
  { id: "pattern-quest", title: "Pattern Quest", category: "problem-solving", image: "/assets/brain-games-cards/pattern-quest.png", href: "/brain-games/pattern-quest", xp: 15, position: "left-[43%] top-[66%]" },
  { id: "hidden-numbers", title: "Hidden Numbers", category: "attention", image: "/assets/brain-games-cards/hidden-numbers.png", href: "/brain-games/hidden-numbers", xp: 15, position: "left-[68%] top-[60%]" },
  { id: "whats-missing", title: "What's Missing?", category: "flexibility", image: "/assets/brain-games-cards/whats-missing.png", href: "/brain-games/whats-missing", xp: 15, position: "left-[84%] top-[68%]" },
];

function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "brain") return <svg {...common}><path d="M9.5 4.5A3.5 3.5 0 0 0 3 6.3a3.5 3.5 0 0 0 .8 2.2A4 4 0 0 0 5 16a3.5 3.5 0 0 0 6 2.5V6a3.5 3.5 0 0 0-1.5-1.5Z"/><path d="M14.5 4.5A3.5 3.5 0 0 1 21 6.3a3.5 3.5 0 0 1-.8 2.2A4 4 0 0 1 19 16a3.5 3.5 0 0 1-6 2.5V6a3.5 3.5 0 0 1 1.5-1.5Z"/><path d="M8 8h1M15 8h1M8 12h1M15 12h1"/></svg>;
  if (name === "bolt") return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/></svg>;
  if (name === "target") return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>;
  if (name === "shuffle") return <svg {...common}><path d="M3 7h3c5 0 6 10 12 10h3"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3c1.8 0 3-1.1 4-2.5"/><path d="M14 9.5C15 8 16.2 7 18 7h3"/><path d="m18 4 3 3-3 3"/></svg>;
  if (name === "puzzle") return <svg {...common}><path d="M19 13a2 2 0 1 0 0-4h-1V6a2 2 0 0 0-2-2h-3v1a2 2 0 1 1-4 0V4H6a2 2 0 0 0-2 2v3h1a2 2 0 1 1 0 4H4v3a2 2 0 0 0 2 2h3v-1a2 2 0 1 1 4 0v1h3a2 2 0 0 0 2-2v-3h1Z"/></svg>;
  return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8v8H8z"/></svg>;
}

export default function BrainGamesPage() {
  const [active, setActive] = useState("all");
  const [selected, setSelected] = useState<Game | null>(null);

  const visibleGames = useMemo(
    () => active === "all" ? games : games.filter((game) => game.category === active),
    [active]
  );

  const categoryName = categories.find((c) => c.id === active)?.name ?? "All Games";

  return (
    <main className="min-h-screen overflow-hidden bg-[#09b9d7] text-slate-900">
      <section className="relative min-h-[780px] px-4 pb-14 pt-5 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute left-8 top-24 text-5xl opacity-80">☁</div>
          <div className="absolute right-10 top-28 text-6xl opacity-80">☁</div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="flex flex-col items-center text-center">
            <div className="mb-2 inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-5 py-2 text-sm font-extrabold text-white shadow-lg backdrop-blur">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-cyan-600">
                <Icon name="brain" size={21} />
              </span>
              FAHI VISSNUN
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_5px_0_rgba(0,93,130,.25)] sm:text-7xl">
              Brain Games
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold text-white/90 sm:text-base">
              Explore, play and strengthen the skills that make your brain powerful.
            </p>
          </header>

          <nav className="mt-7 flex flex-wrap justify-center gap-2.5" aria-label="Brain game categories">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActive(category.id)}
                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-extrabold shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
                  active === category.id
                    ? "border-white bg-white text-[#087ca8] shadow-xl"
                    : "border-white/20 bg-[#087db7] text-white hover:bg-[#096fa5]"
                }`}
              >
                <Icon name={category.icon} size={19} />
                {category.name}
              </button>
            ))}
          </nav>

          <div className="relative mx-auto mt-8 min-h-[560px] max-w-6xl">
            {/* Stylised original game world */}
            <div className="absolute inset-x-[3%] top-[7%] bottom-[3%] rounded-[46%] bg-[#4dbb50] shadow-[0_25px_0_rgba(0,80,120,.18),inset_0_8px_0_rgba(255,255,255,.22)]">
              <div className="absolute inset-[7%] rounded-[46%] bg-[#7fd65a]" />
              <div className="absolute left-[18%] top-[31%] h-36 w-[64%] rounded-[50%] bg-[#35aeb5]/80 shadow-inner" />
              <div className="absolute left-[41%] top-[13%] h-[74%] w-12 rotate-[38deg] rounded-full bg-[#f2d29a]/90" />
              <div className="absolute left-[17%] top-[45%] h-10 w-[67%] -rotate-[10deg] rounded-full bg-[#f2d29a]/90" />
              <div className="absolute left-[49%] top-[40%] h-36 w-36 rounded-full bg-[#39b9bd]/80" />
              <div className="absolute left-[47%] top-[43%] h-40 w-40 rounded-full border-[10px] border-[#e8f6df]/40" />
              {[
                ["8%","19%"],["23%","8%"],["76%","14%"],["88%","30%"],["7%","62%"],
                ["25%","78%"],["55%","77%"],["83%","64%"],["92%","76%"],["38%","23%"]
              ].map(([x,y], i) => (
                <span key={i} className="absolute text-3xl drop-shadow-md" style={{left:x, top:y}}>🌳</span>
              ))}
              <span className="absolute left-[8%] top-[42%] text-4xl">🎡</span>
              <span className="absolute right-[9%] top-[40%] text-5xl">🎈</span>
              <span className="absolute left-[47%] top-[3%] text-4xl">☁️</span>
              <span className="absolute right-[23%] top-[7%] text-3xl">☁️</span>
              <span className="absolute left-[11%] bottom-[7%] text-4xl">🛝</span>
              <span className="absolute right-[11%] bottom-[10%] text-4xl">🎪</span>
            </div>

            {/* Interactive game islands */}
            {visibleGames.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelected(game)}
                className={`group absolute z-20 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-[0_12px_0_rgba(0,78,115,.18)] transition-all duration-200 hover:z-30 hover:scale-110 hover:-rotate-1 focus:outline-none focus:ring-4 focus:ring-white/70 ${game.position}`}
                style={{ width: "clamp(116px, 15vw, 190px)" }}
                aria-label={`Open ${game.title}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={game.image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-[#087ca8] shadow">
                    +{game.xp} XP
                  </span>
                </div>
                <div className="px-2 py-2 text-center">
                  <span className="block text-xs font-black text-[#075d93] sm:text-sm">{game.title}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    Play <span aria-hidden>→</span>
                  </span>
                </div>
              </button>
            ))}

            <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-full border-4 border-white bg-[#ffca28] px-6 py-3 font-black text-[#7a4a00] shadow-[0_8px_0_rgba(122,74,0,.18)]">
              🪙 Brain Zone
            </div>
          </div>

          <div className="mx-auto mt-5 flex max-w-3xl items-center justify-between rounded-3xl border-2 border-white/30 bg-white/15 px-5 py-4 text-white shadow-lg backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">Current world</p>
              <p className="text-lg font-black">{categoryName}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-white/70">Games available</p>
              <p className="text-lg font-black">{visibleGames.length} activities</p>
            </div>
            <Link href="#games" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#087ca8] shadow hover:-translate-y-0.5">
              View games
            </Link>
          </div>
        </div>
      </section>

      <section id="games" className="bg-white px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-cyan-600">Explore the world</p>
              <h2 className="mt-1 text-3xl font-black text-slate-900">Choose a brain challenge</h2>
            </div>
            <p className="max-w-md text-sm font-medium text-slate-500">
              Your existing game routes stay intact. The world above is the new discovery experience.
            </p>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => (
              <Link key={game.id} href={game.href} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img src={game.image} alt={`${game.title} game`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-black text-slate-900">{game.title}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{game.category.replace("-", " ")}</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan-500 text-white shadow">▶</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/3]">
              <img src={selected.image} alt="" className="h-full w-full object-cover" />
              <button onClick={() => setSelected(null)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-xl font-black text-slate-700 shadow" aria-label="Close">×</button>
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-600">{selected.category.replace("-", " ")}</p>
              <h2 className="mt-1 text-3xl font-black text-slate-900">{selected.title}</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Ready for a quick brain challenge?</p>
              <div className="mt-5 flex gap-3">
                <Link href={selected.href} className="flex-1 rounded-2xl bg-[#087fc0] px-5 py-3 text-center font-black text-white shadow-lg hover:bg-[#076da5]">
                  Play now
                </Link>
                <button onClick={() => setSelected(null)} className="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700">
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
