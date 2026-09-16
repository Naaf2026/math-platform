"use client";

import Link from "next/link";
import { ArrowLeft, Brain, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

const ITEMS = [
  { id: "apple", emoji: "🍎", name: "Apple" },
  { id: "ball", emoji: "⚽", name: "Ball" },
  { id: "star", emoji: "⭐", name: "Star" },
  { id: "rocket", emoji: "🚀", name: "Rocket" },
  { id: "pencil", emoji: "✏️", name: "Pencil" },
  { id: "fish", emoji: "🐟", name: "Fish" },
  { id: "flower", emoji: "🌸", name: "Flower" },
  { id: "pizza", emoji: "🍕", name: "Pizza" },
  { id: "moon", emoji: "🌙", name: "Moon" },
  { id: "crown", emoji: "👑", name: "Crown" },
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeRound(round: number) {
  const count = Math.min(4 + Math.floor((round - 1) / 2), 7);
  return shuffle(ITEMS).slice(0, count);
}

export default function WhatsInsidePage() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [items, setItems] = useState(() => makeRound(1));
  const [showing, setShowing] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none");
  const finishing = useRef(false);

  const missing = useMemo(() => {
    const available = ITEMS.filter((item) => !items.some((inside) => inside.id === item.id));
    return available[Math.floor(Math.random() * available.length)];
  }, [items]);

  const choices = useMemo(() => shuffle([...items, missing]).slice(0, Math.min(5, items.length + 1)), [items, missing]);

  const begin = () => {
    finishing.current = false;
    setRound(1);
    setItems(makeRound(1));
    setShowing(true);
    setSelected(null);
    setScore(0);
    setFeedback("none");
    setDone(false);
    setResult(null);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || done || !showing) return;
    const timer = window.setTimeout(() => setShowing(false), Math.max(2200, items.length * 520));
    return () => window.clearTimeout(timer);
  }, [started, done, showing, items]);

  const finish = async (finalScore: number) => {
    if (finishing.current) return;
    finishing.current = true;
    setDone(true);
    setSaving(true);
    try {
      const { data } = await createClient().rpc("complete_brain_game", {
        p_game_key: "whats-inside",
        p_score: finalScore,
        p_total: 8,
        p_combo: finalScore,
      });
      setResult(data?.[0] ?? null);
    } finally {
      setSaving(false);
    }
  };

  const pick = (id: string) => {
    if (showing || done || feedback !== "none") return;
    setSelected(id);
    const correct = id === missing.id;
    if (!correct) {
      setFeedback("wrong");
      window.setTimeout(() => finish(score), 650);
      return;
    }

    const newScore = score + 1;
    setFeedback("correct");
    if (round >= 8) {
      window.setTimeout(() => finish(newScore), 700);
      return;
    }

    window.setTimeout(() => {
      setScore(newScore);
      setRound((r) => r + 1);
      setItems(makeRound(round + 1));
      setShowing(true);
      setSelected(null);
      setFeedback("none");
    }, 650);
  };

  const Gate = ({ children }: { children: React.ReactNode }) => (
    <MindSparkGate gameKey="whats-inside" gameTitle="What’s Inside?" onStarted={begin}>
      {children}
    </MindSparkGate>
  );

  const percentage = Math.round((score / 8) * 100);
  const stars = percentage >= 90 ? "⭐⭐⭐" : percentage >= 60 ? "⭐⭐" : "⭐";

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_10%_0%,#fff2c9,transparent_28%),radial-gradient(circle_at_90%_100%,#d9f7ff,transparent_30%),linear-gradient(135deg,#fffaf0,#f2f9ff)] px-2.5 py-2.5 text-slate-800 sm:px-4 sm:py-4">
      <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <Link href="/brain-games/memory" className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-black shadow-sm sm:px-3 sm:text-sm"><ArrowLeft size={15}/> Brain Boost</Link>
          <Link href="/brain-games" className="rounded-full bg-white/80 px-2.5 py-1.5 text-[11px] font-black text-slate-500 shadow-sm sm:px-3 sm:text-xs">Exit</Link>
        </div>

        <section className="mt-2.5 shrink-0 rounded-[22px] border-2 border-white bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 px-3.5 py-2.5 text-white shadow-lg sm:mt-4 sm:rounded-[28px] sm:px-5 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-sm sm:h-11 sm:w-11">📦</div>
            <div className="min-w-0 flex-1"><div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/75">BRAIN BOOST • MEMORY</div><h1 className="mt-0.5 truncate text-base font-black leading-tight sm:text-xl">What’s Inside?</h1><p className="mt-0.5 hidden text-[10px] font-semibold text-white/90 sm:block sm:text-xs">Remember what’s in the box, then find what disappeared.</p></div>
            <Brain className="hidden shrink-0 opacity-90 sm:block" size={26}/>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-2.5">
            <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black">{score}</div><div className="text-[8px] font-bold uppercase tracking-wide text-white/70">Score</div></div>
            <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black">{round}/8</div><div className="text-[8px] font-bold uppercase tracking-wide text-white/70">Round</div></div>
            <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black">+{score * 10}</div><div className="text-[8px] font-bold uppercase tracking-wide text-white/70">XP</div></div>
          </div>
        </section>

        {!started && !done ? (
          <div className="mt-2.5 min-h-0 flex-1 overflow-hidden sm:mt-4">
            <div className="flex h-full items-center justify-center overflow-hidden rounded-[24px] bg-white/95 p-4 text-center shadow-xl sm:rounded-[28px] sm:p-8">
              <div className="w-full max-w-lg">
                <div className="text-6xl sm:text-7xl">📦👀✨</div>
                <div className="mx-auto mt-2 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">Memory Challenge</div>
                <h2 className="mt-2 text-2xl font-black sm:text-4xl">Can you remember what’s inside?</h2>
                <p className="mx-auto mt-1.5 max-w-md text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">Watch the mystery box carefully. The box closes, one item disappears, and you must spot the missing item.</p>
                <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2 sm:mt-6"><Tip icon="👀" text="Watch"/><Tip icon="🧠" text="Remember"/><Tip icon="🔍" text="Find it"/></div>
                <Gate><span className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 px-7 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 sm:px-8 sm:text-base">Open the Mystery Box 🚀</span></Gate>
              </div>
            </div>
          </div>
        ) : done ? (
          <div className="mt-2.5 min-h-0 flex-1 overflow-hidden sm:mt-4">
            <div className="flex h-full items-center justify-center overflow-hidden rounded-[24px] bg-white/95 p-4 text-center shadow-xl sm:rounded-[28px] sm:p-8">
              <div className="w-full max-w-lg"><div className="animate-bounce text-5xl sm:text-6xl">📦🏆</div><div className="mt-2 text-2xl font-black sm:text-4xl">Box Memory Master!</div><div className="mt-1 text-3xl font-black text-orange-500 sm:text-5xl">{score}<span className="text-lg text-slate-400 sm:text-xl"> / 8</span></div><p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{percentage}% memory accuracy</p><div className="mt-2 text-xl tracking-wider sm:text-2xl">{stars}</div>{saving ? <p className="mt-4 text-sm font-bold">Saving your rewards…</p> : <><div className="mt-4 grid grid-cols-3 gap-2"><Mini icon="⭐" v={result?.stars ?? Math.max(1, Math.ceil(score / 3))} t="STARS"/><Mini icon="✨" v={`+${result?.xp ?? score * 10}`} t="XP"/><Mini icon="🪙" v={`+${result?.coins ?? score * 2}`} t="COINS"/></div>{result?.mind_sparks_rewarded != null && <div className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">✨ +{result.mind_sparks_rewarded} Mind Sparks</div>}</>}<Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3 text-sm font-black text-white shadow-lg"><RotateCcw size={16}/> Play Again</span></Gate></div>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 min-h-0 flex-1 overflow-hidden rounded-[24px] bg-white/95 p-2.5 shadow-xl sm:mt-4 sm:rounded-[28px] sm:p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-700 sm:px-3 sm:text-sm">ROUND {round} / 8</span>{feedback === "correct" && <span className="animate-bounce text-xs font-black text-emerald-500 sm:text-sm">✨ Great memory!</span>}{feedback === "wrong" && <span className="animate-pulse text-xs font-black text-rose-500 sm:text-sm">💥 Not quite!</span>}</div><div className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black text-yellow-700 sm:px-4 sm:py-2 sm:text-sm">⭐ {score}</div></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-3 sm:h-2"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 transition-all duration-500" style={{width:`${(round/8)*100}%`}}/></div>
            <div className={`mt-2 flex min-h-0 flex-1 flex-col justify-center rounded-[22px] p-3 text-center transition-all duration-300 sm:mt-4 sm:p-5 ${showing ? "bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50" : feedback === "wrong" ? "bg-gradient-to-br from-rose-50 to-slate-100" : "bg-gradient-to-br from-sky-50 to-violet-50"}`}>
              <div className="text-[10px] font-black tracking-[0.22em] text-orange-500 sm:text-xs">{showing ? "LOOK INSIDE!" : "WHAT DISAPPEARED?"}</div><div className="mt-1 text-xs font-bold text-slate-400 sm:text-sm">{showing ? "Memorize everything in the box" : "Pick the item that was inside"}</div>
              <div className="relative mx-auto mt-3 w-full max-w-xl rounded-[30px] border-4 border-amber-700/20 bg-gradient-to-b from-amber-100 to-orange-100 p-3 shadow-inner sm:mt-5 sm:p-5">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-[9px] font-black text-white shadow-md">MYSTERY BOX</div>
                {showing ? <div className="grid grid-cols-4 gap-2 sm:gap-3">{items.map((item) => <div key={item.id} className="flex aspect-square items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-md sm:text-5xl">{item.emoji}</div>)}</div> : <div className="flex min-h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-orange-800 text-6xl shadow-inner sm:min-h-36 sm:text-7xl">📦</div>}
              </div>
              {!showing && <div className="mt-3 grid grid-cols-2 gap-2 sm:mx-auto sm:mt-5 sm:max-w-xl sm:grid-cols-5">{choices.map((item) => {const active=selected===item.id; return <button key={item.id} onClick={()=>pick(item.id)} className={`flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 bg-white px-2 py-2 text-3xl shadow-sm transition duration-150 hover:-translate-y-1 active:scale-95 sm:min-h-24 ${active && item.id===missing.id ? "border-emerald-400 bg-emerald-50" : active ? "border-rose-400 bg-rose-50" : "border-slate-100 hover:border-orange-200"}`}><span>{item.emoji}</span><span className="mt-1 text-[9px] font-black text-slate-500">{item.name}</span></button>})}</div>}
              {showing && <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-orange-400 sm:mt-4">Look carefully • Remember • Find</div>}
            </div>
          </div>
        )}
        <Link href="/brain-games/memory" className="mx-auto mt-1.5 flex shrink-0 items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-400 sm:mt-3 sm:text-sm"><ArrowLeft size={12}/> Brain Boost</Link>
      </div>
    </main>
  );
}

function Tip({icon,text}:{icon:string;text:string}){return <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3"><div className="text-xl sm:text-2xl">{icon}</div><div className="mt-0.5 text-[9px] font-black text-slate-500 sm:text-[10px]">{text}</div></div>}
function Mini({icon,v,t}:{icon:string;v:any;t:string}){return <div className="rounded-2xl bg-slate-50 p-2.5"><div className="text-lg">{icon}</div><div className="text-base font-black text-slate-800">{v}</div><div className="text-[8px] font-black text-slate-400">{t}</div></div>}
