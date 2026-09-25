"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

type Question = { prompt: string; choices: string[]; answer: string; explanation: string; visual?: string };
type Worksheet = { id: string; title: string; description: string; example: string; questions: Question[] };
const q = (prompt: string, choices: string[], answer: string, explanation: string, visual?: string): Question => ({ prompt, choices, answer, explanation, visual });
const sheets: Worksheet[] = [
  { id: "counting", title: "Count the objects", description: "Count pictures up to 20", example: "Count each object once. Touch each picture as you count.", questions: [
    q("How many shells are there?",["4","5","6"],"5","There are 5 shells.","🐚 🐚 🐚 🐚 🐚"),
    q("How many fish are there?",["6","7","8"],"7","There are 7 fish.","🐟 🐟 🐟 🐟 🐟 🐟 🐟"),
    q("How many stars are there?",["8","9","10"],"9","There are 9 stars.","⭐ ⭐ ⭐ ⭐ ⭐\n⭐ ⭐ ⭐ ⭐"),
    q("How many coconuts are there?",["3","4","5"],"4","There are 4 coconuts.","🥥 🥥 🥥 🥥"),
    q("What number comes after 11?",["10","12","13"],"12","Count on one from 11 to get 12."),
    q("How many turtles are there?",["5","6","7"],"6","There are 6 turtles.","🐢 🐢 🐢 🐢 🐢 🐢"),
    q("What number comes before 15?",["13","14","16"],"14","Count back one from 15 to get 14."),
    q("How many flowers are there?",["10","11","12"],"10","There are 10 flowers.","🌼 🌼 🌼 🌼 🌼\n🌼 🌼 🌼 🌼 🌼"),
    q("Count on: 16, 17, 18, …",["19","20","15"],"19","19 comes after 18."),
    q("How many shells are there?",["12","13","14"],"12","Two groups of 6 make 12.","🐚 🐚 🐚 🐚 🐚 🐚\n🐚 🐚 🐚 🐚 🐚 🐚")
  ]},
  { id: "compare", title: "Compare numbers", description: "More, fewer and equal", example: "Compare the numbers. The larger number represents more objects.", questions: [
    q("Which number is greater?",["8","12","Equal"],"12","12 is greater than 8."),
    q("Which number is smaller?",["7","3","Equal"],"3","3 is smaller than 7."),
    q("Compare 10 and 10.",["10 is greater","10 is smaller","Equal"],"Equal","Both numbers are 10."),
    q("Which group has more?",["Shells","Fish","Equal"],"Fish","There are 5 fish and 3 shells.","🐚 🐚 🐚\n🐟 🐟 🐟 🐟 🐟"),
    q("Which number is greater?",["16","19","Equal"],"19","19 is greater than 16."),
    q("Which number is smaller?",["14","11","Equal"],"11","11 is smaller than 14."),
    q("Which group has fewer?",["Stars","Turtles","Equal"],"Turtles","There are 4 turtles and 6 stars.","⭐ ⭐ ⭐ ⭐ ⭐ ⭐\n🐢 🐢 🐢 🐢"),
    q("Compare 15 and 15.",["15 is greater","15 is smaller","Equal"],"Equal","Both numbers are 15."),
    q("Which number is greater?",["20","18","Equal"],"20","20 is greater than 18."),
    q("Which number is smaller?",["9","13","Equal"],"9","9 is smaller than 13.")
  ]},
  { id: "tens-ones", title: "Tens and ones", description: "Build numbers up to 99", example: "2 tens and 3 ones make 23. Each ten is a group of 10.", questions: [
    q("2 tens and 7 ones make …",["27","72","9"],"27","2 tens are 20; add 7 ones to make 27."),
    q("1 ten and 4 ones make …",["14","41","5"],"14","10 + 4 = 14."),
    q("How many tens are in 30?",["2","3","0"],"3","30 is 3 groups of ten."),
    q("How many ones are in 46?",["4","6","10"],"6","The last digit of 46 shows 6 ones."),
    q("5 tens and 2 ones make …",["25","52","7"],"52","50 + 2 = 52."),
    q("How many tens are in 68?",["6","8","68"],"6","68 has 6 tens and 8 ones."),
    q("3 tens and 0 ones make …",["3","30","33"],"30","Three groups of ten make 30."),
    q("How many ones are in 91?",["1","9","10"],"1","91 has 9 tens and 1 one."),
    q("7 tens and 5 ones make …",["57","75","12"],"75","70 + 5 = 75."),
    q("How many tens and ones are in 84?",["8 tens, 4 ones","4 tens, 8 ones","8 tens, 0 ones"],"8 tens, 4 ones","84 is 80 + 4.")
  ]},
  { id: "addition", title: "Add with pictures", description: "Add within 20", example: "Count the first group, then count on using the second group.", questions: [
    q("2 + 3 = ?",["4","5","6"],"5","2 and 3 make 5.","🐚 🐚  +  🐚 🐚 🐚"),
    q("4 + 2 = ?",["5","6","7"],"6","4 and 2 make 6.","⭐ ⭐ ⭐ ⭐  +  ⭐ ⭐"),
    q("5 + 5 = ?",["9","10","11"],"10","Two groups of 5 make 10."),
    q("7 + 1 = ?",["7","8","9"],"8","Count on one from 7 to get 8."),
    q("3 + 6 = ?",["8","9","10"],"9","6, then count on 3: 7, 8, 9."),
    q("10 + 4 = ?",["13","14","15"],"14","10 and 4 make 14."),
    q("8 + 2 = ?",["9","10","11"],"10","8, 9, 10: 8 + 2 = 10."),
    q("6 + 3 = ?",["8","9","10"],"9","Count on from 6: 7, 8, 9."),
    q("9 + 1 = ?",["9","10","11"],"10","One more than 9 is 10."),
    q("4 + 4 = ?",["7","8","9"],"8","Double 4 is 8.")
  ]}
];
const key = "fahi-grade-one-worksheets-v1";
type Result = { score: number; total: number; date: string };

export default function GradeOneWorksheets() {
  const [selected, setSelected] = useState<Worksheet | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<Record<string,Result>>({});
  useEffect(() => { try { setHistory(JSON.parse(localStorage.getItem(key) || "{}")); } catch { /* Storage may be disabled. */ } }, []);
  const start = (sheet: Worksheet) => { setSelected(sheet); setIndex(0); setAnswers({}); setSubmitted(false); };
  const submit = () => {
    if (!selected || Object.keys(answers).length !== selected.questions.length) return;
    const score = selected.questions.reduce((n,item,i) => n + Number(answers[i] === item.answer),0);
    const next = { ...history, [selected.id]: { score, total: selected.questions.length, date: new Date().toISOString() } };
    setHistory(next); setSubmitted(true);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* The result remains visible for this session. */ }
  };
  const question = selected?.questions[index];
  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4 py-7 text-[#15233f] sm:px-6">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between gap-4"><Link href="/learn" className="inline-flex items-center gap-2 font-bold text-violet-700"><ArrowLeft size={18}/> Learning</Link><span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold shadow-sm">Fahi Hisaabu · Grade 1</span></header>
      {!selected ? <><section className="mt-7 rounded-[2rem] bg-gradient-to-r from-violet-700 to-cyan-600 p-7 text-white shadow-xl sm:p-10"><p className="font-bold text-cyan-100">LEARN · PRACTISE · GROW</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Grade 1 Online Worksheets</h1><p className="mt-3 max-w-2xl text-lg text-violet-50">Short, visual maths practice you can finish at your own pace. Choose a skill to begin.</p></section><section className="mt-8 grid gap-5 sm:grid-cols-2">{sheets.map((sheet,i) => <button key={sheet.id} onClick={() => start(sheet)} className="rounded-3xl border border-violet-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-extrabold text-violet-700">Worksheet {i+1} · 10 questions</span><h2 className="mt-5 text-2xl font-black">{sheet.title}</h2><p className="mt-2 text-slate-600">{sheet.description}</p><div className="mt-6 flex items-center justify-between border-t pt-4 font-bold text-violet-700"><span>{history[sheet.id] ? `Last score: ${history[sheet.id].score}/10` : "Start worksheet"}</span><ArrowRight size={19}/></div></button>)}</section><p className="mt-5 text-center text-sm text-slate-500">Progress is saved on this device for this pilot.</p></> : submitted ? <section className="mt-8 rounded-3xl bg-white p-6 shadow-lg sm:p-10"><p className="text-sm font-extrabold uppercase tracking-widest text-violet-700">Worksheet complete</p><h1 className="mt-2 text-3xl font-black">{selected.title}</h1><p className="mt-5 text-5xl font-black text-emerald-600">{history[selected.id]?.score}/{selected.questions.length}</p><p className="mt-2 text-slate-600">Review your answers and try again whenever you are ready.</p><div className="mt-7 space-y-3">{selected.questions.map((item,i) => <div key={i} className={`rounded-2xl border p-4 ${answers[i]===item.answer?"border-emerald-200 bg-emerald-50":"border-amber-200 bg-amber-50"}`}><p className="font-bold">{i+1}. {item.prompt}</p><p className="mt-1 text-sm">Your answer: {answers[i]} · Correct answer: {item.answer}</p><p className="mt-1 text-sm text-slate-600">{item.explanation}</p></div>)}</div><div className="mt-7 flex flex-wrap gap-3"><button onClick={() => start(selected)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-bold text-white"><RotateCcw size={17}/> Try again</button><button onClick={() => setSelected(null)} className="rounded-xl border px-5 py-3 font-bold">Choose another worksheet</button></div></section> : <section className="mt-8 rounded-3xl bg-white p-5 shadow-lg sm:p-9"><button onClick={() => setSelected(null)} className="text-sm font-bold text-violet-700">← All worksheets</button><div className="mt-5 flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-violet-700">{selected.title}</p><h1 className="text-2xl font-black">Question {index+1} of {selected.questions.length}</h1></div><span className="rounded-full bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800">{Object.keys(answers).length}/{selected.questions.length} answered</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-violet-600" style={{width:`${((index+1)/selected.questions.length)*100}%`}}/></div><p className="mt-6 rounded-2xl bg-violet-50 p-4 text-sm font-semibold text-violet-900">Remember: {selected.example}</p><div className="mt-8 min-h-48"><h2 className="text-xl font-black sm:text-2xl">{question?.prompt}</h2>{question?.visual && <div aria-label={question.visual.replaceAll("\n", " ")} className="mt-5 whitespace-pre-line rounded-2xl bg-cyan-50 p-5 text-center text-3xl leading-[2.1] tracking-wide sm:text-4xl">{question.visual}</div>}<div className="mt-6 grid gap-3 sm:grid-cols-3">{question?.choices.map(choice => <button key={choice} onClick={() => setAnswers({...answers,[index]:choice})} aria-pressed={answers[index]===choice} className={`min-h-16 rounded-2xl border-2 px-4 py-3 text-lg font-black transition ${answers[index]===choice?"border-violet-700 bg-violet-100 text-violet-900":"border-slate-200 bg-white hover:border-violet-400"}`}>{choice}</button>)}</div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><button disabled={index===0} onClick={() => setIndex(index-1)} className="rounded-xl px-4 py-3 font-bold text-violet-700 disabled:opacity-40">Previous</button>{index < selected.questions.length-1 ? <button onClick={() => setIndex(index+1)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-bold text-white">Next <ArrowRight size={17}/></button> : <button disabled={Object.keys(answers).length !== selected.questions.length} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={17}/> Submit worksheet</button>}</div>{index===selected.questions.length-1 && Object.keys(answers).length!==selected.questions.length && <p className="mt-3 text-right text-sm text-slate-600">Answer every question before submitting. Use Previous to check skipped questions.</p>}</section>}
    </div>
  </main>;
}
