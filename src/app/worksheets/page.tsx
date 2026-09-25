"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, HelpCircle, Printer, RefreshCw, XCircle } from "lucide-react";

type Problem={a:number;b:number;icon:string};
const icons=["🐚","🐟","🥥","⭐","🌸","🐢"];
const makeProblems=(count:number,challenge:number):Problem[]=>{
 const max=challenge===1?10:challenge===2?15:20;
 return Array.from({length:count},(_,i)=>{
  const a=1+((i*3+challenge*2)%Math.max(2,max-2));
  const room=Math.max(1,max-a);
  const b=1+((i*5+challenge)%room);
  return {a,b,icon:icons[(i+challenge)%icons.length]};
 });
};
const objects=(icon:string,n:number)=>Array.from({length:n},()=>icon).join(" ");

export default function WorksheetsPage(){
 const [challenge,setChallenge]=useState(1);
 const [count,setCount]=useState(5);
 const [seed,setSeed]=useState(0);
 const [problems,setProblems]=useState<Problem[]>([]);
 const [answers,setAnswers]=useState<Record<number,string>>({});
 const [checked,setChecked]=useState(false);
 const [help,setHelp]=useState(false);
 useEffect(()=>{setProblems(makeProblems(count,challenge));setAnswers({});setChecked(false)},[count,challenge,seed]);
 const fresh=()=>setSeed(v=>v+1);
 const score=problems.reduce((n,p,i)=>n+Number(Number(answers[i])===p.a+p.b),0);
 return <main className="min-h-screen bg-[#f8f5e9] text-[#17234b] print:bg-white">
  <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 print:max-w-none print:p-0">
   <header className="flex items-center justify-between gap-3 print:hidden">
    <Link href="/learn" className="inline-flex items-center gap-2 font-black text-violet-700"><ArrowLeft size={18}/> Learning</Link>
    <div className="text-right"><p className="font-black">Fahi Hisaabu</p><p className="text-xs font-bold text-slate-500">Grade 1 Worksheets</p></div>
   </header>

   <section className="mt-5 rounded-[1.75rem] border-2 border-violet-100 bg-white p-4 shadow-sm sm:p-6 print:hidden">
    <div className="flex flex-wrap items-end gap-4">
     <label className="min-w-40 flex-1"><span className="mb-2 block text-sm font-black">Challenge</span><select value={challenge} onChange={e=>setChallenge(Number(e.target.value))} className="w-full rounded-xl border-2 border-violet-100 bg-slate-50 px-4 py-3 font-black"><option value={1}>Challenge 1</option><option value={2}>Challenge 2</option><option value={3}>Challenge 3</option></select></label>
     <label className="min-w-40 flex-1"><span className="mb-2 block text-sm font-black">Operation</span><select className="w-full rounded-xl border-2 border-violet-100 bg-slate-50 px-4 py-3 font-black"><option>Addition</option></select></label>
     <label className="min-w-32"><span className="mb-2 block text-sm font-black">Problems</span><select value={count} onChange={e=>setCount(Number(e.target.value))} className="w-full rounded-xl border-2 border-violet-100 bg-slate-50 px-4 py-3 font-black"><option>5</option><option>10</option><option>15</option><option>20</option></select></label>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-4">
     <button onClick={fresh} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffb82e] px-4 py-3 font-black"><RefreshCw size={18}/> New Worksheet</button>
     <button onClick={()=>setChecked(true)} className="rounded-xl bg-[#ffb82e] px-4 py-3 font-black">Check Answers</button>
     <button onClick={()=>window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffb82e] px-4 py-3 font-black"><Printer size={18}/> Print</button>
     <button onClick={()=>setHelp(v=>!v)} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-100 px-4 py-3 font-black"><HelpCircle size={18}/> {help?"Hide Help":"Show Help"}</button>
    </div>
    {help&&<div className="mt-4 rounded-xl bg-cyan-50 p-4 text-sm font-semibold text-cyan-950">Count the first group, then count on using the second group. Challenge 1 keeps totals within 10, Challenge 2 within 15, and Challenge 3 within 20.</div>}
   </section>

   <section className="mt-5 print:mt-0">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17234b] pb-3">
     <div><p className="text-sm font-black uppercase tracking-widest text-violet-600 print:text-black">Fahi Hisaabu · Grade 1</p><h1 className="text-3xl font-black">Addition Worksheet</h1></div>
     <p className="font-bold">Date: {new Intl.DateTimeFormat("en-GB").format(new Date())}</p>
    </div>
    <div className="mt-4 flex items-end gap-3"><span className="text-lg font-bold">Name:</span><span className="h-7 flex-1 border-b border-slate-500"/></div>
    {checked&&<div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center font-black text-emerald-700 print:hidden">Score: {score} / {problems.length}</div>}
    <div className="mt-5 space-y-4">
     {problems.map((p,i)=>{
      const correct=Number(answers[i])===p.a+p.b;
      return <div key={i} className="grid items-center gap-4 rounded-2xl border-2 border-[#cde6e3] bg-white p-4 sm:grid-cols-[1fr_auto] print:break-inside-avoid">
       <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="rounded-2xl bg-[#eefaf7] px-4 py-3 text-xl leading-loose sm:text-2xl"><span>{objects(p.icon,p.a)}</span><span className="mx-3 font-black text-cyan-700">+</span><span>{objects(p.icon,p.b)}</span></div>
        <p className="whitespace-nowrap text-xl font-black sm:text-2xl">{i+1}. {p.a} + {p.b} =</p>
       </div>
       <div className="flex items-center gap-2">
        <input aria-label={`Answer for question ${i+1}`} inputMode="numeric" disabled={checked} value={answers[i]??""} onChange={e=>setAnswers({...answers,[i]:e.target.value.replace(/\D/g,"")})} className="h-16 w-20 rounded-xl border-[3px] border-violet-200 bg-white text-center text-2xl font-black outline-none focus:border-violet-500 print:border-slate-500" />
        {checked&&(correct?<CheckCircle2 className="text-emerald-600 print:hidden" size={24}/>:<span className="flex items-center gap-1 font-black text-rose-600 print:hidden"><XCircle size={24}/><span className="text-sm">{p.a+p.b}</span></span>)}
       </div>
      </div>
     })}
    </div>
    <div className="mt-6 hidden border-t pt-3 text-center text-xs font-bold print:block">Fahi Hisaabu · The Maldives Maths Learning Hub</div>
   </section>
  </div>
 </main>
}
