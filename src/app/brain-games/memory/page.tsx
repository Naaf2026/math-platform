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
        <header className="flex h-8 items-center justify-between px-1">
          <Link href="/brain-games" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black text-slate-500 transition hover:bg-white">
            <ArrowLeft size={12} /> Brain Games
          </Link>
          <div className="text-[9px] font-black tracking-[.16em] text-violet-500">MEMORY ✨</div>
          <Link href="/dashboard" className="rounded-full px-2 py-1 text-[10px] font-black text-slate-500 transition hover:bg-white">Home</Link>
        </header>

        <section className="px-1 pb-2 pt-1 text-center sm:pb-2.5">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-400">🧠 MEMORY MAGIC</div>
          <h1 className="mt-0.5 text-lg font-black leading-tight text-slate-800 sm:text-xl">Ready to Remember? 🎉</h1>
          <p className="mx-auto mt-0.5 max-w-xl text-[10px] font-bold text-slate-500 sm:text-[11px]">Remember it • Match it • Beat your best! ⭐</p>
        </section>

        <nav className="flex gap-1.5 overflow-x-auto border-y border-sky-100 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(([icon, title, href]) => (
            <Link key={href} href={`/brain-games/${href}`} className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black sm:text-[10px] ${href === "memory" ? "border-violet-400 bg-violet-500 text-white" : "border-transparent bg-white text-slate-500 hover:border-sky-100"}`}>
              <span>{icon}</span>{title}
            </Link>
          ))}
        </nav>

        <section className="mt-2.5 sm:mt-3">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-800 sm:text-base">Ready to play? 🎮</h2>
            <span className="text-[8px] font-black text-violet-400 sm:text-[9px]">4 GAMES</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {games.map((game) => (
              <article key={game.title} className={`group rounded-2xl border border-white bg-white p-2 shadow-[0_3px_12px_rgba(15,23,42,.06)] transition duration-200 ${game.active ? "hover:-translate-y-0.5 hover:shadow-[0_7px_16px_rgba(15,23,42,.1)]" : "opacity-75"}`}>
                <div className="relative h-28 overflow-hidden rounded-xl bg-slate-50 sm:h-32">
                  <div className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white/95 px-1.5 py-0.5 text-[7px] font-black text-violet-500 shadow-sm">{game.reward}</div>
                  <div className="h-full w-full transition duration-200 group-hover:scale-[1.03]">
                    <CategoryGameIllustration type={game.illustration} />
                  </div>
                </div>

                <div className="px-0.5 pt-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="truncate text-[11px] font-black text-slate-800 sm:text-[12px]">{game.title}</h3>
                    {!game.active && <Lock size={10} className="shrink-0 text-slate-300" />}
                  </div>
                  <p className="mt-0.5 h-6 overflow-hidden text-[8px] font-semibold leading-3 text-slate-400">{game.description}</p>
                  {game.active ? (
                    <Link href={game.href} className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-violet-500 px-2 py-1.5 text-[9px] font-black text-white transition hover:bg-violet-600">
                      <Play size={9} fill="currentColor" /> Play!
                    </Link>
                  ) : (
                    <span className="mt-1.5 inline-flex w-full items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-[8px] font-black text-slate-400">Coming Soon</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-2.5 pb-1 text-center text-[9px] font-black text-slate-400">🌟 Play every day and make your memory stronger! 🌟</p>
      </div>
    </main>
  );
}
