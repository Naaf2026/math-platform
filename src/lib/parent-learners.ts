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

async function invokeWithDetailedError<T>(supabase: ReturnType<typeof createClient>, functionName: string, body: unknown) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const payload = await context.clone().json() as { error?: string; message?: string };
        const detail = payload?.error || payload?.message;
        if (detail) throw new Error(detail);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== error.message) throw parseError;
      }
    }
    throw new Error(`${error.message}${context?.status ? ` (HTTP ${context.status})` : ""}`);
  }
  return data as T;
}

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
  const data = await invokeWithDetailedError<{ success?: boolean; error?: string; learner_id: string; username: string; display_name: string }>(supabase, "create-learner-account", input);
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
  const data = await invokeWithDetailedError<{ success?: boolean; error?: string; action: string; account_status?: string }>(supabase, "manage-learner-account", input);
  if (!data?.success) throw new Error(data?.error || "Could not update learner account.");
  return data as { success: true; action: string; account_status?: string };
}
