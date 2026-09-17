"use client";

import Link from "next/link";
import { ArrowLeft, Brain, CheckCircle2, Coins, Home, RotateCcw, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

type Card = { id: number; pair: string; value: string; matched: boolean; flipped: boolean };
const PAIRS = [["3 + 2", "5"],["4 + 4", "8"],["6 - 2", "4"],["2 + 7", "9"],["10 - 3", "7"],["5 + 5", "10"]];
function makeCards(): Card[] { return PAIRS.flatMap(([question, answer], pairIndex) => [{ id: pairIndex * 2, pair: String(pairIndex), value: question, matched: false, flipped: false }, { id: pairIndex * 2 + 1, pair: String(pairIndex), value: answer, matched: false, flipped: false }]).sort(() => Math.random() - 0.5); }

export default function MemoryTilesPage() {
  const [cards, setCards] = useState<Card[]>(makeCards), [flipped, setFlipped] = useState<number[]>([]), [moves, setMoves] = useState(0), [matches, setMatches] = useState(0), [time, setTime] = useState(60), [started, setStarted] = useState(false), [finished, setFinished] = useState(false), [saving, setSaving] = useState(false), [reward, setReward] = useState<any>(null), [message, setMessage] = useState("");
  const finishing = useRef(false);
  const totalPairs = PAIRS.length, progress = Math.round((matches / totalPairs) * 100);

  useEffect(() => { if (!started || finished) return; const timer = window.setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000); return () => window.clearInterval(timer); }, [started, finished]);
  useEffect(() => { if (started && !finished && time === 0) finishGame(); }, [time, started, finished]);
  useEffect(() => { if (started && matches === totalPairs && !finished) finishGame(); }, [matches, started, finished]);
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [firstId, secondId] = flipped;
    const first = cards.find((c) => c.id === firstId), second = cards.find((c) => c.id === secondId);
    if (!first || !second) return;
    const isMatch = first.pair === second.pair;
    const timer = window.setTimeout(() => {
      if (isMatch) {
        setCards((current) => current.map((c) => c.id === firstId || c.id === secondId ? { ...c, matched: true, flipped: true } : c));
        setMatches((m) => m + 1);
        setMessage("✨ Perfect match!");
        window.setTimeout(() => setMessage(""), 650);
      } else {
        setCards((current) => current.map((c) => c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c));
        setMessage("💭 Keep looking!");
        window.setTimeout(() => setMessage(""), 500);
      }
      setFlipped([]);
    }, isMatch ? 300 : 700);
    return () => window.clearTimeout(timer);
  }, [flipped, cards]);

  const finishGame = async () => {
    if (finishing.current) return;
    finishing.current = true;
    setFinished(true); setFlipped([]); setSaving(true);
    const score = matches;
    try {
      const { data } = await createClient().rpc("complete_brain_game", { p_game_key: "memory-tiles", p_score: score, p_total: totalPairs, p_combo: Math.max(0, totalPairs - moves + 1) });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setReward(row);
    } finally { setSaving(false); }
  };

  const start = () => { finishing.current = false; setCards(makeCards()); setFlipped([]); setMoves(0); setMatches(0); setTime(60); setReward(null); setFinished(false); setStarted(true); setMessage(""); };
  const flipCard = (id: number) => {
    if (!started || finished || flipped.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    setCards((current) => current.map((c) => c.id === id ? { ...c, flipped: true } : c));
    setFlipped((current) => [...current, id]); setMoves((m) => m + 1);
  };
  const Gate = ({ children }: { children: React.ReactNode }) => <MindSparkGate gameKey="memory-tiles" gameTitle="Memory Cards" onStarted={start}>{children}</MindSparkGate>;
  const displayStars = reward?.stars ?? (matches >= 6 ? 3 : matches >= 4 ? 2 : matches > 0 ? 1 : 0);

  return <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_8%_5%,#fff3a6,transparent_22%),radial-gradient(circle_at_92%_8%,#baf7ff,transparent_25%),linear-gradient(135deg,#effcff,#eef6ff_48%,#faf0ff)] px-2.5 py-2.5 text-[#12375d] sm:px-5 sm:py-4">
    <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between rounded-[22px] border-2 border-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-3 py-2 text-white shadow-lg sm:rounded-[26px] sm:px-5 sm:py-3">
        <Link href="/brain-games" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-black sm:px-3 sm:text-sm"><ArrowLeft size={15}/> Brain Games</Link>
        <div className="hidden items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black sm:flex"><Brain size={16}/> MEMORY LAB</div>
        <Link href="/dashboard" aria-label="Home" className="rounded-full bg-white/15 p-2"><Home size={18}/></Link>
      </header>

      <section className="mt-2.5 shrink-0 rounded-[25px] border-2 border-white bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-700 p-3.5 text-white shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black sm:text-xs"><Sparkles size={12}/> MEMORY • MATCH</div><h1 className="mt-1 text-2xl font-black sm:text-4xl">Memory Cards 🧠</h1><p className="mt-1 hidden text-xs font-bold text-white/85 sm:block sm:text-sm">Flip, remember, and match every equation with its answer.</p></div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
            <Stat icon={<Zap size={14}/>} value={`${time}s`} label="TIME" danger={time <= 10 && started}/><Stat icon={<Brain size={14}/>} value={`${matches}/${totalPairs}`} label="MATCH"/><Stat icon={<Trophy size={14}/>} value={String(moves)} label="MOVES"/>
          </div>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/20 sm:mt-4 sm:h-2.5"><div className="h-full rounded-full bg-yellow-300 transition-all duration-500" style={{width:`${progress}%`}}/></div>
      </section>

      {!started && !finished && <section className="mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[25px] border-2 border-white bg-white/95 p-4 text-center shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-8"><div className="w-full max-w-lg"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-cyan-100 text-4xl shadow-inner sm:h-20 sm:w-20 sm:text-5xl">🧠</div><div className="mt-2 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-600 sm:text-[10px]">Memory Challenge</div><h2 className="mt-2 text-2xl font-black sm:text-4xl">Ready to test your memory?</h2><p className="mx-auto mt-1.5 max-w-md text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">You have 60 seconds. Find every equation and its matching answer. Remember where each tile lives!</p><div className="mx-auto mt-3 grid max-w-sm grid-cols-3 gap-2"><Tip icon="👀" text="Remember"/><Tip icon="🧩" text="Match"/><Tip icon="⚡" text="Be quick"/></div><Gate><span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:scale-[1.02] sm:mt-5 sm:px-8 sm:py-4 sm:text-base"><Zap size={18} fill="currentColor"/> Start Game 🚀</span></Gate></div></section>}

      {started && !finished && <section className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[25px] border-2 border-white bg-white/90 p-2.5 shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-5">
        <div className="flex shrink-0 items-center justify-between"><div className="text-[10px] font-black uppercase tracking-widest text-cyan-600 sm:text-xs">Find the pairs</div><div className={`rounded-full px-2.5 py-1 text-[10px] font-black sm:px-3 sm:text-xs ${time <= 10 ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-500"}`}>⏱ {time}s left</div></div>
        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-[22px] bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-2 sm:mt-3 sm:p-4">
          <div className="mx-auto grid h-full max-w-3xl grid-cols-3 grid-rows-4 gap-1.5 sm:grid-cols-4 sm:grid-rows-3 sm:gap-3">{cards.map((card) => <button key={card.id} aria-label="memory tile" onClick={() => flipCard(card.id)} className={`relative min-h-0 overflow-hidden rounded-[16px] border-2 transition-all duration-200 [perspective:800px] sm:rounded-[20px] sm:border-4 ${card.matched ? "border-emerald-300 bg-emerald-100 shadow-[0_0_0_3px_rgba(110,231,183,.18)]" : card.flipped ? "scale-[1.03] border-cyan-300 bg-white shadow-xl" : "border-white bg-gradient-to-br from-blue-500 to-indigo-700 shadow-md hover:-translate-y-1 hover:shadow-xl active:scale-95"}`}><span className={`absolute inset-0 flex items-center justify-center p-1 text-center text-base font-black transition-all sm:p-2 sm:text-2xl ${card.matched ? "text-emerald-700" : "text-blue-700"}`}>{card.flipped || card.matched ? card.value : "?"}</span>{!card.flipped && !card.matched && <span className="absolute inset-0 flex items-center justify-center text-2xl text-white/90 sm:text-4xl">✦</span>}{card.matched && <CheckCircle2 className="absolute right-1 top-1 text-emerald-600 sm:right-2 sm:top-2" size={16}/>}</button>)}</div>
          {message && <div className="absolute left-1/2 top-2 -translate-x-1/2 animate-bounce rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-cyan-700 shadow-lg sm:top-4 sm:px-4 sm:py-2 sm:text-xs">{message}</div>}
        </div>
        <div className="mt-2 shrink-0 text-center text-[9px] font-black text-slate-400 sm:mt-3 sm:text-xs">💡 Equation <span className="text-cyan-600">↔</span> Answer • Fewer moves = better score</div>
      </section>}

      {finished && <section className="mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[25px] border-2 border-white bg-white/95 p-4 text-center shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-8"><div className="w-full max-w-lg"><div className="animate-bounce text-5xl sm:text-6xl">{matches === totalPairs ? "🏆" : "🧠"}</div><div className="mt-1 text-2xl font-black sm:text-4xl">{matches === totalPairs ? "Memory Master!" : "Time's Up!"}</div><p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{matches === totalPairs ? "You found every pair! Brilliant memory." : "Great effort! Can you beat your score next time?"}</p><div className="mt-3 text-xl tracking-wider sm:text-2xl">{"⭐".repeat(displayStars)}<span className="opacity-20">{"⭐".repeat(3-displayStars)}</span></div><div className="mx-auto mt-3 grid max-w-md grid-cols-3 gap-2 sm:mt-4 sm:gap-3"><Mini value={`${matches}/${totalPairs}`} label="MATCHES"/><Mini value={String(moves)} label="MOVES"/><Mini value={`${Math.round((matches/totalPairs)*100)}%`} label="ACCURACY"/></div>{saving ? <div className="mt-3 text-xs font-black text-slate-500">Saving your rewards…</div> : <div className="mt-3 flex flex-wrap justify-center gap-2"><Reward icon="✨" text={`+${reward?.xp ?? matches*10} XP`}/><Reward icon="🪙" text={`+${reward?.coins ?? matches*2} Coins`}/>{reward?.mind_sparks_rewarded != null && <Reward icon="✨" text={`+${reward.mind_sparks_rewarded} Mind Sparks`}/>}</div>}<div className="mt-4 flex flex-col justify-center gap-2 sm:mt-5 sm:flex-row"><Gate><span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg"><RotateCcw size={17}/> Play Again</span></Gate><Link href="/brain-games" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17}/> Brain Games</Link></div></div></section>}
      <Link href="/brain-games" className="mx-auto mt-1 flex shrink-0 items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-400 sm:mt-2 sm:text-xs"><ArrowLeft size={12}/> Brain Games</Link>
    </div>
  </main>;
}

function Stat({icon,value,label,danger=false}:{icon:React.ReactNode,value:string,label:string,danger?:boolean}){return <div className={`rounded-xl px-2 py-1 text-center sm:px-3 sm:py-1.5 ${danger?"bg-rose-500/30 animate-pulse":"bg-white/15"}`}><div className="flex items-center justify-center gap-1">{icon}<b className="text-xs sm:text-sm">{value}</b></div><span className="text-[7px] font-bold text-white/70 sm:text-[8px]">{label}</span></div>}
function Tip({icon,text}:{icon:string,text:string}){return <div className="rounded-2xl bg-slate-50 p-2"><div className="text-xl sm:text-2xl">{icon}</div><div className="text-[9px] font-black text-slate-500">{text}</div></div>}
function Mini({value,label}:{value:string,label:string}){return <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3"><b className="block text-lg text-cyan-700 sm:text-xl">{value}</b><span className="text-[8px] font-black text-slate-400 sm:text-[9px]">{label}</span></div>}
function Reward({icon,text}:{icon:string,text:string}){return <div className="rounded-full bg-yellow-50 px-3 py-1.5 text-[10px] font-black text-amber-700 sm:px-4 sm:py-2 sm:text-xs">{icon} {text}</div>}
