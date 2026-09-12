import type { QuestionBankItem, QuestionBankStatus, QuestionDifficulty } from "@/lib/question-bank-management";
import { createClient } from "@/lib/supabase/client";

export async function loadPersistentQuestionBank(): Promise<QuestionBankItem[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("learning_questions")
    .select("id,topic_id,prompt,options,answer,explanation,skill,difficulty,question_type,interaction_config,hint,title,subject,status,version,tags,mission_ids,usage_count,correct_count,created_at,updated_at,published_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title || row.prompt?.slice(0, 72) || "Untitled question",
    subject: row.subject || "Mathematics",
    topic: row.topic_id || "General",
    difficulty: toBankDifficulty(row.difficulty),
    status: toBankStatus(row.status),
    version: Number(row.version || 1),
    tags: Array.isArray(row.tags) ? row.tags : [],
    missionIds: Array.isArray(row.mission_ids) ? row.mission_ids : [],
    usageCount: Number(row.usage_count || 0),
    correctCount: Number(row.correct_count || 0),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    publishedAt: row.published_at || null,
    prompt: row.prompt,
    options: Array.isArray(row.options) ? row.options : [],
    answer: row.answer,
    explanation: row.explanation || "",
    hint: row.hint || undefined,
    interaction_type: row.question_type,
    interaction_config: row.interaction_config || {},
  }));
}

function toBankDifficulty(value: string): QuestionDifficulty {
  if (value === "easy") return "foundation";
  if (value === "medium") return "developing";
  return "challenge";
}

function toBankStatus(value: string): QuestionBankStatus {
  if (value === "archived") return "archived";
  if (value === "draft") return "draft";
  return "published";
}
