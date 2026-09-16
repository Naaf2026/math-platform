import Link from "next/link";
import { ArrowLeft, Brain, Lock, Play, Sparkles, Star, Zap, Trophy, Timer, Target, Crown } from "lucide-react";
import CategoryGameIllustration from "@/components/brain-games/CategoryGameIllustration";

const categories = {
  memory: {
    title: "Brain Boost",
    subtitle: "Train your memory by remembering numbers, equations and patterns.",
    icon: "🧠",
    accent: "from-violet-500 via-purple-500 to-indigo-600",
    soft: "from-violet-50 to-indigo-50",
    badge: "MEMORY MASTER",
    tip: "Remember it. Match it. Master it!",
    games: [
      { title: "Memory Tiles", description: "Match each math equation with its answer.", href: "/brain-games/memory-tiles", reward: "+30 XP", active: true, illustration: "memory" },
      { title: "Flash Memory", description: "Watch a number sequence and rebuild it from memory.", href: "/brain-games/flash-memory", reward: "+25 XP", active: true, illustration: "flash" },
      { title: "Hidden Numbers", description: "Find and remember hidden numbers around the scene.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false, illustration: "hidden" },
      { title: "What's Missing?", description: "Remember the set and spot the missing number.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false, illustration: "missing" },
    ],
  },
  flexibility: {
    title: "Brain Twist",
    subtitle: "Switch strategies, compare choices and arrange numbers in new ways.",
    icon: "🔄",
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
    soft: "from-emerald-50 to-cyan-50",
    badge: "FLEX CHALLENGER",
    tip: "Change your strategy. Find a new way!",
    games: [
      { title: "Number Order", description: "Remember the numbers and rebuild them in the correct order.", href: "/brain-games/number-order", reward: "+30 XP", active: true, illustration: "order" },
      { title: "Pattern Quest", description: "Discover the rule and continue the changing number pattern.", href: "/brain-games/pattern-quest", reward: "+30 XP", active: true, illustration: "pattern" },
    ],
  },
  speed: {
    title: "Speed Rush",
    subtitle: "Think quickly and solve number challenges before the clock runs out.",
    icon: "⚡",
    accent: "from-orange-400 via-amber-500 to-rose-500",
    soft: "from-orange-50 to-rose-50",
    badge: "SPEED STAR",
    tip: "Think fast. Build your combo!",
    games: [
      { title: "Number Rush", description: "Solve fast addition challenges and build your combo.", href: "/brain-games/number-rush", reward: "+40 XP", active: true, illustration: "rush" },
    ],
  },
  attention: {
    title: "Spot On!",
    subtitle: "Focus carefully, spot details and make accurate decisions.",
    icon: "🎯",
    accent: "from-cyan-400 via-sky-500 to-blue-600",
    soft: "from-cyan-50 to-blue-50",
    badge: "FOCUS HERO",
    tip: "Look closely. Trust your focus!",
    games: [
      { title: "Even or Odd", description: "Quickly identify whether each number is even or odd.", href: "/brain-games/even-odd", reward: "+30 XP", active: true, illustration: "even" },
    ],
  },
  "problem-solving": {
    title: "Puzzle Power",
    subtitle: "Use logic, patterns and mathematical thinking to crack each challenge.",
    icon: "🧩",
    accent: "from-fuchsia-500 via-purple-500 to-violet-600",
    soft: "from-fuchsia-50 to-violet-50",
    badge: "LOGIC LEGEND",
    tip: "Think differently. Crack the puzzle!",
    games: [
      { title: "Pattern Quest", description: "Find the hidden rule and solve the next step.", href: "/brain-games/pattern-quest", reward: "+30 XP", active: true, illustration: "pattern" },
      { title: "What's Missing?", description: "Work out which number belongs in the missing space.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false, illustration: "missing" },
    ],
  },
  adventure: {
    title: "Brain Quest",
    subtitle: "Explore playful mathematical challenges and discover what comes next.",
    icon: "🗺️",
    accent: "from-sky-400 via-cyan-500 to-teal-500",
    soft: "from-sky-50 to-teal-50",
    badge: "MATH EXPLORER",
    tip: "Explore. Discover. Keep going!",
    games: [
      { title: "Hidden Numbers", description: "Explore the challenge and uncover hidden numbers.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false, illustration: "hidden" },
    ],
  },
} as const;

type CategoryKey = keyof typeof categories;
type Game = (typeof categories)[CategoryKey]["games"][number];
type Props = { params: Promise<{ category: string }> };

const categoryOrder: CategoryKey[] = ["memory", "flexibility", "speed", "attention", "problem-solving", "adventure"];

function MemoryCategoryPage({ category }: { category: (typeof categories)["memory"] }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef7ff] px-3 py-3 text-[#17395f] sm:px-5 sm:py-4">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-2xl border border-white/90 bg-white px-3 py-2 shadow-sm">
          <Link href="/brain-games" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-200">
            <ArrowLeft size={15} /> Brain Games
          </Link>
          <div className="hidden items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black tracking-wide text-violet-600 sm:flex">
            <Brain size={14} /> MEMORY WORLD
          </div>
          <Link href="/dashboard" className="rounded-full px-3 py-1.5 text-xs font-black text-slate-500 hover:bg-slate-100">Home</Link>
        </header>

        <section className="relative mt-3 overflow-hidden rounded-[28px] border-2 border-white bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-4 py-4 shadow-[0_12px_30px_rgba(59,130,246,.16)] sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/20" />
          <div className="pointer-events-none absolute bottom-[-55px] left-[38%] h-28 w-28 rounded-full bg-yellow-300/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-[20px] border-2 border-white/80 bg-white/25 text-4xl shadow-lg backdrop-blur sm:h-20 sm:w-20 sm:text-5xl">
                🧠
                <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-yellow-300 text-xs text-amber-800 shadow">★</span>
              </div>
              <div className="min-w-0 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-black tracking-[.12em]">MEMORY MASTER</span>
                  <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-black">4 GAMES</span>
                </div>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Memory</h1>
                <p className="mt-1 max-w-2xl text-xs font-bold leading-5 text-white/90 sm:text-sm">Train your memory with numbers, equations &amp; patterns.</p>
                <div className="mt-1.5 text-[11px] font-black text-white/95">💡 Remember it. Match it. Master it!</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:min-w-[245px] sm:gap-2">
              <div className="rounded-xl border border-white/25 bg-white/15 px-2 py-2 text-center text-white backdrop-blur"><Trophy className="mx-auto" size={16} /><div className="mt-0.5 text-base font-black">0</div><div className="text-[8px] font-black uppercase opacity-80">Best</div></div>
              <div className="rounded-xl border border-white/25 bg-white/15 px-2 py-2 text-center text-white backdrop-blur"><Target className="mx-auto" size={16} /><div className="mt-0.5 text-base font-black">4</div><div className="text-[8px] font-black uppercase opacity-80">Games</div></div>
              <div className="rounded-xl border border-white/25 bg-white/15 px-2 py-2 text-center text-white backdrop-blur"><Zap className="mx-auto" size={16} /><div className="mt-0.5 text-base font-black">+115</div><div className="text-[8px] font-black uppercase opacity-80">XP</div></div>
            </div>
          </div>
        </section>

        <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryOrder.map((item) => {
            const selected = item === "memory";
            const itemCategory = categories[item];
            return (
              <Link key={item} href={`/brain-games/${item}`} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black transition sm:text-xs ${selected ? "border-violet-400 bg-violet-500 text-white shadow-sm" : "border-white bg-white text-slate-500 shadow-sm hover:-translate-y-0.5"}`}>
                <span>{itemCategory.icon}</span>{itemCategory.title}
              </Link>
            );
          })}
        </nav>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <div><div className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">Memory challenges</div><h2 className="mt-0.5 text-xl font-black text-slate-800 sm:text-2xl">Pick a game 🎮</h2></div>
            <div className="hidden items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm sm:flex"><Timer size={13} /> Quick brain workout</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {category.games.map((game) => (
              <article key={game.title} className={`group relative overflow-hidden rounded-[22px] border-2 border-white bg-white shadow-[0_7px_20px_rgba(15,23,42,.08)] transition duration-300 ${game.active ? "hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(15,23,42,.14)]" : "opacity-90"}`}>
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 sm:h-36">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15" />
                  <div className="absolute -bottom-10 -left-5 h-20 w-20 rounded-full bg-cyan-300/15" />
                  <div className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white/20 px-2 py-1 text-[8px] font-black tracking-wide text-white backdrop-blur">{game.active ? "READY" : "COMING SOON"}</div>
                  <div className="absolute inset-0 flex items-center justify-center p-1 transition duration-300 group-hover:scale-[1.04]">
                    <div className="h-full w-full text-white"><CategoryGameIllustration type={game.illustration} /></div>
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-violet-700 shadow-sm">{game.reward}</div>
                </div>
                <div className="p-3">
                  <h3 className="text-base font-black leading-tight text-slate-800">{game.title}</h3>
                  <p className="mt-1.5 min-h-9 text-[11px] font-semibold leading-4 text-slate-500">{game.description}</p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-black text-slate-400"><span className="text-amber-400">★★★★★</span><span>MEMORY</span></div>
                  <div className="mt-2.5">
                    {game.active ? (
                      <Link href={game.href} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:scale-[1.02]"><Play size={13} fill="currentColor" /> Play Now</Link>
                    ) : (
                      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-400"><Lock size={13} /> Coming Soon</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-4 flex items-center justify-between rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex min-w-0 items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500 text-white shadow-sm"><Crown size={18} /></div><div className="min-w-0"><div className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">Daily brain workout</div><p className="truncate text-xs font-black text-slate-700">Play a little every day and build your memory skills.</p></div></div>
          <Link href="/brain-games" className="ml-3 shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white transition hover:scale-[1.02]">All Games</Link>
        </section>
      </div>
    </main>
  );
}

export default async function BrainGameCategoryPage({ params }: Props) {
  const { category: categoryParam } = await params;
  const key = categoryParam.toLowerCase() as CategoryKey;
  const category = categories[key];

  if (!category) {
    return (
      <main className="grid min-h-screen place-items-center bg-sky-50 p-6 text-center text-[#12375d]">
        <div><div className="text-6xl">🧠</div><h1 className="mt-4 text-3xl font-black">Brain Games</h1><p className="mt-2 font-semibold text-slate-500">This game area could not be found.</p><Link href="/brain-games" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-6 py-3 font-black text-white">Back to Map</Link></div>
      </main>
    );
  }

  if (key === "memory") return <MemoryCategoryPage category={category} />;

  return (
    <main className={`min-h-screen overflow-x-hidden bg-gradient-to-b ${category.soft} to-white px-3 py-4 text-[#17395f] sm:px-6 sm:py-6`}>
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between rounded-[22px] border-2 border-white bg-white/85 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
          <Link href="/brain-games" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200"><ArrowLeft size={17} /> Brain Games</Link>
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500 sm:flex"><Brain size={15} /> PLAY • THINK • GROW</div>
          <Link href="/dashboard" className="rounded-full px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">Home</Link>
        </header>

        <section className={`relative mt-4 overflow-hidden rounded-[34px] bg-gradient-to-br ${category.accent} px-5 py-6 text-white shadow-[0_18px_45px_rgba(56,189,248,.22)] sm:px-8 sm:py-8`}>
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-yellow-300/20" />
          <div className="pointer-events-none absolute left-[42%] top-4 text-3xl opacity-60">✦</div>
          <div className="pointer-events-none absolute right-[34%] bottom-5 text-2xl opacity-50">★</div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-[30px] border-4 border-white/60 bg-white/20 text-6xl shadow-xl backdrop-blur sm:h-28 sm:w-28 sm:text-7xl">{category.icon}<span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-yellow-300 text-sm text-amber-800 shadow">★</span></div>
              <div><div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black tracking-wide"><Sparkles size={13} /> {category.badge}</div><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{category.title}</h1><p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-white/90 sm:text-base">{category.subtitle}</p><div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white/95">💡 {category.tip}</div></div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[270px] sm:gap-3">
              <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur"><Trophy className="mx-auto" size={20} /><div className="mt-1 text-xl font-black">0</div><div className="text-[10px] font-black uppercase opacity-80">Best</div></div>
              <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur"><Target className="mx-auto" size={20} /><div className="mt-1 text-xl font-black">{category.games.length}</div><div className="text-[10px] font-black uppercase opacity-80">Games</div></div>
              <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur"><Zap className="mx-auto" size={20} /><div className="mt-1 text-xl font-black">+{category.games.reduce((sum, game) => sum + Number(game.reward.replace(/\D/g, "")), 0)}</div><div className="text-[10px] font-black uppercase opacity-80">XP</div></div>
            </div>
          </div>
        </section>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryOrder.map((item) => { const selected = item === key; const itemCategory = categories[item]; return <Link key={item} href={`/brain-games/${item}`} className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-3 py-2 text-xs font-black transition ${selected ? `border-transparent bg-gradient-to-r ${itemCategory.accent} text-white shadow-md` : "border-white bg-white text-slate-500 shadow-sm hover:-translate-y-0.5"}`}><span>{itemCategory.icon}</span>{itemCategory.title}</Link>; })}
        </nav>

        <section className="mt-5">
          <div className="mb-4 flex items-end justify-between px-1"><div><div className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Your next challenge</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Choose a game 🎮</h2></div><div className="hidden items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm sm:flex"><Timer size={14} /> Quick brain workout</div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.games.map((game: Game) => (
              <article key={game.title} className={`group relative overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-[0_8px_22px_rgba(15,23,42,.08)] transition duration-300 ${game.active ? "hover:-translate-y-1.5 hover:shadow-[0_16px_30px_rgba(15,23,42,.14)]" : "opacity-90"}`}>
                <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${category.accent}`}><div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15" /><div className="absolute -bottom-12 -left-7 h-24 w-24 rounded-full bg-white/10" /><div className="absolute left-3 top-3 z-10 rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-black tracking-wide text-white backdrop-blur">{game.active ? "READY TO PLAY" : "COMING SOON"}</div><div className="absolute inset-0 flex items-center justify-center"><div className="h-full w-full text-white transition duration-300 group-hover:scale-[1.03] group-hover:-rotate-1"><CategoryGameIllustration type={game.illustration} /></div></div><div className="absolute bottom-2 left-3 z-10 flex gap-0.5 text-sm text-white/80"><span>★</span><span>★</span><span>★</span></div></div>
                <div className="p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-xl font-black leading-tight text-slate-800">{game.title}</h3><span className="shrink-0 rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-black text-amber-700">{game.reward}</span></div><p className="mt-2 min-h-10 text-sm font-semibold leading-5 text-slate-500">{game.description}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${category.accent} ${game.active ? "w-[8%]" : "w-0"}`} /></div><div className="mt-3 flex items-center justify-between gap-2">{game.active ? <Link href={game.href} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r ${category.accent} px-4 py-3 text-sm font-black text-white shadow-md transition hover:scale-[1.02]`}><Play size={15} fill="currentColor" /> Play Now</Link> : <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"><Lock size={14} /> Coming Soon</span>}<span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400"><Star size={17} fill="currentColor" /></span></div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-7 rounded-[28px] border-2 border-white bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${category.accent} text-white shadow-md`}><Crown size={27} /></div><div><div className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Brain Games</div><h3 className="text-xl font-black text-slate-800">Keep your brain moving!</h3><p className="mt-1 text-sm font-semibold text-slate-500">Play a little every day and build your math thinking skills.</p></div></div><Link href="/brain-games" className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 font-black text-white transition hover:scale-[1.02]">Back to Brain Games</Link></div></section>
      </div>
    </main>
  );
}