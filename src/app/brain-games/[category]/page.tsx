import Link from "next/link";
import { ArrowLeft, Brain, Lock, Play, Sparkles, Star, Zap, Trophy, Timer, Target, Crown } from "lucide-react";

const categories = {
  memory: {
    title: "Memory",
    subtitle: "Train your memory by remembering numbers, equations and patterns.",
    icon: "🧠",
    accent: "from-violet-500 via-purple-500 to-indigo-600",
    soft: "from-violet-50 to-indigo-50",
    badge: "MEMORY MASTER",
    tip: "Remember it. Match it. Master it!",
    games: [
      { title: "Memory Tiles", description: "Match each math equation with its answer.", href: "/brain-games/memory-tiles", reward: "+30 XP", active: true, emoji: "🧠", art: "🔢✨" },
      { title: "Flash Memory", description: "Watch a number sequence and rebuild it from memory.", href: "/brain-games/flash-memory", reward: "+25 XP", active: true, emoji: "⚡", art: "👀🔢" },
      { title: "Hidden Numbers", description: "Find and remember hidden numbers around the scene.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false, emoji: "🔎", art: "🌴🔢" },
      { title: "What's Missing?", description: "Remember the set and spot the missing number.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false, emoji: "❓", art: "🧩🔢" },
    ],
  },
  flexibility: {
    title: "Flexibility",
    subtitle: "Switch strategies, compare choices and arrange numbers in new ways.",
    icon: "🔄",
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
    soft: "from-emerald-50 to-cyan-50",
    badge: "FLEX CHALLENGER",
    tip: "Change your strategy. Find a new way!",
    games: [
      { title: "Number Order", description: "Remember the numbers and rebuild them in the correct order.", href: "/brain-games/number-order", reward: "+30 XP", active: true, emoji: "🔢", art: "1️⃣ 2️⃣ 3️⃣" },
      { title: "Pattern Quest", description: "Discover the rule and continue the changing number pattern.", href: "/brain-games/pattern-quest", reward: "+30 XP", active: true, emoji: "🧩", art: "🔵🟡🔵" },
    ],
  },
  speed: {
    title: "Speed",
    subtitle: "Think quickly and solve number challenges before the clock runs out.",
    icon: "⚡",
    accent: "from-orange-400 via-amber-500 to-rose-500",
    soft: "from-orange-50 to-rose-50",
    badge: "SPEED STAR",
    tip: "Think fast. Build your combo!",
    games: [
      { title: "Number Rush", description: "Solve fast addition challenges and build your combo.", href: "/brain-games/number-rush", reward: "+40 XP", active: true, emoji: "🚀", art: "➕⚡🔢" },
    ],
  },
  attention: {
    title: "Attention",
    subtitle: "Focus carefully, spot details and make accurate decisions.",
    icon: "🎯",
    accent: "from-cyan-400 via-sky-500 to-blue-600",
    soft: "from-cyan-50 to-blue-50",
    badge: "FOCUS HERO",
    tip: "Look closely. Trust your focus!",
    games: [
      { title: "Even or Odd", description: "Quickly identify whether each number is even or odd.", href: "/brain-games/even-odd", reward: "+30 XP", active: true, emoji: "🎯", art: "2️⃣ 5️⃣ 8️⃣" },
    ],
  },
  "problem-solving": {
    title: "Problem Solving",
    subtitle: "Use logic, patterns and mathematical thinking to crack each challenge.",
    icon: "🧩",
    accent: "from-fuchsia-500 via-purple-500 to-violet-600",
    soft: "from-fuchsia-50 to-violet-50",
    badge: "LOGIC LEGEND",
    tip: "Think differently. Crack the puzzle!",
    games: [
      { title: "Pattern Quest", description: "Find the hidden rule and solve the next step.", href: "/brain-games/pattern-quest", reward: "+30 XP", active: true, emoji: "🧩", art: "🔺🔵⭐" },
      { title: "What's Missing?", description: "Work out which number belongs in the missing space.", href: "/brain-games/whats-missing", reward: "+30 XP", active: false, emoji: "🔍", art: "❓➕🔢" },
    ],
  },
  adventure: {
    title: "Adventure",
    subtitle: "Explore playful mathematical challenges and discover what comes next.",
    icon: "🗺️",
    accent: "from-sky-400 via-cyan-500 to-teal-500",
    soft: "from-sky-50 to-teal-50",
    badge: "MATH EXPLORER",
    tip: "Explore. Discover. Keep going!",
    games: [
      { title: "Hidden Numbers", description: "Explore the challenge and uncover hidden numbers.", href: "/brain-games/hidden-numbers", reward: "+30 XP", active: false, emoji: "🗺️", art: "🌴🪙🔢" },
    ],
  },
} as const;

type CategoryKey = keyof typeof categories;
type Game = (typeof categories)[CategoryKey]["games"][number];
type Props = { params: Promise<{ category: string }> };

const categoryOrder: CategoryKey[] = ["memory", "flexibility", "speed", "attention", "problem-solving", "adventure"];

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

  return (
    <main className={`min-h-screen overflow-x-hidden bg-gradient-to-b ${category.soft} to-white px-3 py-4 text-[#17395f] sm:px-6 sm:py-6`}>
      <div className="mx-auto max-w-7xl">
        {/* Small game navigation — intentionally much lighter than the main dashboard navigation. */}
        <header className="flex items-center justify-between rounded-[22px] border-2 border-white bg-white/85 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
          <Link href="/brain-games" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200"><ArrowLeft size={17} /> Brain Games</Link>
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500 sm:flex"><Brain size={15} /> PLAY • THINK • GROW</div>
          <Link href="/dashboard" className="rounded-full px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">Home</Link>
        </header>

        {/* KooBits-inspired category hero: bright, playful and illustration-led without copying their artwork. */}
        <section className={`relative mt-4 overflow-hidden rounded-[34px] bg-gradient-to-br ${category.accent} px-5 py-6 text-white shadow-[0_18px_45px_rgba(56,189,248,.22)] sm:px-8 sm:py-8`}>
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-yellow-300/20" />
          <div className="pointer-events-none absolute left-[42%] top-4 text-3xl opacity-60">✦</div>
          <div className="pointer-events-none absolute right-[34%] bottom-5 text-2xl opacity-50">★</div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-[30px] border-4 border-white/60 bg-white/20 text-6xl shadow-xl backdrop-blur sm:h-28 sm:w-28 sm:text-7xl">
                {category.icon}
                <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-yellow-300 text-sm text-amber-800 shadow">★</span>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black tracking-wide"><Sparkles size={13} /> {category.badge}</div>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{category.title}</h1>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-white/90 sm:text-base">{category.subtitle}</p>
                <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white/95">💡 {category.tip}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[270px] sm:gap-3">
              <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur"><Trophy className="mx-auto" size={20} /><div className="mt-1 text-xl font-black">0</div><div className="text-[10px] font-black uppercase opacity-80">Best</div></div>
              <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur"><Target className="mx-auto" size={20} /><div className="mt-1 text-xl font-black">{category.games.length}</div><div className="text-[10px] font-black uppercase opacity-80">Games</div></div>
              <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur"><Zap className="mx-auto" size={20} /><div className="mt-1 text-xl font-black">+{category.games.reduce((sum, game) => sum + Number(game.reward.replace(/\D/g, "")), 0)}</div><div className="text-[10px] font-black uppercase opacity-80">XP</div></div>
            </div>
          </div>
        </section>

        {/* Category chips make it feel like a game world rather than a plain list page. */}
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryOrder.map((item) => {
            const selected = item === key;
            const itemCategory = categories[item];
            return <Link key={item} href={`/brain-games/${item}`} className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-3 py-2 text-xs font-black transition ${selected ? `border-transparent bg-gradient-to-r ${itemCategory.accent} text-white shadow-md` : "border-white bg-white text-slate-500 shadow-sm hover:-translate-y-0.5"}`}><span>{itemCategory.icon}</span>{itemCategory.title}</Link>;
          })}
        </nav>

        <section className="mt-5">
          <div className="mb-4 flex items-end justify-between px-1">
            <div><div className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Your next challenge</div><h2 className="mt-1 text-2xl font-black sm:text-3xl">Choose a game 🎮</h2></div>
            <div className="hidden items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm sm:flex"><Timer size={14} /> Quick brain workout</div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.games.map((game: Game) => (
              <article key={game.title} className={`group relative overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-[0_10px_28px_rgba(15,23,42,.08)] transition duration-300 ${game.active ? "hover:-translate-y-2 hover:shadow-[0_20px_38px_rgba(15,23,42,.14)]" : "opacity-90"}`}>
                <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${category.accent}`}>
                  <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/15" />
                  <div className="absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-white/10" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black tracking-wide text-white backdrop-blur">{game.active ? "READY TO PLAY" : "COMING SOON"}</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative grid h-28 w-28 place-items-center rounded-[34px] border-4 border-white/70 bg-white/20 text-6xl shadow-2xl backdrop-blur transition duration-300 group-hover:scale-110 group-hover:rotate-2">{game.emoji}<span className="absolute -bottom-3 -right-5 rounded-2xl border-2 border-white/70 bg-white/90 px-2.5 py-1 text-sm font-black text-slate-700 shadow">{game.art}</span></div>
                  </div>
                  <div className="absolute bottom-3 left-4 flex gap-1 text-white/80"><span>★</span><span>★</span><span>★</span></div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="text-2xl font-black text-slate-800">{game.title}</h3><span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-black text-amber-700">{game.reward}</span></div>
                  <p className="mt-2 min-h-12 font-semibold leading-6 text-slate-500">{game.description}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${category.accent} ${game.active ? "w-[8%]" : "w-0"}`} /></div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {game.active ? <Link href={game.href} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${category.accent} px-5 py-3.5 font-black text-white shadow-md transition hover:scale-[1.02]`}><Play size={17} fill="currentColor" /> Play Now</Link> : <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3.5 font-black text-slate-400"><Lock size={16} /> Coming Soon</span>}
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl">{game.active ? "🚀" : "🔒"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-7 flex justify-center pb-4"><Link href="/brain-games" className="inline-flex items-center gap-2 rounded-2xl border-2 border-white bg-white px-6 py-3 font-black text-slate-600 shadow-md transition hover:-translate-y-0.5"><ArrowLeft size={18} /> Back to Brain Games Map</Link></div>
      </div>
    </main>
  );
}
