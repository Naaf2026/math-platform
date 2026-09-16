import Link from "next/link";
import { ArrowLeft, Brain, Lock, Play, Sparkles, Star, Zap } from "lucide-react";

const categories = {
  memory: { title: "Memory", subtitle: "Train your memory by remembering numbers, equations and patterns.", icon: "🧠", accent: "from-violet-500 to-indigo-600", games: [
    { title: "Memory Tiles", description: "Match each math equation with its answer.", href: "/brain-games/memory-tiles", reward: "+30 XP", active: true },
    { title: "Flash Memory", description: "Watch a number sequence and rebuild it from memory.", href: "/brain-games/flash-memory", reward: "+25 XP", active: true },
    { title: "Hidden Numbers", description: "Find and remember hidden numbers around the scene.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false },
    { title: "What's Missing?", description: "Remember the set and spot the missing number.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false },
  ] },
  flexibility: { title: "Flexibility", subtitle: "Switch strategies, compare choices and arrange numbers in new ways.", icon: "🔄", accent: "from-emerald-500 to-teal-600", games: [
    { title: "Number Order", description: "Remember the numbers and rebuild them in the correct order.", href: "/brain-games/number-order", reward: "+30 XP", active: true },
    { title: "Pattern Quest", description: "Discover the rule and continue the changing number pattern.", href: "/brain-games/pattern-quest", reward: "+30 XP", active: true },
  ] },
  speed: { title: "Speed", subtitle: "Think quickly and solve number challenges before the clock runs out.", icon: "⚡", accent: "from-orange-500 to-rose-600", games: [
    { title: "Number Rush", description: "Solve fast addition challenges and build your combo.", href: "/brain-games/number-rush", reward: "+40 XP", active: true },
  ] },
  attention: { title: "Attention", subtitle: "Focus carefully, spot details and make accurate decisions.", icon: "🎯", accent: "from-cyan-500 to-blue-600", games: [
    { title: "Even or Odd", description: "Quickly identify whether each number is even or odd.", href: "/brain-games/even-odd", reward: "+30 XP", active: true },
  ] },
  "problem-solving": { title: "Problem Solving", subtitle: "Use logic, patterns and mathematical thinking to crack each challenge.", icon: "🧩", accent: "from-fuchsia-500 to-purple-600", games: [
    { title: "Pattern Quest", description: "Find the hidden rule and solve the next step.", href: "/brain-games/pattern-quest", reward: "+30 XP", active: true },
    { title: "What's Missing?", description: "Work out which number belongs in the missing space.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false },
  ] },
  adventure: { title: "Adventure", subtitle: "Explore playful mathematical challenges and discover what comes next.", icon: "🗺️", accent: "from-sky-500 to-cyan-600", games: [
    { title: "Hidden Numbers", description: "Explore the challenge and uncover hidden numbers.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false },
  ] },
} as const;

type CategoryKey = keyof typeof categories;
type Game = (typeof categories)[CategoryKey]["games"][number];
type Props = { params: Promise<{ category: string }> };

export default async function BrainGameCategoryPage({ params }: Props) {
  const { category: categoryParam } = await params;
  const key = categoryParam.toLowerCase() as CategoryKey;
  const category = categories[key];

  if (!category) {
    return (
      <main className="grid min-h-screen place-items-center bg-sky-50 p-6 text-center text-[#12375d]">
        <div>
          <div className="text-6xl">🧠</div>
          <h1 className="mt-4 text-3xl font-black">Brain Games</h1>
          <p className="mt-2 font-semibold text-slate-500">This game area could not be found.</p>
          <Link href="/brain-games" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">Back to Map</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_10%_5%,#fff59a,transparent_20%),radial-gradient(circle_at_90%_10%,#b9f5ff,transparent_24%),linear-gradient(135deg,#effcff,#eef7ff_45%,#f9efff)] px-3 py-5 text-[#12375d] sm:px-6 sm:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between rounded-[24px] border-4 border-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-3 py-3 text-white shadow-xl sm:px-5">
          <Link href="/brain-games" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 font-black transition hover:bg-white/25"><ArrowLeft size={18} /> Brain Games Map</Link>
          <div className="hidden items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-black sm:flex"><Brain size={18} /> GAME AREA</div>
          <Link href="/dashboard" className="rounded-full bg-white/15 px-3 py-2 font-black transition hover:bg-white/25">Home</Link>
        </header>
        <section className={`mt-5 overflow-hidden rounded-[34px] border-4 border-white bg-gradient-to-br ${category.accent} p-6 text-white shadow-[0_20px_55px_rgba(14,165,233,.22)] sm:p-9`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-[26px] bg-white/20 text-5xl shadow-inner">{category.icon}</div><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black"><Sparkles size={14} /> BRAIN GAMES</div><h1 className="mt-2 text-4xl font-black sm:text-5xl">{category.title}</h1><p className="mt-2 max-w-2xl font-bold text-white/90">{category.subtitle}</p></div></div>
            <div className="rounded-3xl bg-white/15 px-5 py-4 text-center backdrop-blur"><div className="text-2xl font-black">{category.games.length}</div><div className="text-xs font-black uppercase tracking-wide text-white/80">Games in this area</div></div>
          </div>
        </section>
        <section className="mt-6"><div className="mb-4 px-1"><h2 className="text-2xl font-black sm:text-3xl">Choose a game</h2><p className="font-semibold text-slate-500">More games can be added to this area anytime.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.games.map((game: Game) => <article key={game.title} className={`group overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-lg transition duration-200 ${game.active ? "hover:-translate-y-1 hover:shadow-2xl" : "opacity-90"}`}>
              <div className={`relative h-44 bg-gradient-to-br ${category.accent} p-5`}><div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_28%),radial-gradient(circle_at_80%_70%,white_0,transparent_30%)]" /><div className="relative flex h-full items-end justify-between"><div className="grid h-20 w-20 place-items-center rounded-[24px] border-4 border-white/60 bg-white/20 text-5xl shadow-lg">{category.icon}</div>{game.active ? <div className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow"><Zap className="mr-1 inline" size={14} fill="currentColor" /> Ready</div> : <div className="rounded-full bg-slate-900/60 px-3 py-2 text-xs font-black text-white"><Lock className="mr-1 inline" size={13} /> Coming soon</div>}</div></div>
              <div className="p-5"><h3 className="text-2xl font-black">{game.title}</h3><p className="mt-2 min-h-12 font-semibold leading-6 text-slate-500">{game.description}</p><div className="mt-4 flex items-center justify-between gap-3"><div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-2 text-sm font-black text-amber-700"><Star size={15} fill="currentColor" /> {game.reward}</div>{game.active ? <Link href={game.href} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-black text-white shadow-md transition hover:scale-105"><Play size={17} fill="currentColor" /> Play</Link> : <span className="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-400">Locked</span>}</div></div>
            </article>)}
          </div>
        </section>
        <div className="mt-7 text-center"><Link href="/brain-games" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-slate-700 shadow-lg transition hover:-translate-y-0.5"><ArrowLeft size={18} /> Back to Brain Games Map</Link></div>
      </div>
    </main>
  );
}
