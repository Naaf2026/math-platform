"use client";

import Link from "next/link";
import {
  ArrowRight, BarChart3, Brain, CalendarCheck, Gamepad2, Gift,
  Menu, Search, Sparkles, Star, Trophy, Users, X,
} from "lucide-react";
import { useState } from "react";

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

  return (
    <main className="min-h-screen bg-[#eef8ff] text-[#082b61] student-dashboard-font">
      <header className="sticky top-0 z-50 border-b border-[#dcecf8] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center gap-6 px-5 lg:px-8">
          <Link href="/" className="flex min-w-fit items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#082b61] text-2xl shadow-md">📖</div>
            <div className="leading-none">
              <div className="text-[21px] font-black tracking-wide text-[#082b61]">FAHI VISSNUN</div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[.11em] text-[#1595e7]">Maths for a brighter tomorrow</div>
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
            <Link href="/login" className="hidden rounded-xl border-2 border-[#168ff0] px-5 py-2.5 text-sm font-black text-[#07528e] sm:inline-flex">Student Login</Link>
            <Link href="/login" className="hidden rounded-xl bg-[#ff6b22] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 sm:inline-flex">Start Learning</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf7ff] lg:hidden" aria-label="Menu">{menuOpen ? <X/> : <Menu/>}</button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-[#e1eef7] bg-white px-5 py-4 lg:hidden">
            <div className="grid gap-2">
              {nav.map(([label, href]) => <Link onClick={() => setMenuOpen(false)} key={label} href={href} className="rounded-xl px-4 py-3 font-extrabold hover:bg-[#edf7ff]">{label}</Link>)}
              <Link href="/login" className="mt-2 rounded-xl bg-[#ff6b22] px-4 py-3 text-center font-black text-white">Start Learning</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#e8f7ff] via-[#f8fcff] to-[#d9f4ff]">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#50b9ed_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-7 px-5 py-10 lg:min-h-[540px] lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-12">
          <div className="z-10 max-w-[610px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#0e86cf] shadow-sm"><Sparkles size={15}/> Learn • Practise • Play</div>
            <h1 className="text-[44px] font-black leading-[.98] tracking-tight text-[#072c61] sm:text-[58px] lg:text-[68px]">
              Maths Builds <span className="text-[#1595e7]">Brighter</span> Futures
            </h1>
            <p className="mt-5 max-w-[520px] text-[17px] font-bold leading-7 text-[#28547c] sm:text-lg">Explore. Practise. Play. Earn Mind Sparks.<br/>Build confidence and enjoy learning maths every day.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-[#ff6b22] px-6 py-4 font-black text-white shadow-xl shadow-orange-200"><span className="text-lg">▶</span> Start Learning</Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#168ff0] bg-white px-6 py-4 font-black text-[#07528e]"><Users size={19}/> Student Login</Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border-[7px] border-white shadow-[0_24px_65px_rgba(25,116,171,.22)]">
            <img src="/homepage-artwork/hero-illustration.webp" alt="Students enjoying maths together in a tropical learning scene" className="block aspect-[16/9] w-full object-cover lg:aspect-[5/4]" />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-1 max-w-[1440px] rounded-t-[34px] bg-white px-5 py-10 shadow-[0_-8px_35px_rgba(22,105,160,.08)] lg:px-8">
        <div className="mb-7">
          <h2 className="text-3xl font-black text-[#082b61] sm:text-4xl">Jump into an Activity</h2>
          <p className="mt-1 font-bold text-[#477092]">Different ways to learn, practise and have fun with maths!</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activities.map((a, index) => (
            <Link key={a.title} href={a.href} className={`group overflow-hidden rounded-[22px] border border-[#dcecf7] bg-white shadow-[0_8px_22px_rgba(16,78,120,.09)] transition hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(16,78,120,.15)] ${index < 3 ? "lg:col-span-1" : ""}`}>
              <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${a.tone}`}>
                <img src={a.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
              </div>
              <div className="relative p-4 pr-12">
                <h3 className="text-xl font-black text-[#082b61]">{a.title}</h3>
                <p className="mt-1 min-h-[42px] text-sm font-bold leading-5 text-[#557794]">{a.text}</p>
                <span className="absolute bottom-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-[#1595e7] text-white"><ArrowRight size={18}/></span>
              </div>
            </Link>
          ))}
          <Link href="/dashboard" className="group flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-[#7849e8] to-[#4227a9] p-5 text-white shadow-lg">
            <div><img src="/homepage-artwork/my-progress.webp" alt="" className="mb-3 h-32 w-full rounded-2xl object-cover"/><h3 className="mt-4 text-2xl font-black">My Progress</h3><p className="mt-2 text-sm font-bold text-violet-100">See your learning journey, streak and achievements.</p></div>
            <span className="inline-flex items-center gap-2 font-black">View dashboard <ArrowRight size={18}/></span>
          </Link>
        </div>

        <div className="mt-8 grid overflow-hidden rounded-[22px] border border-[#d8ebf8] bg-[#eef8ff] sm:grid-cols-3">
          <div className="flex items-center justify-center gap-3 p-5"><Brain className="text-[#168ff0]"/><div><b className="block text-lg font-black">Learn visually</b><span className="text-xs font-bold text-[#5b7891]">Understand ideas clearly</span></div></div>
          <div className="flex items-center justify-center gap-3 border-y border-[#d8ebf8] p-5 sm:border-x sm:border-y-0"><Star className="text-[#ffb500]" fill="currentColor"/><div><b className="block text-lg font-black">Earn Mind Sparks</b><span className="text-xs font-bold text-[#5b7891]">Complete challenges & games</span></div></div>
          <div className="flex items-center justify-center gap-3 p-5"><Trophy className="text-[#ff8a21]"/><div><b className="block text-lg font-black">Grow every day</b><span className="text-xs font-bold text-[#5b7891]">Build confidence and skill</span></div></div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#e8f9ff] via-[#fff9db] to-[#e6faff]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-11 lg:grid-cols-[1fr_.8fr] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ffef9e] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#805d00]"><Gift size={15}/> Rewards</div>
            <h2 className="mt-4 text-3xl font-black text-[#082b61] sm:text-4xl">Earn Mind Sparks as you learn!</h2>
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
          <span>© 2026 FAHI VISSNUN · Mathematics Learning Platform</span>
          <span className="text-[#8ed8ff]">Learn • Practise • Play • Achieve</span>
        </div>
      </footer>
    </main>
  );
}
