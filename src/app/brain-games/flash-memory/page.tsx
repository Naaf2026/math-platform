"use client";

import Link from "next/link";
import { ArrowLeft, Brain, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

function makeSequence(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
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
    const s = makeSequence(3);
    finishing.current = false;
    setSequence(s);
    setInput([]);
    setShow(true);
    setStarted(true);
    setRound(1);
    setScore(0);
    setDone(false);
    setResult(null);
    setFeedback("none");
  };

  useEffect(() => {
    if (!show || !started || done) return;
    const id = setTimeout(() => setShow(false), Math.max(1200, sequence.length * 620));
    return () => clearTimeout(id);
  }, [show, started, done, sequence]);

  const finish = async (finalScore: number, total: number) => {
    if (finishing.current) return;
    finishing.current = true;
    setDone(true);
    setSaving(true);
    try {
      const { data } = await createClient().rpc("complete_brain_game", {
        p_game_key: "brain-flash-memory",
        p_score: finalScore,
        p_total: total,
        p_combo: finalScore,
      });
      setResult(data?.[0] ?? null);
    } finally {
      setSaving(false);
    }
  };

  const pick = (n: number) => {
    if (show || done || feedback !== "none") return;
    const index = input.length;
    const next = [...input, n];
    setInput(next);

    if (n !== sequence[index]) {
      setFeedback("wrong");
      setTimeout(() => finish(score, round), 500);
      return;
    }

    if (next.length === sequence.length) {
      const newScore = score + 1;
      setFeedback("nice");
      if (round >= 8) {
        setTimeout(() => finish(newScore, 8), 550);
        return;
      }
      setTimeout(() => {
        setScore(newScore);
        setRound((r) => r + 1);
        setSequence(makeSequence(Math.min(3 + Math.floor(round / 2), 7)));
        setInput([]);
        setFeedback("none");
        setShow(true);
      }, 550);
    }
  };

  const Gate = ({ children }: { children: React.ReactNode }) => (
    <MindSparkGate
      gameKey="brain-flash-memory"
      gameTitle="Memory Master"
      onStarted={begin}
    >
      {children}
    </MindSparkGate>
  );

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_15%_0%,#d8fbff,transparent_28%),radial-gradient(circle_at_90%_100%,#f0ddff,transparent_30%),linear-gradient(135deg,#f4fbff,#f8f4ff)] px-2.5 py-2.5 text-slate-800 sm:px-4 sm:py-4">
      <div className="mx-auto flex h-full max-w-4xl flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <Link href="/brain-games" className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-black shadow-sm sm:px-3 sm:text-sm">
            <ArrowLeft size={15} /> Brain Arena
          </Link>
          <Link href="/brain-games" className="rounded-full bg-white/80 px-2.5 py-1.5 text-[11px] font-black text-slate-500 shadow-sm sm:px-3 sm:text-xs">Exit</Link>
        </div>

        <section className="mt-2.5 shrink-0 rounded-[22px] border-2 border-white bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 px-3.5 py-2.5 text-white shadow-lg sm:mt-4 sm:rounded-[28px] sm:px-5 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl shadow-sm sm:h-11 sm:w-11 sm:text-2xl">🧠</div>
            <div className="min-w-0 flex-1">
              <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/75">MEMORY MASTER</div>
              <h1 className="mt-0.5 truncate text-base font-black leading-tight sm:text-xl">Memory</h1>
              <p className="mt-0.5 hidden truncate text-[10px] font-semibold text-white/90 sm:block sm:text-xs">Train your memory by remembering numbers, equations and patterns.</p>
            </div>
            <Brain className="hidden shrink-0 opacity-90 sm:block" size={26} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-2.5">
            <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black">{score}</div><div className="text-[8px] font-bold uppercase tracking-wide text-white/70">Score</div></div>
            <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black">{round}/8</div><div className="text-[8px] font-bold uppercase tracking-wide text-white/70">Round</div></div>
            <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><div className="text-sm font-black">+{score * 10}</div><div className="text-[8px] font-bold uppercase tracking-wide text-white/70">XP</div></div>
          </div>
        </section>

        {!started && !done ? (
          <div className="mt-2.5 min-h-0 flex-1 overflow-hidden sm:mt-4"><Intro Gate={Gate} /></div>
        ) : done ? (
          <div className="mt-2.5 min-h-0 flex-1 overflow-hidden sm:mt-4"><Result score={score} result={result} saving={saving} Gate={Gate} /></div>
        ) : (
          <div className="mt-2.5 min-h-0 flex-1 overflow-hidden rounded-[24px] bg-white/95 p-2.5 shadow-xl sm:mt-4 sm:rounded-[28px] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-700 sm:px-3 sm:text-sm">ROUND {round} / 8</span>
                {feedback === "nice" && <span className="animate-bounce text-xs font-black text-emerald-500 sm:text-sm">✨ Nice!</span>}
                {feedback === "wrong" && <span className="animate-pulse text-xs font-black text-rose-500 sm:text-sm">💥 Not quite!</span>}
              </div>
              <div className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black text-yellow-700 sm:px-4 sm:py-2 sm:text-sm">⭐ {score}</div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-3 sm:h-2">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all duration-500" style={{ width: `${(round / 8) * 100}%` }} />
            </div>

            <div className={`mt-2 flex min-h-0 flex-1 flex-col justify-center rounded-[22px] p-3 text-center transition-all duration-300 sm:mt-4 sm:p-5 ${show ? "bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900" : feedback === "wrong" ? "bg-gradient-to-br from-rose-950 to-slate-900" : "bg-gradient-to-br from-blue-950 to-indigo-950"}`}>
              <div className="text-[10px] font-black tracking-[0.22em] text-cyan-300 sm:text-xs">{show ? "MEMORIZE!" : "YOUR TURN"}</div>
              <div className="mt-1 text-xs font-bold text-white/60 sm:text-sm">{show ? "Lock the numbers into your mind" : `${input.length} of ${sequence.length} numbers`}</div>

              <div className="mt-3 flex min-h-20 flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:min-h-24 sm:gap-3">
                {show ? sequence.map((n, i) => (
                  <div key={`${round}-${i}`} className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-white text-3xl font-black text-blue-600 shadow-xl sm:h-16 sm:w-16 sm:text-4xl">{n}</div>
                )) : input.map((n, i) => (
                  <div key={`${round}-input-${i}`} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-white shadow-lg transition-transform animate-[bounce_0.25s_ease-out] sm:h-14 sm:w-14 sm:text-2xl">{n}</div>
                ))}
                {!show && input.length === 0 && <div className="text-sm font-bold text-white/35">Tap a number below</div>}
              </div>

              {!show && (
                <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/40 sm:mt-4 sm:text-xs">Remember • Match • Master</div>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:mt-4 sm:grid-cols-5 sm:gap-2.5">
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <button key={n} onClick={() => pick(n)} disabled={show || feedback !== "none"} className="min-h-11 rounded-2xl border-2 border-slate-100 bg-slate-50 text-xl font-black shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 active:scale-95 disabled:cursor-default disabled:opacity-60 sm:min-h-12 sm:text-2xl">{n}</button>
              ))}
            </div>
          </div>
        )}

        <Link href="/brain-games" className="mx-auto mt-1.5 flex shrink-0 items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-400 sm:mt-3 sm:text-sm"><ArrowLeft size={12}/> Brain Arena</Link>
      </div>
    </main>
  );
}

function Intro({ Gate }: { Gate: React.ComponentType<{ children: React.ReactNode }> }) {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden rounded-[24px] bg-white/95 p-4 text-center shadow-xl sm:rounded-[28px] sm:p-8">
      <div className="w-full max-w-lg">
        <div className="text-5xl sm:text-7xl">👀🔢✨</div>
        <div className="mx-auto mt-2 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-600">Memory Challenge</div>
        <h2 className="mt-2 text-2xl font-black sm:text-4xl">Can your memory keep up?</h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">Watch the numbers. Remember the order. Tap them back correctly to build your streak.</p>
        <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2 sm:mt-6">
          <Tip icon="👀" text="Watch" /><Tip icon="🧠" text="Remember" /><Tip icon="👆" text="Match" />
        </div>
        <Gate><span className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 px-7 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 sm:px-8 sm:text-base">Start Memory Game 🚀</span></Gate>
      </div>
    </div>
  );
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3"><div className="text-xl sm:text-2xl">{icon}</div><div className="mt-0.5 text-[9px] font-black text-slate-500 sm:text-[10px]">{text}</div></div>;
}

function Result({ score, result, saving, Gate }: { score: number; result: any; saving: boolean; Gate: React.ComponentType<{ children: React.ReactNode }> }) {
  const percentage = Math.round((score / 8) * 100);
  const stars = percentage >= 90 ? "⭐⭐⭐" : percentage >= 60 ? "⭐⭐" : "⭐";
  return (
    <div className="flex h-full items-center justify-center overflow-hidden rounded-[24px] bg-white/95 p-4 text-center shadow-xl sm:rounded-[28px] sm:p-8">
      <div className="w-full max-w-lg">
        <div className="animate-bounce text-5xl sm:text-6xl">🧠🏆</div>
        <div className="mt-2 text-2xl font-black sm:text-4xl">Memory Master!</div>
        <div className="mt-1 text-3xl font-black text-cyan-600 sm:text-5xl">{score}<span className="text-lg text-slate-400 sm:text-xl"> / 8</span></div>
        <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{percentage}% memory accuracy</p>
        <div className="mt-2 text-xl tracking-wider sm:text-2xl">{stars}</div>
        {saving ? <p className="mt-4 text-sm font-bold">Saving your rewards…</p> : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Mini icon="⭐" v={result?.stars ?? Math.max(1, Math.ceil(score / 3))} t="STARS" />
              <Mini icon="✨" v={`+${result?.xp ?? score * 10}`} t="XP" />
              <Mini icon="🪙" v={`+${result?.coins ?? score * 2}`} t="COINS" />
            </div>
            {result?.mind_sparks_rewarded != null && <div className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">✨ +{result.mind_sparks_rewarded} Mind Sparks</div>}
          </>
        )}
        <Gate><span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 px-7 py-3 text-sm font-black text-white shadow-lg"><RotateCcw size={17}/> Play Again</span></Gate>
      </div>
    </div>
  );
}

function Mini({ icon, v, t }: { icon: string; v: any; t: string }) {
  return <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3"><div>{icon}</div><b className="block text-lg sm:text-xl">{v}</b><span className="text-[8px] font-black text-slate-400 sm:text-[9px]">{t}</span></div>;
}
