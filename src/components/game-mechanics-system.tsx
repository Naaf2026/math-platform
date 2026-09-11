"use client";

import { useEffect, useState } from "react";
import { Clock3, Crown, Flame, Gift, Heart, RotateCcw, Sparkles } from "lucide-react";

const DEFAULT_SECONDS = 45;
const MAX_LIVES = 3;

export default function GameMechanicsSystem() {
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [boss, setBoss] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [perfect, setPerfect] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [retryReady, setRetryReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/mission")) return;
    const root = document.body;
    const readState = () => {
      const text = root.innerText || "";
      const question = (text.match(/Math Adventure · ([^\n]+)/)?.[1] || "").trim();
      if (question && question !== lastQuestion) {
        setLastQuestion(question);
        setSeconds(DEFAULT_SECONDS);
        setTimedOut(false);
        setHintUsed(false);
        setRetryReady(false);
      }
      setBoss(/\bBOSS\b/i.test(text.slice(0, 5000)));
      setHintUsed(v => v || /Helpful hint/i.test(text));
      const finish = /Math Champion!|Adventure complete/i.test(text);
      if (finish) {
        const match = text.match(/(\d+)\/(\d+)\s*Correct/i);
        const allCorrect = match ? match[1] === match[2] : /10\/10/.test(text);
        setPerfect(allCorrect && !hintUsed && !timedOut && retryCount === 0 && lives === MAX_LIVES);
      }
    };
    const onAnswer = (event: Event) => {
      const detail = (event as CustomEvent<{ correct?: boolean }>) .detail;
      if (detail?.correct) {
        setCombo(v => {
          const next = v + 1;
          setMultiplier(Math.min(3, 1 + Math.floor(next / 2) * 0.5));
          return next;
        });
        setRetryReady(false);
      } else {
        setCombo(0);
        setMultiplier(1);
        setRetryReady(true);
        setLives(v => {
          const next = Math.max(0, v - 1);
          if (next === 0) window.dispatchEvent(new CustomEvent("fv:mission-lives-depleted"));
          return next;
        });
      }
    };
    const observer = new MutationObserver(readState);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    window.addEventListener("fv:answer-result", onAnswer);
    readState();
    return () => {
      observer.disconnect();
      window.removeEventListener("fv:answer-result", onAnswer);
    };
  }, [lastQuestion, hintUsed, timedOut, retryCount, lives]);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/mission")) return;
    if (seconds <= 0) {
      setTimedOut(true);
      return;
    }
    const id = window.setInterval(() => setSeconds(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  useEffect(() => {
    const onRetry = () => {
      setRetryCount(v => v + 1);
      setRetryReady(false);
      setHintUsed(false);
      setTimedOut(false);
      setSeconds(DEFAULT_SECONDS);
      setCombo(0);
      setMultiplier(1);
      setPerfect(false);
    };
    window.addEventListener("fv:retry-question", onRetry);
    return () => window.removeEventListener("fv:retry-question", onRetry);
  }, []);

  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/mission")) return null;
  const progress = Math.max(0, Math.min(100, (seconds / DEFAULT_SECONDS) * 100));

  return <>
    <div className="fixed left-1/2 top-20 z-[70] flex max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 px-2 sm:top-24">
      <div className={`flex items-center gap-2 rounded-2xl border bg-white/95 px-3 py-2 text-xs font-black shadow-lg backdrop-blur ${seconds <= 10 ? "border-rose-300 text-rose-600" : "border-slate-200 text-slate-700"}`}>
        <Clock3 size={15}/><span>{timedOut ? "Time bonus lost" : `${seconds}s`}</span>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white/95 px-3 py-2 text-xs font-black text-orange-700 shadow-lg backdrop-blur">
        <Flame size={15}/><span>Combo {combo}</span>{multiplier > 1 && <b className="rounded-full bg-orange-100 px-1.5 py-0.5">×{multiplier.toFixed(1)}</b>}
      </div>
      <div className="flex items-center gap-1 rounded-2xl border border-rose-200 bg-white/95 px-3 py-2 text-xs font-black text-rose-600 shadow-lg backdrop-blur" aria-label={`${lives} lives remaining`}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => <Heart key={i} size={15} fill={i < lives ? "currentColor" : "none"} className={i < lives ? "" : "text-slate-300"}/>) }
      </div>
      {boss && <div className="flex items-center gap-1.5 rounded-2xl border border-yellow-300 bg-yellow-50/95 px-3 py-2 text-xs font-black text-yellow-800 shadow-lg"><Crown size={15}/> BOSS</div>}
      {hintUsed && <div className="flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50/95 px-3 py-2 text-xs font-black text-violet-700 shadow-lg"><Heart size={14}/> Hint used</div>}
    </div>
    <div className="fixed bottom-20 left-1/2 z-[65] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 pointer-events-none"><div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70 shadow"><div className={`h-full transition-all duration-1000 ${seconds <= 10 ? "bg-rose-400" : "bg-orange-400"}`} style={{width:`${progress}%`}}/></div></div>
    {retryReady && lives > 0 && <div className="fixed bottom-5 left-1/2 z-[75] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-rose-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur"><RotateCcw size={16} className="text-rose-500"/><span className="text-xs font-black text-slate-700">Retry for a fresh chance</span><button onClick={()=>window.dispatchEvent(new CustomEvent("fv:retry-question"))} className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black text-white">Retry</button></div>}
    {lives === 0 && <div className="fixed bottom-5 left-1/2 z-[76] flex -translate-x-1/2 items-center gap-3 rounded-3xl border-2 border-rose-200 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur"><Heart size={22} className="text-rose-500"/><div><p className="font-black text-[#15233f]">Out of lives</p><p className="text-xs font-bold text-slate-500">Your adventure has ended. Try again to start a fresh run.</p></div></div>}
    {perfect && <div className="fixed inset-x-0 bottom-6 z-[76] mx-auto flex max-w-md items-center gap-3 rounded-3xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 shadow-2xl"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-300"><Sparkles size={21}/></div><div><p className="font-black text-[#15233f]">PERFECT RUN! 🌟</p><p className="text-xs font-bold text-slate-600">No hints, no timeouts — perfect bonus unlocked.</p></div><Gift size={22} className="ml-auto text-orange-500"/></div>}
  </>;
}
