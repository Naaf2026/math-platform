import { createClient } from "@/lib/supabase/client";

export type LearningPathStep = {
  step_number: number;
  step_type: "remediate" | "practice" | "mastery_check" | "advance" | "challenge";
  action_type: string;
  objective_id: string;
  objective: string;
  topic_id: string;
  topic: string;
  level: string | null;
  mastery: number;
  mastery_band: string;
  prerequisite_topic_id: string | null;
  prerequisite_topic: string | null;
  prerequisite_mastery: number;
  locked: boolean;
  available: boolean;
  question_id: string | null;
  question_prompt: string | null;
  question_type: string | null;
  difficulty: string | null;
  points: number | null;
  explanation: string | null;
  expected_milestone: string;
  reason: string;
  priority: number;
};

export type PathQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string | null;
  hint: string | null;
  question_type: string | null;
  interaction_type: string | null;
  interaction_config: Record<string, unknown> | null;
  points: number;
};

export async function getPersonalizedLearningPath(limit = 12) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Authentication required.");
  const { data, error } = await supabase.rpc("get_personalized_learning_path", { p_limit: limit });
  if (error) throw error;
  return (data || []) as LearningPathStep[];
}

export async function getPathQuestion(questionId: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("learning_questions")
    .select("id,prompt,options,answer,explanation,hint,question_type,interaction_config")
    .eq("id", questionId)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const config = (data.interaction_config || null) as Record<string, unknown> | null;
  return {
    ...data,
    options: Array.isArray(data.options) ? data.options.map(String) : [],
    interaction_type: typeof config?.interaction_type === "string" ? config.interaction_type : null,
    points: Number(config?.points ?? 1),
  } as PathQuestion;
}

export async function startLearningPathStep(step: LearningPathStep) {
  return recordLearningPathStep(step.objective_id, "in_progress", step.step_type, step.question_id);
}

export async function recordLearningPathStep(
  objectiveId: string,
  status: "in_progress" | "completed" | "available" = "in_progress",
  stepType: LearningPathStep["step_type"],
  questionId?: string | null,
  isCorrect?: boolean | null,
) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("record_learning_path_step", {
    p_objective_id: objectiveId,
    p_status: status,
    p_step_type: stepType,
    p_question_id: questionId ?? null,
    p_is_correct: isCorrect ?? null,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function submitLearningAnswer(questionId: string, selectedAnswer: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("submit_learning_answer", {
    p_question_id: questionId,
    p_selected_answer: selectedAnswer,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}
