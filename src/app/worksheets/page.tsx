"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft,CheckCircle2,HelpCircle,Printer,RefreshCw,XCircle } from "lucide-react";

type Operation="Addition"|"Subtraction"|"Counting"|"Comparing Numbers";
type Problem={a:number;b:number;icon:string;kind?:string};\ntype PrintMode="blank"|"completed"|"answer";
const icons=["🐚","🐟","🥥","⭐","🌸","🐢"];
const limit=(c:number)=>c===1?10:c===2?15:20;
const makeProblems=(count:number,c:number,op:Operation,seed:number):Problem[]=>{
 const max=limit(c);
 return Array.from({length:count},(_,i)=>{
  const k=i+seed*7;
  if(op==="Subtraction"){const a=2+((k*5+c)%Math.max(2,max-1));const b=1+((k*3+c)%a);return{a,b,icon:icons[(k+c)%icons.length]}}
  if(op==="Counting"){const a=1+((k*5+c*3)%max);return{a,b:0,icon:icons[(k+c)%icons.length]}}
  if(op==="Comparing Numbers"){const a=1+((k*3+c)%max);let b=1+((k*7+c*2)%max);if(k%4===0)b=a;return{a,b,icon:icons[(k+c)%icons.length]}}
  const a=1+((k*3+c*2)%Math.max(2,max-2));const room=Math.max(1,max-a);const b=1+((k*5+c)%room);return{a,b,icon:icons[(k+c)%icons.length]};
 });
};
const objects=(icon:string,n:number)=>Array.from({length:n},()=>icon).join(" ");
const answerFor=(p:Problem,op:Operation)=>op==="Addition"?String(p.a+p.b):op==="Subtraction"?String(p.a-p.b):op==="Counting"?String(p.a):p.a===p.b?"=":p.a>p.b?">":"<";
const helpText=(op:Operation,c:number)=>op==="Addition"?`Count the first group, then count on. Challenge ${c} uses totals up to ${limit(c)}.`:op==="Subtraction"?`Start with the first group and take away the second. Challenge ${c} uses numbers up to ${limit(c)}.`:op==="Counting"?`Count each object once. Challenge ${c} uses groups up to ${limit(c)} objects.`:`Compare the two numbers. Choose > when the first is greater, < when it is smaller, or = when both are equal. Numbers go up to ${limit(c)}.`;

export default function WorksheetsPage(){
 const [challenge,setChallenge]=useState(1),[count,setCount]=useState(5),[seed,setSeed]=useState(0);
 const [operation,setOperation]=useState<Operation>("Addition");
 const [problems,setProblems]=useState<Problem[]>([]),[answers,setAnswers]=useState<Record<number,string>>({});
 const [checked,setChecked]=useState(false),[help,setHelp]=useState(false);
 const [learnerName,setLearnerName]=useState("");\n const [printOpen,setPrintOpen]=useState(false),[printMode,setPrintMode]=useState<PrintMode>("blank");
 useEffect(()=>{setProblems(makeProblems(count,challenge,operation,seed));setAnswers({});setChecked(false)},[count,challenge,operation,seed]);
 useEffect(()=>{let mounted=true;async function loadLearner(){const supabase=createClient();if(!supabase)return;const {data:auth}=await supabase.auth.getUser();if(!mounted||!auth.user)return;const {data}=await supabase.from("profiles").select("full_name").eq("id",auth.user.id).maybeSingle();if(mounted)setLearnerName(data?.full_name?.trim()||auth.user.user_metadata?.full_name?.trim()||"");}void loadLearner();return()=>{mounted=false}},[]);
 useEffect(()=>{const before=()=>document.body.setAttribute("data-worksheet-print",printMode);const after=()=>document.body.removeAttribute("data-worksheet-print");window.addEventListener("beforeprint",before);window.addEventListener("afterprint",after);return()=>{window.removeEventListener("beforeprint",before);window.removeEventListener("afterprint",after)}},[printMode]);\n const score=problems.reduce((n,p,i)=>n+Number((answers[i]??"")===answerFor(p,operation)),0);
 const setAnswer=(i:number,value:string)=>setAnswers({...answers,[i]:value});\n const doPrint=(mode:PrintMode)=>{setPrintMode(mode);setTimeout(()=>window.print(),80)};
 return <main className="min-h-screen bg-[#f8f5e9] text-[#17234b] print:bg-white"><div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 print:max-w-none print:p-0">
  <header className="flex items-center justify-between gap-3 print:hidden"><Link href="/learn" className="inline-flex items-center gap-2 font-black text-violet-700"><ArrowLeft size={18}/> Learning</Link><div className="text-right"><p className="font-black">Fahi Hisaabu</p><p className="text-xs font-bold text-slate-500">Grade 1 Worksheets</p></div></header>
  <section className="mt-5 rounded-[1.75rem] border-2 border-violet-100 bg-white p-4 shadow-sm sm:p-6 print:hidden">
   <div className="flex flex-wrap items-end gap-4">
    <label className="min-w-40 flex-1"><span className="mb-2 block text-sm font-black">Challenge</span><select value={challenge} onChange={e=>setChallenge(Number(e.target.value))} className="w-full rounded-xl border-2 border-violet-100 bg-slate-50 px-4 py-3 font-black"><option value={1}>Challenge 1</option><option value={2}>Challenge 2</option><option value={3}>Challenge 3</option></select></label>
    <label className="min-w-48 flex-1"><span className="mb-2 block text-sm font-black">Operation</span><select value={operation} onChange={e=>setOperation(e.target.value as Operation)} className="w-full rounded-xl border-2 border-violet-100 bg-slate-50 px-4 py-3 font-black"><option>Addition</option><option>Subtraction</option><option>Counting</option><option>Comparing Numbers</option></select></label>
    <label className="min-w-32"><span className="mb-2 block text-sm font-black">Problems</span><select value={count} onChange={e=>setCount(Number(e.target.value))} className="w-full rounded-xl border-2 border-violet-100 bg-slate-50 px-4 py-3 font-black"><option>5</option><option>10</option><option>15</option><option>20</option></select></label>
   </div>
   <div className="mt-4 grid gap-2 sm:grid-cols-4"><button onClick={()=>setSeed(v=>v+1)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffb82e] px-4 py-3 font-black"><RefreshCw size={18}/> New Worksheet</button><button onClick={()=>setChecked(true)} className="rounded-xl bg-[#ffb82e] px-4 py-3 font-black">Check Answers</button><button onClick={()=>setPrintOpen(v=>!v)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffb82e] px-4 py-3 font-black"><Printer size={18}/> Print Options</button><button onClick={()=>setHelp(v=>!v)} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-violet-100 px-4 py-3 font-black"><HelpCircle size={18}/> {help?"Hide Help":"Show Help"}</button></div>
   {printOpen&&<div className="mt-4 rounded-2xl border-2 border-violet-100 bg-violet-50/40 p-4"><h3 className="text-lg font-black">Print options</h3><div className="mt-3 flex flex-wrap items-end gap-3"><label className="min-w-64 flex-1"><span className="mb-1 block text-sm font-bold">Print:</span><select value={printMode} onChange={e=>setPrintMode(e.target.value as PrintMode)} className="w-full rounded-xl border-2 border-violet-200 bg-white px-4 py-3 font-black"><option value="blank">Blank worksheet</option><option value="completed">My completed worksheet</option><option value="answer">Arithmetic answer key</option></select></label><button onClick={()=>doPrint(printMode)} className="rounded-xl bg-[#17234b] px-5 py-3 font-black text-white">Print</button><button onClick={()=>doPrint(printMode)} className="rounded-xl bg-violet-600 px-5 py-3 font-black text-white">Save as PDF</button></div><p className="mt-2 text-xs font-semibold text-slate-500">Save as PDF opens your browser print window; choose “Save as PDF” as the destination.</p></div>}\n   {help&&<div className="mt-4 rounded-xl bg-cyan-50 p-4 text-sm font-semibold text-cyan-950">{helpText(operation,challenge)}</div>}
  </section>
  <section className="mt-5 print:mt-0">
   <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#17234b] pb-3"><div><p className="text-sm font-black uppercase tracking-widest text-violet-600 print:text-black">Fahi Hisaabu · Grade 1</p><h1 className="text-3xl font-black">{operation} Worksheet</h1></div><p className="font-bold">Date: {new Intl.DateTimeFormat("en-GB").format(new Date())}</p></div>
   <div className="mt-4 flex items-end gap-3"><span className="text-lg font-bold">Name:</span><span className="min-h-7 flex-1 border-b border-slate-500 px-2 pb-1 text-lg font-bold">{learnerName}</span></div>
   {checked&&<div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center font-black text-emerald-700 print:hidden">Score: {score} / {problems.length}</div>}
   <div className="mt-5 space-y-4">{problems.map((p,i)=>{const expected=answerFor(p,operation),correct=(answers[i]??"")===expected;return <div key={i} className="flex flex-col gap-4 rounded-2xl border-2 border-[#cde6e3] bg-white p-4 sm:flex-row sm:items-center print:break-inside-avoid"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-base font-black text-violet-700 print:border print:border-slate-400 print:bg-white print:text-black">{i+1}</div><div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
     {operation==="Addition"&&<><div className="rounded-2xl bg-[#eefaf7] px-4 py-3 text-xl leading-loose sm:text-2xl">{objects(p.icon,p.a)} <b className="mx-2 text-cyan-700">+</b> {objects(p.icon,p.b)}</div><p className="whitespace-nowrap text-xl font-black sm:text-2xl">{p.a} + {p.b} =</p></>}
     {operation==="Subtraction"&&<><div className="rounded-2xl bg-[#eefaf7] px-4 py-3 text-xl leading-loose sm:text-2xl">{objects(p.icon,p.a)} <b className="mx-2 text-cyan-700">−</b> {objects(p.icon,p.b)}</div><p className="whitespace-nowrap text-xl font-black sm:text-2xl">{p.a} − {p.b} =</p></>}
     {operation==="Counting"&&<><div className="rounded-2xl bg-[#eefaf7] px-4 py-3 text-xl leading-loose sm:text-2xl">{objects(p.icon,p.a)}</div><p className="text-xl font-black sm:text-2xl">How many?</p></>}
     {operation==="Comparing Numbers"&&<p className="text-2xl font-black sm:text-3xl"><span className="rounded-xl bg-cyan-50 px-4 py-2">{p.a}</span> <span className="mx-2 text-slate-400">?</span> <span className="rounded-xl bg-cyan-50 px-4 py-2">{p.b}</span></p>}
    </div>
    <div className="flex items-center gap-2"><span className="hidden print-answer font-black text-xl">{expected}</span>{operation==="Comparing Numbers"?<div className="flex gap-2">{[">","<","="].map(v=><button key={v} disabled={checked} onClick={()=>setAnswer(i,v)} className={`worksheet-answer h-14 w-14 rounded-xl border-2 text-2xl font-black ${answers[i]===v?"border-violet-600 bg-violet-50":"border-violet-200"}`}>{v}</button>)}</div>:<input aria-label={`Answer for question ${i+1}`} inputMode="numeric" disabled={checked} value={answers[i]??""} onChange={e=>setAnswer(i,e.target.value.replace(/\D/g,""))} className="worksheet-answer h-16 w-20 rounded-xl border-[3px] border-violet-200 bg-white text-center text-2xl font-black outline-none focus:border-violet-500 print:border-slate-500"/>}{checked&&(correct?<CheckCircle2 className="text-emerald-600 print:hidden" size={24}/>:<span className="flex items-center gap-1 font-black text-rose-600 print:hidden"><XCircle size={24}/><span className="text-sm">{expected}</span></span>)}</div>
   </div>})}</div>
   <div className="mt-6 hidden border-t pt-3 text-center text-xs font-bold print:block">Fahi Hisaabu · The Maldives Maths Learning Hub</div>
  </section>
 </div></main>
}