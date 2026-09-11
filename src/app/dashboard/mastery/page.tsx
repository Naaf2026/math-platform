"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, Brain, CheckCircle2, Flame, LockKeyhole, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile={full_name:string|null;xp:number;current_streak:number;best_streak:number};
type Topic={id:string;title:string;description:string;level:string;sort_order:number};
type TopicProgress={topic_id:string;questions_answered:number;correct_answers:number;completed_at:string|null};
type Attempt={question_id:string;is_correct:boolean;created_at:string};

type Band="Unknown"|"Emerging"|"Developing"|"Mastered";
type Action="Remediate"|"Practice"|"Advance"|"Challenge";

const topicStyles=[
 {bar:"from-violet-500 to-indigo-500",soft:"bg-violet-50",text:"text-violet-700"},
 {bar:"from-cyan-400 to-blue-500",soft:"bg-cyan-50",text:"text-cyan-700"},
 {bar:"from-amber-400 to-orange-500",soft:"bg-amber-50",text:"text-orange-700"},
 {bar:"from-pink-400 to-rose-500",soft:"bg-pink-50",text:"text-pink-700"},
];

function mastery(correct:number,answered:number){return answered?Math.round((correct/answered)*100):0;}
function band(score:number):Band{if(score===0)return "Unknown";if(score<60)return "Emerging";if(score<80)return "Developing";return "Mastered";}
function action(score:number):Action{if(score===0||score<50)return "Remediate";if(score<80)return "Practice";if(score<90)return "Advance";return "Challenge";}

export default function MasteryDashboard(){
 const[profile,setProfile]=useState<Profile|null>(null);
 const[topics,setTopics]=useState<Topic[]>([]);
 const[progress,setProgress]=useState<TopicProgress[]>([]);
 const[attempts,setAttempts]=useState<Attempt[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 useEffect(()=>{const supabase=createClient();if(!supabase){setError("Supabase is not configured yet.");setLoading(false);return;}supabase.auth.getUser().then(async({data,error:authError})=>{if(authError||!data.user){window.location.href="/login";return;}const[{data:p},{data:t},{data:tp},{data:a}]=await Promise.all([
  supabase.from("profiles").select("full_name,xp,current_streak,best_streak").eq("id",data.user.id).maybeSingle(),
  supabase.from("learning_topics").select("id,title,description,level,sort_order").order("sort_order"),
  supabase.from("topic_progress").select("topic_id,questions_answered,correct_answers,completed_at").eq("user_id",data.user.id),
  supabase.from("question_attempts").select("question_id,is_correct,created_at").eq("user_id",data.user.id).order("created_at",{ascending:false}).limit(20)
 ]);setProfile(p??{full_name:data.user.user_metadata?.full_name??"Student",xp:0,current_streak:0,best_streak:0});setTopics((t??[]) as Topic[]);setProgress((tp??[]) as TopicProgress[]);setAttempts((a??[]) as Attempt[]);setLoading(false);})},[]);
 const rows=useMemo(()=>topics.map((topic,index)=>{const p=progress.find(x=>x.topic_id===topic.id);const score=mastery(p?.correct_answers??0,p?.questions_answered??0);return{topic,p,score,band:band(score),action:action(score),style:topicStyles[index%topicStyles.length]}}),[topics,progress]);
 const answered=progress.reduce((n,p)=>n+p.questions_answered,0),correct=progress.reduce((n,p)=>n+p.correct_answers,0),overall=mastery(correct,answered);
 const weakest=rows.filter(r=>r.band!=="Mastered").sort((a,b)=>a.score-b.score)[0]??rows[0];
 const next=weakest?.topic;
 const recentCorrect=attempts.slice(0,10).filter(a=>a.is_correct).length;
 const firstName=(profile?.full_name||"Student").split(" ")[0];
 if(loading)return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><Sparkles className="mx-auto text-violet-500"/><p className="mt-3 font-bold text-[#071b3a]">Building your mastery map…</p></div></main>;
 if(error)return <main className="flex min-h-screen items-center justify-center p-6"><div className="rounded-3xl bg-white p-8 text-center shadow-xl"><p className="font-bold text-red-600">{error}</p><Link href="/dashboard" className="mt-4 inline-block font-bold text-violet-600">Back to dashboard</Link></div></main>;
 return <main className="min-h-screen bg-gradient-to-br from-[#f7f7ff] via-white to-[#f0fbff]">
  <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-violet-50 hover:text-violet-600"><ArrowLeft size={17}/> Dashboard</Link><div className="flex items-center gap-2 text-sm font-black text-[#071b3a]"><Brain size={19} className="text-violet-600"/> Mastery Map</div><Link href="/mission" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-violet-700">Practice <ArrowRight size={16}/></Link></div></header>
  <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-9">
   <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl shadow-indigo-200 sm:p-9"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl"/><div className="relative grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Sparkles size={14}/> Adaptive learning</div><h1 className="mt-4 text-3xl font-black sm:text-5xl">{firstName}, here is your mastery map.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">We turn your practice results into a simple picture of what you know, what needs work and what you are ready to learn next.</p></div><div className="rounded-3xl bg-white/10 p-5 backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-indigo-100">Overall mastery</p><p className="text-4xl font-black">{overall}%</p></div><BarChart3 size={34} className="text-cyan-200"/></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow-300" style={{width:`${overall}%`}}/></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-black">{answered}</p><p className="text-[11px] text-indigo-100">Answered</p></div><div><p className="text-xl font-black">{correct}</p><p className="text-[11px] text-indigo-100">Correct</p></div><div><p className="text-xl font-black">{profile?.xp??0}</p><p className="text-[11px] text-indigo-100">XP</p></div></div></div></div></section>
   <section className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"><Flame className="text-orange-500" size={22}/><p className="mt-3 text-2xl font-black text-[#071b3a]">{profile?.current_streak??0} days</p><p className="text-sm text-slate-500">Current streak · best {profile?.best_streak??0}</p></div><div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm"><Zap className="text-violet-600" size={22}/><p className="mt-3 text-2xl font-black text-[#071b3a]">{recentCorrect}/10</p><p className="text-sm text-slate-500">Recent answers correct</p></div><div className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm"><Trophy className="text-amber-500" size={22}/><p className="mt-3 text-2xl font-black text-[#071b3a]">{rows.filter(r=>r.band==="Mastered").length}/{rows.length}</p><p className="text-sm text-slate-500">Topics mastered</p></div></section>
   <section className="mt-7"><div className="mb-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">Topic mastery</p><h2 className="mt-1 text-2xl font-black text-[#071b3a] sm:text-3xl">Know your strengths and gaps</h2></div><div className="grid gap-4 md:grid-cols-2">{rows.map(({topic,p,score,band:level,action:nextAction,style})=><article key={topic.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-[#071b3a]">{topic.title}</h3><p className="mt-1 text-sm text-slate-500">{topic.description}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${style.soft} ${style.text}`}>{level}</span></div><div className="mt-5 flex items-end justify-between"><span className="text-3xl font-black text-[#071b3a]">{score}%</span><span className="text-xs font-bold text-slate-400">{p?.correct_answers??0}/{p?.questions_answered??0} correct</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all`} style={{width:`${score}%`}}/></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="inline-flex items-center gap-2 text-sm font-black text-slate-700"><Target size={16} className={style.text}/> Next: {nextAction}</span>{p?.completed_at?<CheckCircle2 size={18} className="text-emerald-500"/>:<LockKeyhole size={17} className="text-slate-300"/>}</div></article>)}</div></section>
   {next&&<section className="mt-7 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 shadow-sm sm:p-7"><div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Recommended next step</p><h2 className="mt-2 text-2xl font-black text-[#071b3a]">Strengthen {next.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Your current mastery is {mastery(weakest?.p?.correct_answers??0,weakest?.p?.questions_answered??0)}%. The adaptive engine will prioritise this skill when you practise your next mission.</p></div><Link href="/mission" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700">Start adaptive practice <ArrowRight size={18}/></Link></div></section>}
  </div>
 </main>;
}
