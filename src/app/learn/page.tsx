"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic = { id:string; title:string; description:string; level:string; lessons:number; sort_order:number };
type Lesson = { id:string; topic_id:string; title:string; sort_order:number };
type Progress = { lesson_id:string; completed_at:string|null };
const gradeOneSkills = [
  {title:"Counting and adding",topic:"g1-numbers-50",lesson:"g1-counting-adding"},
  {title:"Number names",topic:"g1-numbers-100",lesson:"g1-number-names"},
  {title:"Tens and ones",topic:"g1-numbers-100",lesson:"g1-tens-ones"},
  {title:"Before and after",topic:"g1-numbers-100",lesson:"g1-before-after"},
  {title:"Comparing numbers",topic:"g1-numbers-100",lesson:"g1-comparing"},
  {title:"Ordering numbers",topic:"g1-numbers-100",lesson:"g1-ordering"},
  {title:"Number patterns",topic:"g1-numbers-100",lesson:"g1-patterns"},
  {title:"Skip counting",topic:"g1-numbers-100",lesson:"g1-skip-counting"},
];

export default function LearnPage() {
  const [topics,setTopics]=useState<Topic[]>([]);
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [progress,setProgress]=useState<Progress[]>([]);
  const [questionTopics,setQuestionTopics]=useState<Set<string>>(new Set());
  const [grade,setGrade]=useState("");
  const [xp,setXp]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    const supabase=createClient();
    if(!supabase){setError("Learning is unavailable right now.");setLoading(false);return;}
    (async()=>{
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||!user){window.location.href="/login";return;}
      const {data:profile,error:profileError}=await supabase.from("profiles").select("grade,xp").eq("id",user.id).maybeSingle();
      if(profileError){setError("Your learning path could not be loaded.");setLoading(false);return;}
      const match=String(profile?.grade??"").match(/(?:grade|primary)?\s*([1-5])/i);
      if(!match){setError("Set your grade in your profile to see your learning path.");setLoading(false);return;}
      const learnerGrade=`Grade ${match[1]}`;
      const [{data:t,error:topicsError},{data:l,error:lessonsError},{data:p,error:progressError}]=await Promise.all([
        supabase.from("learning_topics").select("id,title,description,level,lessons,sort_order").order("sort_order"),
        supabase.from("learning_lessons").select("id,topic_id,title,sort_order").order("sort_order"),
        supabase.from("lesson_progress").select("lesson_id,completed_at").eq("user_id",user.id),
      ]);
      if(topicsError||lessonsError||progressError){setError("Your learning path could not be loaded.");setLoading(false);return;}
      const gradeTopics=(t??[]).filter(topic=>learnerGrade==="Grade 3"
        ? topic.level==="Foundation"||topic.level==="Development"
        : topic.level===learnerGrade) as Topic[];
      const counts=await Promise.all(gradeTopics.map(topic=>supabase.from("learning_questions")
        .select("id",{count:"exact",head:true}).eq("topic_id",topic.id).eq("grade_level",learnerGrade).eq("status","published")));
      if(counts.some(result=>result.error)){setError("Your learning path could not be loaded.");setLoading(false);return;}
      const available=new Set(gradeTopics.filter((_,index)=>(counts[index].count??0)>0).map(topic=>topic.id));
      const allLessons=(l??[]) as Lesson[];
      setTopics(gradeTopics.filter(topic=>available.has(topic.id)||allLessons.some(lesson=>lesson.topic_id===topic.id)));
      setQuestionTopics(available);
      setLessons(allLessons);
      setProgress((p??[]) as Progress[]);
      setGrade(learnerGrade);
      setXp(profile?.xp??0);
      setLoading(false);
    })();
  },[]);

  if(loading)return <main className="flex min-h-screen items-center justify-center bg-violet-50"><p className="font-bold text-[#071b3a]">Loading your learning path…</p></main>;
  if(error)return <main className="grid min-h-screen place-items-center bg-violet-50 p-6"><div className="rounded-3xl bg-white p-8 text-center"><p className="font-bold text-[#071b3a]">{error}</p><Link href="/profile" className="mt-4 inline-block font-bold text-violet-600">Go to Profile</Link></div></main>;

  const completed=new Set(progress.filter(item=>item.completed_at).map(item=>item.lesson_id));
  const nextLesson=topics.flatMap(topic=>lessons.filter(lesson=>lesson.topic_id===topic.id).map(lesson=>({topic,lesson}))).find(({lesson})=>!completed.has(lesson.id));
  const nextTopic=topics.find(topic=>questionTopics.has(topic.id));
  const continueHref=nextLesson?`/learn/${nextLesson.topic.id}/lesson/${nextLesson.lesson.id}`:nextTopic?`/learn/${nextTopic.id}`:"";
  const continueTitle=nextLesson?nextLesson.lesson.title:nextTopic?nextTopic.title:"";

  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 text-[#071b3a]">
    <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-10">
      <section className="rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-xl sm:p-10">
        <p className="text-sm font-black text-cyan-100">{grade} · Fahi Hisaabu</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your learning path</h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-indigo-100">Learn one topic at a time and practise what you know.</p>
        <div className="mt-5 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 font-bold"><Zap size={18} className="text-yellow-300"/>{xp} XP</span><span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 font-bold"><BookOpen size={18} className="text-cyan-200"/>{topics.length} topics</span></div>
      </section>

      {continueHref&&<section className="mt-6 flex flex-col gap-4 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-black uppercase tracking-wide text-violet-600">Continue learning</p><h2 className="mt-1 text-2xl font-black">{continueTitle}</h2><p className="mt-1 text-sm text-slate-600">{nextLesson?nextLesson.topic.title:nextTopic?.title}</p></div>
        <Link href={continueHref} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ffcc37] px-5 py-3 font-black text-[#15233f]">{nextLesson?"Continue lesson":"Explore topic"}<ArrowRight size={18}/></Link>
      </section>}

      <section className="mt-8"><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-600">{grade} topics</p><h2 className="mt-1 text-2xl font-black">Choose a topic</h2>
        {topics.length?<div className="mt-5 grid gap-5 md:grid-cols-2">{topics.map((topic,index)=>{
          const topicLessons=lessons.filter(lesson=>lesson.topic_id===topic.id);
          const done=topicLessons.filter(lesson=>completed.has(lesson.id)).length;
          const percent=topicLessons.length?Math.round(done/topicLessons.length*100):0;
          const allDone=topicLessons.length>0&&done===topicLessons.length;
          return <Link key={topic.id} href={`/learn/${topic.id}`} className="group rounded-3xl border border-white bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-600">{topic.level}</span>{allDone?<CheckCircle2 className="text-emerald-500" size={22}/>:<span className="text-sm font-bold text-slate-400">{String(index+1).padStart(2,"0")}</span>}</div>
            <h3 className="mt-5 text-xl font-black">{topic.title}</h3><p className="mt-2 text-base leading-6 text-slate-600">{topic.description}</p>
            {topicLessons.length>0&&<><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{width:`${percent}%`}}/></div><p className="mt-2 text-sm font-semibold text-slate-600">{done} of {topicLessons.length} lessons complete</p></>}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-semibold text-slate-600">{topicLessons.length} learning lessons</span><span className="inline-flex items-center gap-1 text-sm font-black text-violet-600">{allDone?"Review":"View lessons"}<ArrowRight size={16}/></span></div>
          </Link>})}</div>:<div className="mt-5 rounded-3xl bg-white p-7 text-slate-600">Topics for {grade} are being prepared.</div>}
      </section>
      {grade==="Grade 1"&&<section className="mt-8 flex flex-col gap-4 rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black uppercase tracking-wide text-violet-600">New · Grade 1</p><h2 className="mt-1 text-2xl font-black">Online worksheets</h2><p className="mt-1 text-slate-600">Count, compare, explore tens and ones, and add with pictures.</p></div><Link href="/worksheets/grade-1" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#ffcc37] px-5 py-3 font-black text-[#15233f]">Explore worksheets <ArrowRight size={18}/></Link></section>}
      {grade==="Grade 1"&&<section className="mt-9"><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-600">Grade 1 learning</p><h2 className="mt-1 text-2xl font-black">Explore a lesson</h2><p className="mt-2 text-slate-600">Read the idea, follow the steps, and see a worked example.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{gradeOneSkills.map(item=><Link key={item.lesson} href={`/learn/${item.topic}/lesson/${item.lesson}`} className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4 font-bold shadow-sm hover:border-violet-300 hover:shadow-md"><span>{item.title}</span>{completed.has(item.lesson)?<CheckCircle2 size={20} className="shrink-0 text-emerald-600"/>:<ArrowRight size={18} className="shrink-0 text-violet-600"/>}</Link>)}</div></section>}
    </div>
  </main>;
}
