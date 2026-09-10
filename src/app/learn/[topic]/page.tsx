"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { questions, topics } from "@/lib/learning/data";

export default function TopicPage() {
  const params = useParams<{ topic: string }>();
  const topicId = params.topic;
  const topic = topics.find((item) => item.id === topicId);
  const quiz = useMemo(() => questions[topicId] ?? [], [topicId]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!topic || quiz.length === 0) return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-black text-[#071b3a]">Topic not found</h1><Link href="/learn" className="mt-4 inline-block font-bold text-[#0d666b]">Back to learning path</Link></div></main>;

  const question = quiz[current];
  const answered = selected !== null;
  const correct = selected === question.answer;

  function choose(option: string) {
    if (answered) return;
    setSelected(option);
    if (option === question.answer) setScore((value) => value + 10);
  }

  function next() {
    if (current + 1 >= quiz.length) setFinished(true);
    else { setCurrent((value) => value + 1); setSelected(null); }
  }

  function restart() { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }

  return <main className="min-h-screen bg-[#f7f9fc]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4"><Link href="/learn" className="inline-flex items-center gap-2 text-sm font-bold text-[#0d666b]"><ArrowLeft size={16}/> Learning path</Link><span className="text-sm font-bold text-slate-500">{topic.level}</span></div></header>
    <div className="mx-auto max-w-4xl px-5 py-8">
      {finished ? <section className="rounded-3xl bg-white p-8 text-center shadow-xl sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e2b75d]/20"><Trophy size={36} className="text-[#c9952e]"/></div><p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">Topic complete</p><h1 className="mt-2 text-3xl font-black text-[#071b3a]">Great work!</h1><p className="mt-3 text-slate-500">You earned <strong className="text-[#071b3a]">{score} XP</strong> in {topic.title}.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-[#071b3a]"><RotateCcw size={17}/> Try again</button><Link href="/learn" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d666b] px-5 py-3 font-bold text-white">Choose another topic <ArrowRight size={17}/></Link></div></section> : <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-9"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">{topic.title}</p><h1 className="mt-1 text-2xl font-black text-[#071b3a]">Practice</h1></div><div className="rounded-2xl bg-[#071b3a] px-4 py-3 text-right text-white"><p className="text-xs text-slate-300">XP</p><p className="font-black">{score}</p></div></div><div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0d666b] transition-all" style={{ width: `${((current + 1) / quiz.length) * 100}%` }}/></div><p className="mt-3 text-sm font-semibold text-slate-500">Question {current + 1} of {quiz.length}</p><h2 className="mt-6 text-2xl font-black leading-tight text-[#071b3a]">{question.prompt}</h2><div className="mt-6 grid gap-3">{question.options.map((option) => { const isSelected = selected === option; const isAnswer = option === question.answer; let className = "border-slate-200 bg-white hover:border-[#0d666b] hover:bg-slate-50"; if (answered && isAnswer) className = "border-emerald-400 bg-emerald-50"; else if (answered && isSelected) className = "border-red-400 bg-red-50"; return <button key={option} onClick={() => choose(option)} className={`flex items-center justify-between rounded-2xl border p-4 text-left font-bold text-[#071b3a] transition ${className}`}><span>{option}</span>{answered && isAnswer && <CheckCircle2 className="text-emerald-600" size={20}/>} {answered && isSelected && !isAnswer && <XCircle className="text-red-600" size={20}/>}</button>; })}</div>{answered && <div className={`mt-6 rounded-2xl p-5 ${correct ? "bg-emerald-50" : "bg-amber-50"}`}><p className="font-black text-[#071b3a]">{correct ? "Correct! +10 XP" : `Not quite. The answer is ${question.answer}.`}</p><p className="mt-1 text-sm leading-6 text-slate-600">{question.explanation}</p></div>}<div className="mt-7 flex justify-end">{answered && <button onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-bold text-white">{current + 1 >= quiz.length ? "Finish" : "Next question"} <ArrowRight size={17}/></button>}</div></section>}
    </div>
  </main>;
}
