import Link from "next/link";
import { ArrowLeft, Lock, Play, Flame, Sparkles } from "lucide-react";
import CategoryGameIllustration from "@/components/brain-games/CategoryGameIllustration";

const games = [
  { title: "Memory Cards", description: "Match the pairs and train your memory!", href: "/brain-games/memory-tiles", reward: "+30 XP", difficulty: "⭐⭐", active: true, illustration: "memory", badge: "✨ PLAY" },
  { title: "Memory Master", description: "Remember the numbers and recall them!", href: "/brain-games/flash-memory", reward: "+25 XP", difficulty: "⭐", active: true, illustration: "flash", badge: "⚡ FAST" },
  { title: "What’s Inside?", description: "Remember the objects in the mystery box and find what disappeared!", href: "/brain-games/whats-inside", reward: "+30 XP", difficulty: "⭐⭐", active: true, illustration: "inside", badge: "📦 NEW" },
  { title: "Hidden Numbers", description: "Find the hidden numbers before time runs out!", href: "/brain-games/hidden-numbers", reward: "+30 XP", difficulty: "⭐⭐", active: false, illustration: "hidden", badge: "" },
  { title: "What's Missing?", description: "Look carefully and spot what disappeared!", href: "/brain-games/whats-missing", reward: "+30 XP", difficulty: "⭐⭐", active: false, illustration: "missing", badge: "" },
];

const categories = [
  ["🧠", "Brain Boost", "memory"], ["🔄", "Brain Twist", "flexibility"], ["⚡", "Speed Rush", "speed"],
  ["🎯", "Spot On!", "attention"], ["🧩", "Puzzle Power", "problem-solving"], ["🗺️", "Brain Quest", "adventure"],
] as const;

export default function MemoryPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef8ff] px-3 py-2 text-[#17395f] sm:px-5 sm:py-3">
      <div className="mx-auto max-w-6xl">
        <header className="flex h-8 items-center justify-between px-1">
          <Link href="/brain-games" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white"><ArrowLeft size={13} /> Brain Games</Link>
          <Link href="/dashboard" className="rounded-full px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-white">Home</Link>
        </header>
        <section className="relative px-1 pb-3 pt-1 text-center sm:pb-4 sm:pt-1.5">
          <div className="pointer-events-none absolute left-[15%] top-1 text-lg text-pink-400 sm:text-xl">✦</div><div className="pointer-events-none absolute right-[15%] top-3 text-sm text-amber-400 sm:text-lg">✦</div>
          <h1 className="inline-block bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text text-3xl font-black leading-none tracking-tight text-transparent drop-shadow-[0_3px_0_rgba(255,255,255,.95)] sm:text-4xl md:text-5xl" style={{ fontFamily: "'Comic Sans MS', 'Trebuchet MS', cursive" }}>🧠 BRAIN BOOST</h1>
          <p className="mx-auto mt-1 max-w-xl text-[10px] font-bold text-slate-400 sm:text-xs">Train your memory, focus and recall through quick brain games.</p>
        </section>
        <nav className="flex gap-1.5 overflow-x-auto border-y border-sky-100 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map(([icon, title, href]) => <Link key={href} href={`/brain-games/${href}`} className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black sm:text-[10px] ${href === "memory" ? "border-violet-400 bg-violet-500 text-white shadow-sm" : "border-transparent bg-white text-slate-500 hover:border-sky-100"}`}><span>{icon}</span>{title}</Link>)}
        </nav>
        <section className="mt-2.5">
          <Link href="/brain-games/daily-challenge" className="group mb-2 flex items-center justify-between overflow-hidden rounded-2xl border border-orange-100 bg-white px-3 py-2 shadow-[0_4px_14px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,.09)]">
            <div className="flex min-w-0 items-center gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Flame size={17} fill="currentColor" /></div><div className="min-w-0"><div className="flex items-center gap-1 text-[10px] font-black text-orange-500"><Sparkles size={10} /> DAILY MEMORY CHALLENGE</div><p className="truncate text-[9px] font-bold text-slate-400">A quick challenge to test your memory today!</p></div></div>
            <span className="shrink-0 rounded-lg bg-orange-500 px-2.5 py-1.5 text-[9px] font-black text-white transition group-hover:scale-105">PLAY →</span>
          </Link>
          <div className="mb-1.5 flex items-center justify-between px-1"><h2 className="text-sm font-black text-slate-800 sm:text-base">Choose your memory challenge 🎮</h2><span className="text-[8px] font-black text-violet-400">5 GAMES</span></div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {games.map((game) => <article key={game.title} className={`group overflow-hidden rounded-[22px] border border-white bg-white p-1.5 shadow-[0_5px_18px_rgba(15,23,42,.08)] transition duration-200 ${game.active ? "hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(15,23,42,.12)]" : "opacity-90"}`}>
              <div className="relative h-32 overflow-hidden rounded-[17px] bg-gradient-to-br from-sky-50 via-white to-violet-50 sm:h-36">
                {game.badge && <span className="absolute left-2 top-2 z-30 rounded-full bg-white px-2 py-1 text-[7px] font-black text-violet-600 shadow-md">{game.badge}</span>}
                {!game.active && <span className="absolute left-2 top-2 z-30 rounded-full bg-white/95 px-2 py-1 text-[7px] font-black text-slate-400 shadow-md">🔒 SOON</span>}
                <div className="h-full w-full transition duration-300 group-hover:scale-[1.06]"><CategoryGameIllustration type={game.illustration} /></div>
              </div>
              <div className="px-1 pt-2"><div className="flex items-center justify-between gap-1"><h3 className="truncate text-[13px] font-black text-slate-800 sm:text-sm">{game.title}</h3>{!game.active && <Lock size={11} className="shrink-0 text-slate-300" />}</div><p className="mt-0.5 min-h-[25px] text-[9px] font-bold leading-3 text-slate-400 sm:text-[10px]">{game.description}</p><div className="mt-1 flex items-center justify-between"><span className="text-[8px] font-black text-amber-400">{game.difficulty}</span><span className="text-[8px] font-black text-violet-400">{game.reward}</span></div>{game.active ? <Link href={game.href} className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-violet-500 px-2 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-violet-600 hover:scale-[1.01]"><Play size={10} fill="currentColor" /> PLAY NOW</Link> : <span className="mt-1.5 inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-2 py-2 text-[9px] font-black text-slate-400">Coming Soon</span>}</div>
            </article>)}
          </div>
        </section>
        <p className="mt-3 pb-1 text-center text-[9px] font-black text-slate-400">🌟 Play every day and make your memory stronger! 🌟</p>
      </div>
    </main>
  );
}
