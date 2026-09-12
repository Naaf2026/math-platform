"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic = { id: string; title: string; description: string; level: string; lessons: number; sort_order: number };
type Question = { id: string; topic_id?: string; topic?: string; skill?: string; difficulty: string; prompt: string; options?: string[] };
type Progress = { topic_id: string; questions_answered: number; correct_answers: number; completed_at: string | null };

const topicMeta: Record<string, { emoji: string; tone: string }> = {
  "place-value": { emoji: "🔢", tone: "from-violet-500 to-indigo-500" },
  "addition-subtraction": { emoji: "➕", tone: "from-cyan-400 to-blue-500" },
  multiplication: { emoji: "✖️", tone: "from-orange-400 to-amber-500" },
  fractions: { emoji: "🍕", tone: "from-emerald-400 to-teal-500" },
};

const fallbackTopics: Topic[] = [
  { id: "place-value", title: "Place Value", description: "Read, compare and build numbers.", level: "Foundation", lessons: 5, sort_order: 1 },
  { id: "addition-subtraction", title: "Addition & Subtraction", description: "Calculate accurately and solve problems.", level: "Foundation", lessons: 5, sort_order: 2 },
  { id: "multiplication", title: "Multiplication", description: "Build fluency with facts and strategies.", level: "Development", lessons: 5, sort_order: 3 },
  { id: "fractions", title: "Fractions", description: "Understand parts, equivalence and comparison.", level: "Development", lessons: 5, sort_order: 4 },
];

function meta(id: string) { return topicMeta[id] ?? { emoji: "📘", tone: "from-blue-500 to-cyan-500" }; }
function difficultyLabel(d: string) { const x = d.toLowerCase(); return x.includes("hard") || x.includes("advanced") ? "Advanced" : x.includes("medium") || x.includes("intermediate") ? "Developing" : "Starter"; }

export default function TrainingPage() {
  const [topics, setTopics] = useState<Topic[]>(fallbackTopics);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [grade, setGrade] = useState("My Grade");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  useEffect(() => { void load(); }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/login"; return; }
    const [{ data: ts }, { data: qs }, { data: ps }, { data: profile }] = await Promise.all([
      supabase.from("learning_topics").select("id,title,description,level,lessons,sort_order").order("sort_order"),
      supabase.rpc("get_adaptive_questions", { p_limit: 100 }),
      supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers,completed_at").eq("user_id", auth.user.id),
      supabase.from("profiles").select("xp,grade").eq("id", auth.user.id).maybeSingle(),
    ]);
    if (ts?.length) setTopics(ts as Topic[]);
    setQuestions((qs ?? []) as Question[]);
    setProgress((ps ?? []) as Progress[]);
    setXp(profile?.xp ?? 0);
    setGrade(profile?.grade ? String(profile.grade) : "My Grade");
    setLoading(false);
  }

  const visibleQuestions = useMemo(() => selectedTopic ? questions.filter(q => q.topic_id === selectedTopic || q.topic === selectedTopic || q.topic?.toLowerCase() === topics.find(t => t.id === selectedTopic)?.title.toLowerCase()) : questions, [questions, selectedTopic, topics]);
  const skills = useMemo(() => Array.from(new Map(visibleQuestions.filter(q => q.skill).map(q => [q.skill, q])).values()).slice(0, 8), [visibleQuestions]);
  const selected = topics.find(t => t.id === selectedTopic);
  const selectedProgress = progress.find(p => p.topic_id === selectedTopic);
  const level = Math.floor(xp / 100) + 1;

  if (loading) return <main className="min-h-screen bg-[#f5f7ff] p-6 lg:pl-28"><div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-3xl">📚</div><h1 className="mt-5 text-2xl font-black text-[#15233f]">Opening Training</h1><p className="mt-2 text-sm font-bold text-slate-500">Loading your maths learning path…</p></div></div></main>;

  return <main className="min-h-screen bg-gradient-to-br from-[#f6f7ff] via-white to-[#eefbff] pb-28 lg:pl-20">
    <header className="border-b border-white/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-600">FAHI VISSNUN MATHS</p><h1 className="mt-1 text-2xl font-black text-[#15233f] sm:text-3xl">Math Training</h1></div><div className="flex items-center gap-2"><div className="hidden rounded-2xl bg-yellow-50 px-4 py-2 text-sm font-black text-orange-700 sm:block">⚡ {xp} XP</div><div className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-black text-white">Level {level}</div></div></div></header>
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-2xl shadow-indigo-200 sm:p-8"><div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em]"><Sparkles size={14}/> Personalised practice</div><h2 className="mt-3 text-3xl font-black sm:text-4xl">Choose what you want to practise 🚀</h2><p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-indigo-100">Select your grade, choose a topic, then focus on the skills you want to strengthen. Your progress stays connected to your learning account.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-3xl bg-white/10 p-4"><BookOpen size={21}/><p className="mt-3 text-2xl font-black">{topics.length}</p><p className="text-xs font-bold text-indigo-100">Topics</p></div><div className="rounded-3xl bg-white/10 p-4"><Target size={21}/><p className="mt-3 text-2xl font-black">10</p><p className="text-xs font-bold text-indigo-100">Questions / practice</p></div></div></div></section>
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Curriculum</p><p className="mt-1 font-black text-[#15233f]">Choose your grade</p></div><select value={grade} onChange={e => setGrade(e.target.value)} className="rounded-2xl border-2 border-violet-100 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 outline-none"><option>My Grade</option>{[1,2,3,4,5,6,7].map(n => <option key={n}>Grade {n}</option>)}</select></div></section>
      {!selectedTopic ? <>
        <section className="mt-7"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Skills pathway</p><h2 className="mt-1 text-2xl font-black text-[#15233f]">Choose a topic</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">Easy → Advanced</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{topics.map(topic => { const m = meta(topic.id); const p = progress.find(x => x.topic_id === topic.id); const answered = p?.questions_answered ?? 0; const accuracy = answered ? Math.round(((p?.correct_answers ?? 0) / answered) * 100) : 0; return <button key={topic.id} onClick={() => setSelectedTopic(topic.id)} className="group overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className={`bg-gradient-to-br ${m.tone} p-5 text-white`}><div className="flex items-start justify-between"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-3xl">{m.emoji}</span><ChevronRight className="opacity-70 transition group-hover:translate-x-1"/></div><p className="mt-5 text-xl font-black">{topic.title}</p><p className="mt-1 text-xs font-bold text-white/80">{topic.level}</p></div><div className="p-5"><p className="min-h-10 text-sm font-semibold leading-5 text-slate-500">{topic.description}</p><div className="mt-4 flex items-center justify-between text-xs font-black"><span className="text-slate-400">{topic.lessons || 5} lessons</span><span className="text-violet-600">{accuracy}% mastery</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full bg-gradient-to-r ${m.tone}`} style={{ width: `${Math.min(100, accuracy)}%` }}/></div></div></button>; })}</div></section>
        <section className="mt-7 grid gap-4 lg:grid-cols-3"><Link href="/challenge" className="rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 p-5 text-white shadow-lg transition hover:-translate-y-1"><Target size={24}/><h3 className="mt-4 text-xl font-black">Daily Challenge</h3><p className="mt-1 text-sm font-semibold text-orange-50">A 10-question challenge with selectable proficiency.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black">Open challenge <ArrowRight size={15}/></span></Link><Link href="/mission" className="rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 p-5 text-white shadow-lg transition hover:-translate-y-1"><Zap size={24}/><h3 className="mt-4 text-xl font-black">Today's Mission</h3><p className="mt-1 text-sm font-semibold text-cyan-50">Adaptive practice selected from your learning bank.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black">Start mission <ArrowRight size={15}/></span></Link><Link href="/progress" className="rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 p-5 text-white shadow-lg transition hover:-translate-y-1"><Trophy size={24}/><h3 className="mt-4 text-xl font-black">Mastery & Progress</h3><p className="mt-1 text-sm font-semibold text-emerald-50">Review accuracy, completed topics and your learning streak.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black">View progress <ArrowRight size={15}/></span></Link></section>
      </> : <>
        <section className="mt-7"><button onClick={() => setSelectedTopic(null)} className="text-sm font-black text-violet-600 hover:text-violet-800">← All topics</button><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-3"><span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${meta(selectedTopic).tone} text-3xl text-white`}>{meta(selectedTopic).emoji}</span><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">{selected?.level}</p><h2 className="text-3xl font-black text-[#15233f]">{selected?.title}</h2></div></div></div><div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your progress</p><p className="mt-1 font-black text-[#15233f]">{selectedProgress?.questions_answered ?? 0} questions · {selectedProgress?.correct_answers ?? 0} correct</p></div></div></section>
        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Skills</p><h3 className="mt-1 text-2xl font-black text-[#15233f]">Pick a skill to practise</h3></div><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">{visibleQuestions.length} questions available</span></div>{skills.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{skills.map(q => <Link key={q.skill} href={`/training/practice?topic=${encodeURIComponent(selectedTopic)}&skill=${encodeURIComponent(q.skill || "")}`} className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600"><CheckCircle2 size={21}/></div><div className="min-w-0 flex-1"><p className="font-black text-[#15233f]">{q.skill}</p><p className="mt-1 text-xs font-bold text-slate-400">{difficultyLabel(q.difficulty)} · Practice questions</p></div><ChevronRight className="text-slate-300" size={20}/></Link>)}</div> : <div className="mt-5 rounded-3xl bg-slate-50 p-7 text-center"><p className="font-black text-slate-700">Skills are being added to this topic.</p><p className="mt-1 text-sm text-slate-500">Use the topic mission below while the skill bank grows.</p></div>}
          <div className="mt-7 border-t border-dashed border-slate-200 pt-6"><div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-violet-50 to-cyan-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">10-question practice</p><p className="mt-1 font-black text-[#15233f]">Ready to train {selected?.title}?</p><p className="mt-1 text-sm font-semibold text-slate-500">Choose a skill above for focused practice, or continue with the adaptive set.</p></div><Link href={`/training/practice?topic=${encodeURIComponent(selectedTopic)}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 font-black text-white shadow-lg hover:bg-violet-700">Start practice <ArrowRight size={17}/></Link></div></div></section>
        <section className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-black text-slate-400">Starter</p><p className="mt-1 font-black">Build foundations</p></div><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-black text-slate-400">Developing</p><p className="mt-1 font-black">Strengthen accuracy</p></div><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><p className="text-xs font-black text-slate-400">Advanced</p><p className="mt-1 font-black">Stretch your thinking</p></div></section>
      </>}
    </div>
  </main>;
}
