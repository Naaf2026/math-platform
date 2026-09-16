"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Check, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import MindSparkGate from "@/components/brain-games/MindSparkGate";

const TOTAL_ROUNDS = 8;

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeSequence(round: number) {
  const count = round >= 6 ? 5 : 4;
  const start = Math.floor(Math.random() * 35) + 5;
  const values = [start];
  for (let i = 1; i < count; i++) {
    const step = round <= 2 ? Math.floor(Math.random() * 7) + 2 : Math.floor(Math.random() * 11) + 2;
    values.push(values[i - 1] + step);
  }
  return shuffle(values);
}

export default function NumberOrderPage() {
  const [started, setStarted] = useState(false);
  const [nums, setNums] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none");
  const finishing = useRef(false);

  const start = () => {
    finishing.current = false;
    setStarted(true);
    setDone(false);
    setRound(1);
    setScore(0);
    setChosen([]);
    setNums(makeSequence(1));
    setResult(null);
    setFeedback("none");
  };

  const finish = async (finalScore: number) => {
    if (finishing.current) return;
    finishing.current = true;
    setDone(true);
    setSaving(true);
    try {
      const { data } = await (await import("@/lib/supabase/client")).createClient().rpc("complete_brain_game", {
        p_game_key: "number-sequence",
        p_score: finalScore,
        p_total: TOTAL_ROUNDS,
        p_combo: finalScore,
      });
      setResult(data?.[0] ?? null);
    } finally {
      setSaving(false);
    }
  };

  const pick = (n: number) => {
    if (chosen.includes(n) || done || feedback !== "none") return;

    const nextChosen = [...chosen, n];
    setChosen(nextChosen);

    if (nextChosen.length !== nums.length) return;

    const sorted = [...nums].sort((a, b) => a - b);
    const correct = nextChosen.every((value, index) => value === sorted[index]);
    const nextScore = score + (correct ? 1 : 0);
    setFeedback(correct ? "correct" : "wrong");

    if (round >= TOTAL_ROUNDS) {
      setTimeout(() => finish(nextScore), 700);
      return;
    }

    setTimeout(() => {
      setScore(nextScore);
      setRound((value) => value + 1);
      setChosen([]);
      setNums(makeSequence(round + 1));
      setFeedback("none");
    }, 700);
  };

  const Gate = ({ children }: { children: React.ReactNode }) => (
    <MindSparkGate gameKey="number-sequence" gameTitle="Number Sequence" onStarted={start}>
      {children}
    </MindSparkGate>
  );

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_8%_4%,#fff1a8,transparent_24%),radial-gradient(circle_at_94%_92%,#ffd7e8,transparent_25%),linear-gradient(135deg,#fffdf4,#effcff)] px-2.5 py-2.5 text-slate-800 sm:px-5 sm:py-4">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <Link href="/brain-games/flexibility" className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-2.5 py-1.5 text-xs font-black shadow-sm sm:px-3 sm:text-sm">
            <ArrowLeft size={15} /> Brain Twist
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-black text-slate-500 shadow-sm sm:flex sm:items-center sm:gap-1.5"><Sparkles size={12} /> 3 Mind Sparks</div>
            <Link href="/brain-games" className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-sm">Exit</Link>
          </div>
        </div>

        <section className="relative mt-2.5 shrink-0 overflow-hidden rounded-[26px] border-2 border-white bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-3.5 text-white shadow-xl sm:mt-4 sm:rounded-[30px] sm:p-5">
          <div className="pointer-events-none absolute -right-6 -top-10 text-[92px] opacity-15">🔢</div>
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">🔢</div>
            <div className="min-w-0 flex-1">
              <div className="text-[8px] font-black uppercase tracking-[.2em] text-white/75">BRAIN TWIST · NUMBER SEQUENCE</div>
              <h1 className="text-xl font-black sm:text-3xl">Number Sequence</h1>
              <p className="hidden text-xs font-bold text-white/85 sm:block">Put the numbers in the correct order. Think fast!</p>
            </div>
            <Brain className="hidden sm:block" size={28} />
          </div>
          <div className="relative mt-2.5 grid grid-cols-3 gap-1.5">
            <Stat value={`${round || 1}/${TOTAL_ROUNDS}`} label="ROUND" />
            <Stat value={`⭐ ${score}`} label="SCORE" />
            <Stat value={`+${score * 10}`} label="XP" />
          </div>
        </section>

        {!started && !done ? (
          <section className="mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[26px] bg-white/95 p-4 text-center shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-8">
            <div className="w-full max-w-lg">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-orange-100 to-yellow-50 text-6xl shadow-inner sm:h-32 sm:w-32 sm:text-7xl">🔢</div>
              <span className="mt-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-600">Mind Games · Brain Twist</span>
              <h2 className="mt-2 text-2xl font-black sm:text-4xl">Can you crack the sequence?</h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">Tap the numbers from <b>smallest → largest</b>. The challenge grows as you go!</p>

              <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2">
                <Tip icon="👀" title="Spot" text="Look closely" />
                <Tip icon="🧠" title="Think" text="Find the order" />
                <Tip icon="👆" title="Tap" text="Build it" />
              </div>

              <Gate>
                <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-7 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 sm:mt-5 sm:px-8 sm:py-4 sm:text-base">
                  Start Sequence 🚀
                </span>
              </Gate>
            </div>
          </section>
        ) : done ? (
          <section className="mt-2.5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[26px] bg-white/95 p-4 text-center shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-8">
            <div className="w-full max-w-lg">
              <div className="mx-auto flex h-20 w-20 animate-bounce items-center justify-center rounded-[26px] bg-gradient-to-br from-yellow-100 to-orange-100 text-5xl shadow-inner sm:h-24 sm:w-24 sm:text-6xl">🏆</div>
              <h2 className="mt-2 text-2xl font-black sm:text-4xl">Sequence Master!</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">You solved {score} of {TOTAL_ROUNDS} rounds correctly.</p>
              <div className="mt-2 text-xl">{score >= 7 ? "⭐⭐⭐" : score >= 4 ? "⭐⭐" : "⭐"}</div>

              {saving ? (
                <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                  <span className="animate-pulse">✨</span> Saving your rewards…
                </div>
              ) : (
                <div className="mx-auto mt-3 grid max-w-md grid-cols-3 gap-2">
                  <Mini i="⭐" v={result?.stars ?? Math.max(1, Math.ceil(score / 3))} t="STARS" />
                  <Mini i="✨" v={`+${result?.xp ?? score * 10}`} t="XP" />
                  <Mini i="🪙" v={`+${result?.coins ?? score * 2}`} t="COINS" />
                </div>
              )}

              <Gate>
                <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-7 py-3 text-sm font-black text-white shadow-lg">
                  <RotateCcw size={17} /> Play Again
                </span>
              </Gate>
            </div>
          </section>
        ) : (
          <section className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] bg-white/95 p-2.5 shadow-xl sm:mt-4 sm:rounded-[32px] sm:p-5">
            <div className="flex shrink-0 items-center justify-between">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-600 sm:px-3 sm:text-xs">ROUND {round} / {TOTAL_ROUNDS}</span>
              <span className="rounded-full bg-yellow-50 px-3 py-1 text-[10px] font-black text-amber-600">⭐ {score}</span>
            </div>
            <div className="mt-2 h-1.5 shrink-0 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-500" style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }} />
            </div>

            <div className={`relative mt-2 flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-[23px] p-3 text-center transition-all duration-300 sm:mt-4 sm:p-5 ${feedback === "correct" ? "bg-gradient-to-br from-emerald-50 to-cyan-50" : feedback === "wrong" ? "bg-gradient-to-br from-rose-50 to-orange-50" : "bg-gradient-to-br from-orange-50 via-yellow-50 to-rose-50"}`}>
              <div className="pointer-events-none absolute -right-5 -top-5 text-7xl opacity-[.08]">🧠</div>
              <div className="relative">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-orange-500 sm:text-xs">SMALLEST → LARGEST</div>
                <p className="mt-1 text-[10px] font-bold text-slate-400 sm:text-xs">Build the sequence one number at a time</p>

                <div className="mx-auto mt-3 flex min-h-14 max-w-xl flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:min-h-20 sm:gap-2">
                  {chosen.map((n, index) => (
                    <div key={`${n}-${index}`} className="relative flex h-12 w-12 animate-[bounce_0.25s_ease-out] items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white shadow-md sm:h-16 sm:w-16 sm:text-xl">
                      {n}
                      {index === chosen.length - 1 && <Check className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-0.5 text-white" size={16} />}
                    </div>
                  ))}
                  {chosen.length === 0 && <div className="rounded-2xl border-2 border-dashed border-orange-200 px-5 py-3 text-xs font-bold text-slate-300">Your order appears here</div>}
                </div>

                {feedback !== "none" && (
                  <div className={`mt-2 text-sm font-black sm:text-base ${feedback === "correct" ? "text-emerald-600" : "text-rose-600"}`}>
                    {feedback === "correct" ? "✨ Perfect order!" : "💥 Not quite — keep going!"}
                  </div>
                )}

                <div className={`mx-auto mt-3 grid w-full max-w-xl gap-2 sm:mt-5 sm:gap-3 ${nums.length === 5 ? "grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {nums.map((n) => {
                    const picked = chosen.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={picked || feedback !== "none"}
                        onClick={() => pick(n)}
                        className="group relative min-h-14 rounded-2xl border-2 border-white bg-white text-2xl font-black text-orange-600 shadow-md transition duration-150 hover:-translate-y-1 hover:shadow-lg active:scale-95 disabled:cursor-default disabled:opacity-25 sm:min-h-16 sm:text-3xl"
                      >
                        {n}
                        {!picked && feedback === "none" && <span className="absolute inset-x-0 bottom-1 text-[7px] font-black uppercase tracking-wider text-orange-200 opacity-0 transition group-hover:opacity-100">tap</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        <Link href="/brain-games/flexibility" className="mx-auto mt-1 flex shrink-0 items-center gap-1 px-3 py-1 text-[10px] font-bold text-slate-400 sm:mt-2 sm:text-xs">
          <ArrowLeft size={12} /> Back to Brain Twist
        </Link>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white/15 px-2 py-1.5 text-center"><b className="block text-sm sm:text-base">{value}</b><span className="text-[7px] font-bold text-white/70 sm:text-[8px]">{label}</span></div>;
}

function Tip({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="rounded-2xl bg-slate-50 p-2.5"><div className="text-xl">{icon}</div><div className="text-[9px] font-black text-slate-600">{title}</div><div className="text-[7px] font-semibold text-slate-400">{text}</div></div>;
}

function Mini({ i, v, t }: { i: string; v: any; t: string }) {
  return <div className="rounded-2xl bg-slate-50 p-2.5"><div>{i}</div><b className="block text-lg">{v}</b><span className="text-[8px] font-black text-slate-400">{t}</span></div>;
}
