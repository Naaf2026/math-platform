export type InteractiveQuestion = {
  id?: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
  interaction_type?: string | null;
  question_type?: string | null;
  interaction_config?: Record<string, unknown> | null;
  hint?: string | null;
};

export type AnswerResult = {
  id: string;
  answer: string;
  correct: boolean;
  interactionType: string;
};

const aliases: Record<string, string> = {
  truefalse: "true_false",
  numberinput: "number_input",
  numeric: "number_input",
  numeric_input: "number_input",
  text_input: "short_answer",
  shortanswer: "short_answer",
  order: "ordering",
  sort: "ordering",
  dragdrop: "drag_drop",
  drag_and_drop: "drag_drop",
  numberline: "number_line",
  geometry: "shape_lab",
  shapes: "shape_lab",
  shape_lab_select: "shape_lab",
};

export function normalizeInteractionType(question: InteractiveQuestion): string {
  const raw = (question.interaction_type || question.question_type || "multiple_choice")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
  return aliases[raw] || raw;
}

export function normalizeAnswer(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ");
}

export function answersMatch(actual: unknown, expected: unknown): boolean {
  return normalizeAnswer(actual) === normalizeAnswer(expected);
}

export function emitAnswerResult(result: AnswerResult): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AnswerResult>("fv:answer-result", { detail: result }));
}

export function emitRetry(questionId?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fv:retry-question", { detail: { id: questionId || "" } }));
}

export const SUPPORTED_INTERACTIONS = [
  "multiple_choice",
  "true_false",
  "number_input",
  "short_answer",
  "ordering",
  "drag_drop",
  "number_line",
  "shape_lab",
  "manipulatives",
] as const;
