"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Trophy } from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Topic={id:string;title:string;level:string;lessons:number;description:string};
type Lesson={id:string;title:string;objective:string;lesson_number:number};
type Progress={lesson_id:string;completed_at:string|null};

export default function TopicPage(){
  const params=useParams<{topic:string}>();
  const topicId=params.topic;
  const [topic,setTopic]=useState<Topic|null>(null);
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [progress,setProgress]=useState<Progress[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    const supabase=createClient();
    if(!supabase){window.location.href="/login";return;}
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){window.location.href="/login";return;}
      const [{data:t,error:te},{data:l,error:le},{data:p}]=await Promise.all([
        supabase.from("learning_topics").select("id,title,level,lessons,description").eq("id",topicId).maybeSingle(),
        supabase.from("learning_lessons").select("id,title,objective,lesson_number").eq("topic_id",topicId).order("sort_order"),
        supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id",user.id)
      ]);
      if(te||le||!t){setError("This learning topic is not available yet.");}
      else {setTopic(t);setLessons((l??[]) as Lesson[]);setProgress((p??[]) as Progress[]);}
      setLoading(false);
    })();
  },[topicId]);

  if(loading)return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"><p className="font-bold text-[#071b3a]">Loading your lessons…</p></main>;
  if(error||!topic)return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-black text-[#071b3a]">Learning topic unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/learn" className="mt-5 inline-block font-bold text-[#0d666b]">Back to learning path</Link></div></main>;

  const completed=lessons.filter(l=>progress.some(p=>p.lesson_id===l.id&&p.completed_at)).length;
  const percent=lessons.length?Math.round((completed/lessons.length)*100):0;

  return <main className="min-h-screen bg-[#f7f9fc]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/learn" className="inline-flex items-center gap-2 text-sm font-bold text-[#0d666b]"><ArrowLeft size={16}/> Learning path</Link><span className="rounded-full bg-[#0d666b]/10 px-3 py-1 text-xs font-extrabold text-[#0d666b]">{topic.level}</span></div></header>
    <div className="mx-auto max-w-5xl px-5 py-8">
      <section className="rounded-3xl bg-[#071b3a] p-7 text-white shadow-xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#e2b75d]">{topic.level} pathway</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{topic.title}</h1>
        <p className="mt-3 max-w-2xl text-slate-300">{topic.description}</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div><div className="flex justify-between text-sm font-bold"><span>Lesson progress</span><span>{completed}/{lessons.length} complete</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#e2b75d] transition-all" style={{width:`${percent}%`}}/></div></div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-center"><p className="text-2xl font-black">{percent}%</p><p className="text-xs text-slate-300">complete</p></div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">Your lessons</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Learn step by step</h2></div><BookOpen className="text-[#0d666b]"/></div>
        <div className="mt-5 grid gap-4">
          {lessons.map((lesson,index)=>{const done=progress.some(p=>p.lesson_id===lesson.id&&p.completed_at);return <Link key={lesson.id} href={`/learn/${topic.id}/lesson/${lesson.id}`} className="group flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black ${done?"bg-emerald-100 text-emerald-700":"bg-[#0d666b]/10 text-[#0d666b]"}`}>{done?<CheckCircle2 size={22}/>:String(index+1).padStart(2,"0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#071b3a]">{lesson.title}</h3>{done&&<span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">Completed</span>}</div><p className="mt-1 text-sm leading-6 text-slate-500">{lesson.objective}</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[#0d666b]">{done?"Review lesson":"Start lesson"}<ArrowRight size={15}/></span></div></Link>})}
        </div>
        {lessons.length===0&&<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-bold text-[#071b3a]">Lessons are being prepared.</p><p className="mt-1 text-sm text-slate-500">Practice questions are already available for this topic.</p><Link href={`/learn/${topic.id}/practice`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0d666b] px-4 py-2 font-bold text-white">Start practice <ArrowRight size={16}/></Link></div>}
      </section>
      {percent===100&&<section className="mt-8 rounded-3xl bg-white p-7 text-center shadow-sm"><Trophy className="mx-auto text-[#c9952e]" size={32}/><h2 className="mt-3 text-xl font-black text-[#071b3a]">Topic learning complete</h2><p className="mt-1 text-sm text-slate-500">Excellent work. Keep practising to strengthen your skills.</p><Link href="/learn" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-bold text-white">Next topic <ArrowRight size={16}/></Link></section>}
    </div>
  </main>;
}
