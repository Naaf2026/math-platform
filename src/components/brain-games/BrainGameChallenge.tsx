"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { ArrowLeft,CheckCircle2 } from "lucide-react";
import type { BrainGame } from "@/lib/brain-games/catalog";

type Q={prompt:string;choices:number[];answer:number};
function rng(seed:number){let x=seed||1;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296}}
function makeQuestions(game:BrainGame):Q[]{
 const gameNo=Number(game.id.split("-").pop())||1;
 const seed=[...game.id].reduce((a,c)=>a+c.charCodeAt(0),0),r=rng(seed);
 return Array.from({length:5},(_,i)=>{
  const a=2+Math.floor(r()*18),b=1+Math.floor(r()*12),step=2+(gameNo%4);
  let answer:number,prompt:string;
  if(game.category==="memory"){
   switch(gameNo){
    case 1: answer=a+b; prompt=`Remember this pair: ${a} and ${b}. What is their total?`; break;
    case 2: answer=a; prompt=`Flash recall: keep ${a}, ${b}, ${a+b} in mind. Which was the FIRST number?`; break;
    case 3: answer=b; prompt=`Hidden numbers: ${a} • ${b} • ${a+b}. Which number was in the MIDDLE?`; break;
    case 4: answer=a+2*step; prompt=`What's missing? ${a}, ${a+step}, ?, ${a+3*step}`; break;
    case 5: answer=a; prompt=`Number Echo: remember ${a} → ${b} → ${a+b}. Which number started the echo?`; break;
    case 6: answer=a+b; prompt=`Equation Recall: remember ${a} + ${b}. What was its answer?`; break;
    case 7: answer=a+3*step; prompt=`Pattern Memory: ${a}, ${a+step}, ${a+2*step}, ?`; break;
    case 8: answer=b; prompt=`Quick Peek: ${a} | ${b} | ${a+b}. Recall the centre number.`; break;
    case 9: answer=a; prompt=`Pair Power: pair ${a} with ${a+b}. If the second is ${a+b}, what was its partner?`; break;
    case 10: answer=a+3; prompt=`Memory Ladder: ${a}, ${a+1}, ${a+2}, ?`; break;
    case 11: answer=a+b; prompt=`Number Snapshot: snapshot [${a}, ${b}, ${a+b}]. Recall the largest number.`; break;
    case 12: answer=(gameNo+i)%4+1; prompt=`Shape Recall code: Circle=1, Square=2, Triangle=3, Star=4. Remember code ${(gameNo+i)%4+1}. Which code was shown?`; break;
    case 13: answer=b; prompt=`Sequence Keeper: ${a} → ${b} → ${a+b}. Which number came second?`; break;
    case 14: answer=a+b; prompt=`Math Match: remember ${a} and ${b}. Choose their matching total.`; break;
    case 15: answer=b; prompt=`Missing Pair: pair [${a}, ${b}] was shown. You can still see ${a}. Which number is missing?`; break;
    case 16: answer=(a%9)+1; prompt=`Memory Grid: remember highlighted cell ${(a%9)+1} in a 1–9 grid. Which cell was it?`; break;
    case 17: answer=a; prompt=`Recall Rush: ${a}, ${b}, ${a+b}. Quickly recall the first number!`; break;
    case 18: answer=(a*10+b)%100; prompt=`Number Vault: code digits are ${a%10} then ${b%10}. Enter the two-digit code.`; answer=(a%10)*10+(b%10); break;
    case 19: answer=a+b; prompt=`Equation Cards: card A says ${a} + ${b}. Recall its answer.`; break;
    case 20: answer=a+2*step; prompt=`Pattern Vault: remember ${a}, ${a+step}, ${a+2*step}. What was the third number?`; break;
    case 21: answer=a+3; prompt=`Memory Steps: start at ${a}, then +1, +1, +1. Where do you finish?`; break;
    case 22: answer=a+b; prompt=`Hidden Total: remember ${a} and ${b}; now give their hidden total.`; break;
    case 23: answer=a+b; prompt=`Flash Equation: ${a} + ${b} flashed on screen. Recall the result.`; break;
    case 24: answer=a; prompt=`Recall Order: ${a}, ${b}, ${a+b}. Which number was first?`; break;
    case 25: answer=a+b+gameNo%3; prompt=`Math Memory Mix: remember ${a} + ${b}, then add ${gameNo%3}. Result?`; break;
    case 26: answer=a+2*step; prompt=`Number Trail: ${a} → ${a+step} → ${a+2*step}. Where did the trail end?`; break;
    case 27: answer=b; prompt=`Memory Switch: first [${a}, ${b}], then positions switch. Which number moves to the FIRST position?`; break;
    case 28: answer=a+3*step; prompt=`Secret Sequence: ${a}, ${a+step}, ${a+2*step}, ?`; break;
    case 29: answer=a+b; prompt=`Brain Snapshot: snapshot has ${a}, ${b}, ${a+b}. Recall the highest value.`; break;
    default: answer=a+b; prompt=`Memory Master: remember ${a} and ${b}; combine them. What total do you recall?`;
   }
  } else {
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
  }
  const pool=[answer,answer+1,Math.max(0,answer-1),answer+2,answer+3].filter((v,j,x)=>x.indexOf(v)===j);
  const choices=pool.slice(0,4).sort(()=>r()-.5);
  return {prompt:`${i+1}. ${prompt}`,choices,answer};
 });
}
export default function BrainGameChallenge({game,categoryGameIds}:{game:BrainGame;categoryGameIds:string[]}){
 const questions=useMemo(()=>makeQuestions(game),[game]); const [index,setIndex]=useState(0),[score,setScore]=useState(0),[done,setDone]=useState(false),[picked,setPicked]=useState<number|null>(null);
 const q=questions[index];
 const [completed,setCompleted]=useState<string[]>([]);
 useEffect(()=>{
  setCompleted(JSON.parse(localStorage.getItem(`mind-games-completed:${game.category}`)||"[]") as string[]);
 },[game.category]);
 const nextId=categoryGameIds.find(id=>id!==game.id&&!completed.includes(id))??null;
 function choose(v:number){if(picked!==null)return;setPicked(v);if(v===q.answer)setScore(s=>s+1);setTimeout(()=>{if(index===questions.length-1){setDone(true);const key=`mind-games-completed:${game.category}`;const old=JSON.parse(localStorage.getItem(key)||"[]") as string[];const updated=Array.from(new Set([...old,game.id]));localStorage.setItem(key,JSON.stringify(updated));setCompleted(updated);}else{setIndex(i=>i+1);setPicked(null)}},550)}
 return <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 text-[#17395f] sm:p-7"><div className="mx-auto max-w-2xl">
  <Link href={`/brain-games/${game.category}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow"><ArrowLeft size={16}/> {game.title}</Link>
  <section className="mt-5 rounded-[30px] bg-white p-6 shadow-xl ring-1 ring-slate-100 sm:p-9">
   {!done?<><div className="flex items-center justify-between text-xs font-black text-slate-400"><span>{game.id.toUpperCase()}</span><span>{index+1}/5</span></div>
   <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-violet-500 transition-all" style={{width:`${((index+1)/5)*100}%`}}/></div>
   <h1 className="mt-7 text-2xl font-black sm:text-3xl">{q.prompt}</h1><div className="mt-6 grid grid-cols-2 gap-3">{q.choices.map(v=><button key={v} onClick={()=>choose(v)} className={`rounded-2xl border-2 p-5 text-xl font-black transition ${picked===v?(v===q.answer?"border-emerald-400 bg-emerald-50":"border-rose-400 bg-rose-50"):"border-slate-100 bg-slate-50 hover:border-violet-300"}`}>{v}</button>)}</div></>:
   <div className="py-8 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={64}/><h1 className="mt-4 text-3xl font-black">Challenge complete!</h1><p className="mt-2 font-bold text-slate-500">Score: {score}/5 · +{game.reward} XP</p><p className="mt-2 text-sm font-semibold text-slate-400">This game is now marked completed and will be skipped by the no-repeat cycle.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">{nextId?<Link href={`/brain-games/challenge/${nextId}`} className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white">Next unplayed game →</Link>:<Link href={`/brain-games/${game.category}`} className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white">Category complete 🎉</Link>}<Link href="/brain-games" className="rounded-2xl bg-slate-100 px-6 py-3 font-black text-slate-600">Back to map</Link></div></div>}
  </section></div></main>
}