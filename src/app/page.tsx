import Link from "next/link";
import {
  ArrowRight,
  Award,
  Brain,
  Calculator,
  ChartNoAxesCombined,
  CheckCircle2,
  Flame,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  PlayCircle,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const topics = [
  {
    name: "Number Sense",
    detail: "Numbers, place value and mental maths",
    icon: Calculator,
    tone: "from-[#5B5CE2] to-[#7C5CFF]",
    soft: "bg-[#EEF0FF] text-[#5148C8]",
  },
  {
    name: "Arithmetic",
    detail: "Operations, fractions and decimals",
    icon: Brain,
    tone: "from-[#FF7A59] to-[#FF4F81]",
    soft: "bg-[#FFF0EC] text-[#E85D43]",
  },
  {
    name: "Problem Solving",
    detail: "Build reasoning and mathematical thinking",
    icon: Sparkles,
    tone: "from-[#00B8A9] to-[#19C9D8]",
    soft: "bg-[#E8FBF8] text-[#008F84]",
  },
  {
    name: "Geometry",
    detail: "Shapes, space, measurement and patterns",
    icon: ChartNoAxesCombined,
    tone: "from-[#FFB000] to-[#FFCF4A]",
    soft: "bg-[#FFF8DF] text-[#B87900]",
  },
];

const benefits = [
  { icon: PlayCircle, title: "Learn visually", text: "Short guided lessons make tricky ideas easier to understand." },
  { icon: Target, title: "Practise smart", text: "Focused questions help learners strengthen the skills they need most." },
  { icon: Trophy, title: "Earn rewards", text: "XP, streaks and achievements turn practice into a motivating habit." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F8FF] text-[#17204A]">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B5CE2] via-[#7C5CFF] to-[#FF5E7A] text-lg font-black text-white shadow-lg shadow-[#6B61E8]/25">
              F
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#FFD34E] ring-2 ring-white" />
            </div>
            <div>
              <p className="text-sm font-black tracking-wide text-[#20265B]">FAHI VISSNUN</p>
              <p className="text-xs font-medium text-[#7B819F]">Math Learning Platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[#5B5CE2] transition hover:bg-[#F0F0FF] sm:inline-flex">
              Dashboard
            </Link>
            <Link href="/login" className="rounded-xl bg-[#20265B] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#20265B]/15 transition hover:-translate-y-0.5 hover:bg-[#303878]">
              Student Login
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate bg-gradient-to-br from-[#5B5CE2] via-[#6359E8] to-[#8B5CF6] text-white">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#19C9D8]/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#FF5E7A]/30 blur-3xl" />
        <div className="absolute right-[18%] top-10 h-24 w-24 rounded-full bg-[#FFD34E]/20 blur-2xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#FFF3B0] shadow-lg shadow-black/5 backdrop-blur">
              <Sparkles size={14} /> Learn • Practise • Master
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Maths can be <span className="text-[#FFD84D]">fun.</span>
              <br />
              Let&apos;s make it <span className="text-[#9EF5EF]">addictive.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-indigo-50 sm:text-lg">
              A colourful, game-inspired learning experience for FAHI VISSNUN students — build confidence, practise at your level and celebrate every little win.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFD34E] px-6 py-3.5 font-black text-[#242652] shadow-xl shadow-[#241D68]/20 transition hover:-translate-y-1 hover:bg-[#FFE078]">
                Start Learning <ArrowRight size={19} />
              </Link>
              <a href="#topics" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20">
                Explore Topics
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-indigo-100">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#9EF5EF]" /> Student-first</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#FFD34E]" /> Instant feedback</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#FFB6C7]" /> Progress tracking</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="absolute -right-3 top-2 hidden rotate-6 rounded-2xl bg-[#FFD34E] px-4 py-2 text-sm font-black text-[#40370A] shadow-xl sm:block">
              ⭐ Keep going!
            </div>
            <div className="absolute -left-3 bottom-8 hidden -rotate-6 rounded-2xl bg-[#19C9D8] px-4 py-2 text-sm font-black text-[#063E43] shadow-xl sm:block">
              +25 XP ⚡
            </div>

            <div className="w-full max-w-md rounded-[2rem] border border-white/25 bg-white/95 p-5 text-[#20265B] shadow-2xl shadow-[#241D68]/25 backdrop-blur sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A59] to-[#FF4F81] text-white shadow-lg shadow-[#FF5E7A]/20">
                    <GraduationCap size={25} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8A8FAA]">Today&apos;s mission</p>
                    <p className="text-lg font-black">Number Ninja</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[#FFF6D7] px-2.5 py-1 text-xs font-black text-[#A36A00]"><Flame size={14} /> 3 day</div>
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#EEF0FF] to-[#F9F0FF] p-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Daily progress</span><span className="text-[#6359E8]">2 / 10</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white shadow-inner">
                  <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-[#5B5CE2] to-[#19C9D8]" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#7B819F]">
                  <span>8 questions to go</span><span className="text-[#FF5E7A]">+80 XP possible</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-[#F3F4FF] p-3"><Star className="mx-auto text-[#FFB000]" size={19} fill="currentColor" /><p className="mt-1 text-lg font-black">120</p><p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8FAA]">XP</p></div>
                <div className="rounded-2xl bg-[#FFF0EC] p-3"><Flame className="mx-auto text-[#FF5E7A]" size={19} fill="currentColor" /><p className="mt-1 text-lg font-black">3</p><p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8FAA]">Streak</p></div>
                <div className="rounded-2xl bg-[#EAFBF8] p-3"><Award className="mx-auto text-[#00A99B]" size={19} /><p className="mt-1 text-lg font-black">4</p><p className="text-[10px] font-bold uppercase tracking-wide text-[#8A8FAA]">Badges</p></div>
              </div>

              <Link href="/login" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20265B] px-5 py-3.5 font-black text-white transition hover:bg-[#303878]">
                Continue Mission <Zap size={17} className="text-[#FFD34E]" fill="currentColor" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white px-5 py-8 shadow-sm sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex gap-4 rounded-2xl p-3 sm:p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${index === 0 ? "bg-[#EEF0FF] text-[#5B5CE2]" : index === 1 ? "bg-[#EAFBF8] text-[#00A99B]" : "bg-[#FFF3D9] text-[#E7A000]"}`}>
                <Icon size={23} />
              </div>
              <div><h3 className="font-black text-[#20265B]">{title}</h3><p className="mt-1 text-sm leading-5 text-[#7B819F]">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="topics" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#FF5E7A]">Pick your adventure</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#20265B] sm:text-4xl">Every topic has a challenge.</h2>
            <p className="mt-3 text-base leading-7 text-[#727895]">Learn the idea, practise the skill and watch your mastery grow — one colourful challenge at a time.</p>
          </div>
          <div className="hidden rounded-full bg-[#EEF0FF] px-4 py-2 text-sm font-bold text-[#5B5CE2] sm:block">4 learning paths ready</div>
        </div>

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map(({ name, detail, icon: Icon, tone, soft }) => (
            <article key={name} className="group relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_10px_30px_rgba(42,48,105,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(42,48,105,0.14)]">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tone}`} />
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${soft}`}><Icon size={26} /></div>
              <h3 className="mt-5 text-xl font-black text-[#20265B]">{name}</h3>
              <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#7B819F]">{detail}</p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-black text-[#5B5CE2] transition group-hover:gap-2.5">Explore <ArrowRight size={16} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16 lg:px-8 lg:pb-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#20265B] px-6 py-10 text-white shadow-2xl sm:px-10 lg:px-14">
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-[#7C5CFF]/30 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#19C9D8]/20 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#FFD34E]"><Gamepad2 size={15} /> Your next level starts here</div>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">Ready to become a maths champion?</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100 sm:text-base">Start with a challenge, build your streak and turn small daily wins into big progress.</p>
            </div>
            <Link href="/login" className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#FFD34E] px-6 py-3.5 font-black text-[#242652] shadow-xl transition hover:-translate-y-1 hover:bg-[#FFE078]">Start Learning <ArrowRight size={19} /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E9EAF5] bg-white px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-[#7B819F] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 FAHI VISSNUN Learning Institute · Mathematics Learning Platform</p>
          <p className="font-semibold text-[#5B5CE2]">Learn • Practise • Master</p>
        </div>
      </footer>
    </main>
  );
}
