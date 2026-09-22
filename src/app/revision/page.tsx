"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";

type RevisionQuestion = {
  id: number;
  prompt: string;
  instruction: string;
  answer: string;
  unit?: string;
};

const sampleQuestions: RevisionQuestion[] = [
  { id: 1, prompt: "Ming Ming and Jia Jia have pet dogs.\nJia Jia has 5 pet dogs.\nMing Ming has 3 more pet dogs than Jia Jia.\nHow many pet dogs does Ming Ming have?", instruction: "Write your answer in numerals", answer: "8", unit: "dogs" },
  { id: 2, prompt: "There are 9 shells on the beach. 4 more shells are added.\nHow many shells are there altogether?", instruction: "Write your answer in numerals", answer: "13", unit: "shells" },
  { id: 3, prompt: "A box has 12 pencils. 5 pencils are taken out.\nHow many pencils are left?", instruction: "Write your answer in numerals", answer: "7", unit: "pencils" },
];

export default function RevisionPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const current = sampleQuestions[index];
  const value = answers[current.id] ?? "";
  const isCorrect = checked[current.id] && value.trim() === current.answer;
  const isWrong = checked[current.id] && value.trim() !== current.answer;

  const correctCount = useMemo(() => sampleQuestions.filter(q => checked[q.id] && (answers[q.id] ?? "").trim() === q.answer).length, [answers, checked]);
  const wrong = useMemo(() => sampleQuestions.filter(q => checked[q.id] && (answers[q.id] ?? "").trim() !== q.answer), [answers, checked]);

  function checkAnswer() {
    if (!value.trim()) return;
    setChecked(prev => ({ ...prev, [current.id]: true }));
  }

  function retryQuestion(id: number) {
    const next = sampleQuestions.findIndex(q => q.id === id);
    if (next >= 0) setIndex(next);
    setChecked(prev => ({ ...prev, [id]: false }));
    setAnswers(prev => ({ ...prev, [id]: "" }));
    setShowResults(false);
  }

  if (showResults) {
    const percent = Math.round((correctCount / sampleQuestions.length) * 100);
    return <main className="min-h-screen bg-[#3f4f91] text-[#18234f]">
      <header className="flex h-[58px] items-center justify-between bg-[#17275f] px-4 text-white shadow-lg">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#3655ba] px-4 py-2 font-black"><ArrowLeft size={18}/> Back</Link>
        <h1 className="text-lg font-black sm:text-xl">Revision</h1><span className="w-24"/>
      </header>
      <section className="mx-auto max-w-[1120px] px-4 py-16">
        <div className="relative rounded-[22px] border-2 border-[#ffb323] bg-white px-6 pb-10 pt-20 shadow-[10px_10px_0_#ffad19] sm:px-12">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 rounded-xl border-2 border-white bg-[#65df28] px-8 py-3 text-center text-white shadow-lg">
            <p className="text-sm font-black">TOTAL SCORE</p><div className="flex items-end gap-2"><span className="text-4xl font-black">{percent}%</span><span className="pb-1 font-bold">{correctCount} out of {sampleQuestions.length}</span></div>
          </div>
          {wrong.length ? <p className="mx-auto mb-10 max-w-xl rounded-xl bg-red-50 px-4 py-2 text-center font-bold text-red-500">You have {wrong.length} question{wrong.length === 1 ? "" : "s"} to revise. Select one to try again.</p> : <p className="mx-auto mb-10 max-w-xl rounded-xl bg-green-50 px-4 py-2 text-center font-bold text-green-600">Excellent! You corrected every revision question.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{sampleQuestions.map(q => { const ok = checked[q.id] && (answers[q.id] ?? "").trim() === q.answer; return <button key={q.id} onClick={() => ok ? undefined : retryQuestion(q.id)} className={`flex items-center gap-3 rounded-full border px-4 py-3 text-left font-bold ${ok ? "border-green-200 bg-green-50" : "border-red-300 bg-red-50"}`}>{ok ? <Check className="rounded-full bg-green-500 p-1 text-white" size={25}/> : <span className="grid h-7 w-7 place-items-center rounded-full bg-red-400 text-sm text-white">Q{q.id}</span>}Question {q.id}{!ok && <span className="ml-auto text-red-500">Re-try</span>}</button>})}</div>
          <div className="mt-10 flex justify-center"><button onClick={() => wrong.length ? retryQuestion(wrong[0].id) : setShowResults(false)} className="rounded-full bg-[#ff6b00] px-14 py-3 text-xl font-black text-white shadow-md">{wrong.length ? "Try Again" : "Review Again"}</button></div>
        </div>
      </section>
    </main>;
  }

  return <main className="min-h-screen bg-[#3f4f91] text-[#16234e]" style={{backgroundImage:"radial-gradient(circle at 20px 20px,rgba(255,255,255,.055) 2px,transparent 2px)",backgroundSize:"44px 44px"}}>
    <header className="flex h-[60px] items-center justify-between bg-[#17275f] px-3 text-white shadow-lg sm:px-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#3655ba] px-4 py-2 font-black"><ArrowLeft size={18}/> Back</Link>
      <h1 className="text-center text-lg font-black sm:text-xl">Revision</h1>
      <button onClick={() => setShowResults(true)} className="rounded-full bg-[#3655ba] px-5 py-2 font-black">Submit</button>
    </header>

    <section className="mx-auto max-w-[1120px] px-3 py-6 sm:px-6">
      <div className="overflow-hidden rounded-[34px] border-[10px] border-[#f4d940] bg-[#eaf8fb] shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7edf2] px-5 py-5 sm:px-10">
          <div><span className="text-3xl font-black text-[#ff6900]">Question {index + 1}</span><span className="ml-3 text-sm font-bold text-slate-400">Qn ID {current.id}</span></div>
          <div className="flex gap-2"><button disabled={index===0} onClick={() => setIndex(i => Math.max(0,i-1))} className="inline-flex items-center gap-1 rounded-full border border-[#8fd7e7] bg-white px-4 py-2 font-bold text-[#46b9d4] disabled:opacity-40"><ChevronLeft size={18}/> Previous Qn</button><button disabled={index===sampleQuestions.length-1} onClick={() => setIndex(i => Math.min(sampleQuestions.length-1,i+1))} className="inline-flex items-center gap-1 rounded-full border border-[#8fd7e7] bg-white px-4 py-2 font-bold text-[#46b9d4] disabled:opacity-40">Next <ChevronRight size={18}/></button></div>
        </div>

        <div className="min-h-[570px] bg-white px-6 py-8 sm:px-12">
          <div className="max-w-[850px]">
            <p className="whitespace-pre-line text-[20px] font-medium leading-[1.75] sm:text-[24px]">{current.prompt}</p>
            <p className="mt-2 text-lg font-medium text-slate-400 sm:text-xl">{current.instruction}</p>
            <div className="mt-12 flex items-center gap-3"><input value={value} disabled={checked[current.id]} onChange={e => setAnswers(prev => ({...prev,[current.id]:e.target.value}))} onKeyDown={e => {if(e.key==="Enter") checkAnswer();}} className={`h-14 w-44 border-2 bg-white px-4 text-2xl font-bold outline-none ${isCorrect?"border-green-500":isWrong?"border-red-400":"border-slate-400"}`} inputMode="numeric"/><span className="text-xl">{current.unit}</span></div>
            {!checked[current.id] ? <button onClick={checkAnswer} className="mt-16 rounded-full bg-[#2bb9da] px-5 py-2.5 font-black text-white shadow">Check Answer</button> : isCorrect ? <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-4 font-black text-green-600"><Check className="rounded-full bg-green-500 p-1 text-white"/>Correct! Great work.</div> : <div className="mt-8 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5"><div className="flex items-center gap-2 font-black text-red-500"><X className="rounded-full bg-red-500 p-1 text-white"/>Not quite yet.</div><p className="mt-2 font-semibold text-slate-600">Try the question again. Think about what the question is asking you to find.</p><button onClick={() => retryQuestion(current.id)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff765f] px-5 py-2 font-black text-white"><RotateCcw size={17}/>Try Again</button></div>}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-2">{sampleQuestions.map((q,i)=><button key={q.id} onClick={()=>setIndex(i)} className={`h-3 rounded-full transition-all ${i===index?"w-10 bg-yellow-300":"w-3 bg-white/50"}`} aria-label={`Question ${i+1}`}/>)}</div>
    </section>
  </main>;
}
