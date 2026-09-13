"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Brain, Clock3, FileText, LockKeyhole, Play, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Question = { id: string; topic_id?: string; topic?: string; skill?: string; difficulty?: string; prompt: string; options?: string[] };

const papers = [
  { id: "essential", title: "Essential Skills", subtitle: "Core curriculum practice", icon: "📘", tone: "from-cyan-500 to-blue-600", tag: "Core" },
  { id: "revision", title: "Revision Papers", subtitle: "Mixed-topic timed practice", icon: "📝", tone: "from-violet-500 to-indigo-600", tag: "Revision" },
  { id: "hots", title: "Higher Thinking", subtitle: "Multi-step problem solving", icon: "🧠", tone: "from-orange-400 to-rose-500", tag: "Challenge" },
];

export default function ExamPracticePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paper, setPaper] = useState<(typeof papers)[number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.rpc("get_adaptive_questions", { p_limit: 100 });
      setQuestions((data ?? []) as Question[]);
      setLoading(false);
    }
    void load();
  }, []);

  const selectedQuestions = useMemo(() => {
    if (!paper) return [];
    const sorted = [...questions];
    if (paper.id === "hots") sorted.sort((a, b) => (b.difficulty ?? "").localeCompare(a.difficulty ?? ""));
    return sorted.slice(0, 20);
  }, [paper, questions]);

  if (paper) return (
    <main className="min-h-screen bg-[#f5f7ff] pb-24 lg:pl-20">
      <header className="border-b bg-white px-5 py-4 lg:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between"><button onClick={() => setPaper(null)} className="inline-flex items-center gap-2 text-sm font-black text-slate-500"><ArrowLeft size={17}/> Back to papers</button><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">{paper.tag}</span></div></header>
      <div className="mx-auto max-w-5xl px-5 py-7 lg:px-8">
        <section className={`rounded-[2rem] bg-gradient-to-br ${paper.tone} p-7 text-white shadow-xl`}><div className="flex items-start justify-between gap-5"><div><span className="text-4xl">{paper.icon}</span><h1 className="mt-4 text-3xl font-black">{paper.title}</h1><p className="mt-1 font-semibold text-white/80">{paper.subtitle}</p></div><div className="rounded-2xl bg-white/15 px-4 py-3 text-right"><p className="text-xs font-bold text-white/70">Questions</p><p className="text-2xl font-black">{selectedQuestions.length}</p></div></div></section>
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><Clock3 className="text-violet-600" size={20}/><p className="mt-2 font-black">Timed practice</p><p className="text-xs font-semibold text-slate-400">Work at your own pace</p></div><div className="rounded-2xl bg-slate-50 p-4"><BookOpenCheck className="text-cyan-600" size={20}/><p className="mt-2 font-black">Auto-marked</p><p className="text-xs font-semibold text-slate-400">Instant results and feedback</p></div><div className="rounded-2xl bg-slate-50 p-4"><Brain className="text-orange-500" size={20}/><p className="mt-2 font-black">Skill building</p><p className="text-xs font-semibold text-slate-400">See what to practise next</p></div></div><Link href={`/training/practice?mode=exam&paper=${paper.id}`} className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 font-black text-white shadow-lg hover:bg-violet-700"><Play size={18}/> Start paper</Link></section>
      </div>
    </main>
  );

  return <main className="min-h-screen bg-gradient-to-br from-[#f6f7ff] via-white to-[#eefbff] pb-24 lg:pl-20"><div className="mx-auto max-w-7xl px-5 py-7 lg:px-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Practice library</p><h1 className="mt-1 text-3xl font-black text-[#15233f]">Exam Practice</h1><p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Build a complete practice layer for core skills, revision and higher-thinking mathematics.</p></div><Link href="/training" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200">Training</Link></div><div className="mt-7 grid gap-5 lg:grid-cols-3">{papers.map(item => <button key={item.id} onClick={() => setPaper(item)} className="group overflow-hidden rounded-[2rem] bg-white text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"><div className={`bg-gradient-to-br ${item.tone} p-7 text-white`}><div className="flex items-center justify-between"><span className="text-5xl">{item.icon}</span><Sparkles size={22} className="opacity-80"/></div><p className="mt-7 text-2xl font-black">{item.title}</p><p className="mt-1 font-semibold text-white/80">{item.subtitle}</p></div><div className="p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">{item.tag}</span><span className="text-sm font-black text-violet-600">{loading ? "Loading…" : `${Math.min(20, questions.length)} questions ready`}</span></div><p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Select a paper to preview the practice set and begin.</p></div></button>)}</div><div className="mt-6 rounded-3xl border border-dashed border-violet-200 bg-violet-50/50 p-5"><p className="font-black text-violet-900">Next library layer</p><p className="mt-1 text-sm font-semibold text-violet-700">Teacher-created papers, school revision sets and topic-specific test banks can be added without changing the learner experience.</p></div></div></main>;
}
