import { createClient } from "@/lib/supabase/client";

export type LevelProgress = {
  lifetime_xp: number;
  current_level: number;
  level_title: string;
  level_icon: string;
  current_level_min_xp: number;
  next_level: number | null;
  next_level_min_xp: number | null;
  xp_into_level: number;
  xp_needed: number;
  progress_percent: number;
  next_level_title: string | null;
  next_level_icon: string | null;
};

export type LevelHistoryItem = {
  level: number;
  title: string;
  icon: string;
  reached_at: string;
  xp_at_level: number;
  metadata: Record<string, unknown> | null;
};

function client() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getMyLevelProgress() {
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("get_my_level_progress");
  if (error) throw error;
  return (data?.[0] ?? null) as LevelProgress | null;
}

export async function getMyLevelHistory() {
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("get_my_level_history");
  if (error) throw error;
  return (data ?? []) as LevelHistoryItem[];
}

export async function checkLearningLevelUp() {
  const supabase = client();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("check_learning_level_up");
  if (error) throw error;
  return data ?? [];
}
