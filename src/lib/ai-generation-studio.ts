import { createClient } from "@/lib/supabase/client";

export type GenerationRequest = {
  grade: number;
  age: number;
  count: number;
  book_id: string;
  chapter_id?: string | null;
  objective_id?: string | null;
  difficulty?: "easy" | "medium" | "hard" | "adaptive";
  question_types?: string[];
};

export async function generateAIQuestions(request: GenerationRequest) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in as a teacher or administrator.");
  const { data, error } = await supabase.functions.invoke("generate-ai-questions", {
    body: request,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listGenerationJobs(limit = 20) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("ai_generation_jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
