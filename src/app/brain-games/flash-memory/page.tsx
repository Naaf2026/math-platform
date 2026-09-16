"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Home, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

const TOTAL_ROUNDS = 8;

function makeSequence(round: number) {
  const length = Math.min(3 + Math.floor((round - 1) / 2), 7);
  const result: number[] = [];
  while (result.length < length) {
    const n = Math.floor(Math.random() * 9) + 1;
    if (result.length === 0 || result[result.length - 1] !== n) result.push(n);
  }
  return result;
}

export default function FlashMemoryPage() {
  const [started, setStarted] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [show, setShow] = useState(true);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [feedback, setFeedback] = useState<"none" | "nice" | "wrong">("none");
  const finishing = useRef(false);

  const begin = () => {
    finishing.current = false;
    setRound(1);
    setSequence(makeSequence(1));
    setInput([]);
    setScore(0);
    setShow(true);
    setStarted(true);
    setDone(false);
    setResult(null);
    setFeedback("none");
  };

  useEffect(() => {
    if (!started || done || !show) return;
    const delay = Math.max(1500, sequence.length * 650);
    const id = window.setTimeout(() => setShow(false), delay);
    return () => window.clearTimeout(id);
  }, [started, done, show, sequence]);

  const finish = async (finalScore: number) => {
    if (finishing.current) return;
    finishing.current = true;
    setDone(true);
    setSaving(true);
    try {
      const { data } = await createClient().rpc("complete_brain_game", {
        p_game_key: "memory-master",
        p_score: finalScore,
        p_total: TOTAL_ROUNDS,
        p_combo: finalScore,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setResult(row);
    } finally {
      setSaving(false);
    }
  };

  const pick = (n: number) => {
    if (!started || done || show || feedback !== "none") return;
    const index = input.length;
    const next = [...input, n];
    setInput(next);

    if (n !== sequence[index]) {
      setFeedback("wrong");
      window.setTimeout(() => finish(score), 450);
      return;
    }

    if (next.length === sequence.length) {
      const newScore = score + 1;
      setFeedback("nice");
      if (round === TOTAL_ROUNDS) {
        window.setTimeout(() => finish(newScore), 500);
        return;
      }
      window.setTimeout(() => {
        const nextRound = round + 1;
        setRound(nextRound);
        setScore(newScore);
        setSequence(makeSequence(nextRound));
        setInput([]);
        setFeedback("none");
        setShow(true);
      }, 550);
    }
  };

  const Gate = ({ children }: { children: React.ReactNode }) => (
    <MindSparkGate gameKey="memory-master" gameTitle="Memory Master" onStarted={begin}>
      {children}
    </MindSparkGate>
  );

  const percent = Math.round((score / TOTAL_ROUNDS) * 100);
  const stars = percent >= 90 ? 3 : percent >= 70 ? 2 : score > 0 ? 1 : 0;

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_8%_5%,#fff4a8,transparent_24%),radial-gradient(circle_at_92%_12%,#bdf7ff,transparent_28%),linear-gradient(135deg,#eefcff,#f2f3ff_50%,#fff1fa)] px-2.5 py-2.5 text-slate-800 sm:px-5 sm:py-4">
      <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between rounded-[20px] border-2 border-white bg-white/85 px-2.5 py-2 shadow-md backdrop-blur sm:rounded-[24px] sm:px-4 sm:py-2.5">
          <Link href="/brain-games/memory" className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-700 sm:text-sm"><ArrowLeft size={15}/> Brain Boost</Link>
          <div className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 sm:flex"><Brain size={14}/> MEMORY MASTER</div>
          <Link href="/dashboard" aria-label="Home" className="rounded-full bg-slate-100 p-2 text-slate-500"><Home size={17}/></Link>
        </header>

        <section className="mt-2.5 shrink-0 rounded-[24px] border-2 border-white bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-3.5 text-white shadow-xl sm:mt-4 sm:rounded-[30px] sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-white/15 text-3xl shadow-inner">🧠</div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">FLASH MEMORY</div>
              <h1 className="mt-0.5 text-2xl font-black leading-none sm:text-3xl">Memory Master</h1>
              <p className="mt-1 hidden text-xs font-semibold text-white/80 sm:block">Watch the sequence. Remember every number. Beat your best.</p>
            </div>
            <Sparkles className="hidden sm:block" size={27}/>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2.5">
            <Stat value={String(score)} label="SCORE" />
            <Stat value={`${round}/${TOTAL_ROUNDS}`} label="ROUND" />
            <Stat value={`${Math.min(3 + Math.floor((round - 1) / 2), 7)}`} label="DIGITS" />
          </div>
        </section>

        {!started && !done && (
          <section className="mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[26px] border-2 border-white bg-white/95 p-4 text-center shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-8">
            <div className="w-full max-w-lg">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-indigo-100 to-cyan-100 text-5xl shadow-inner sm:h-24 sm:w-24 sm:text-6xl">👀</div>
              <div className="mx-auto mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 sm:text-[10px]">Brain Boost • Memory</div>
              <h2 className="mt-2 text-2xl font-black sm:text-4xl">Can you remember the flash?</h2>
              <p className="mx-auto mt-2 max-w-md text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">A number sequence appears for a moment. Then it disappears. Tap the numbers back in exactly the same order.</p>
              <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2">
                <Tip icon="👀" text="Watch"/><Tip icon="🧠" text="Remember"/><Tip icon="⚡" text="React"/>
              </div>
              <Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 sm:px-9 sm:text-base"><Zap size={18} fill="currentColor"/> Start Memory Master</span></Gate>
            </div>
          </section>
        )}

        {started && !done && (
          <section className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border-2 border-white bg-white/95 p-2.5 shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-4">
            <div className="flex shrink-0 items-center justify-between">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black text-indigo-600 sm:text-xs">ROUND {round} / {TOTAL_ROUNDS}</span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black sm:text-xs ${show ? "bg-amber-100 text-amber-700" : feedback === "wrong" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>{show ? "👀 MEMORIZE" : feedback === "wrong" ? "💥 TRY AGAIN" : "👆 YOUR TURN"}</span>
            </div>
            <div className="mt-2 h-2 shrink-0 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" style={{width:`${(round/TOTAL_ROUNDS)*100}%`}}/></div>

            <div className={`mt-2 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px] p-3 text-center sm:mt-3 sm:p-5 ${show ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950" : feedback === "wrong" ? "bg-gradient-to-br from-rose-950 via-slate-950 to-indigo-950" : "bg-gradient-to-br from-indigo-950 via-blue-950 to-cyan-950"}`}>
              <div className="text-[9px] font-black tracking-[0.25em] text-cyan-300 sm:text-xs">{show ? "LOCK IT IN" : "REPEAT THE SEQUENCE"}</div>
              <p className="mt-1 text-[10px] font-semibold text-white/45 sm:text-xs">{show ? "Remember left → right" : "Tap each number in order"}</p>
              <div className="mt-3 flex min-h-20 max-w-full flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:min-h-24 sm:gap-2.5">
                {show ? sequence.map((n, i) => <div key={`${round}-${i}`} className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-3xl font-black text-indigo-600 shadow-[0_8px_25px_rgba(0,0,0,.25)] sm:h-16 sm:w-16 sm:text-4xl">{n}</div>) : input.map((n, i) => <div key={`${round}-${i}`} className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-cyan-400 text-xl font-black text-white shadow-lg sm:h-14 sm:w-14 sm:text-2xl">{n}</div>)}
                {!show && input.length === 0 && <span className="text-xs font-bold text-white/35">Choose your first number below</span>}
              </div>
              {feedback === "nice" && <div className="mt-3 animate-bounce text-sm font-black text-emerald-300">✨ Perfect!</div>}
              {feedback === "wrong" && <div className="mt-3 animate-pulse text-sm font-black text-rose-300">The sequence changed — keep practicing!</div>}
            </div>

            <div className="mt-2.5 grid shrink-0 grid-cols-3 gap-1.5 sm:mt-3 sm:grid-cols-5 sm:gap-2.5">
              {[1,2,3,4,5,6,7,8,9].map((n) => <button key={n} onClick={() => pick(n)} disabled={show || feedback !== "none"} className="min-h-12 rounded-2xl border-2 border-slate-100 bg-slate-50 text-xl font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 active:scale-95 disabled:opacity-50 sm:min-h-14 sm:text-2xl">{n}</button>)}
            </div>
          </section>
        )}

        {done && <section className="mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[26px] border-2 border-white bg-white/95 p-4 text-center shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-8">
          <div className="w-full max-w-lg">
            <div className="animate-bounce text-5xl sm:text-6xl">{score === TOTAL_ROUNDS ? "🏆" : "🧠"}</div>
            <div className="mt-2 text-2xl font-black sm:text-4xl">{score === TOTAL_ROUNDS ? "Memory Master!" : "Great Brain Workout!"}</div>
            <div className="mt-1 text-4xl font-black text-indigo-600 sm:text-5xl">{score}<span className="text-lg text-slate-400"> / {TOTAL_ROUNDS}</span></div>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{percent}% memory accuracy</p>
            <div className="mt-2 text-2xl">{"⭐".repeat(stars)}<span className="opacity-15">{"⭐".repeat(3-stars)}</span></div>
            {saving ? <p className="mt-4 text-xs font-bold text-slate-500">Saving your rewards…</p> : <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2"><Mini icon="⭐" value={result?.stars ?? stars} label="STARS"/><Mini icon="⚡" value={`+${result?.xp ?? score * 10}`} label="XP"/><Mini icon="🪙" value={`+${result?.coins ?? score * 2}`} label="COINS"/></div>}
            {!saving && result?.mind_sparks_rewarded != null && <div className="mx-auto mt-2 max-w-md rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">✨ +{result.mind_sparks_rewarded} Mind Sparks</div>}
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Gate><span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-7 py-3 text-sm font-black text-white shadow-lg"><RotateCcw size={17}/> Play Again</span></Gate><Link href="/brain-games/memory" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-7 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17}/> Brain Boost</Link></div>
          </div>
        </section>}

        <Link href="/brain-games/memory" className="mx-auto mt-1.5 flex shrink-0 items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-400 sm:mt-2 sm:text-xs"><ArrowLeft size={12}/> Brain Boost</Link>
      </div>
    </main>
  );
}

function Stat({value,label}:{value:string;label:string}){return <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black sm:text-base">{value}</div><div className="text-[7px] font-bold tracking-widest text-white/65 sm:text-[8px]">{label}</div></div>}
function Tip({icon,text}:{icon:string;text:string}){return <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3"><div className="text-xl sm:text-2xl">{icon}</div><div className="mt-0.5 text-[9px] font-black text-slate-500 sm:text-[10px]">{text}</div></div>}
function Mini({icon,value,label}:{icon:string;value:string|number;label:string}){return <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3"><div className="text-base sm:text-lg">{icon}</div><div className="text-sm font-black text-slate-800 sm:text-base">{value}</div><div className="text-[7px] font-bold tracking-wider text-slate-400 sm:text-[8px]">{label}</div></div>}
