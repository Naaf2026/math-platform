"use client";
import Link from "next/link";
import {ArrowLeft,Brain,Home,RotateCcw,Sparkles,Zap} from "lucide-react";
import {useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

const CFG={
"flexibility-03":["Rule Switch","switch","🔀","Follow the rule — then switch when it changes!"],
"flexibility-04":["Reverse It","reverse","↩️","Rebuild the sequence in reverse order."],
"flexibility-05":["Odd One Rule","odd","🕵️","Spot the tile that breaks the rule."],
"flexibility-06":["Number Flip","flip","🔄","Flip the number rule and find its partner."],
"flexibility-07":["Change the Rule","switch","🚦","React when the sorting rule suddenly changes."],
"flexibility-08":["Two Ways","route","🛤️","Find a different path to the same target."],
"flexibility-09":["Sort Smart","sort","🧺","Sort each number into the correct zone."],
"flexibility-10":["Pattern Switch","pattern","🧩","Spot when the pattern changes and continue it."],
"flexibility-11":["Equation Flip","flip","⚖️","Flip the operation and keep the result balanced."],
"flexibility-12":["Build Another Way","route","🧱","Build the target using a different combination."],
"flexibility-13":["Number Shuffle","sort","🎲","Put shuffled numbers into the requested order."],
"flexibility-14":["Rule Detective","odd","🔎","Discover the hidden rule from the clues."],
"flexibility-15":["Reverse Sequence","reverse","⏪","Remember the sequence and tap it backwards."],
"flexibility-16":["Compare Paths","route","🗺️","Choose which path reaches the target."],
"flexibility-17":["Flexible Facts","switch","🧠","Switch quickly between number rules."],
"flexibility-18":["Swap the Signs","flip","➕","Swap the operation signs to make it work."],
"flexibility-19":["Reorder Challenge","sort","🔢","Reorder the tiles to match the changing instruction."],
"flexibility-20":["Changing Steps","switch","👣","Follow steps that change direction as you play."],
"flexibility-21":["Double Rule","pattern","✌️","Track two rules working at the same time."],
"flexibility-22":["Number Transform","flip","✨","Transform each number using the shown rule."],
"flexibility-23":["Pattern Pivot","pattern","🔁","Pivot when the pattern changes direction."],
"flexibility-24":["Equation Switch","switch","🎚️","Switch operations without losing the target."],
"flexibility-25":["Think Again","odd","💡","Ignore the obvious answer and find the new rule."],
"flexibility-26":["New Route","route","🧭","Choose a fresh route to reach the target."],
"flexibility-27":["Rule Remix","pattern","🎵","Combine changing rules to complete the remix."],
"flexibility-28":["Twist the Total","flip","🌀","Change the operation to hit the target total."],
"flexibility-29":["Switch Master","switch","⚡","Master rapid rule changes without getting caught."],
"flexibility-30":["Brain Bender","mixed","🏆","Beat a final mix of Brain Twist challenges."]
} as const;
type Id=keyof typeof CFG; type Kind="switch"|"reverse"|"odd"|"flip"|"route"|"sort"|"pattern"|"mixed";
const sh=<T,>(a:T[])=>[...a].sort(()=>Math.random()-.5);
const TOTAL=8;
function roundData(kind:Kind,r:number){
 const base=Math.floor(Math.random()*18)+2, step=Math.floor(Math.random()*4)+2;
 if(kind==="reverse") {const seq=Array.from({length:Math.min(3+Math.floor(r/3),5)},(_,i)=>base+i*step);return{seq,answer:[...seq].reverse(),rule:"Tap backwards"}}
 if(kind==="sort"){const seq=sh(Array.from({length:5},(_,i)=>base+i*step));const desc=r%2===0;return{seq,answer:[...seq].sort((a,b)=>desc?b-a:a-b),rule:desc?"Largest → smallest":"Smallest → largest"}}
 if(kind==="odd"){const rule=r%2===0?"EVEN":"ODD", good=Array.from({length:3},(_,i)=>(base+i*2)*2+(rule==="ODD"?1:0)),bad=base*2+(rule==="ODD"?0:1),seq=sh([...good,bad]);return{seq,answer:[bad],rule:`Find the number that is NOT ${rule.toLowerCase()}`}}
 if(kind==="route"){const target=base+10;const opts=sh([[base,10],[base+2,8],[base-1,10],[base+5,4]]);const answer=opts.findIndex(x=>x[0]+x[1]===target);return{seq:opts.map(x=>x[0]*100+x[1]),answer:[answer],rule:`Reach ${target}`,target}}
 if(kind==="pattern"){const seq=[base,base+step,base+step*2,base+step*3];return{seq,answer:[base+step*4],rule:`Continue the +${step} pattern`}}
 const plus=r%2===1; const n=base; const delta=step; return{seq:sh([n+delta,n-delta,n*2,n+1]),answer:[plus?n+delta:n-delta],rule:plus?`ADD ${delta}`:`SUBTRACT ${delta}`,target:n};
}
export default function BrainTwistGame({gameId}:{gameId:Id}){
 const [title,baseKind,emoji,instruction]=CFG[gameId];const [started,setStarted]=useState(false),[done,setDone]=useState(false),[round,setRound]=useState(1),[score,setScore]=useState(0),[picked,setPicked]=useState<number[]>([]),[feedback,setFeedback]=useState("");const finishing=useRef(false);
 const kind=(baseKind==="mixed"?(["switch","reverse","odd","sort","pattern","route"][round%6] as Kind):baseKind) as Kind;
 const data=useMemo(()=>roundData(kind,round),[kind,round]);
 const begin=()=>{finishing.current=false;setStarted(true);setDone(false);setRound(1);setScore(0);setPicked([]);setFeedback("")};
 const finish=async(s:number)=>{if(finishing.current)return;finishing.current=true;setDone(true);try{await createClient().rpc("complete_brain_game",{p_game_key:gameId,p_score:s,p_total:TOTAL,p_combo:s})}catch{}};
 const next=(ok:boolean)=>{const s=score+(ok?1:0);setScore(s);setFeedback(ok?"✨ Nice switch!":"🌀 Rule twisted!");setTimeout(()=>{if(round>=TOTAL)finish(s);else{setRound(x=>x+1);setPicked([]);setFeedback("")}},550)};
 const tap=(value:number,index:number)=>{if(feedback)return;if(kind==="reverse"||kind==="sort"){const n=[...picked,value];setPicked(n);if(value!==data.answer[picked.length])return next(false);if(n.length===data.answer.length)next(true);return}if(kind==="route")return next(index===data.answer[0]);next(value===data.answer[0])};
 const Gate=({children}:{children:React.ReactNode})=><MindSparkGate gameKey={gameId} gameTitle={title} onStarted={begin}>{children}</MindSparkGate>;
 return <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_8%_4%,#d7fff0,transparent_24%),radial-gradient(circle_at_94%_92%,#d7f7ff,transparent_25%),linear-gradient(135deg,#f5fff9,#effcff)] px-2.5 py-2.5 text-slate-800 sm:px-5 sm:py-4"><div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden">
 <header className="flex shrink-0 items-center justify-between rounded-[22px] border-2 border-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 px-3 py-2 text-white shadow-lg"><Link href="/brain-games/flexibility" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black"><ArrowLeft size={15}/> Brain Twist</Link><div className="hidden items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black sm:flex"><Brain size={16}/> FLEX LAB</div><Link href="/dashboard" className="rounded-full bg-white/15 p-2"><Home size={18}/></Link></header>
 <section className="mt-3 shrink-0 rounded-[28px] border-2 border-white bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-4 text-white shadow-xl"><div className="flex items-center justify-between gap-3"><div><div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black"><Sparkles size={11}/> BRAIN TWIST • {kind.toUpperCase()}</div><h1 className="mt-1 text-2xl font-black sm:text-4xl">{title} {emoji}</h1><p className="mt-1 text-xs font-bold text-white/85">{instruction}</p></div><div className="grid grid-cols-2 gap-2"><Stat value={`${round}/${TOTAL}`} label="ROUND"/><Stat value={String(score)} label="SCORE"/></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-yellow-300 transition-all" style={{width:`${((round-1)/TOTAL)*100}%`}}/></div></section>
 {!started&&!done?<Panel><div className="text-6xl">{emoji}</div><h2 className="mt-3 text-3xl font-black">Ready to twist your thinking?</h2><p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">{instruction}</p><Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-8 py-4 font-black text-white shadow-lg"><Zap size={18}/> Start Game 🚀</span></Gate></Panel>:done?<Panel><div className="text-6xl">🏆</div><h2 className="mt-2 text-3xl font-black">Brain Twist complete!</h2><div className="mt-2 text-5xl font-black text-emerald-600">{score}<span className="text-xl text-slate-400"> / {TOTAL}</span></div><Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3 font-black text-white"><RotateCcw size={17}/> Play Again</span></Gate></Panel>:<section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border-2 border-white bg-white/95 p-3 shadow-xl sm:p-5"><div className="flex justify-between"><b className="text-xs uppercase tracking-widest text-emerald-600">🎮 FOLLOW THE RULE</b><b className="text-xs text-slate-400">Round {round}</b></div><div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4"><div className="relative w-full max-w-2xl text-center"><div className="pointer-events-none absolute -left-8 -top-8 text-7xl opacity-[.07]">🌀</div><div className="pointer-events-none absolute -bottom-8 -right-8 text-7xl opacity-[.07]">🧠</div><div className="mx-auto flex w-fit items-center gap-2 rounded-full border-4 border-white bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-black text-white shadow-[0_6px_0_rgba(15,118,110,.18)]"><span className="text-lg">💡</span> {data.rule}</div>{data.target!==undefined&&kind!=="route"&&<div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-[30px] border-4 border-white bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-400 text-5xl font-black text-white shadow-[0_9px_0_rgba(234,88,12,.16),0_15px_28px_rgba(15,118,110,.12)]">{data.target}</div>}<div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">{data.seq.map((n,i)=>{const a=kind==="route"?Math.floor(n/100):n%100,b=kind==="route"?n%100:null;return <button key={i} onClick={()=>tap(n,i)} className={`group relative min-h-24 overflow-hidden rounded-[24px] border-4 border-white bg-gradient-to-br from-white via-emerald-50 to-cyan-100 p-3 text-2xl font-black text-[#174b59] shadow-[0_8px_0_rgba(13,148,136,.13),0_13px_22px_rgba(15,23,42,.10)] transition hover:-translate-y-1 hover:rotate-1 active:translate-y-1 active:scale-95 ${picked.includes(n)?"!from-yellow-200 !via-amber-200 !to-orange-200":""}`}><span className="pointer-events-none absolute -right-2 -top-3 text-4xl opacity-[.08]">✦</span>{kind==="route"?<span className="relative">{a}<small className="mx-1 text-emerald-400">+</small>{b}<span className="mt-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">PATH {i+1}</span></span>:<span className="relative">{n}</span>}</button>})}</div>{(kind==="reverse"||kind==="sort")&&<div className="mx-auto mt-5 flex min-h-16 max-w-xl flex-wrap items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-emerald-200 bg-white/70 p-2">{picked.length===0&&<span className="text-xs font-black text-emerald-300">Tap the tiles in the correct order</span>}{picked.map((n,i)=><span key={i} className="animate-[bounce_.25s_ease-out] rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 px-4 py-3 font-black text-white shadow-md">{n}</span>)}</div>}{feedback&&<div className="mx-auto mt-4 w-fit animate-bounce rounded-full bg-emerald-100 px-5 py-2 text-lg font-black text-emerald-600 shadow-sm">{feedback}</div>}</div></div></section>}
 </div></main>
}
function Stat({value,label}:{value:string;label:string}){return <div className="rounded-2xl bg-white/15 px-4 py-2 text-center"><div className="font-black">{value}</div><div className="text-[8px] font-black text-white/70">{label}</div></div>}
function Panel({children}:{children:React.ReactNode}){return <section className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[28px] border-2 border-white bg-white/95 p-5 text-center shadow-xl"><div className="w-full max-w-xl">{children}</div></section>}
