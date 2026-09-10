"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { topics } from "@/lib/learning/data";

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div><p className="text-sm font-black tracking-wide text-[#071b3a]">FAHI VISSNUN</p><p className="text-xs text-slate-500">Maths Learning Path</p></div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-[#0d666b]"><ArrowLeft size={16}/> Dashboard</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <section className="rounded-3xl bg-[#071b3a] p-7 text-white shadow-xl sm:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e2b75d]">Your learning journey</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Learn. Practise. Grow.</h1>
            <p className="mt-3 text-slate-300">Follow your maths pathway from Foundation to Development and build confidence one topic at a time.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3"><Sparkles size={18} className="text-[#e2b75d]"/> <span className="font-bold">0 XP</span></div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3"><BookOpen size={18} className="text-[#e2b75d]"/> <span className="font-bold">{topics.length} topics</span></div>
          </div>
        </section>

        <section className="mt-8">
          <div><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">Learning path</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Choose your next topic</h2></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {topics.map((topic, index) => (
              <Link key={topic.id} href={`/learn/${topic.id}`} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[#0d666b]/10 px-3 py-1 text-xs font-extrabold text-[#0d666b]">{topic.level}</span><span className="text-sm font-bold text-slate-400">0{index + 1}</span></div>
                <h3 className="mt-5 text-xl font-black text-[#071b3a]">{topic.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{topic.description}</p>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-semibold text-slate-500">{topic.lessons} lessons</span><span className="inline-flex items-center gap-1 text-sm font-black text-[#0d666b]">Start learning <ArrowRight size={16} className="transition group-hover:translate-x-1"/></span></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
