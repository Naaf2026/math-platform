"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Home, Lightbulb, RotateCcw, Sparkles, Target, Trophy, XCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Question = { id:string; topicId:string; topic:string; prompt:string; options:string[]; answer:string; explanation:string; difficulty:string; skill:string; points:number };

type Profile = { xp:number; current_streak:number; best_streak:number };

const optionStyles = [
  "border-sky-200 bg-sky-50 hover:border-sky-400 hover:bg-sky-100",
  "border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100",
  "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100",
  "border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100",
];

const optionLetters = ["A", "B", "C", "D"];

function levelForXp(xp:number){ return Math.floor(Math.max(0,xp)/100)+1; }
function levelStart(level:number){ return (level-1)*100; }

export default function MissionPage(){
  const [questions,setQuestions] = useState<Question[]>([]);
  const [loading,setLoading] = useState(true);
  const [current,setCurrent] = useState(0);
  const [selected,setSelected] = useState<string|null>(null);
  const [score,setScore] = useState(0);
  const [correct,setCorrect] = useState(0);
  const [finished,setFinished] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [totalXp,setTotalXp] = useState(0);
  const [streak,setStreak] = useState(0);
  const [bestStreak,setBestStreak] = useState(0);

  const q = questions[current];
  const progress = questions.length ? ((current + (selected ? 1 : 0)) / questions.length) * 100 : 0;
  const level = useMemo(() => levelForXp(totalXp), [totalXp]);
  const currentLevelStart = levelStart(level);
  const nextLevelXp = level * 100;
  const levelProgress = Math.min(100, Math.round(((totalXp-currentLevelStart)/100)*100));

  useEffect(() => { loadMission(); }, []);

  async function loadMission(){
    const supabase = createClient();
    if(!supabase){ setError("Your learning account is not configured yet."); setLoading(false); return; }
    const { data:{user} } = await supabase.auth.getUser();
    if(!user){ window.location.href = "/login"; return; }
    const [{data,error},{data:profile}] = await Promise.all([
      supabase.rpc("get_adaptive_questions",{p_limit:10}),
      supabase.from("profiles").select("xp,current_streak,best_streak").eq("id",user.id).maybeSingle()
    ]);
    if(error || !data?.length){ setError(error?.message || "No practice questions are available yet."); setLoading(false); return; }
    setQuestions(data.map((item:Question) => ({...item, options:Array.isArray(item.options)?item.options:[]})));
    setTotalXp(profile?.xp ?? 0);
    setStreak(profile?.current_streak ?? 0);
    setBestStreak(profile?.best_streak ?? 0);
    setLoading(false);
  }

  async function choose(option:string){
    if(selected || !q) return;
    setSelected(option); setSaving(true); setError("");
    const supabase = createClient();
    if(!supabase){ setError("Your learning account is not configured yet."); setSaving(false); return; }
    const {data,error} = await supabase.rpc("submit_learning_answer",{p_question_id:q.id,p_selected_answer:option});
    if(error){ setError("Your answer could not be saved. Please try again."); setSaving(false); return; }
    const result = data?.[0];
    if(result?.is_correct){
      const earned = result.xp_awarded || 0;
      setCorrect(v=>v+1); setScore(v=>v+earned); setTotalXp(v=>v+earned);
    }
    const {data:profile} = await supabase.from("profiles").select("xp,current_streak,best_streak").maybeSingle();
    if(profile){ setTotalXp(profile.xp??0); setStreak(profile.current_streak??0); setBestStreak(profile.best_streak??0); }
    setSaving(false);
  }

  function next(){
    if(!selected) return;
    if(current===questions.length-1){ setFinished(true); return; }
    setCurrent(v=>v+1); setSelected(null);
  }

  function restart(){
    setQuestions([]); setCurrent(0); setSelected(null); setScore(0); setCorrect(0); setFinished(false); setError(""); setLoading(true); loadMission();
  }

  if(loading) return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0,#f5f3ff_40%,#ecfeff_100%)] p-6 lg:pl-20">
      <div className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[2rem] border-4 border-white bg-white p-10 text-center shadow-2xl shadow-violet-200">
          <div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-lg"><Sparkles size={30}/></div>
          <p className="mt-6 text-xl font-black text-[#071b3a]">Building your Maths Mission… 🚀</p>
          <p className="mt-2 text-sm font-bold text-slate-500">Picking questions just for you.</p>
        </div>
      </div>
    </main>
  );

  if(finished) return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#bae6fd_0,#ede9fe_38%,#fff7ed_100%)] p-5 pb-28 sm:p-8 sm:pb-10 lg:pl-20">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-3"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black text-slate-600 shadow-sm"><Home size={17}/> Home</Link><span className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-violet-950 shadow-sm">Mission complete! 🎉</span></header>
        <section className="relative mt-7 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-7 text-center text-white shadow-2xl sm:p-12">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-300/20"/><div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-white/10"/>
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-yellow-300 text-violet-900 shadow-xl"><Trophy size={46}/></div>
          <p className="relative mt-6 text-sm font-black uppercase tracking-[0.2em] text-cyan-100">Adaptive mission finished</p><h1 className="relative mt-2 text-4xl font-black sm:text-5xl">Maths Champion! 🏆</h1>
          <p className="relative mx-auto mt-3 max-w-xl text-indigo-100">Amazing work. Your next mission will adapt to what you have learned.</p>
          <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat icon={<Zap/>} value={score} label="XP earned"/><ResultStat icon={<Trophy/>} value={`Level ${level}`} label="Current level"/><ResultStat icon={<Flame/>} value={streak} label="Day streak"/><ResultStat icon={<CheckCircle2/>} value={`${correct}/${questions.length}`} label="Correct"/>
          </div>
          <div className="relative mx-auto mt-6 max-w-xl rounded-3xl bg-white/15 p-5 text-left backdrop-blur"><div className="flex items-center justify-between text-xs font-black"><span>Level {level}</span><span>{Math.max(0,totalXp-currentLevelStart)} / 100 XP</span></div><div className="mt-2 h-4 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-yellow-300" style={{width:`${Math.max(3,levelProgress)}%`}}/></div><p className="mt-2 text-xs font-bold text-indigo-100">Best streak: {bestStreak} days · {Math.max(0,nextLevelXp-totalXp)} XP to Level {level+1}</p></div>
          <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-6 py-4 font-black text-violet-950 shadow-lg hover:-translate-y-0.5 hover:bg-yellow-200"><RotateCcw size={18}/> New mission</button><Link href="/learn" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-6 py-4 font-black text-white hover:bg-white/25">Explore topics <ArrowRight size={18}/></Link></div>
        </section>
      </div>
    </main>
  );

  if(!q) return <main className="min-h-screen bg-violet-50 p-6 lg:pl-20"><div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl"><Target className="mx-auto text-violet-600" size={42}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Mission unavailable</h1><p className="mt-2 text-slate-500">{error||"Please try again later."}</p><button onClick={restart} className="mt-6 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Try again</button></div></main>;

  const difficulty = q.difficulty==='easy' ? 'Starter' : q.difficulty==='hard' ? 'Challenge' : 'Core';
  const topicEmoji = q.topic.toLowerCase().includes("fraction") ? "🍕" : q.topic.toLowerCase().includes("multip") ? "✖️" : q.topic.toLowerCase().includes("place") ? "🔢" : "➕";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#bae6fd_0,#dbeafe_22%,#ede9fe_52%,#fff7ed_100%)] pb-28 lg:pl-20 lg:pb-8">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"><div className="absolute -left-24 top-32 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl"/><div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-fuchsia-300/25 blur-3xl"/><div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl"/></div>

      <header className="relative z-10 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:-translate-y-0.5"><ArrowLeft size={19}/><span className="sr-only">Back to dashboard</span></Link>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">FAHI VISSNUN Maths Adventure</p><p className="truncate text-sm font-black text-slate-800 sm:text-base">Daily Adaptive Mission 🚀</p></div>
          <div className="hidden items-center gap-2 sm:flex"><div className="rounded-2xl bg-yellow-50 px-3 py-2 text-xs font-black text-orange-600"><Zap size={15} className="mr-1 inline"/> {score} XP</div><div className="rounded-2xl bg-orange-50 px-3 py-2 text-xs font-black text-orange-600"><Flame size={15} className="mr-1 inline"/> {streak} days</div></div>
          <div className="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-violet-200">LEVEL {level}</div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <section className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 p-5 text-white shadow-2xl shadow-violet-200 sm:p-7">
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/15"/><div className="absolute bottom-[-60px] left-1/4 h-36 w-36 rounded-full bg-yellow-300/20"/>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-black backdrop-blur"><span>🚀</span> LEVEL {level} · {questions.length}-QUESTION MISSION</div><h1 className="mt-3 text-3xl font-black sm:text-4xl">Maths Mission!</h1><p className="mt-1 max-w-xl text-sm font-bold text-cyan-50 sm:text-base">Think carefully, choose your answer, and collect XP. ⭐</p></div>
            <div className="flex shrink-0 items-center gap-3 rounded-3xl bg-white/15 p-3 backdrop-blur"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-3xl shadow-lg">{topicEmoji}</div><div><p className="text-[10px] font-black uppercase tracking-wider text-white/70">Today's skill</p><p className="max-w-[180px] text-sm font-black">{q.skill}</p></div></div>
          </div>
          <div className="relative mt-5"><div className="mb-2 flex items-center justify-between text-xs font-black"><span>Question {current+1} of {questions.length}</span><span>{Math.round(progress)}% complete</span></div><div className="h-4 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-yellow-300 shadow-sm transition-all duration-500" style={{width:`${progress}%`}}/></div></div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="overflow-hidden rounded-[2.25rem] border-4 border-white bg-white shadow-2xl shadow-violet-100">
            <div className="p-5 sm:p-8 lg:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-700">{q.topic}</span><span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">{difficulty}</span></div><span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-black text-orange-700"><Sparkles size={15}/> +{q.points} XP</span></div>
              <h2 className="mt-6 text-2xl font-black leading-tight text-[#071b3a] sm:text-3xl lg:text-[2.15rem]">{q.prompt}</h2>
              <div className="mt-7 rounded-[1.75rem] bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-5 ring-1 ring-sky-100 sm:p-7"><div className="flex items-center justify-center gap-4 text-center"><div className="rounded-2xl bg-white px-5 py-4 text-2xl font-black text-slate-800 shadow-sm sm:text-3xl">{topicEmoji}</div><div className="text-3xl font-black text-violet-500">?</div><div className="rounded-2xl bg-white px-5 py-4 text-2xl font-black text-slate-800 shadow-sm sm:text-3xl">🧠</div></div><p className="mt-3 text-center text-xs font-black text-slate-500">Think step by step. You’ve got this! 💪</p></div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {q.options.map((option,index)=>{
                  const isSelected=selected===option, isCorrect=option===q.answer;
                  let cls=optionStyles[index%optionStyles.length];
                  if(selected&&isCorrect) cls="border-emerald-400 bg-emerald-100 ring-4 ring-emerald-100";
                  else if(selected&&isSelected) cls="border-rose-400 bg-rose-100 ring-4 ring-rose-100";
                  return <button key={option} onClick={()=>choose(option)} disabled={Boolean(selected)||saving} className={`group flex min-h-[72px] items-center gap-4 rounded-3xl border-2 px-4 py-3 text-left font-black text-[#071b3a] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg disabled:cursor-default disabled:hover:translate-y-0 ${cls}`}><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black shadow-sm ring-1 ring-black/5">{optionLetters[index]??"•"}</span><span className="flex-1 text-lg sm:text-xl">{option}</span>{selected&&isCorrect?<CheckCircle2 className="shrink-0 text-emerald-600" size={25}/>:selected&&isSelected?<XCircle className="shrink-0 text-rose-600" size={25}/>:<span className="h-5 w-5 rounded-full border-2 border-white/80 bg-white/70"/>}</button>;
                })}
              </div>

              {selected && <div className={`mt-5 rounded-3xl p-5 ${selected===q.answer?"bg-emerald-50 ring-2 ring-emerald-200":"bg-rose-50 ring-2 ring-rose-200"}`}><div className="flex items-start gap-3">{selected===q.answer?<CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={25}/>:<XCircle className="mt-0.5 shrink-0 text-rose-600" size={25}/>}<div><p className={`text-lg font-black ${selected===q.answer?"text-emerald-700":"text-rose-700"}`}>{selected===q.answer?"Brilliant! That’s correct! 🎉":`Good try! The answer is ${q.answer}.`}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-600">{q.explanation}</p></div></div></div>}
              {error && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</p>}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400"><Lightbulb size={16} className="text-yellow-500"/> Mistakes help your brain grow!</div>{selected&&<button onClick={next} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700">{current===questions.length-1?"Finish Mission":"Next Question"} <ArrowRight size={19}/></button>}</div>
            </div>
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-5 space-y-4">
              <div className="rounded-[2rem] border-4 border-white bg-white p-5 text-center shadow-xl shadow-cyan-100"><div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 via-white to-yellow-100 text-6xl shadow-inner ring-8 ring-cyan-50">🧑‍🚀</div><p className="mt-4 text-lg font-black text-[#071b3a]">You can do it!</p><p className="mt-1 text-sm font-bold text-slate-500">Think step by step ⭐</p></div>
              <div className="rounded-[2rem] border-4 border-white bg-white p-5 shadow-xl shadow-violet-100"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Your progress</p><div className="mt-4 flex items-center gap-2">{questions.map((_,index)=><span key={index} className={`h-3 flex-1 rounded-full ${index<current||(index===current&&selected)?"bg-emerald-400":"bg-slate-200"}`}/>)}</div><p className="mt-3 text-center text-sm font-black text-violet-600">{current + (selected?1:0)} / {questions.length}</p></div>
              <div className="rounded-[2rem] border-4 border-white bg-gradient-to-br from-yellow-50 to-orange-50 p-5 shadow-xl shadow-orange-100"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-300 text-orange-700"><Zap size={21}/></div><div><p className="text-xs font-black uppercase tracking-wider text-orange-500">XP reward</p><p className="text-xl font-black text-orange-700">+{q.points} XP</p></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-orange-400" style={{width:`${Math.max(5,levelProgress)}%`}}/></div></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ResultStat({icon,value,label}:{icon:React.ReactNode;value:string|number;label:string}){
  return <div className="rounded-3xl bg-white/15 p-4 backdrop-blur"><div className="mx-auto flex h-9 w-9 items-center justify-center text-yellow-300">{icon}</div><p className="mt-1 text-2xl font-black">{value}</p><p className="text-[11px] font-bold text-indigo-100">{label}</p></div>;
}
