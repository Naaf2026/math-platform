"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RevisionQuestion = { id:string; prompt:string; answer:string; explanation?:string|null; skill?:string|null; topic?:string|null; topic_id?:string|null; difficulty?:string|null; question_type?:string|null; options?:string[]|null; interaction_config?:Record<string,unknown>|null; hint?:string|null; media_url?:string|null; from_mistake?:boolean; };
function normalizeGrade(raw: unknown) { const m=String(raw??"").match(/(?:grade|primary)?\s*([1-7])/i); return m ? `Grade ${m[1]}` : "Grade 1"; }

export default function RevisionPage() {
  const [questions,setQuestions]=useState<RevisionQuestion[]>([]);
  const [grade,setGrade]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [checked,setChecked]=useState<Record<string,boolean>>({});
  const [showResults,setShowResults]=useState(false);
  const [submitting,setSubmitting]=useState(false);

  useEffect(()=>{void load();},[]);
  async function load(){
    const supabase=createClient(); if(!supabase){setError("Learning account is not configured.");setLoading(false);return;}
    const {data:auth}=await supabase.auth.getUser(); if(!auth.user){window.location.href="/login";return;}
    const {data:profile,error:profileError}=await supabase.from("profiles").select("grade").eq("id",auth.user.id).maybeSingle();
    if(profileError){setError(profileError.message);setLoading(false);return;}
    const studentGrade=normalizeGrade(profile?.grade); setGrade(studentGrade);
    const {data,error:qError}=await supabase.rpc("get_revision_questions",{p_grade_level:studentGrade,p_limit:12});
    if(qError){setError(qError.message);setLoading(false);return;}
    const usable=((data??[]) as RevisionQuestion[]).filter(q=>q?.id&&q?.prompt&&q?.answer);
    const unique=Array.from(new Map(usable.map(q=>[q.id,q])).values()).slice(0,12);
    setQuestions(unique); setLoading(false);
  }

  const current=questions[index];
  const value=current ? answers[current.id]??"" : "";
  const answeredCount=questions.filter(q=>(answers[q.id]??"").trim().length>0).length;
  const allAnswered=questions.length===12&&answeredCount===12;
  const correctCount=useMemo(()=>questions.filter(q=>checked[q.id]&&(answers[q.id]??"").trim().toLowerCase()===q.answer.trim().toLowerCase()).length,[questions,answers,checked]);
  const wrong=useMemo(()=>questions.filter(q=>checked[q.id]&&(answers[q.id]??"").trim().toLowerCase()!==q.answer.trim().toLowerCase()),[questions,answers,checked]);
  async function submitRevision(){
    if(!allAnswered||submitting)return;
    setSubmitting(true);
    const supabase=createClient();
    if(!supabase){setSubmitting(false);return;}
    const results=await Promise.all(questions.map(q=>supabase.rpc("submit_revision_answer",{p_question_id:q.id,p_selected_answer:answers[q.id]??""})));
    const failed=results.find(r=>r.error);
    if(failed?.error){setError(failed.error.message);setSubmitting(false);return;}
    setChecked(Object.fromEntries(questions.map(q=>[q.id,true])));
    setSubmitting(false);
    setShowResults(true);
  }
  function retryQuestion(id:string){const n=questions.findIndex(q=>q.id===id);if(n>=0)setIndex(n);setChecked(p=>({...p,[id]:false}));setAnswers(p=>({...p,[id]:""}));setShowResults(false);}

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#3f4f91]"><div className="rounded-3xl bg-white px-10 py-8 text-center shadow-2xl"><div className="text-4xl">📚</div><h1 className="mt-3 text-2xl font-black text-[#17275f]">Preparing Revision…</h1><p className="mt-2 font-bold text-slate-400">Loading questions for your grade</p></div></main>;
  if(error||questions.length<12)return <main className="grid min-h-screen place-items-center bg-[#3f4f91] p-6"><div className="max-w-lg rounded-3xl bg-white p-9 text-center shadow-2xl"><h1 className="text-2xl font-black text-[#17275f]">Revision is not ready</h1><p className="mt-3 font-semibold text-slate-500">{error||`Revision needs 12 suitable questions for ${grade}; only ${questions.length} are available.`}</p><Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-[#3655ba] px-6 py-3 font-black text-white">Back to Dashboard</Link></div></main>;

  if(showResults){const percent=Math.round((correctCount/questions.length)*100);return <main className="min-h-screen bg-[#3f4f91] text-[#18234f]"><header className="flex h-[58px] items-center justify-between bg-[#17275f] px-4 text-white"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#3655ba] px-4 py-2 font-black"><ArrowLeft size={18}/> Back</Link><h1 className="text-xl font-black">Revision • {grade}</h1><span className="w-24"/></header><section className="mx-auto max-w-[1120px] px-4 py-16"><div className="relative rounded-[22px] border-2 border-[#ffb323] bg-white px-6 pb-10 pt-20 shadow-[10px_10px_0_#ffad19] sm:px-12"><div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 rounded-xl border-2 border-white bg-[#65df28] px-8 py-3 text-center text-white shadow-lg"><p className="text-sm font-black">TOTAL SCORE</p><div className="flex items-end gap-2"><span className="text-4xl font-black">{percent}%</span><span className="pb-1 font-bold">{correctCount} out of {questions.length}</span></div></div>{wrong.length?<p className="mx-auto mb-10 max-w-xl rounded-xl bg-red-50 px-4 py-2 text-center font-bold text-red-500">You have {wrong.length} question{wrong.length===1?"":"s"} to revise. Select one to try again.</p>:<p className="mx-auto mb-10 max-w-xl rounded-xl bg-green-50 px-4 py-2 text-center font-bold text-green-600">Excellent! You corrected every revision question.</p>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{questions.map((q,i)=>{const ok=checked[q.id]&&(answers[q.id]??"").trim().toLowerCase()===q.answer.trim().toLowerCase();return <button key={q.id} onClick={()=>ok?undefined:retryQuestion(q.id)} className={`flex items-center gap-3 rounded-full border px-4 py-3 text-left font-bold ${ok?"border-green-200 bg-green-50":"border-red-300 bg-red-50"}`}>{ok?<Check className="rounded-full bg-green-500 p-1 text-white" size={25}/>:<span className="grid h-7 w-7 place-items-center rounded-full bg-red-400 text-xs text-white">Q{i+1}</span>}Question {i+1}{!ok&&<span className="ml-auto text-red-500">Re-try</span>}</button>})}</div><div className="mt-10 flex justify-center"><button onClick={()=>wrong.length?retryQuestion(wrong[0].id):setShowResults(false)} className="rounded-full bg-[#ff6b00] px-14 py-3 text-xl font-black text-white">{wrong.length?"Try Again":"Review Again"}</button></div></div></section></main>;}

  return <main className="min-h-screen bg-[#3f4f91] text-[#16234e]" style={{backgroundImage:"radial-gradient(circle at 20px 20px,rgba(255,255,255,.055) 2px,transparent 2px)",backgroundSize:"44px 44px"}}><header className="flex h-[60px] items-center justify-between bg-[#17275f] px-3 text-white sm:px-6"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#3655ba] px-4 py-2 font-black"><ArrowLeft size={18}/> Back</Link><h1 className="text-center text-lg font-black sm:text-xl">Revision • {grade}</h1><span className="text-xs font-bold text-white/80 sm:text-sm">{answeredCount}/12 answered</span></header><section className="mx-auto max-w-[1120px] px-3 py-6 sm:px-6"><div className="relative"><div aria-hidden="true" className="pointer-events-none absolute -left-[7px] top-[72px] z-20 flex flex-col gap-[28px] sm:-left-[18px]">{Array.from({length:10}).map((_,ring)=><span key={ring} className="block h-[9px] w-[28px] rounded-full border-[3px] border-[#68726f] bg-[#dbe4e1] shadow-[0_1px_0_rgba(255,255,255,.8)] sm:h-[10px] sm:w-[42px]"/>)}</div><div className="overflow-hidden rounded-[34px] border-[10px] border-[#f4d940] bg-[#eaf8fb] shadow-2xl"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7edf2] px-5 py-5 sm:px-10"><div><span className="text-3xl font-black text-[#ff6900]">Question {index+1}</span><span className="ml-3 text-sm font-bold text-slate-400">{current.skill||current.topic||grade}</span></div><div className="flex gap-2"><button disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))} className="inline-flex items-center gap-1 rounded-full border border-[#8fd7e7] bg-white px-4 py-2 font-bold text-[#46b9d4] disabled:opacity-40"><ChevronLeft size={18}/> Previous Qn</button><button disabled={index===questions.length-1||!value.trim()} onClick={()=>setIndex(i=>Math.min(questions.length-1,i+1))} className="inline-flex items-center gap-1 rounded-full border border-[#8fd7e7] bg-white px-4 py-2 font-bold text-[#46b9d4] disabled:opacity-40">Next <ChevronRight size={18}/></button><button onClick={submitRevision} disabled={!allAnswered||submitting} title={!allAnswered?"Answer all 12 questions before submitting":undefined} className="rounded-full bg-[#3655ba] px-5 py-2 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting?"Submitting…":"Submit"}</button></div></div><div className="min-h-[570px] bg-white px-6 py-8 sm:px-12"><div className="max-w-[850px]"><p className="whitespace-pre-line text-[20px] font-medium leading-[1.75] sm:text-[24px]">{current.prompt}</p><div className="mt-8">{current.question_type==="multiple_choice"||current.question_type==="true_false"?<div className="grid gap-3 sm:grid-cols-2">{(current.question_type==="true_false"?["True","False"]:(current.options??[])).map((option,i)=><button key={option} type="button" onClick={()=>setAnswers(p=>({...p,[current.id]:option}))} className={`rounded-2xl border-2 p-4 text-left text-base font-black transition ${value===option?"border-[#3655ba] bg-blue-50 ring-2 ring-[#3655ba]/20":"border-slate-200 bg-white hover:border-sky-300"}`}><span className="mr-2 text-slate-400">{String.fromCharCode(65+i)}.</span>{option}</button>)}</div>:<div><p className="mb-3 text-lg font-medium text-slate-400">Write your answer</p><input value={value} onChange={e=>setAnswers(p=>({...p,[current.id]:e.target.value}))} inputMode={current.question_type==="number_input"?"numeric":"text"} className="h-14 w-full max-w-xs rounded-xl border-2 border-slate-300 bg-white px-4 text-2xl font-bold outline-none focus:border-[#3655ba]"/></div>}</div></div></div></div></div><div className="mt-5 flex justify-center gap-2">{questions.map((q,i)=><button key={q.id} onClick={()=>setIndex(i)} className={`h-3 rounded-full transition-all ${i===index?"w-10 bg-yellow-300":"w-3 bg-white/50"}`} aria-label={`Question ${i+1}`}/>)}</div></section></main>;
}
