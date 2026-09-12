import { createClient } from "@/lib/supabase/client";

export type Achievement = {
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  achievement_type: string;
  xp_awarded: number;
  earned_at: string;
};

export type AchievementEvaluation = Achievement & { newly_earned: boolean };

export async function evaluateLearningAchievements() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("evaluate_learning_achievements");
  if (error) throw error;
  return (data || []).map((row: AchievementEvaluation) => ({
    ...row,
    xp_awarded: Number(row.xp_awarded || 0),
  }));
}

export async function getMyAchievements() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("get_my_achievements");
  if (error) throw error;
  return (data || []) as Achievement[];
}
