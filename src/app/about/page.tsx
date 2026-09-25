import Link from "next/link";
import { ArrowLeft, Brain, Gamepad2, ShieldCheck, Sparkles, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#eef9ff] text-[#083d78]">
      <header className="bg-[#073b73] text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/profile" className="flex items-center gap-2 font-black"><ArrowLeft size={20}/>Profile</Link>
          <Link href="/" aria-label="Fahi Hisaabu home"><img src="/fahi-hisaabu-logo-optimized.webp" alt="ފަހި ހިސާބު — Fahi Hisaabu" className="h-10 w-auto object-contain"/></Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-[2rem] bg-[#073b73] p-7 text-white shadow-xl sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">About</p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">Fahi Hisaabu</h1>
          <p className="mt-2 text-xl font-bold text-cyan-100" lang="dv" dir="rtl">ފަހި ހިސާބު</p>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-blue-100 sm:text-lg">A maths learning platform designed to make practice engaging, rewarding and easier for young learners.</p>
        </section>
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card icon={<Target/>} title="Learn & Practise" text="Daily challenges, revision and visual maths activities help learners build skills through regular practice."/>
          <Card icon={<Gamepad2/>} title="Mind Sparks" text="Brain games add playful challenges for thinking, attention, speed and problem solving."/>
          <Card icon={<Brain/>} title="Progress" text="XP, streaks, achievements and progress tools help learners see their learning journey grow."/>
          <Card icon={<ShieldCheck/>} title="Built for Learners" text="A simple, friendly learner experience across phones, tablets and computers."/>
        </section>
        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-3"><Sparkles/><h2 className="text-2xl font-black">About this platform</h2></div>
          <p className="mt-3 font-medium leading-7 text-[#426584]">Fahi Hisaabu brings maths learning activities together in one place, combining structured practice with visual learning, challenges, rewards and games.</p>
          <Link href="/profile" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#073b73] px-5 py-3 font-black text-white"><ArrowLeft size={18}/>Back to Profile</Link>
        </section>
      </div>
    </main>
  );
}

function Card({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) {
  return <div className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-slate-100"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e5f5ff] text-[#197fe9] [&_svg]:h-6 [&_svg]:w-6" aria-hidden="true">{icon}</div><h2 className="mt-4 text-xl font-black">{title}</h2><p className="mt-2 text-sm font-semibold leading-6 text-[#426584]">{text}</p></div>;
}
