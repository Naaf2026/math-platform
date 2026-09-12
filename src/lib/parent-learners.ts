import { createClient } from "@/lib/supabase/client";

export type LearnerAccount = {
  learner_id: string;
  username: string;
  display_name: string;
  grade: string | null;
  avatar_emoji: string | null;
  account_status: string | null;
  xp: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
};

export async function getMyLearners() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_my_learners");
  if (error) throw new Error(error.message);
  return (data ?? []) as LearnerAccount[];
}

export async function createLearnerAccount(input: {
  display_name: string;
  username: string;
  password: string;
  grade?: string;
  avatar_emoji?: string;
}) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("create-learner-account", { body: input });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Could not create learner account.");
  return data as { success: true; learner_id: string; username: string; display_name: string };
}

export async function manageLearnerAccount(input: {
  learner_id: string;
  action: "enable" | "disable" | "reset_password";
  new_password?: string;
}) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("manage-learner-account", { body: input });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Could not update learner account.");
  return data as { success: true; action: string; account_status?: string };
}
