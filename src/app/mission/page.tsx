"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Home, RotateCcw, Sparkles, Target, Trophy, XCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Question={id:number;topicId:string;topic:string;question:string;options:string[];answer:string;explanation:string;points:number};

const QUESTIONS:Question[]=[
 {id:1,topicId:"place-value",topic:"Place Value",question:"What is the value of the digit 7 in 4,782?",options:["7","70","700","7,000"],answer:"700",explanation:"The 7 is in the hundreds place, so its value is 700.",points:10},
 {id:2,topicId:"addition-subtraction",topic:"Addition & Subtraction",question:"What is 248 + 137?",options:["375","385","395","405"],answer:"385",explanation:"248 + 100 = 348, +30 = 378, +7 = 385.",points:10},
 {id:3,topicId:"multiplication",topic:"Multiplication",question:"What is 6 × 8?",options:["42","48","54","56"],answer:"48",explanation:"Six groups of eight make 48.",points:10},
 {id:4,topicId:"fractions",topic:"Fractions",question:"Which fraction is equal to 1/2?",options:["2/3","2/4","3/5","4/6"],answer:"2/4",explanation:"Multiplying both 1 and 2 by 2 gives 2/4.",points:10},
 {id:5,topicId:"place-value",topic:"Place Value",question:"Which number is greatest?",options:["3,905","3,950","3,590","3,509"],answer:"3,950",explanation:"Compare from left to right. 3,950 has the greatest tens digit among these numbers.",points:15},
 {id:6,topicId:"addition-subtraction",topic:"Addition & Subtraction",question:"A shop has 600 pencils and sells 275. How many pencils remain?",options:["315","325","335","375"],answer:"325",explanation:"600 − 275 = 325 pencils.",points:15},
 {id:7,topicId:"multiplication",topic:"Multiplication",question:"There are 7 boxes with 9 books in each. How many books are there?",options:["56","63","72","79"],answer:"63",explanation:"7 × 9 = 63 books.",points:15},
 {id:8,topicId:"fractions",topic:"Fractions",question:"What is 1/4 + 2/4?",options:["1/2","2/4","3/4","3/8"],answer:"3/4",explanation:"The denominators are the same, so add the numerators: 1 + 2 = 3.",points:15},
 {id:9,topicId:"multiplication",topic:"Multiplication",question:"Which expression has the same value as 4 × 25?",options:["4 × 20","5 × 20","10 × 10","2 × 40"],answer:"5 × 20",explanation:"Both 4 × 25 and 5 × 20 equal 100.",points:20},
 {id:10,topicId:"addition-subtraction",topic:"Problem Solving",question:"Mia has 125 stickers. She gets 48 more and gives 23 away. How many does she have now?",options:["140","150","160","170"],answer:"150",explanation:"125 + 48 = 173, then 173 − 23 = 150.",points:20},
];

export default function MissionPage(){
 const[current,setCurrent]=useState(0),[selected,setSelected]=useState<string|null>(null),[score,setScore]=useState(0),[correct,setCorrect]=useState(0),[answered,setAnswered]=useState(0),[finished,setFinished]=useState(false),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState("");
 const q=QUESTIONS[current];
 const earned=useMemo(()=>QUESTIONS.reduce((n,x)=>n+x.points,0),[]);
 const progress=((current+(selected?1:0))/QUESTIONS.length)*100;

 useEffect(()=>{const supabase=createClient();if(!supabase){setError("Your learning account is not configured yet.");return;}supabase.auth.getUser().then(({data})=>{if(!data.user)window.location.href="/login";});},[]);

 function choose(option:string){if(selected)return;setSelected(option);setAnswered(v=>v+1);if(option===q.answer){setCorrect(v=>v+1);setScore(v=>v+q.points);}}

 function next(){if(!selected)return;if(current===QUESTIONS.length-1){setFinished(true);saveResults();return;}setCurrent(v=>v+1);setSelected(null);}

 async function saveResults(){
  setSaving(true);setError("");
  const supabase=createClient();
  if(!supabase){setSaving(false);return;}
  const{data:{user}}=await supabase.auth.getUser();
  if(!user){setSaving(false);return;}
  try{
   const{data:profile}=await supabase.from("profiles").select("xp").eq("id",user.id).maybeSingle();
   const currentXp=profile?.xp??0;
   const{error:updateError}=await supabase.from("profiles").update({xp:currentXp+score}).eq("id",user.id);
   if(updateError)throw updateError;
   setSaved(true);
  }catch(e){setError("Your result is complete, but XP could not be synced yet. You can continue practising.");}
  finally{setSaving(false);}
 }

 function restart(){setCurrent(0);setSelected(null);setScore(0);setCorrect(0);setAnswered(0);setFinished(false);setSaved(false);setError("");}

 if(finished)return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 sm:p-8"><div className="mx-auto max-w-3xl"><header className="flex items-center justify-between"><Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600"><Home size={18}/> Dashboard</Link><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-600 shadow-sm">Mission complete</span></header><section className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-8 text-center text-white shadow-2xl sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-300 text-violet-900 shadow-xl"><Trophy size={40}/></div><p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Daily mission finished</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">Maths champion! 🎉</h1><p className="mx-auto mt-3 max-w-xl text-indigo-100">You completed all 10 questions. Keep practising to build stronger skills and a longer learning streak.</p><div className="mt-8 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-white/10 p-4"><Zap className="mx-auto text-yellow-300" size={22}/><p className="mt-2 text-2xl font-black">{score}</p><p className="text-xs text-indigo-100">XP earned</p></div><div className="rounded-2xl bg-white/10 p-4"><CheckCircle2 className="mx-auto text-cyan-200" size={22}/><p className="mt-2 text-2xl font-black">{correct}/10</p><p className="text-xs text-indigo-100">Correct</p></div><div className="rounded-2xl bg-white/10 p-4"><Target className="mx-auto text-pink-200" size={22}/><p className="mt-2 text-2xl font-black">{Math.round((correct/10)*100)}%</p><p className="text-xs text-indigo-100">Accuracy</p></div></div><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-5 py-3.5 font-black text-violet-950 hover:bg-yellow-200"><RotateCcw size={18}/> Practise again</button><Link href="/learn" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3.5 font-black text-white hover:bg-white/20">Explore topics <ArrowRight size={18}/></Link></div>{saving&&<p className="mt-4 text-xs text-indigo-100">Saving your XP…</p>}{saved&&<p className="mt-4 text-xs font-bold text-cyan-200">XP saved to your learning profile ✓</p>}{error&&<p className="mt-4 text-xs text-yellow-200">{error}</p>}</section></div></main>;

 return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50"><header className="border-b border-white bg-white/85 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={17}/> Dashboard</Link><div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-orange-600"><Flame size={17}/> Daily Mission</div></div></header><div className="mx-auto max-w-4xl px-5 py-7 sm:py-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Question {current+1} of {QUESTIONS.length}</p><h1 className="mt-1 text-3xl font-black text-[#071b3a] sm:text-4xl">Let’s solve it! 🚀</h1></div><div className="text-right"><p className="text-xs font-bold text-slate-400">Mission XP</p><p className="text-xl font-black text-violet-600">{score}</p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-300" style={{width:`${progress}%`}}/></div><section className="mt-7 rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-violet-100 sm:p-9"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-600">{q.topic}</span><span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-orange-600"><Sparkles size={14}/> +{q.points} XP</span></div><h2 className="mt-7 text-2xl font-black leading-tight text-[#071b3a] sm:text-3xl">{q.question}</h2><div className="mt-7 grid gap-3 sm:grid-cols-2">{q.options.map(option=>{const isSelected=selected===option,isCorrect=option===q.answer;let cls="border-slate-200 bg-white hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50";if(selected&&isCorrect)cls="border-emerald-300 bg-emerald-50";else if(selected&&isSelected)cls="border-rose-300 bg-rose-50";return <button key={option} onClick={()=>choose(option)} disabled={Boolean(selected)} className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left font-bold text-[#071b3a] transition ${cls}`}><span>{option}</span>{selected&&isCorrect?<CheckCircle2 className="text-emerald-500" size={21}/>:selected&&isSelected?<XCircle className="text-rose-500" size={21}/>:<span className="h-5 w-5 rounded-full border-2 border-slate-200"/>}</button>})}</div>{selected&&<div className={`mt-5 rounded-2xl p-5 ${selected===q.answer?"bg-emerald-50":"bg-rose-50"}`}><div className="flex items-start gap-3">{selected===q.answer?<CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={21}/>:<XCircle className="mt-0.5 shrink-0 text-rose-600" size={21}/>}<div><p className={`font-black ${selected===q.answer?"text-emerald-700":"text-rose-700"}`}>{selected===q.answer?"Brilliant! Correct answer.":`Not quite — the answer is ${q.answer}.`}</p><p className="mt-1 text-sm leading-6 text-slate-600">{q.explanation}</p></div></div></div>}<div className="mt-7 flex justify-end">{selected&&<button onClick={next} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700">{current===QUESTIONS.length-1?"Finish mission":"Next question"} <ArrowRight size={18}/></button>}</div></section><p className="mt-5 text-center text-sm text-slate-400">Choose an answer to unlock instant feedback. Mistakes are part of learning. 💡</p></div></main>;
}
