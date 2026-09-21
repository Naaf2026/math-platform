"use client";
import Link from "next/link";
import { useMemo,useState } from "react";
import { ArrowLeft,CheckCircle2 } from "lucide-react";
import type { BrainGame } from "@/lib/brain-games/catalog";

type Q={prompt:string;choices:number[];answer:number};
function rng(seed:number){let x=seed||1;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296}}
function makeQuestions(game:BrainGame):Q[]{
 const seed=[...game.id].reduce((a,c)=>a+c.charCodeAt(0),0),r=rng(seed);
 return Array.from({length:5},(_,i)=>{const a=2+Math.floor(r()*18),b=1+Math.floor(r()*12);let answer:number,prompt:string;
  switch(game.mechanic){
   case "subtraction": answer=a+b; prompt=`${answer} − ${b} = ?`; break;
   case "multiply": answer=(2+Math.floor(r()*8))*(2+Math.floor(r()*6)); prompt=`Which answer equals ${answer}?`; break;
   case "odd-even": answer=(a%2===0)?0:1; prompt=`Is ${a} even or odd? (0 = even, 1 = odd)`; break;
   case "compare": answer=Math.max(a,b); prompt=`Choose the greater number: ${a} or ${b}`; break;
   case "missing": answer=a; prompt=`? + ${b} = ${a+b}`; break;
   case "pattern": answer=a+6; prompt=`Continue: ${a}, ${a+2}, ${a+4}, ?`; break;
   case "reverse": answer=a; prompt=`Put back the starting number: ${a+5} − 5 = ?`; break;
   default: answer=a+b; prompt=`${a} + ${b} = ?`;
  }
  const choices=[answer,answer+1,Math.max(0,answer-1),answer+2].filter((v,j,x)=>x.indexOf(v)===j).slice(0,4);
  while(choices.length<4) choices.push(answer+choices.length+3);
  return {prompt:`${i+1}. ${prompt}`,choices:choices.sort(()=>r()-.5),answer};
 });
}
export default function BrainGameChallenge({game,nextId}:{game:BrainGame;nextId:string|null}){
 const questions=useMemo(()=>makeQuestions(game),[game]); const [index,setIndex]=useState(0),[score,setScore]=useState(0),[done,setDone]=useState(false),[picked,setPicked]=useState<number|null>(null);
 const q=questions[index];
 function choose(v:number){if(picked!==null)return;setPicked(v);if(v===q.answer)setScore(s=>s+1);setTimeout(()=>{if(index===questions.length-1){setDone(true);const key=`mind-games-completed:${game.category}`;const old=JSON.parse(localStorage.getItem(key)||"[]") as string[];localStorage.setItem(key,JSON.stringify(Array.from(new Set([...old,game.id]))));}else{setIndex(i=>i+1);setPicked(null)}},550)}
 return <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 text-[#17395f] sm:p-7"><div className="mx-auto max-w-2xl">
  <Link href={`/brain-games/${game.category}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow"><ArrowLeft size={16}/> {game.title}</Link>
  <section className="mt-5 rounded-[30px] bg-white p-6 shadow-xl ring-1 ring-slate-100 sm:p-9">
   {!done?<><div className="flex items-center justify-between text-xs font-black text-slate-400"><span>{game.id.toUpperCase()}</span><span>{index+1}/5</span></div>
   <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-violet-500 transition-all" style={{width:`${((index+1)/5)*100}%`}}/></div>
   <h1 className="mt-7 text-2xl font-black sm:text-3xl">{q.prompt}</h1><div className="mt-6 grid grid-cols-2 gap-3">{q.choices.map(v=><button key={v} onClick={()=>choose(v)} className={`rounded-2xl border-2 p-5 text-xl font-black transition ${picked===v?(v===q.answer?"border-emerald-400 bg-emerald-50":"border-rose-400 bg-rose-50"):"border-slate-100 bg-slate-50 hover:border-violet-300"}`}>{v}</button>)}</div></>:
   <div className="py-8 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={64}/><h1 className="mt-4 text-3xl font-black">Challenge complete!</h1><p className="mt-2 font-bold text-slate-500">Score: {score}/5 · +{game.reward} XP</p><p className="mt-2 text-sm font-semibold text-slate-400">This game is now marked completed and will be skipped by the no-repeat cycle.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">{nextId?<Link href={`/brain-games/challenge/${nextId}`} className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white">Next unplayed game →</Link>:<Link href={`/brain-games/${game.category}`} className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white">Category complete 🎉</Link>}<Link href="/brain-games" className="rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-600">Back to map</Link></div></div>}
  </section></div></main>
}