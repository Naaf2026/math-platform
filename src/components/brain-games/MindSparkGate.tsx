"use client";

import { useState } from "react";
import { Clock3, Sparkles, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StartResult = { session_id: string; game_key: string; cost: number; charged: number; balance: number; free_play: boolean };
type TimerStatus = { seconds_remaining: number; seconds_used: number; daily_limit_seconds: number };
type Props = { gameKey: string; gameTitle: string; onStarted: (result: StartResult) => void | Promise<void>; children: React.ReactNode; className?: string };

const COSTS: Record<string, number> = {
  "memory-master": 3, "brain-flash-memory": 3, "flash-memory": 3, memory: 3,
  "number-sequence": 3, "brain-number-order": 3, "number-order": 3,
  "speed-quiz": 3, "number-rush": 3, unscramble: 3,
  "pattern-master": 3, "brain-pattern-quest": 3, "pattern-quest": 3,
  "memory-cards": 3, "memory-tiles": 3, "word-search": 3, "fill-blanks": 3,
  "whats-inside": 3, "hidden-numbers": 3,
};

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}

async function getAuthenticatedClient() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured yet.");
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }
  if (!session) throw new Error("Your student session has expired. Please sign in again.");
  return supabase;
}

export default function MindSparkGate({ gameKey, gameTitle, onStarted, children, className }: Props) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ balance: number; free_play_available: boolean } | null>(null);
  const [timer, setTimer] = useState<TimerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState<number | null>(null);

  const prepare = async () => {
    setError(null); setLoading(true);
    try {
      const supabase = await getAuthenticatedClient();
      const [{ data, error: rpcError }, { data: timerData, error: timerError }] = await Promise.all([
        supabase.rpc("get_mind_spark_status"), supabase.rpc("get_brain_game_timer_status"),
      ]);
      if (rpcError) {
        const message = String(rpcError.message || "");
        const limitMatch = message.match(/daily_limit_reached[:\s]+(\d+)/i);
        if (message.toLowerCase().includes("subscription_limit") && limitMatch) {
          setOpen(false);
          setDailyLimitReached(Number(limitMatch[1]));
          return;
        }
        throw rpcError;
      }
      if (timerError) throw timerError;
      const row = Array.isArray(data) ? data[0] : data;
      const timerRow = Array.isArray(timerData) ? timerData[0] : timerData;
      if (!row) throw new Error("Unable to load Mind Sparks.");
      setStatus({ balance: Number(row.balance ?? 0), free_play_available: Boolean(row.free_play_available) });
      setTimer({ seconds_remaining: Number(timerRow?.seconds_remaining ?? 0), seconds_used: Number(timerRow?.seconds_used ?? 0), daily_limit_seconds: Number(timerRow?.daily_limit_seconds ?? 1800) });
      setOpen(true);
    } catch (e: any) {
      const message = String(e?.message || "Unable to load Mind Time.");
      setError(message.toLowerCase().includes("not authenticated") ? "Your student session has expired. Please sign in again." : message);
    } finally { setLoading(false); }
  };

  const start = async () => {
    setError(null); setDailyLimitReached(null); setLoading(true);
    try {
      const supabase = await getAuthenticatedClient();
      if ((timer?.seconds_remaining ?? 0) <= 0) throw new Error("Your 30-minute Mind Time is finished for today. Come back tomorrow!");
      const { data, error: rpcError } = await supabase.rpc("start_brain_game", { p_game_key: gameKey });
      if (rpcError) {
        const message = String(rpcError.message || "");
        const limitMatch = message.match(/daily_limit_reached[:\s]+(\d+)/i);
        if (message.toLowerCase().includes("subscription_limit") && limitMatch) {
          setOpen(false);
          setDailyLimitReached(Number(limitMatch[1]));
          return;
        }
        throw rpcError;
      }
      const row = (Array.isArray(data) ? data[0] : data) as StartResult | null;
      if (!row) throw new Error("The game could not be started.");
      window.localStorage.setItem("brain_game_active_session", row.session_id);
      setOpen(false); await onStarted(row);
    } catch (e: any) {
      const message = String(e?.message || "The game could not be started.");
      const limitMatch = message.match(/daily_limit_reached[:\s]+(\d+)/i);
      if (message.toLowerCase().includes("subscription_limit") && limitMatch) {
        setOpen(false);
        setDailyLimitReached(Number(limitMatch[1]));
        return;
      }
      setError(message.toLowerCase().includes("not authenticated") ? "Your student session has expired. Please sign in again." : message);
    } finally { setLoading(false); }
  };

  const cost = COSTS[gameKey] ?? 3;
  const free = Boolean(status?.free_play_available);
  const balance = status?.balance ?? 0;
  const insufficient = !free && balance < cost;
  const timeFinished = (timer?.seconds_remaining ?? 0) <= 0;
  const canPlay = !loading && !insufficient && !timeFinished;

  return <>
    <button type="button" onClick={prepare} disabled={loading} className={className}>{loading ? "Loading…" : children}</button>
    {open && status && timer && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[430px] overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 px-6 pb-5 pt-6 text-center text-white">
          <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/15 p-2 transition hover:bg-white/25" aria-label="Close"><X size={18}/></button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-lg">✨</div>
          <h2 className="mt-3 text-[23px] font-black tracking-tight">Ready to play?</h2>
          <p className="mt-1 truncate px-6 font-bold text-white/90">{gameTitle}</p>
        </div>

        <div className="p-5 sm:p-6">
          {free ? (
            <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <div className="text-lg font-black text-emerald-700">🎁 You have 1 free game play today!</div>
              <p className="mt-1 text-sm font-bold text-emerald-600">Ready to play?</p>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-purple-100 bg-purple-50 px-4 py-4 text-center">
              <div className="text-base font-black leading-snug text-purple-800">✨ It takes {cost} Mind Sparks to play this game for today.</div>
              <p className="mt-1 text-sm font-bold text-purple-600">Continue?</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
              <div className="text-[10px] font-black tracking-wide text-slate-400">MIND SPARKS</div>
              <div className="mt-1 text-xl font-black text-purple-700">✨ {balance}</div>
            </div>
            <div className="rounded-2xl bg-cyan-50 px-3 py-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black tracking-wide text-slate-400"><Clock3 size={12}/> MIND TIME</div>
              <div className="mt-1 text-xl font-black text-cyan-700">{formatTime(timer.seconds_remaining)}</div>
            </div>
          </div>

          {!free && <div className="mt-3 text-center text-xs font-bold text-slate-400">After playing: <span className="font-black text-slate-600">✨ {Math.max(0, balance - cost)}</span> Mind Sparks</div>}
          {timeFinished && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-black text-rose-700">⏰ Your 30-minute Mind Time is finished for today.</div>}
          {insufficient && !timeFinished && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-black text-rose-700">Not enough Mind Sparks. You need {cost} to play.</div>}
          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">{error}</div>}

          <div className="mt-5 grid grid-cols-1 gap-2.5">
            <button type="button" onClick={start} disabled={!canPlay} className="order-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-4 py-3.5 text-base font-black text-white shadow-lg shadow-blue-200 transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">
              {free ? "YES, LET'S PLAY!" : "✨ YES, LET'S PLAY!"}
            </button>
            <button type="button" onClick={start} disabled={!canPlay || free} className="order-2 rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 font-black text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-45">
              🔓 Unlock &amp; Play
            </button>
            <button type="button" onClick={() => setOpen(false)} className="order-3 rounded-2xl px-4 py-2.5 font-black text-slate-400 transition hover:bg-slate-50 hover:text-slate-600">CANCEL</button>
          </div>
        </div>
      </div>
    </div>}
    {error && !open && <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-700">{error}</div>}
    {dailyLimitReached !== null && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="brain-games-limit-title">
        <div className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#fff3cc] text-5xl">🏆</div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#e39a00]">Brain Game complete</p>
          <h2 id="brain-games-limit-title" className="mt-2 text-3xl font-black text-[#083d78]">Great work today! 🎉</h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-[#6685a4]">
            You have completed your {dailyLimitReached} Brain Game play for today.
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#6685a4]">
            Your Brain Games will be available again tomorrow when the daily limit resets.
          </p>
          <button
            type="button"
            onClick={() => setDailyLimitReached(null)}
            className="mt-7 w-full rounded-2xl bg-[#ffad16] px-6 py-3.5 font-black text-white shadow-md"
          >
            Got it! 🎉
          </button>
        </div>
      </div>
    )}
  </>;
}
