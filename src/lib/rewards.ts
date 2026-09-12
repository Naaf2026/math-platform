import { createClient } from "@/lib/supabase/client";

export type RewardWallet = {
  xp: number;
  lifetime_xp: number;
  coins: number;
  gems: number;
  best_combo: number;
  missions_completed: number;
};

export type RewardHistoryItem = {
  source: string;
  reason: string;
  xp: number;
  coins: number;
  gems: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function getMyRewardWallet() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("get_my_reward_wallet");
  if (error) throw error;
  return (data?.[0] || null) as RewardWallet | null;
}

export async function getMyRewardHistory(limit = 50) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("get_my_reward_history", { p_limit: limit });
  if (error) throw error;
  return (data || []) as RewardHistoryItem[];
}
