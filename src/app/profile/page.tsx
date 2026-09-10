"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Flame, Gamepad2, Sparkles, Target, Trophy, Zap } from "lucide-react";
import StudentProfile from "@/components/student-profile";

const tiles = [
  { href: "/mission", icon: Target, label: "My Mission", text: "Keep your learning streak alive.", cls: "from-violet-600 to-indigo-500", iconCls: "bg-white/20" },
  { href: "/challenge", icon: Gamepad2, label: "Daily Challenge", text: "Take today's maths sprint.", cls: "from-pink-500 to-rose-500", iconCls: "bg-white/20" },
  { href: "/progress", icon: BookOpen, label: "My Progress", text: "See skills you are mastering.", cls: "from-cyan-500 to-sky-500", iconCls: "bg-white/20" },
  { href: "/rewards", icon: Trophy, label: "My Rewards", text: "Collect badges and milestones.", cls: "from-amber-400 to-orange-400", iconCls: "bg-white/30" },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f4ff] px-4 py-5 text-slate-900 sm:px-6 lg:pl-28 lg:pr-10 lg:py-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-72 bg-gradient-to-br from-violet-200/70 via-fuchsia-100/50 to-cyan-100/60 blur-2xl" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm backdrop-blur transition hover:text-violet-600">
          <ArrowLeft className="h-4 w-4" /> Back to learning hub
        </Link>

        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-700">
              <Sparkles className="h-3.5 w-3.5" /> My Learning World
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">My Profile</h1>
            <p className="mt-2 max-w-2xl font-medium text-slate-500">Your XP, streaks, rewards and learning journey — all in one fun place.</p>
          </div>
          <div className="hidden rounded-2xl bg-white px-4 py-3 text-right shadow-sm sm:block">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Keep going</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-black text-orange-500"><Flame className="h-4 w-4" /> Build your streak</p>
          </div>
        </header>

        <StudentProfile />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map(({ href, icon: Icon, label, text, cls, iconCls }) => (
            <Link key={href} href={href} className={`group relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${cls} p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl`}>
              <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/10" />
              <div className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${iconCls}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="relative mt-5 text-lg font-black">{label}</p>
              <p className="relative mt-1 text-sm font-bold text-white/75">{text}</p>
              <div className="relative mt-4 text-xs font-black uppercase tracking-wider text-white/70 group-hover:text-white">Open →</div>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-xl shadow-violet-100/60 ring-1 ring-violet-100 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Learning journey</p>
                <h2 className="mt-1 text-2xl font-black">Small wins become big progress 🚀</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Answer questions, earn XP, unlock levels and keep coming back each day.</p>
              </div>
              <div className="hidden rounded-2xl bg-yellow-100 p-3 text-yellow-600 sm:block"><Zap className="h-6 w-6" /></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <JourneyStep n="01" title="Learn" text="Build maths skills" cls="bg-violet-50 text-violet-700" />
              <JourneyStep n="02" title="Practice" text="Complete challenges" cls="bg-cyan-50 text-cyan-700" />
              <JourneyStep n="03" title="Level up" text="Earn XP & rewards" cls="bg-yellow-50 text-yellow-700" />
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 p-6 text-white shadow-xl shadow-rose-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Flame className="h-6 w-6" /></div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-white/70">Streak power</p>
            <h2 className="mt-1 text-2xl font-black">Don't break the chain!</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/80">Complete a learning activity every day and turn consistency into your superpower.</p>
            <Link href="/mission" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-600 shadow-lg transition hover:-translate-y-0.5">Start Learning <span className="ml-2">→</span></Link>
          </div>
        </section>

        <div className="mt-6 rounded-[2rem] border border-violet-100 bg-white/80 p-5 text-center shadow-sm backdrop-blur sm:p-6">
          <p className="text-sm font-black text-slate-700">⭐ Every question is a step forward.</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Keep practising and your profile will grow with you.</p>
        </div>
      </div>
    </main>
  );
}

function JourneyStep({ n, title, text, cls }: { n: string; title: string; text: string; cls: string }) {
  return (
    <div className={`rounded-2xl p-4 ${cls}`}>
      <div className="text-[10px] font-black tracking-widest opacity-60">{n}</div>
      <div className="mt-2 font-black">{title}</div>
      <div className="mt-1 text-xs font-bold opacity-70">{text}</div>
    </div>
  );
}
