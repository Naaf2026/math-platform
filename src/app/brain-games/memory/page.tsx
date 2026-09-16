import Link from "next/link";
import { ArrowLeft, Lock, Play } from "lucide-react";
import CategoryGameIllustration from "@/components/brain-games/CategoryGameIllustration";

const games = [
  { title: "Memory Tiles", description: "Match equations with answers.", href: "/brain-games/memory-tiles", reward: "+30 XP", active: true, illustration: "memory" },
  { title: "Flash Memory", description: "Remember the number sequence.", href: "/brain-games/flash-memory", reward: "+25 XP", active: true, illustration: "flash" },
  { title: "Hidden Numbers", description: "Find hidden numbers.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false, illustration: "hidden" },
  { title: "What's Missing?", description: "Spot the missing number.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false, illustration: "missing" },
];

const categories = [
  ["🧠", "Memory", "memory"], ["🔄", "Flexibility", "flexibility"], ["⚡", "Speed", "speed"],
  ["🎯", "Attention", "attention"], ["🧩", "Problem Solving", "problem-solving"], ["🗺️", "Adventure", "adventure"],
] as const;

export default function MemoryPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef8ff] px-3 py-2 text-[#17395f] sm:px-5 sm:py-3">
      <div className="mx-auto max-w-6xl">
        {/* Small KooBits-style top bar */}
        <header className="flex h-9 items-center justify-between px-1">
          <Link href="/brain-games" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white">
            <ArrowLeft size={13} /> Brain Games
          </Link>
          <div className="text-[10px] font-black tracking-widest text-violet-500">MEMORY ✨</div>
          <Link href="/dashboard" className="rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white">Home</Link>
        </header>

        {/* Text-only, compact child-focused header */}
        <section className="px-1 pb-2 pt-1 text-center sm:pb-3">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-400">🧠 MEMORY MAGIC</div>
          <h1 className="mt-0.5 text-xl font-black leading-tight text-slate-800 sm:text-2xl">Let’s Play &amp; Remember! 🎉</h1>
          <p className="mx-auto mt-0.5 max-w-xl text-[11px] font-bold text-slate-500 sm:text-xs">Remember it • Match it • Beat your best! ⭐</p>
        </section>

        {/* Category filter stays compact */}
        <nav className="flex gap-1.5 overflow-x-auto border-y border-sky-100 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(([icon, title, href]) => (
            <Link key={href} href={`/brain-games/${href}`} className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black sm:text-[10px] ${href === "memory" ? "border-violet-400 bg-violet-500 text-white" : "border-transparent bg-white text-slate-500 hover:border-sky-100"}`}>
              <span>{icon}</span>{title}
            </Link>
          ))}
        </nav>

        <section className="mt-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-base font-black text-slate-800 sm:text-lg">Pick a game! 🎮</h2>
            <span className="text-[9px] font-black text-violet-400">4 MEMORY GAMES</span>
          </div>

          {/* Small flat cards — no colored card header */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {games.map((game) => (
              <article key={game.title} className={`group rounded-2xl border border-white bg-white p-2.5 shadow-[0_4px_14px_rgba(15,23,42,.07)] transition duration-200 ${game.active ? "hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,.1)]" : "opacity-75"}`}>
                <div className="relative h-24 overflow-hidden rounded-xl bg-slate-50 sm:h-28">
                  <div className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white px-1.5 py-0.5 text-[7px] font-black text-violet-500 shadow-sm">{game.reward}</div>
                  <div className="h-full w-full transition duration-200 group-hover:scale-[1.03]">
                    <CategoryGameIllustration type={game.illustration} />
                  </div>
                </div>
                <div className="px-0.5 pt-2">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="truncate text-[12px] font-black text-slate-800 sm:text-[13px]">{game.title}</h3>
                    {!game.active && <Lock size={11} className="shrink-0 text-slate-300" />}
                  </div>
                  <p className="mt-0.5 h-7 overflow-hidden text-[9px] font-semibold leading-3.5 text-slate-400">{game.description}</p>
                  {game.active ? (
                    <Link href={game.href} className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-violet-500 px-2 py-1.5 text-[10px] font-black text-white hover:bg-violet-600">
                      <Play size={10} fill="currentColor" /> Play!
                    </Link>
                  ) : (
                    <span className="mt-1.5 inline-flex w-full items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-[9px] font-black text-slate-400">Coming Soon</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-3 pb-1 text-center text-[10px] font-black text-slate-400">🌟 Play every day and make your memory stronger! 🌟</p>
      </div>
    </main>
  );
}
