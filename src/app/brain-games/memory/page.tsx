import Link from "next/link";
import { ArrowLeft, Lock, Play, Flame, Sparkles } from "lucide-react";
import CategoryGameIllustration from "@/components/brain-games/CategoryGameIllustration";

const games = [
  { title: "Memory Tiles", description: "🧠 Can you remember?", href: "/brain-games/memory-tiles", reward: "+30 XP", difficulty: "⭐⭐", active: true, illustration: "memory", badge: "✨ NEW" },
  { title: "Flash Memory", description: "⚡ Remember it fast!", href: "/brain-games/flash-memory", reward: "+25 XP", difficulty: "⭐", active: true, illustration: "flash", badge: "" },
  { title: "Hidden Numbers", description: "🔎 Can you find them?", href: "/brain-games/hidden-numbers", reward: "+30 XP", difficulty: "⭐⭐", active: false, illustration: "hidden", badge: "" },
  { title: "What's Missing?", description: "👀 Spot what is missing!", href: "/brain-games/whats-missing", reward: "+30 XP", difficulty: "⭐⭐", active: false, illustration: "missing", badge: "" },
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
          <Link href="/brain-games" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white"><ArrowLeft size={13} /> Brain Games</Link>
          <div className="text-[10px] font-black tracking-widest text-violet-500">MEMORY ✨</div>
          <Link href="/dashboard" className="rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white">Home</Link>
        </header>

        <section className="px-1 pb-2 pt-0.5 text-center sm:pb-2.5">
          <h1 className="text-lg font-black leading-tight text-slate-800 sm:text-xl">🧠 MEMORY</h1>
        </section>

        <nav className="flex gap-1.5 overflow-x-auto border-y border-sky-100 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(([icon, title, href]) => (
            <Link key={href} href={`/brain-games/${href}`} className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black sm:text-[10px] ${href === "memory" ? "border-violet-400 bg-violet-500 text-white" : "border-transparent bg-white text-slate-500 hover:border-sky-100"}`}><span>{icon}</span>{title}</Link>
          ))}
        </nav>

        <section className="mt-2.5">
          <Link href="/brain-games/daily-challenge" className="group mb-2 flex items-center justify-between overflow-hidden rounded-2xl border border-orange-100 bg-white px-3 py-2 shadow-[0_4px_14px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,.09)]">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Flame size={17} fill="currentColor" /></div>
              <div className="min-w-0"><div className="flex items-center gap-1 text-[10px] font-black text-orange-500"><Sparkles size={10} /> DAILY MEMORY CHALLENGE</div><p className="truncate text-[9px] font-bold text-slate-400">A quick challenge to test your memory today!</p></div>
            </div>
            <span className="shrink-0 rounded-lg bg-orange-500 px-2.5 py-1.5 text-[9px] font-black text-white transition group-hover:scale-105">PLAY →</span>
          </Link>

          <div className="mb-1.5 flex items-center justify-between px-1"><h2 className="text-sm font-black text-slate-800 sm:text-base">What do you want to play? 🎮</h2><span className="text-[8px] font-black text-violet-400">4 GAMES</span></div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {games.map((game) => (
              <article key={game.title} className={`group rounded-2xl border border-white bg-white p-1.5 shadow-[0_4px_14px_rgba(15,23,42,.07)] transition duration-200 ${game.active ? "hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,.1)]" : ""}`}>
                <div className="relative h-28 overflow-hidden rounded-xl bg-slate-50 sm:h-32">
                  {game.badge && <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-white px-1.5 py-0.5 text-[7px] font-black text-pink-500 shadow-sm">{game.badge}</span>}
                  {!game.active && <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-white/95 px-1.5 py-0.5 text-[7px] font-black text-slate-400 shadow-sm">🔒 SOON</span>}
                  <div className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white px-1.5 py-0.5 text-[7px] font-black text-violet-500 shadow-sm">{game.reward}</div>
                  <div className="h-full w-full transition duration-200 group-hover:scale-[1.05]"><CategoryGameIllustration type={game.illustration} /></div>
                </div>
                <div className="px-0.5 pt-1.5">
                  <div className="flex items-center justify-between gap-1"><h3 className="truncate text-[12px] font-black text-slate-800 sm:text-[13px]">{game.title}</h3>{!game.active && <Lock size={10} className="shrink-0 text-slate-300" />}</div>
                  <div className="mt-0.5 flex items-center justify-between gap-1"><p className="truncate text-[9px] font-bold text-slate-400">{game.description}</p><span className="shrink-0 text-[7px] font-black text-amber-400">{game.difficulty}</span></div>
                  {game.active ? <Link href={game.href} className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-violet-500 px-2 py-1.5 text-[10px] font-black text-white transition hover:bg-violet-600 hover:scale-[1.01]"><Play size={10} fill="currentColor" /> PLAY</Link> : <span className="mt-1.5 inline-flex w-full items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-[9px] font-black text-slate-400">Coming Soon</span>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-2 pb-1 text-center text-[9px] font-black text-slate-400">🌟 Play every day and make your memory stronger! 🌟</p>
      </div>
    </main>
  );
}
