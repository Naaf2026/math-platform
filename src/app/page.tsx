"use client";

import Link from "next/link";
import { ArrowRight, Brain, Gift, Menu, Search, Sparkles, Star, Trophy, Users, X } from "lucide-react";
import { useState } from "react";
import LearnerLoginModal from "@/components/learner-login-modal";

const activities = [
  { title: "Visual Maths", text: "Explore concepts with videos, visuals and examples.", href: "/visual-questions", image: "/homepage-artwork/visual-maths.webp", tone: "from-violet-100 to-indigo-50" },
  { title: "Daily Challenge", text: "A new challenge every day to build your skills.", href: "/challenge", image: "/homepage-artwork/daily-challenge.webp", tone: "from-amber-100 to-orange-50" },
  { title: "Revision", text: "Practise past topics and strengthen your skills.", href: "/revision", image: "/homepage-artwork/revision.webp", tone: "from-sky-100 to-cyan-50" },
  { title: "Brain Games", text: "Fun games to boost your thinking skills.", href: "/brain-games", image: "/homepage-artwork/brain-games.webp", tone: "from-cyan-100 to-blue-50" },
  { title: "Buddy Challenge", text: "Challenge your friends and learn together.", href: "/peer-challenge/select", image: "/homepage-artwork/buddy-challenge.webp", tone: "from-emerald-100 to-teal-50" },
  { title: "Leaderboard", text: "See how you're doing and climb to the top!", href: "/leaderboard", image: "/homepage-artwork/leaderboard.webp", tone: "from-yellow-100 to-amber-50" },
  { title: "Rewards", text: "Earn Mind Sparks and unlock exciting rewards.", href: "/rewards", image: "/homepage-artwork/rewards.webp", tone: "from-fuchsia-100 to-purple-50" },
];

const nav = [
  ["Home", "/"], ["Learn", "/learn"], ["Challenge", "/challenge"],
  ["Games", "/brain-games"], ["Leaderboard", "/leaderboard"], ["Rewards", "/rewards"],
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [learnerLoginOpen, setLearnerLoginOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#eef8ff] text-[#082b61] student-dashboard-font">
      <LearnerLoginModal open={learnerLoginOpen} onClose={() => setLearnerLoginOpen(false)} />
      <header className="sticky top-0 z-50 border-b border-[#dcecf8] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center gap-6 px-5 lg:px-8">
          <Link href="/" className="flex min-w-fit items-center gap-3">
            <img
              src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }}
              alt="ފަހި ހިސާބު — The Maldives Maths Learning Hub"
              className="hidden h-14 w-auto max-w-[230px] object-contain sm:max-w-[290px]"
              onLoad={(event) => { event.currentTarget.classList.remove("hidden"); event.currentTarget.nextElementSibling?.classList.add("hidden"); }}
            />
            <div className="leading-tight">
              <div lang="dv" dir="rtl" className="text-[21px] font-black text-[#082b61]">ފަހި ހިސާބު</div>
              <div className="mt-1 text-[9px] font-extrabold text-[#1595e7]">The Maldives Maths Learning Hub</div>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-7 lg:flex">
            {nav.map(([label, href], i) => (
              <Link key={label} href={href} className={`relative py-7 text-sm font-extrabold transition hover:text-[#118ee5] ${i === 0 ? "text-[#118ee5]" : "text-[#164473]"}`}>
                {label}{i === 0 && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#168ff0]" />}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <Link href="/login" aria-label="Search" className="hidden h-11 w-11 place-items-center rounded-full border border-[#dbeaf5] text-[#0c548d] sm:grid"><Search size={20}/></Link>
            <button type="button" onClick={() => setLearnerLoginOpen(true)} className="hidden rounded-xl border-2 border-[#168ff0] px-5 py-2.5 text-sm font-black text-[#07528e] sm:inline-flex">Student Login</button>
            <Link href="/login" className="hidden rounded-xl bg-[#ff6b22] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 sm:inline-flex">Start Learning</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf7ff] lg:hidden" aria-label="Menu">{menuOpen ? <X/> : <Menu/>}</button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-[#e1eef7] bg-white px-5 py-4 lg:hidden">
            <div className="grid gap-2">
              {nav.map(([label, href]) => <Link onClick={() => setMenuOpen(false)} key={label} href={href} className="rounded-xl px-4 py-3 font-extrabold hover:bg-[#edf7ff]">{label}</Link>)}
              <button type="button" onClick={() => { setMenuOpen(false); setLearnerLoginOpen(true); }} className="rounded-xl border-2 border-[#168ff0] px-4 py-3 text-center font-black text-[#07528e]">Student Login</button>
              <Link href="/login" className="mt-2 rounded-xl bg-[#ff6b22] px-4 py-3 text-center font-black text-white">Start Learning</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative mx-auto max-w-[1500px] overflow-hidden bg-[#c9edfc] lg:mt-3 lg:rounded-[30px]">
        <img src="/homepage-artwork/hero-illustration.webp" alt="Two students learning maths beside the ocean" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#e7f7ff]/95 via-[#e7f7ff]/75 to-transparent sm:via-[#e7f7ff]/45 lg:from-[#e7f7ff]/90 lg:via-transparent" />
        <div className="relative mx-auto flex min-h-[300px] max-w-[1440px] items-center px-6 py-4 sm:min-h-[300px] lg:h-[300px] lg:min-h-0 lg:px-12">
          <div className="max-w-[520px] rounded-[24px] bg-[#e8f7ff]/45 p-3 backdrop-blur-[2px] sm:p-5 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="mb-1 hidden items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#0e86cf] shadow-sm lg:inline-flex"><Sparkles size={17}/> Learn • Practise • Play</div>
            <h1 className="text-[clamp(2rem,3vw,3.15rem)] font-black leading-[.98] tracking-tight text-[#072c61]">Maths<br/>Builds <span className="text-[#1595e7]">Brighter</span><br/>Futures</h1>
            <p className="mt-2 max-w-[450px] text-[13px] font-bold leading-[1.35rem] text-[#173e66] sm:text-sm">Explore. Practise. Play. Earn Mind Sparks.<br/>Build confidence and enjoy learning maths every day.</p>
            <div className="mt-3 flex flex-wrap gap-2 pb-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff6b22] px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-orange-200">▶ Start Learning</Link>
              <button type="button" onClick={() => setLearnerLoginOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#168ff0] bg-white px-6 py-3.5 text-sm font-black text-[#07528e]"><Users size={20}/> Student Login</button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1500px] px-5 pb-4 pt-7 sm:px-8 lg:px-12">
          <div className="grid items-center gap-7 lg:grid-cols-[.98fr_1.02fr]">
            <div>
              <h2 className="text-[clamp(2.25rem,3.45vw,3.75rem)] font-black leading-[1.02] tracking-tight text-[#082b61]">Help Your Child Become<br/><span className="text-[#1595e7]">More Confident in Maths</span></h2>
              <p className="mt-4 max-w-[690px] text-[15px] font-bold leading-6 text-[#426787] sm:text-base">Build stronger maths skills through short, engaging daily practice designed around your child’s grade level. Visual learning, personalised revision, daily challenges and fun Brain Games help children practise consistently without making maths feel like extra homework.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                <div className="flex items-start gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#ffe4ee] text-2xl">📊</span><div><h3 className="text-[15px] font-black leading-4 text-[#082b61]">Grade-based<br/>learning</h3><p className="mt-2 text-[12px] font-bold leading-4 text-[#5c7891]">Questions matched to your child’s school level.</p></div></div>
                <div className="flex items-start gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#d9faed] text-2xl">🎯</span><div><h3 className="text-[15px] font-black leading-4 text-[#082b61]">Learn from<br/>mistakes</h3><p className="mt-2 text-[12px] font-bold leading-4 text-[#5c7891]">Revision helps children revisit areas they struggled with.</p></div></div>
                <div className="flex items-start gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff2c9] text-2xl">⭐</span><div><h3 className="text-[15px] font-black leading-4 text-[#082b61]">See real<br/>progress</h3><p className="mt-2 text-[12px] font-bold leading-4 text-[#5c7891]">Parents can follow learning, practice and improvement.</p></div></div>
              </div>
              <Link href="/login" className="mt-6 inline-flex min-w-[285px] items-center justify-center gap-2 rounded-full bg-[#ff6b22] px-8 py-3.5 text-base font-black text-white shadow-md">Start Free Trial <ArrowRight size={19}/></Link>
            </div>
            <div className="h-[330px] overflow-hidden rounded-[24px] bg-[#dff4ff] sm:h-[370px] lg:h-[355px]">
              <img src="/homepage-artwork/parent-confidence.webp" alt="Parent supporting a child with maths learning" className="h-full w-full object-cover object-center"/>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1500px] px-3 pb-4">
          <div className="grid gap-4 rounded-[22px] bg-[#eaf7ff] px-5 py-4 lg:grid-cols-[1fr_390px] lg:items-center">
            <div className="flex flex-wrap items-center gap-3"><span className="mr-1 text-sm font-black text-[#082b61]">Fun ways to learn:</span>{[["🖼️","Visual Maths"],["⚡","Daily Challenge"],["📝","Revision"],["🎮","Brain Games"],["📊","Progress Tracking"]].map(([icon,label])=><span key={label} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#1269a7]"><span>{icon}</span>{label}</span>)}</div>
            <div className="border-t border-[#9fd1ec] pt-3 text-center lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><p className="text-[13px] font-black leading-4 text-[#082b61]">Built around the Maldives primary<br/>mathematics curriculum</p><div className="mt-2 flex flex-wrap justify-center gap-2">{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5"].map(g=><span key={g} className="rounded-full border border-[#8bd0f8] bg-white px-3 py-1 text-[11px] font-black text-[#137ac1]">{g}</span>)}</div></div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-0 max-w-[1500px] rounded-t-[34px] bg-white px-5 py-7 shadow-[0_-8px_35px_rgba(22,105,160,.08)] sm:px-8 lg:px-12">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-[#082b61] sm:text-3xl">Jump into an Activity</h2>
          <p className="mt-2 text-base font-bold text-[#477092]">Different ways to learn, practise and have fun with maths!</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {activities.map((a) => (
            <Link key={a.title} href={a.href} className="group overflow-hidden rounded-[22px] border border-[#dcecf7] bg-white shadow-[0_8px_22px_rgba(16,78,120,.09)] transition hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(16,78,120,.15)]">
              <div className="relative aspect-[2.25/1] overflow-hidden bg-[#e9f7ff]">
                <img src={a.image} alt="" className="h-[118%] w-full -translate-y-[2%] object-cover object-top transition duration-300 group-hover:scale-[1.025]" />
              </div>
              <div className="relative min-h-[108px] p-4 pr-12">
                <h3 className="text-lg font-black text-[#082b61]">{a.title}</h3>
                <p className="mt-1 text-[13px] font-bold leading-5 text-[#557794]">{a.text}</p>
                <span className="absolute bottom-4 right-3 grid h-9 w-9 place-items-center rounded-full bg-[#1595e7] text-white"><ArrowRight size={20}/></span>
              </div>
            </Link>
          ))}
          <Link href="/dashboard" className="group overflow-hidden rounded-[22px] border border-[#dcecf7] bg-white shadow-[0_8px_22px_rgba(16,78,120,.09)] transition hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(16,78,120,.15)]">
            <div className="aspect-[2.25/1] overflow-hidden bg-[#e9f7ff]"><img src="/homepage-artwork/my-progress.webp" alt="" className="h-[118%] w-full -translate-y-[2%] object-cover object-top transition duration-300 group-hover:scale-[1.025]"/></div>
            <div className="relative min-h-[108px] p-4 pr-12"><h3 className="text-lg font-black text-[#082b61]">My Progress</h3><p className="mt-1 text-[13px] font-bold leading-5 text-[#557794]">See your learning journey, streak and achievements.</p><span className="absolute bottom-4 right-3 grid h-9 w-9 place-items-center rounded-full bg-[#1595e7] text-white"><ArrowRight size={20}/></span></div>
          </Link>
        </div>
        <div className="mt-6 grid overflow-hidden rounded-[22px] border border-[#d8ebf8] bg-[#eef8ff] sm:grid-cols-3">
          <div className="flex items-center justify-center gap-3 p-4"><Brain className="text-[#168ff0]"/><div><b className="block text-lg font-black">Learn visually</b><span className="text-sm font-bold text-[#5b7891]">Understand ideas clearly</span></div></div>
          <div className="flex items-center justify-center gap-3 border-y border-[#d8ebf8] p-6 sm:border-x sm:border-y-0"><Star className="text-[#ffb500]" fill="currentColor"/><div><b className="block text-lg font-black">Earn Mind Sparks</b><span className="text-sm font-bold text-[#5b7891]">Complete challenges & games</span></div></div>
          <div className="flex items-center justify-center gap-3 p-4"><Trophy className="text-[#ff8a21]"/><div><b className="block text-lg font-black">Grow every day</b><span className="text-sm font-bold text-[#5b7891]">Build confidence and skill</span></div></div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#e8f9ff] via-[#fff9db] to-[#e6faff]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-6 py-9 lg:grid-cols-[1fr_.8fr] lg:px-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ffef9e] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#805d00]"><Gift size={15}/> Rewards</div>
            <h2 className="mt-4 text-2xl font-black text-[#082b61] sm:text-3xl">Earn Mind Sparks as you learn!</h2>
            <p className="mt-3 max-w-2xl font-bold leading-7 text-[#477092]">Complete challenges, play games and show your progress to earn Mind Sparks. Use them across the platform and keep your learning journey moving.</p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6b22] px-5 py-3 font-black text-white">Start Learning Now <ArrowRight size={18}/></Link>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="grid h-28 w-28 place-items-center rounded-full border-[8px] border-[#ffe477] bg-[#ffc928] text-5xl shadow-xl">⭐</div>
            <div className="rounded-[28px] bg-white p-5 shadow-xl">
              <div className="flex gap-3 text-center">
                {[["Solve","🧠"],["Learn","📘"],["Play","🎮"],["Challenge","🏆"]].map(([t,e]) => <div key={t}><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf7ff] text-2xl">{e}</div><span className="mt-1 block text-[10px] font-black">{t}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#082b61] px-5 py-7 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Fahi Hisaabu · The Maldives Maths Learning Hub</span>
          <span className="text-[#8ed8ff]">Learn • Practise • Play • Achieve</span>
        </div>
      </footer>
    </main>
  );
}
