"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Lightbulb, RotateCcw, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import InteractiveQuestionEngine from "@/components/interactive-question-engine";

type Question = {
  id:string;
  topicId:string;
  topic:string;
  prompt:string;
  options:string[];
  answer:string;
  explanation:string;
  difficulty:string;
  skill:string;
  points:number;
  interaction_type?:string|null;
  question_type?:string|null;
  hint?:string|null;
};

const topicItems=[
  {name:"Place Value",emoji:"🔢",tone:"bg-sky-100 text-sky-700"},
  {name:"Addition & Subtraction",emoji:"➕",tone:"bg-violet-100 text-violet-700"},
  {name:"Multiplication",emoji:"✖️",tone:"bg-orange-100 text-orange-700"},
  {name:"Fractions",emoji:"🍕",tone:"bg-emerald-100 text-emerald-700"},
];
function levelForXp(xp:number){return Math.floor(Math.max(0,xp)/100)+1;}
function levelStart(level:number){return (level-1)*100;}

export default function MissionPage(){
  const [questions,setQuestions]=useState<Question[]>([]),[loading,setLoading]=useState(true),[current,setCurrent]=useState(0),[selected,setSelected]=useState<string|null>(null),[score,setScore]=useState(0),[correct,setCorrect]=useState(0),[finished,setFinished]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(""),[totalXp,setTotalXp]=useState(0),[streak,setStreak]=useState(0),[bestStreak,setBestStreak]=useState(0);
  const q=questions[current];
  const progress=questions.length?((current+(selected?1:0))/questions.length)*100:0;
  const level=useMemo(()=>levelForXp(totalXp),[totalXp]);
  const currentLevelStart=levelStart(level),nextLevelXp=level*100,levelProgress=Math.min(100,Math.round(((totalXp-currentLevelStart)/100)*100));

  useEffect(()=>{loadMission();},[]);
  async function loadMission(){
    const supabase=createClient();
    if(!supabase){setError("Your learning account is not configured yet.");setLoading(false);return;}
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login";return;}
    const[{data,error},{data:profile}]=await Promise.all([supabase.rpc("get_adaptive_questions",{p_limit:10}),supabase.from("profiles").select("xp,current_streak,best_streak").eq("id",user.id).maybeSingle()]);
    if(error||!data?.length){setError(error?.message||"No practice questions are available yet.");setLoading(false);return;}
    setQuestions(data.map((item:Question)=>({...item,options:Array.isArray(item.options)?item.options:[]})));
    setTotalXp(profile?.xp??0);setStreak(profile?.current_streak??0);setBestStreak(profile?.best_streak??0);setLoading(false);
  }
  async function choose(option:string){
    if(selected||!q)return;setSelected(option);setSaving(true);setError("");
    const supabase=createClient();if(!supabase){setError("Your learning account is not configured yet.");setSaving(false);return;}
    const{data,error}=await supabase.rpc("submit_learning_answer",{p_question_id:q.id,p_selected_answer:option});
    if(error){setError("Your answer could not be saved. Please try again.");setSaving(false);return;}
    const result=data?.[0];if(result?.is_correct){const earned=result.xp_awarded||0;setCorrect(v=>v+1);setScore(v=>v+earned);setTotalXp(v=>v+earned);}
    const{data:profile}=await supabase.from("profiles").select("xp,current_streak,best_streak").maybeSingle();if(profile){setTotalXp(profile.xp??0);setStreak(profile.current_streak??0);setBestStreak(profile.best_streak??0);}setSaving(false);
  }
  function next(){if(!selected)return;if(current===questions.length-1){setFinished(true);return;}setCurrent(v=>v+1);setSelected(null);}
  function restart(){setQuestions([]);setCurrent(0);setSelected(null);setScore(0);setCorrect(0);setFinished(false);setError("");setLoading(true);loadMission();}

  if(loading)return <main className="min-h-screen bg-[#f4f7fb] p-5 lg:pl-20"><div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center"><div className="w-full rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-4xl shadow-lg">🚀</div><p className="mt-6 text-xl font-black text-[#15233f]">Getting your Maths Mission ready!</p><p className="mt-2 text-sm font-bold text-slate-500">Finding questions that match your level…</p></div></div></main>;

  if(finished)return <main className="min-h-screen bg-[#f4f7fb] p-5 pb-28 sm:p-8 sm:pb-10 lg:pl-20"><div className="mx-auto max-w-5xl"><section className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl"><div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 px-6 py-8 text-center sm:px-10"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl shadow-xl">🏆</div><p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-orange-800">Mission complete</p><h1 className="mt-1 text-4xl font-black text-[#15233f] sm:text-5xl">You did it! 🎉</h1><p className="mx-auto mt-2 max-w-xl font-bold text-orange-900/70">Every question helps your Maths power grow.</p></div><div className="p-6 sm:p-10"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><ResultStat icon={<Zap/>} value={score} label="XP earned"/><ResultStat icon={<Trophy/>} value={`Level ${level}`} label="Your level"/><ResultStat icon={<Flame/>} value={streak} label="Day streak"/><ResultStat icon={<CheckCircle2/>} value={`${correct}/${questions.length}`} label="Correct"/></div><div className="mt-7 rounded-3xl bg-slate-50 p-5"><div className="flex items-center justify-between text-sm font-black text-slate-700"><span>Level {level}</span><span>{Math.max(0,totalXp-currentLevelStart)} / 100 XP</span></div><div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" style={{width:`${Math.max(3,levelProgress)}%`}}/></div><p className="mt-2 text-xs font-bold text-slate-500">Best streak: {bestStreak} days · {Math.max(0,nextLevelXp-totalXp)} XP to Level {level+1}</p></div><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600"><RotateCcw size={18}/> Try another mission</button><Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-7 py-4 font-black text-slate-700">Back to Home <ArrowRight size={18}/></Link></div></div></section></div></main>;

  if(!q)return <main className="min-h-screen bg-[#f4f7fb] p-6 lg:pl-20"><div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><Target className="mx-auto text-orange-500" size={42}/><h1 className="mt-4 text-2xl font-black text-[#15233f]">Mission unavailable</h1><p className="mt-2 text-slate-500">{error||"Please try again later."}</p><button onClick={restart} className="mt-6 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white">Try again</button></div></main>;

  const difficulty=q.difficulty==='easy'?'Starter':q.difficulty==='hard'?'Challenge':'Core';
  const topicEmoji=q.topic.toLowerCase().includes("fraction")?"🍕":q.topic.toLowerCase().includes("multip")?"✖️":q.topic.toLowerCase().includes("place")?"🔢":"➕";
  const activeTopic=q.topic.toLowerCase();

  return <main className="min-h-screen bg-[#f4f7fb] pb-28 lg:pl-20 lg:pb-8">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"><div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6"><Link href="/dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"><ArrowLeft size={18}/><span className="sr-only">Back</span></Link><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">FAHI VISSNUN MATHS</p><p className="truncate text-sm font-black text-[#15233f]">Mission · {q.topic}</p></div><div className="hidden items-center gap-2 sm:flex"><div className="rounded-xl bg-yellow-50 px-3 py-2 text-xs font-black text-orange-700">⚡ {score} XP</div><div className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">🔥 {streak}</div></div><div className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white"><span>⭐</span> Lv {level}</div></div></header>

    <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block"><div className="sticky top-20 space-y-4"><div className="overflow-hidden rounded-[1.5rem] bg-white shadow-lg"><div className="bg-gradient-to-r from-yellow-300 to-orange-300 px-5 py-4"><p className="text-xs font-black uppercase tracking-wider text-orange-900">Today's Mission</p><p className="mt-1 text-lg font-black text-[#15233f]">10 questions 🚀</p></div><div className="p-3">{topicItems.map(item=>{const active=activeTopic.includes(item.name.toLowerCase().split(" ")[0])||activeTopic.includes(item.name.toLowerCase().replace(" & ","-"));return <div key={item.name} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black ${active?item.tone:"text-slate-500 hover:bg-slate-50"}`}><span className="text-xl">{item.emoji}</span><span>{item.name}</span></div>})}</div></div><div className="rounded-[1.5rem] bg-white p-5 shadow-lg"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Mission progress</p><div className="mt-4 grid grid-cols-5 gap-2">{questions.map((_,i)=><span key={i} className={`flex h-8 items-center justify-center rounded-lg text-[10px] font-black ${i<current?"bg-emerald-400 text-white":i===current?"bg-orange-500 text-white shadow-md":"bg-slate-100 text-slate-400"}`}>{i+1}</span>)}</div><p className="mt-4 text-center text-xs font-black text-slate-500">{current+(selected?1:0)} of {questions.length} answered</p></div></div></aside>

      <section className="min-w-0">
        <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl">
          <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 px-5 py-5 sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-black text-orange-800"><span>🚀</span> PERSONALIZED MATHS MISSION</div><h1 className="mt-2 text-2xl font-black text-[#15233f] sm:text-3xl">Let’s solve this one! 🧠</h1></div><div className="flex items-center gap-2 rounded-2xl bg-white/70 p-2"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">{topicEmoji}</div><div className="pr-2"><p className="text-[10px] font-black uppercase tracking-wider text-orange-700">Skill</p><p className="max-w-[170px] text-sm font-black text-[#15233f]">{q.skill}</p></div></div></div><div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs font-black text-orange-900"><span>Question {current+1} / {questions.length}</span><span>{Math.round(progress)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white/60"><div className="h-full rounded-full bg-violet-600 transition-all duration-500" style={{width:`${Math.max(progress,8)}%`}}/></div></div></div>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div key={q.id} className="question-enter">
                <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-700">{q.topic}</span><span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">{difficulty}</span></div><span className="rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-black text-orange-700">⭐ +{q.points} XP</span></div>
                <div className="mt-7 rounded-[1.75rem] border-2 border-slate-100 bg-[#fbfcff] px-5 py-8 text-center sm:px-10 sm:py-12"><p className="mx-auto max-w-3xl text-2xl font-black leading-tight text-[#15233f] sm:text-4xl">{q.prompt}</p><div className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-500 shadow-sm ring-1 ring-slate-100"><span className="text-2xl">{topicEmoji}</span><span>Take your time · Think step by step</span><span>💡</span></div></div>
                <InteractiveQuestionEngine question={q} selected={selected} disabled={Boolean(selected)||saving} onAnswer={choose}/>
              </div>

              {error&&<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</p>}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><Lightbulb size={16} className="text-yellow-500"/> Mistakes are part of learning!</div>{selected&&<button onClick={next} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600">{current===questions.length-1?"Finish Mission":"Next Question"} <ArrowRight size={19}/></button>}</div>
            </div>

            <aside className="hidden border-l border-slate-100 bg-[#fbfcff] p-5 xl:block"><div className="sticky top-24 space-y-4"><div className="rounded-[1.5rem] bg-white p-5 text-center shadow-sm ring-1 ring-slate-100"><div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 via-pink-100 to-violet-100 text-6xl shadow-inner">🧑‍🚀</div><p className="mt-4 text-lg font-black text-[#15233f]">Keep going!</p><p className="mt-1 text-xs font-bold text-slate-500">You’re doing great ⭐</p></div><div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Your rewards</p><Zap className="text-yellow-500" size={18}/></div><p className="mt-2 text-2xl font-black text-orange-600">+{q.points} XP</p><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400" style={{width:`${Math.max(6,levelProgress)}%`}}/></div><p className="mt-2 text-[11px] font-bold text-slate-500">{Math.max(0,nextLevelXp-totalXp)} XP to Level {level+1}</p></div><div className="rounded-[1.5rem] bg-violet-50 p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white"><Flame size={19}/></div><div><p className="text-[10px] font-black uppercase tracking-wider text-violet-500">Streak</p><p className="text-lg font-black text-violet-800">{streak} days</p></div></div></div><div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-100 px-4 py-3 text-sm font-black text-sky-700"><Lightbulb size={17}/> Interactive learning mode</div></div></aside>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 lg:hidden"><span>Question {current+1} of {questions.length}</span><span>•</span><span>{score} XP earned</span><span>•</span><span>🔥 {streak} day streak</span></div>
      </section>
    </div>
  </main>;
}

function ResultStat({icon,value,label}:{icon:ReactNode;value:string|number;label:string}){return <div className="rounded-2xl bg-slate-50 p-4 text-center"><div className="mx-auto flex h-9 w-9 items-center justify-center text-orange-500">{icon}</div><p className="mt-1 text-2xl font-black text-[#15233f]">{value}</p><p className="text-[11px] font-bold text-slate-500">{label}</p></div>;
}
