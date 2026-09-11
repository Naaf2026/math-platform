"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Crown, Flame, Heart, RotateCcw, Sparkles, Trophy, XCircle, Zap } from "lucide-react";

const TOTAL_CHALLENGES = 10;
const MAX_LIVES = 3;

type AnswerDetail = { correct?: boolean; questionId?: string; points?: number; difficulty?: string; hintUsed?: boolean };

type Result = { score: number; correct: number; answered: number; lives: number; combo: number; perfect: boolean; timedOut: boolean };

export default function MissionCompletionSystem() {
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<Result>({ score: 0, correct: 0, answered: 0, lives: MAX_LIVES, combo: 0, perfect: true, timedOut: false });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/mission")) return;
    setStarted(true);

    const onAnswer = (event: Event) => {
      const d = (event as CustomEvent<AnswerDetail>).detail || {};
      setResult(prev => {
        const correct = Boolean(d.correct);
        const combo = correct ? prev.combo + 1 : 0;
        const multiplier = Math.min(3, 1 + Math.floor(combo / 2) * 0.5);
        const bossMultiplier = String(d.difficulty || "").toLowerCase() === "hard" ? 1.5 : 1;
        const hintMultiplier = d.hintUsed ? 0.5 : 1;
        const base = Math.max(0, Number(d.points || 0));
        const earned = correct ? Math.round(base * multiplier * bossMultiplier * hintMultiplier) : 0;
        const lives = correct ? prev.lives : Math.max(0, prev.lives - 1);
        return {
          score: prev.score + earned,
          correct: prev.correct + (correct ? 1 : 0),
          answered: prev.answered + 1,
          lives,
          combo,
          perfect: prev.perfect && correct && !d.hintUsed,
          timedOut: prev.timedOut,
        };
      });
    };

    const onTimeout = () => setResult(prev => ({ ...prev, timedOut: true, perfect: false }));
    const onLives = () => setVisible(true);
    const onComplete = () => setVisible(true);
    const onRestart = () => {
      setResult({ score: 0, correct: 0, answered: 0, lives: MAX_LIVES, combo: 0, perfect: true, timedOut: false });
      setVisible(false);
    };

    window.addEventListener("fv:answer-result", onAnswer);
    window.addEventListener("fv:mission-timeout", onTimeout);
    window.addEventListener("fv:mission-lives-depleted", onLives);
    window.addEventListener("fv:mission-complete", onComplete);
    window.addEventListener("fv:mission-restart", onRestart);

    return () => {
      window.removeEventListener("fv:answer-result", onAnswer);
      window.removeEventListener("fv:mission-timeout", onTimeout);
      window.removeEventListener("fv:mission-lives-depleted", onLives);
      window.removeEventListener("fv:mission-complete", onComplete);
      window.removeEventListener("fv:mission-restart", onRestart);
    };
  }, []);

  useEffect(() => {
    if (result.lives === 0 || result.answered >= TOTAL_CHALLENGES) setVisible(true);
  }, [result.lives, result.answered]);

  const accuracy = useMemo(() => result.answered ? Math.round((result.correct / result.answered) * 100) : 0, [result.correct, result.answered]);
  if (!started || !visible) return null;

  const outOfLives = result.lives === 0 && result.answered < TOTAL_CHALLENGES;
  const complete = !outOfLives && result.answered >= TOTAL_CHALLENGES;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-[2.25rem] bg-white shadow-2xl ring-1 ring-white/30">
        <div className={`relative overflow-hidden p-7 text-white sm:p-9 ${outOfLives ? "bg-gradient-to-br from-rose-600 via-pink-600 to-orange-500" : "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600"}`}>
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
              {outOfLives ? <Heart size={34} fill="currentColor" /> : <Trophy size={36} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-white/70">Mission result</p>
              <h2 className="mt-1 text-3xl font-black">{outOfLives ? "Keep practising!" : "Mission complete!"}</h2>
            </div>
          </div>
          <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Score" value={`${result.score}`} icon={<Zap size={15} />} />
            <Stat label="Correct" value={`${result.correct}/${result.answered}`} icon={<CheckCircle2 size={15} />} />
            <Stat label="Accuracy" value={`${accuracy}%`} icon={<TargetIcon />} />
            <Stat label="Lives" value={`${result.lives}/${MAX_LIVES}`} icon={<Heart size={15} />} />
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 p-4 text-center"><Flame className="mx-auto text-orange-500" size={22}/><p className="mt-1 text-2xl font-black text-[#15233f]">{result.combo}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Final combo</p></div>
            <div className="rounded-2xl bg-violet-50 p-4 text-center"><Crown className="mx-auto text-violet-500" size={22}/><p className="mt-1 text-2xl font-black text-[#15233f]">{result.perfect && complete ? "YES" : "—"}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Perfect run</p></div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-center"><Sparkles className="mx-auto text-emerald-500" size={22}/><p className="mt-1 text-2xl font-black text-[#15233f]">{result.timedOut ? "Time" : "Ready"}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bonus status</p></div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
            {outOfLives ? "All three lives were used. Your saved learning progress is kept. Start a fresh adventure when you're ready." : "Your Mission score is calculated from the submitted answer results, combo multiplier, difficulty and hint usage."}
          </div>
          <button onClick={() => window.location.reload()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15233f] px-6 py-4 font-black text-white shadow-lg"><RotateCcw size={18}/> {outOfLives ? "Start Fresh Adventure" : "Play Again"}</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/15"><div className="flex items-center justify-center gap-1 text-white/70">{icon}<span className="text-[9px] font-black uppercase tracking-wider">{label}</span></div><p className="mt-1 text-xl font-black">{value}</p></div>;
}
function TargetIcon(){ return <span className="text-base">🎯</span>; }
