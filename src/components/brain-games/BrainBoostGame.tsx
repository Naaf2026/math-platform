"use client";
import Link from "next/link";
import {ArrowLeft,Brain,Home,RotateCcw,Sparkles,Trophy,Zap} from "lucide-react";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

const GAME_CONFIGS={
 "memory-03":{title:"Hidden Numbers",kind:"grid",emoji:"🔎",instruction:"Remember where the target numbers are hiding."},
 "memory-04":{title:"What's Missing?",kind:"missing",emoji:"❓",instruction:"Memorize the objects, then spot what disappeared."},
 "memory-05":{title:"Number Echo",kind:"sequence",emoji:"🔢",instruction:"Watch the number sequence and repeat it."},
 "memory-06":{title:"Equation Recall",kind:"flash",emoji:"➕",instruction:"Remember the equation before it disappears."},
 "memory-07":{title:"Pattern Memory",kind:"pattern",emoji:"🧩",instruction:"Remember the pattern and rebuild it."},
 "memory-08":{title:"Quick Peek",kind:"missing",emoji:"👀",instruction:"Take a quick look, then recall the hidden object."},
 "memory-09":{title:"Pair Power",kind:"pairs",emoji:"✨",instruction:"Flip the tiles and find every matching pair."},
 "memory-10":{title:"Memory Ladder",kind:"sequence",emoji:"🪜",instruction:"Repeat the growing sequence in order."},
 "memory-11":{title:"Number Snapshot",kind:"flash",emoji:"📸",instruction:"Memorize the number snapshot and choose it."},
 "memory-12":{title:"Shape Recall",kind:"missing",emoji:"🔷",instruction:"Remember the shapes and find the missing one."},
 "memory-13":{title:"Sequence Keeper",kind:"sequence",emoji:"🔗",instruction:"Keep the sequence in memory and replay it."},
 "memory-14":{title:"Math Match",kind:"pairs",emoji:"🧠",instruction:"Remember the tiles and match the pairs."},
 "memory-15":{title:"Missing Pair",kind:"pairs",emoji:"🃏",instruction:"Find all the hidden matching pairs."},
 "memory-16":{title:"Memory Grid",kind:"grid",emoji:"▦",instruction:"Remember the glowing cells and tap them back."},
 "memory-17":{title:"Recall Rush",kind:"sequence",emoji:"⚡",instruction:"Replay each flashed sequence before time runs out."},
 "memory-18":{title:"Number Vault",kind:"sequence",emoji:"🔐",instruction:"Remember the secret code and unlock the vault."},
 "memory-19":{title:"Equation Cards",kind:"pairs",emoji:"🎴",instruction:"Match each hidden card with its pair."},
 "memory-20":{title:"Pattern Vault",kind:"pattern",emoji:"🔒",instruction:"Remember the pattern that opens the vault."},
 "memory-21":{title:"Memory Steps",kind:"sequence",emoji:"👣",instruction:"Follow the remembered steps in the right order."},
 "memory-22":{title:"Hidden Total",kind:"flash",emoji:"🎯",instruction:"Remember the flashed numbers and choose their total."},
 "memory-23":{title:"Flash Equation",kind:"flash",emoji:"💥",instruction:"Catch the equation before it vanishes."},
 "memory-24":{title:"Recall Order",kind:"sequence",emoji:"↔️",instruction:"Replay the items in exactly the same order."},
 "memory-25":{title:"Math Memory Mix",kind:"pattern",emoji:"🎲",instruction:"Remember the mixed pattern and rebuild it."},
 "memory-26":{title:"Number Trail",kind:"sequence",emoji:"🗺️",instruction:"Remember and follow the number trail."},
 "memory-27":{title:"Memory Switch",kind:"grid",emoji:"🔄",instruction:"Remember the highlighted tiles after they switch."},
 "memory-28":{title:"Secret Sequence",kind:"sequence",emoji:"🤫",instruction:"Memorize the secret sequence and repeat it."},
 "memory-29":{title:"Brain Snapshot",kind:"missing",emoji:"🧠",instruction:"Take a mental snapshot and spot what changed."},
 "memory-30":{title:"Memory Master Challenge",kind:"pattern",emoji:"🏆",instruction:"Beat the final mixed memory challenge."},
} as const;
type GameId=keyof typeof GAME_CONFIGS;
const symbols=["🍎","⭐","🚀","🐟","🌸","⚽","🍌","💎","🐢","🌙","🦋","🎈"];
const shuffle=<T,>(a:T[])=>[...a].sort(()=>Math.random()-.5);
function makeSequence(round:number){return Array.from({length:Math.min(3+Math.floor(round/2),7)},()=>Math.floor(Math.random()*9)+1)}
function makeGrid(round:number){return shuffle(Array.from({length:12},(_,i)=>i)).slice(0,Math.min(3+Math.floor(round/2),6))}
function makeFlash(){const a=Math.floor(Math.random()*15)+2,b=Math.floor(Math.random()*10)+1;return {text:`${a} + ${b}`,answer:a+b,choices:shuffle([a+b,a+b+1,a+b-1,a+b+2])}}
export default function BrainBoostGame({gameId}:{gameId:GameId}){
 const cfg=GAME_CONFIGS[gameId]; const [started,setStarted]=useState(false),[done,setDone]=useState(false),[round,setRound]=useState(1),[score,setScore]=useState(0),[show,setShow]=useState(true),[input,setInput]=useState<number[]>([]),[seq,setSeq]=useState<number[]>(()=>makeSequence(1)),[grid,setGrid]=useState<number[]>(()=>makeGrid(1)),[items,setItems]=useState(()=>shuffle(symbols).slice(0,6)),[missing,setMissing]=useState(""),[flash,setFlash]=useState(makeFlash),[feedback,setFeedback]=useState(""); const finishing=useRef(false); const total=8;
 const kind=cfg.kind;
 const setup=(r:number)=>{setInput([]);setFeedback("");setShow(true);setSeq(makeSequence(r));setGrid(makeGrid(r));const x=shuffle(symbols).slice(0,6);setItems(x);setMissing(x[Math.floor(Math.random()*x.length)]);setFlash(makeFlash())};
 const begin=()=>{finishing.current=false;setRound(1);setScore(0);setDone(false);setStarted(true);setup(1)};
 useEffect(()=>{if(!started||done||!show)return;const t=setTimeout(()=>setShow(false),kind==="pairs"?700:2200);return()=>clearTimeout(t)},[started,done,show,round,kind]);
 const finish=async(s:number)=>{if(finishing.current)return;finishing.current=true;setDone(true);try{await createClient().rpc("complete_brain_game",{p_game_key:gameId,p_score:s,p_total:total,p_combo:s})}catch{}};
 const success=()=>{const s=score+1;setScore(s);setFeedback("✨ Great memory!");if(round>=total){setTimeout(()=>finish(s),500)}else setTimeout(()=>{setRound(r=>r+1);setup(round+1)},550)};
 const fail=()=>{setFeedback("💭 Try the next one!");if(round>=total)setTimeout(()=>finish(score),550);else setTimeout(()=>{setRound(r=>r+1);setup(round+1)},650)};
 const choose=(v:number)=>{if(show||feedback)return;if(kind==="sequence"){const n=[...input,v];setInput(n);if(v!==seq[input.length])return fail();if(n.length===seq.length)return success()}else if(kind==="grid"){if(grid.includes(v)){const n=[...input,v];setInput(n);if(n.length===grid.length)success()}else fail()}};
 const missingChoices=useMemo(()=>shuffle([missing,...shuffle(symbols.filter(x=>x!==missing)).slice(0,3)]),[missing,round]);
 const Gate=({children}:{children:React.ReactNode})=><MindSparkGate gameKey={gameId} gameTitle={cfg.title} onStarted={begin}>{children}</MindSparkGate>;
 return <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_8%_5%,#fff3a6,transparent_22%),radial-gradient(circle_at_92%_8%,#baf7ff,transparent_25%),linear-gradient(135deg,#effcff,#eef6ff_48%,#faf0ff)] px-2.5 py-2.5 text-[#12375d] sm:px-5 sm:py-4"><div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden">
 <header className="flex shrink-0 items-center justify-between rounded-[22px] border-2 border-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-3 py-2 text-white shadow-lg"><Link href="/brain-games/memory" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black"><ArrowLeft size={15}/> Brain Boost</Link><div className="hidden items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black sm:flex"><Brain size={16}/> MEMORY LAB</div><Link href="/dashboard" className="rounded-full bg-white/15 p-2"><Home size={18}/></Link></header>
 <section className="mt-3 shrink-0 rounded-[28px] border-2 border-white bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-700 p-4 text-white shadow-xl"><div className="flex items-center justify-between"><div><div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black"><Sparkles size={11}/> MEMORY • {kind.toUpperCase()}</div><h1 className="mt-1 text-2xl font-black sm:text-4xl">{cfg.title} {cfg.emoji}</h1><p className="mt-1 text-xs font-bold text-white/85">{cfg.instruction}</p></div><div className="grid grid-cols-2 gap-2"><Stat value={`${round}/${total}`} label="ROUND"/><Stat value={String(score)} label="SCORE"/></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-yellow-300 transition-all" style={{width:`${((round-1)/total)*100}%`}}/></div></section>
 {!started&&!done?<Panel><div className="text-6xl">{cfg.emoji}</div><h2 className="mt-3 text-3xl font-black">Ready to play?</h2><p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">{cfg.instruction} Watch carefully, remember, then interact with the game.</p><Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-black text-white shadow-lg"><Zap size={18}/> Start Game 🚀</span></Gate></Panel>:done?<Panel><div className="text-6xl">🏆</div><h2 className="mt-2 text-3xl font-black">Great game!</h2><div className="mt-2 text-5xl font-black text-blue-600">{score}<span className="text-xl text-slate-400"> / {total}</span></div><Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 font-black text-white"><RotateCcw size={17}/> Play Again</span></Gate></Panel>:<section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border-2 border-white bg-white/95 p-3 shadow-xl sm:p-5"><div className="flex justify-between"><b className="text-xs uppercase tracking-widest text-cyan-600">{show?"👀 MEMORIZE":"🎮 YOUR TURN"}</b><b className="text-xs text-slate-400">Round {round}</b></div><div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-[24px] bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-4">
 {kind==="sequence"&&<div className="w-full max-w-2xl text-center">{show?<div className="flex justify-center gap-3">{seq.map((n,i)=><div key={i} className="flex h-20 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black text-white shadow-lg">{n}</div>)}</div>:<><div className="mb-4 text-lg font-black">Repeat the sequence</div><div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6,7,8,9].map(n=><button key={n} onClick={()=>choose(n)} className="rounded-2xl bg-white p-4 text-2xl font-black shadow-md">{n}</button>)}</div></>}</div>}
 {kind==="grid"&&<div className="grid w-full max-w-xl grid-cols-4 gap-3">{Array.from({length:12},(_,i)=><button key={i} onClick={()=>choose(i)} disabled={show} className={`aspect-square rounded-2xl border-4 shadow-md transition ${show&&grid.includes(i)?"border-yellow-300 bg-gradient-to-br from-cyan-400 to-blue-600":"border-white bg-slate-100"} ${!show&&input.includes(i)?"bg-emerald-300":""}`}>{show&&grid.includes(i)?"✨":""}</button>)}</div>}
 {(kind==="missing"||kind==="pattern")&&<div className="w-full text-center">{show?<div className="flex flex-wrap justify-center gap-3">{items.map((x,i)=><div key={i} className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-4xl shadow-md">{x}</div>)}</div>:<><h3 className="mb-4 text-xl font-black">Which one disappeared?</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{missingChoices.map(x=><button key={x} onClick={()=>x===missing?success():fail()} className="rounded-2xl bg-white p-5 text-4xl shadow-md">{x}</button>)}</div></>}</div>}
 {kind==="flash"&&<div className="w-full text-center">{show?<div className="text-6xl font-black text-blue-700">{flash.text}</div>:<><h3 className="mb-5 text-xl font-black">What was the answer?</h3><div className="grid grid-cols-2 gap-3">{flash.choices.map(x=><button key={x} onClick={()=>x===flash.answer?success():fail()} className="rounded-2xl bg-white p-5 text-2xl font-black shadow-md">{x}</button>)}</div></>}</div>}
 {kind==="pairs"&&<Pairs onDone={success}/>}
 </div>{feedback&&<div className="mt-2 text-center text-sm font-black text-emerald-600">{feedback}</div>}</section>}
 </div></main>
}
function Pairs({onDone}:{onDone:()=>void}){const vals=["🍎","⭐","🚀","🐟"];const [cards,setCards]=useState(()=>shuffle([...vals,...vals]).map((v,i)=>({v,i,open:false,done:false})));const [open,setOpen]=useState<number[]>([]);useEffect(()=>{if(open.length!==2)return;const [a,b]=open,t=setTimeout(()=>{if(cards[a].v===cards[b].v){setCards(c=>c.map((x,i)=>i===a||i===b?{...x,done:true}:x));if(cards.filter(x=>x.done).length===6)setTimeout(onDone,250)}setCards(c=>c.map((x,i)=>i===a||i===b?{...x,open:false}:x));setOpen([])},500);return()=>clearTimeout(t)},[open]);return <div className="grid w-full max-w-xl grid-cols-4 gap-3">{cards.map((c,i)=><button key={c.i} onClick={()=>{if(c.open||c.done||open.length>=2)return;setCards(x=>x.map((z,j)=>j===i?{...z,open:true}:z));setOpen(x=>[...x,i])}} className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl text-white shadow-md">{c.open||c.done?c.v:"✦"}</button>)}</div>}
function Stat({value,label}:{value:string;label:string}){return <div className="rounded-2xl bg-white/15 px-4 py-2 text-center"><div className="font-black">{value}</div><div className="text-[8px] font-black text-white/70">{label}</div></div>}
function Panel({children}:{children:React.ReactNode}){return <section className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[28px] border-2 border-white bg-white/95 p-5 text-center shadow-xl"><div className="w-full max-w-xl">{children}</div></section>}
