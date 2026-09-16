import Link from "next/link";
import { ArrowLeft, Lock, Play } from "lucide-react";
import CategoryGameIllustration from "@/components/brain-games/CategoryGameIllustration";

const games = [
  { title: "Memory Tiles", description: "Match each math equation with its answer.", href: "/brain-games/memory-tiles", reward: "+30 XP", active: true, illustration: "memory" },
  { title: "Flash Memory", description: "Watch a number sequence and rebuild it from memory.", href: "/brain-games/flash-memory", reward: "+25 XP", active: true, illustration: "flash" },
  { title: "Hidden Numbers", description: "Find and remember hidden numbers around the scene.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false, illustration: "hidden" },
  { title: "What's Missing?", description: "Remember the set and spot the missing number.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false, illustration: "missing" },
];

const categories = [
  ["🧠", "Memory", "memory"], ["🔄", "Flexibility", "flexibility"], ["⚡", "Speed", "speed"],
  ["🎯", "Attention", "attention"], ["🧩", "Problem Solving", "problem-solving"], ["🗺️", "Adventure", "adventure"],
] as const;

export default function MemoryPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef8ff] px-3 py-3 text-[#17395f] sm:px-5 sm:py-4">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
          <Link href="/brain-games" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200"><ArrowLeft size={15} /> Brain Games</Link>
          <div className="text-xs font-black text-violet-500 sm:text-sm">MEMORY GAMES</div>
          <Link href="/dashboard" className="rounded-full px-3 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-100">Home</Link>
        </header>

        <section className="relative mt-3 overflow-hidden rounded-[28px] border-2 border-white bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-4 py-5 text-center shadow-[0_12px_30px_rgba(59,130,246,.16)] sm:py-6">
          <div className="pointer-events-none absolute left-8 top-4 text-xl text-white/70">✦</div>
          <div className="pointer-events-none absolute right-10 top-8 text-2xl text-yellow-200">★</div>
          <div className="pointer-events-none absolute bottom-3 left-[18%] text-lg text-white/60">✦</div>
          <div className="pointer-events-none absolute bottom-4 right-[20%] text-lg text-yellow-200/80">★</div>
          <div className="relative">
            <div className="text-[11px] font-black uppercase tracking-[.2em] text-white/90 sm:text-xs">MEMORY MAGIC</div>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">Let’s Play &amp; Remember! 🎉</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-5 text-white/95 sm:text-base">Can you remember the numbers, match the tiles and beat your best?</p>
            <div className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-violet-600 shadow-sm sm:text-sm">⭐ Remember • Match • Win! ⭐</div>
          </div>
        </section>

        <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(([icon, title, href]) => (
            <Link key={href} href={`/brain-games/${href}`} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black sm:text-xs ${href === "memory" ? "border-violet-400 bg-violet-500 text-white shadow-sm" : "border-white bg-white text-slate-500 shadow-sm hover:-translate-y-0.5"}`}>
              <span>{icon}</span>{title}
            </Link>
          ))}
        </nav>

        <section className="mt-4">
          <div className="mb-3 px-1">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-400">Your memory playground</div>
            <h2 className="mt-0.5 text-2xl font-black text-slate-800 sm:text-3xl">Pick your challenge! 🎮</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((game) => (
              <article key={game.title} className={`group overflow-hidden rounded-[22px] border-2 border-white bg-white shadow-[0_7px_20px_rgba(15,23,42,.08)] transition duration-300 ${game.active ? "hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(15,23,42,.14)]" : "opacity-90"}`}>
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 sm:h-36">
                  <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/15" />
                  <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-cyan-300/15" />
                  <div className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white/25 px-2 py-1 text-[8px] font-black text-white backdrop-blur">{game.active ? "READY!" : "SOON!"}</div>
                  <div className="absolute inset-0 flex items-center justify-center p-1 transition duration-300 group-hover:scale-[1.04]"><div className="h-full w-full text-white"><CategoryGameIllustration type={game.illustration} /></div></div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-violet-700 shadow-sm">{game.reward}</div>
                </div>
                <div className="p-3">
                  <h3 className="text-base font-black leading-tight text-slate-800">{game.title}</h3>
                  <p className="mt-1.5 min-h-9 text-[11px] font-semibold leading-4 text-slate-500">{game.description}</p>
                  <div className="mt-2.5 text-[10px] font-black text-amber-400">★★★★★</div>
                  <div className="mt-2.5">{game.active ? <Link href={game.href} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-2.5 text-xs font-black text-white shadow-sm hover:scale-[1.02]"><Play size={13} fill="currentColor" /> Play!</Link> : <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-400"><Lock size={13} /> Coming Soon</span>}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-4 rounded-2xl border border-white bg-white/80 px-4 py-3 text-center shadow-sm">
          <p className="text-xs font-black text-slate-600 sm:text-sm">🌟 Play a little every day and make your memory super strong! 🌟</p>
        </div>
      </div>
    </main>
  );
}
