"use client";

import { useEffect, useState } from "react";
import { Flame, ShieldCheck, Sparkles, Star, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Reward = {
  mission_id: string;
  mission_date: string;
  base_xp: number;
  completion_bonus_xp: number;
  perfect_bonus_xp: number;
  streak_bonus_xp: number;
  total_reward_xp: number;
  streak: number;
  reward_claimed_at: string | null;
};

export default function DailyMissionReward({ missionId }: { missionId?: string | null }) {
  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      if (!supabase) { if (active) setLoading(false); return; }
      const { data, error: rpcError } = missionId
        ? await supabase.rpc("get_daily_mission_reward", { p_mission_id: missionId })
        : await supabase.rpc("complete_daily_mission_reward");
      if (!active) return;
      if (rpcError) setError(rpcError.message || "Reward could not be loaded.");
      else setReward((data?.[0] || null) as Reward | null);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [missionId]);

  if (loading) return <div className="mt-5 rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Calculating your rewards…</div>;
  if (error) return <div className="mt-5 rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</div>;
  if (!reward) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-xl sm:p-6">
      <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[.2em] text-white/75">
        <Trophy size={16} /> Mission rewards
      </div>
      <div className="mt-2 text-center text-4xl font-black">+{reward.total_reward_xp} XP</div>
      <p className="mt-1 text-center text-sm font-bold text-white/70">Your reward has been safely recorded.</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <RewardItem icon={<Star size={15} />} label="Completion" value={`+${reward.completion_bonus_xp}`} />
        <RewardItem icon={<ShieldCheck size={15} />} label="Perfect" value={`+${reward.perfect_bonus_xp}`} />
        <RewardItem icon={<Flame size={15} />} label="Streak" value={`+${reward.streak_bonus_xp}`} />
        <RewardItem icon={<Sparkles size={15} />} label="Mission XP" value={`+${reward.base_xp}`} />
      </div>
      {reward.streak > 0 && <div className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-black">🔥 {reward.streak}-day streak</div>}
    </div>
  );
}

function RewardItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl bg-white/10 p-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/65">{icon}{label}</div><p className="mt-1 text-lg font-black">{value} XP</p></div>;
}
