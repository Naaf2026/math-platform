"use client";

import { useState } from "react";
import { Sparkles, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StartResult = {
  session_id: string;
  game_key: string;
  cost: number;
  charged: number;
  balance: number;
  free_play: boolean;
};

type Props = {
  gameKey: string;
  gameTitle: string;
  onStarted: (result: StartResult) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

const COSTS: Record<string, number> = {
  "memory-master": 5, "brain-flash-memory": 5, "flash-memory": 5, memory: 5,
  "number-sequence": 5, "brain-number-order": 5, "number-order": 5,
  "speed-quiz": 6, "number-rush": 6,
  unscramble: 4,
  "pattern-master": 6, "brain-pattern-quest": 6, "pattern-quest": 6,
  "memory-cards": 6, "memory-tiles": 6,
  "word-search": 4,
  "fill-blanks": 4,
};

export default function MindSparkGate({ gameKey, gameTitle, onStarted, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ balance: number; free_play_available: boolean; free_play_game_key: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prepare = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("get_mind_spark_status");
      if (rpcError) throw rpcError;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Unable to load Mind Sparks.");
      setStatus({ balance: Number(row.balance ?? 0), free_play_available: Boolean(row.free_play_available), free_play_game_key: row.free_play_game_key ?? null });
      setOpen(true);
    } catch (e: any) {
      setError(e?.message || "Unable to load Mind Sparks.");
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("start_brain_game", { p_game_key: gameKey });
      if (rpcError) throw rpcError;
      const row = (Array.isArray(data) ? data[0] : data) as StartResult | null;
      if (!row) throw new Error("The game could not be started.");
      setOpen(false);
      await onStarted(row);
    } catch (e: any) {
      setError(e?.message || "The game could not be started.");
    } finally {
      setLoading(false);
    }
  };

  const cost = COSTS[gameKey] ?? 0;
  const free = Boolean(status?.free_play_available && (!status?.free_play_game_key || status.free_play_game_key === gameKey));
  const balance = status?.balance ?? 0;
  const insufficient = !free && cost > 0 && balance < cost;

  return (
    <>
      <button type="button" onClick={prepare} disabled={loading} className={className}>{loading ? "Loading…" : children}</button>
      {open && status && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-6 text-center text-white">
              <button type="button" onClick={() => setOpen(false)} className="float-right rounded-full bg-white/15 p-2" aria-label="Close"><X size={18}/></button>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-3xl"><Sparkles/></div>
              <h2 className="mt-3 text-2xl font-black">Ready to play?</h2><p className="mt-1 font-bold text-white/85">{gameTitle}</p>
            </div>
            <div className="p-6 text-center">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-purple-50 p-4"><div className="text-xs font-black text-slate-400">YOUR SPARKS</div><div className="mt-1 text-2xl font-black text-purple-700">✨ {balance}</div></div>
                <div className="rounded-2xl bg-cyan-50 p-4"><div className="text-xs font-black text-slate-400">PLAY COST</div><div className="mt-1 text-2xl font-black text-cyan-700">{free ? "FREE" : `✨ ${cost}`}</div></div>
              </div>
              {!free && cost > 0 && <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 font-bold text-slate-600">After playing: <span className="font-black text-slate-900">✨ {Math.max(0, balance - cost)}</span> Mind Sparks</div>}
              {free ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 font-black text-emerald-700">🎁 Daily Free Play available!</div> : <p className="mt-4 font-semibold text-slate-500">Mind Sparks are used to enter Brain Games.</p>}
              {insufficient && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 font-black text-rose-700">Not enough Mind Sparks for this game.</div>}
              {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
              <div className="mt-5 flex gap-3"><button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-700">Cancel</button><button type="button" onClick={start} disabled={loading || insufficient} className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Zap className="mr-1 inline" size={17}/> {loading ? "Starting…" : "Play Now"}</button></div>
            </div>
          </div>
        </div>
      )}
      {error && !open && <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-700">{error}</div>}
    </>
  );
}
