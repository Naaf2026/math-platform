"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, HelpCircle, Home, Play, Star, Trophy, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic = { id: string; title: string; description: string; level: string; lessons: number; sort_order: number; grade_level?: string };
type Question = { id: string; topic_id?: string; topic?: string; skill?: string; difficulty: string; prompt?: string; options?: string[] };
type Progress = { topic_id: string; questions_answered: number; correct_answers: number };

const fallbackTopics: Topic[] = [
  { id: "place-value", title: "Numbers to 10000", description: "Read, compare and build numbers.", level: "Grade 3", grade_level: "Grade 3", lessons: 9, sort_order: 1 },
  { id: "addition-subtraction", title: "Addition & Subtraction", description: "Calculate accurately and solve problems.", level: "Grade 3", grade_level: "Grade 3", lessons: 9, sort_order: 2 },
  { id: "multiplication", title: "Multiplication & Division", description: "Build fluency with multiplication and division facts.", level: "Grade 3", grade_level: "Grade 3", lessons: 9, sort_order: 3 },
  { id: "fractions", title: "Fractions", description: "Understand parts, equivalence and comparison.", level: "Grade 3", grade_level: "Grade 3", lessons: 9, sort_order: 4 },
];

const gradeLevels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"];
const curriculumGroups = ["Money", "Money (Advanced)", "Multiplication Tables", "Multiplication & Division", "Multiplication & Division (Advanced)", "Bar Graphs", "Bar Graphs (Advanced)", "Angles", "Perpendicular And Parallel Lines"];

function difficultyBars(value: string) {
  const x = value.toLowerCase();
  if (x.includes("hard") || x.includes("advanced") || x.includes("master")) return 4;
  if (x.includes("medium") || x.includes("intermediate")) return 2;
  return 1;
}

export default function TrainingPage() {
  const [allTopics, setAllTopics] = useState<Topic[]>(fallbackTopics);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [grade, setGrade] = useState("Grade 3");
  const [selectedTopic, setSelectedTopic] = useState("place-value");
  const [levelOpen, setLevelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/login"; return; }
    const [{ data: ts }, { data: ps }, { data: profile }] = await Promise.all([
      supabase.from("learning_topics").select("id,title,description,level,lessons,sort_order,grade_level").order("sort_order"),
      supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers").eq("user_id", auth.user.id),
      supabase.from("profiles").select("grade").eq("id", auth.user.id).maybeSingle(),
    ]);
    if (ts?.length) setAllTopics(ts as Topic[]);
    setProgress((ps ?? []) as Progress[]);
    if (profile?.grade) {
      const raw = String(profile.grade);
      const match = raw.match(/[1-7]/);
      if (match) setGrade(`Grade ${match[0]}`);
    }
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !allTopics.length) return;
    void (async () => {
      const { data } = await supabase.rpc("get_training_questions", { p_grade_level: grade, p_limit: 500 });
      setQuestions((data ?? []) as Question[]);
    })();
  }, [grade, allTopics]);

  const topics = useMemo(() => allTopics.filter(t => t.grade_level === grade), [allTopics, grade]);

  useEffect(() => {
    if (!topics.some(t => t.id === selectedTopic)) setSelectedTopic(topics[0]?.id ?? "");
  }, [topics, selectedTopic]);

  const selected = topics.find(t => t.id === selectedTopic) ?? topics[0];
  const skillRows = useMemo(() => {
    if (!selected) return [];
    return Array.from(new Map(questions.filter(q => q.topic_id === selected.id && q.skill).map(q => [q.skill, q])).values()).slice(0, 50);
  }, [questions, selected]);
  const selectedProgress = progress.find(p => p.topic_id === selectedTopic);
  const completed = selectedProgress?.questions_answered ?? 0;
  const score = completed ? Math.min(3, Math.round(((selectedProgress?.correct_answers ?? 0) / completed) * 3)) : 0;
  const totalSkills = skillRows.length;

  if (loading) return <main className="min-h-screen bg-[#f4f4f4] flex items-center justify-center"><div className="rounded-xl bg-white px-10 py-8 shadow">Loading Training…</div></main>;

  return (
    <main className="min-h-screen bg-[#f4f4f4] text-[#202020] lg:pl-20">
      <header className="h-12 bg-[#303333] px-4 text-white shadow-md"><div className="mx-auto flex h-full max-w-[1400px] items-center justify-between"><div className="flex items-center gap-4 font-bold"><div className="flex items-center gap-2 text-lg tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[11px] font-black text-[#303333]">FV</span><span>FAHI VISSNUN</span></div><span className="rounded-full bg-[#1f2525] px-4 py-1 text-xs">Math ▾</span></div><nav className="hidden items-center gap-10 text-sm font-semibold md:flex"><Link href="/dashboard" className="flex items-center gap-2 hover:text-yellow-300"><Home size={17}/>Home</Link><Link href="/progress" className="flex items-center gap-2 hover:text-yellow-300"><BarChart3 size={17}/>Report</Link><Link href="/leaderboard" className="flex items-center gap-2 hover:text-yellow-300"><Trophy size={17}/>Leaderboard</Link><Link href="/rewards" className="flex items-center gap-2 hover:text-yellow-300"><Award size={17}/>Achievement</Link><span className="flex items-center gap-2"><HelpCircle size={18}/>Help</span></nav><span className="grid h-8 w-8 place-items-center rounded-full bg-[#555]">⌄</span></div></header>
      <section className="relative h-[105px] overflow-hidden bg-[#103dd2] text-white"><div className="absolute inset-0 opacity-80" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.9) 1px, transparent 1.5px)", backgroundSize: "28px 24px" }} /><div className="relative mx-auto flex h-full max-w-[900px] items-center justify-center gap-7 text-center"><span className="text-4xl">🚀</span><div><p className="text-xl font-black sm:text-2xl">Click Practice Button to Start!</p><p className="text-xs font-bold text-blue-100">({totalSkills} skills available for {grade})</p></div><span className="text-2xl">★</span></div></section>
      <div className="mx-auto flex max-w-[1120px] gap-0 bg-white shadow-sm">
        <aside className="hidden w-[205px] shrink-0 border-r border-[#d4d4d4] bg-[#f1f2f2] md:block"><div className="relative flex items-center justify-between border-b border-[#ccc] bg-[#e3e6e6] p-3"><div><p className="text-xs font-bold">{grade}</p></div><button onClick={() => setLevelOpen(v => !v)} className="rounded-md border border-blue-200 bg-[#edf4ff] px-3 py-2 text-xs font-semibold text-blue-800">Change Level</button></div>{levelOpen && <div className="absolute z-20 ml-[1px] w-[204px] border border-[#ccc] bg-white shadow-lg">{gradeLevels.map(level => <button key={level} onClick={() => { setGrade(level); setLevelOpen(false); }} className={`block w-full px-5 py-2 text-left text-sm ${grade === level ? "bg-[#cfd0d0] font-bold" : "hover:bg-slate-100"}`}>{level}</button>)}</div>}<div className="max-h-[560px] overflow-y-auto p-3">{curriculumGroups.map(item => <button key={item} className="block w-full py-2 text-left text-[12px] font-bold leading-4 hover:text-blue-700">{item}</button>)}</div></aside>
        <section className="min-w-0 flex-1 bg-white"><div className="flex items-center justify-between px-5 pt-4"><div className="font-bold text-[#222]">⭐ 0 <span className="text-slate-400">/ {skillRows.length}</span></div><div className="flex overflow-hidden rounded-full border border-slate-200 text-xs font-bold"><span className="px-4 py-2 text-slate-400">Proficiency %</span><span className="bg-[#3579c9] px-4 py-2 text-white">High Score ★★★</span></div></div>
          <div className="px-5 pb-5 pt-1"><h1 className="text-center text-2xl font-black">{selected?.title ?? grade}</h1>{!selected ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"><h2 className="text-lg font-black">No curriculum published for {grade}</h2><p className="mt-2 text-sm text-slate-500">Questions and skills assigned to {grade} will appear here automatically when published.</p></div> : skillRows.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center"><h2 className="text-lg font-black">No questions published for {grade}</h2><p className="mt-2 text-sm text-slate-500">This grade and topic are ready for content. Once questions are published for {grade}, the skill list will appear here automatically.</p></div> : <div className="mt-5 overflow-hidden rounded-2xl border border-[#e4e7e8]"><div className="grid grid-cols-[54px_92px_1fr_80px_150px] items-center border-b bg-[#fafafa] px-3 py-2 text-[10px] font-semibold text-slate-400"><span></span><span>High Score</span><span>Skill Name</span><span>Difficulty</span><span>Tutorial</span></div>{skillRows.map((q, index) => { const bars = difficultyBars(q.difficulty); const skill = q.skill ?? selected.title; return <div key={q.id + index} className="grid min-h-[55px] grid-cols-[54px_92px_1fr_80px_150px] items-center border-b border-[#eceeee] px-3 last:border-b-0 hover:bg-[#fbfdff]"><div className="text-center text-xl font-black text-[#82c8ed]">{index + 1}</div><div className="flex gap-0.5">{[0,1,2].map(s => <Star key={s} className={s < score ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"} size={17}/>)}</div><div className="pr-3 text-[13px] font-semibold leading-4">{skill}</div><div className="flex gap-0.5">{[0,1,2,3,4].map(b => <span key={b} className={`h-4 w-2 rounded-sm ${b < bars ? "bg-orange-500" : "bg-slate-200"}`}></span>)}</div><div className="flex items-center gap-2"><Link href={`/training/practice?topic=${encodeURIComponent(selected.id)}&skill=${encodeURIComponent(skill)}&grade=${encodeURIComponent(grade)}`} aria-label={`Practice ${skill}`} className="grid h-8 w-8 place-items-center rounded-md bg-[#f59b00] text-white shadow-sm"><Play size={16} fill="currentColor"/></Link><Link href={`/training/practice?topic=${encodeURIComponent(selected.id)}&skill=${encodeURIComponent(skill)}&grade=${encodeURIComponent(grade)}`} className="rounded-full border-2 border-[#edcf86] bg-white px-4 py-1.5 text-xs font-black text-[#d88900] hover:bg-[#fff8e7]">{completed > 0 ? "Continue" : "Practice"}</Link></div></div>; })}</div>}</div>
        </section>
      </div>
      <div className="mx-auto max-w-[1120px] bg-white px-5 py-3 text-xs text-slate-500"><span className="font-bold">{grade}</span><span className="mx-3">•</span><span>{completed} questions completed</span><span className="mx-3">•</span><span>{selectedProgress?.correct_answers ?? 0} correct</span></div>
    </main>
  );
}
