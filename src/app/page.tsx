import { ArrowRight, Brain, Calculator, ChartNoAxesCombined, Sparkles, Trophy } from "lucide-react";

const topics = [
  { name: "Number Sense", detail: "Numbers, place value and mental maths", icon: Calculator },
  { name: "Arithmetic", detail: "Operations, fractions and decimals", icon: Brain },
  { name: "Problem Solving", detail: "Build reasoning and mathematical thinking", icon: Sparkles },
  { name: "Geometry", detail: "Shapes, space, measurement and patterns", icon: ChartNoAxesCombined },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-xl font-black text-white">F</div>
            <div>
              <p className="text-sm font-bold tracking-wide text-navy">FAHI VISSNUN</p>
              <p className="text-xs text-slate-500">Math Learning Platform</p>
            </div>
          </div>
          <button className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d2a52]">
            Student Login
          </button>
        </div>
      </header>

      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#e2b75d]">
              <Sparkles size={14} /> Learn • Practise • Master
            </span>
            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Mathematics made <span className="text-[#e2b75d]">clear, engaging and rewarding.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              A KooBits-inspired learning experience designed for FAHI VISSNUN students — with guided practice, instant feedback and progress that grows with every question.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e2b75d] px-5 py-3 font-bold text-navy shadow-lg transition hover:brightness-105">
                Start Learning <ArrowRight size={18} />
              </button>
              <button className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/15">
                Explore Topics
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Today&apos;s progress</p>
                  <p className="mt-1 text-2xl font-black">Ready to learn?</p>
                </div>
                <Trophy className="text-[#e2b75d]" size={28} />
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[8%] rounded-full bg-[#e2b75d]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-black/10 p-3"><p className="text-xl font-black">0</p><p className="text-[11px] text-slate-300">Questions</p></div>
                <div className="rounded-2xl bg-black/10 p-3"><p className="text-xl font-black">0</p><p className="text-[11px] text-slate-300">XP</p></div>
                <div className="rounded-2xl bg-black/10 p-3"><p className="text-xl font-black">0</p><p className="text-[11px] text-slate-300">Streak</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-teal">Learning pathway</p>
          <h2 className="mt-2 text-3xl font-black text-navy sm:text-4xl">Choose what you want to practise.</h2>
          <p className="mt-3 text-slate-600">The foundation is designed to make every future lesson, question and mastery feature fit into one consistent student experience.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map(({ name, detail, icon: Icon }) => (
            <article key={name} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal"><Icon size={23} /></div>
              <h3 className="mt-5 text-lg font-extrabold text-navy">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-teal">Coming next <ArrowRight size={15} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-3 lg:px-8">
          <div><p className="text-3xl font-black text-navy">01</p><p className="mt-1 font-bold">Learn</p><p className="mt-1 text-sm text-slate-500">Understand concepts with guided lessons.</p></div>
          <div><p className="text-3xl font-black text-navy">02</p><p className="mt-1 font-bold">Practise</p><p className="mt-1 text-sm text-slate-500">Build confidence through targeted questions.</p></div>
          <div><p className="text-3xl font-black text-navy">03</p><p className="mt-1 font-bold">Master</p><p className="mt-1 text-sm text-slate-500">Track progress and strengthen weak areas.</p></div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-5 py-8 text-sm text-slate-500 lg:px-8">
        © 2026 FAHI VISSNUN Learning Institute · Mathematics Learning Platform
      </footer>
    </main>
  );
}
