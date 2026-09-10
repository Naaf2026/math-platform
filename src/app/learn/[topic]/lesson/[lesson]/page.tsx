"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Lesson={id:string;topic_id:string;title:string;objective:string;lesson_number:number};
type Topic={id:string;title:string;level:string};
type Question={id:string;prompt:string;options:string[];answer:string;explanation:string;sort_order:number};

export default function LessonPage(){
  const params=useParams<{topic:string;lesson:string}>();
  const topicId=params.topic, lessonId=params.lesson;
  const [lesson,setLesson]=useState<Lesson|null>(null),[topic,setTopic]=useState<Topic|null>(null),[questions,setQuestions]=useState<Question[]>([]),[step,setStep]=useState(0),[selected,setSelected]=useState<string|null>(null),[loading,setLoading]=useState(true),[done,setDone]=useState(false),[error,setError]=useState("");

  useEffect(()=>{
    const supabase=createClient();
    if(!supabase){window.location.href="/login";return;}
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){window.location.href="/login";return;}
      const [{data:l,error:le},{data:t,error:te},{data:q,error:qe}]=await Promise.all([
        supabase.from("learning_lessons").select("id,topic_id,title,objective,lesson_number").eq("id",lessonId).eq("topic_id",topicId).maybeSingle(),
        supabase.from("learning_topics").select("id,title,level").eq("id",topicId).maybeSingle(),
        supabase.from("learning_questions").select("id,prompt,options,answer,explanation,sort_order").eq("topic_id",topicId).order("sort_order")
      ]);
      if(le||te||qe||!l||!t){setError("This lesson is not available yet.");}
      else {setLesson(l);setTopic(t);setQuestions((q??[]) as Question[]);}
      setLoading(false);
    })();
  },[topicId,lessonId]);

  async function complete(){
    const supabase=createClient();
    if(!supabase)return;
    const {error:e}=await supabase.rpc("complete_learning_lesson",{p_lesson_id:lessonId});
    if(e){setError(e.message);return;}
    setDone(true);
  }

  if(loading)return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"><p className="font-bold text-[#071b3a]">Loading lesson…</p></main>;
  if(error||!lesson||!topic)return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-black text-[#071b3a]">Lesson unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href={`/learn/${topicId}`} className="mt-5 inline-block font-bold text-[#0d666b]">Back to topic</Link></div></main>;

  const question=questions[step];
  const answered=selected!==null;
  const correct=answered&&selected===question?.answer;

  return <main className="min-h-screen bg-[#f7f9fc]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4"><Link href={`/learn/${topicId}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#0d666b]"><ArrowLeft size={16}/> {topic.title}</Link><span className="text-sm font-bold text-slate-500">Lesson {lesson.lesson_number}</span></div></header>
    <div className="mx-auto max-w-4xl px-5 py-8">
      {done?<section className="rounded-3xl bg-white p-8 text-center shadow-xl sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="text-emerald-600" size={40}/></div><p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">Lesson complete</p><h1 className="mt-2 text-3xl font-black text-[#071b3a]">{lesson.title}</h1><p className="mx-auto mt-3 max-w-xl text-slate-500">{lesson.objective}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/learn/${topicId}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-bold text-white">Back to lessons <ArrowRight size={17}/></Link>{questions.length>0&&<Link href={`/learn/${topicId}?practice=1`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-[#071b3a]">Continue practising <Sparkles size={17}/></Link>}</div></section>:<section className="rounded-3xl bg-white p-6 shadow-xl sm:p-9">
        <div className="rounded-2xl bg-[#071b3a] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#e2b75d]">{topic.level} • Lesson {lesson.lesson_number}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{lesson.title}</h1><p className="mt-2 text-sm leading-6 text-slate-300">{lesson.objective}</p></div>
        {questions.length>0?<><div className="mt-7 flex items-center justify-between"><div className="inline-flex items-center gap-2 text-sm font-bold text-[#0d666b]"><CircleHelp size={18}/> Quick check</div><span className="text-sm font-bold text-slate-500">{step+1}/{questions.length}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0d666b] transition-all" style={{width:`${((step+1)/questions.length)*100}%`}}/></div><h2 className="mt-7 text-2xl font-black leading-tight text-[#071b3a]">{question.prompt}</h2><div className="mt-6 grid gap-3">{question.options.map(option=>{const isAnswer=option===question.answer,isSelected=selected===option;let cls="border-slate-200 bg-white hover:border-[#0d666b]";if(answered&&isAnswer)cls="border-emerald-400 bg-emerald-50";else if(answered&&isSelected)cls="border-red-400 bg-red-50";return <button key={option} disabled={answered} onClick={()=>setSelected(option)} className={`flex items-center justify-between rounded-2xl border p-4 text-left font-bold text-[#071b3a] transition ${cls}`}><span>{option}</span>{answered&&isAnswer&&<CheckCircle2 className="text-emerald-600" size={20}/>}</button>})}</div>{answered&&<div className={`mt-6 rounded-2xl p-5 ${correct?"bg-emerald-50":"bg-amber-50"}`}><p className="font-black text-[#071b3a]">{correct?"Correct!":"Keep going — review the idea."}</p><p className="mt-1 text-sm leading-6 text-slate-600">{question.explanation}</p></div>}<div className="mt-7 flex justify-end">{answered&&<button onClick={()=>{if(step+1<questions.length){setStep(v=>v+1);setSelected(null)}else complete()}} className="inline-flex items-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-bold text-white">{step+1<questions.length?"Next check":"Complete lesson"}<ArrowRight size={17}/></button>}</div></>:<><div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6"><p className="font-black text-[#071b3a]">Lesson objective</p><p className="mt-2 text-sm leading-7 text-slate-600">{lesson.objective} This lesson is ready for guided content and practice activities as the curriculum expands.</p></div><button onClick={complete} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0d666b] px-5 py-3 font-bold text-white">Mark lesson complete <CheckCircle2 size={17}/></button></>}
        {error&&<p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      </section>}
    </div>
  </main>;
}
