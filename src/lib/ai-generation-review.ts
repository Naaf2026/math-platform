import { createClient } from "@/lib/supabase/client";

export async function getGenerationReviewBatch(jobId: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_ai_generation_review_batch", { p_job_id: jobId });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function reviewGeneratedQuestion(questionId: string, status: "approved" | "rejected" | "needs_review" | "pending", note?: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("review_ai_generated_question", { p_question_id: questionId, p_status: status, p_note: note ?? null });
  if (error) throw new Error(error.message);
}

export async function bulkReviewGeneratedQuestions(questionIds: string[], status: "approved" | "rejected" | "needs_review" | "pending") {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("bulk_review_ai_generated_questions", { p_question_ids: questionIds, p_status: status });
  if (error) throw new Error(error.message);
  return data ?? 0;
}
