import { answersMatch, normalizeInteractionType, type InteractiveQuestion } from "@/lib/interactive-question";

export type InteractionAuthoring = {
  interaction_type: string;
  interaction_config: Record<string, unknown>;
  hint?: string | null;
  explanation?: string;
  points?: number;
};

export const INTERACTION_PRESETS: Record<string, Record<string, unknown>> = {
  multiple_choice: { shuffle: true },
  true_false: { shuffle: false },
  number_input: { allowDecimal: false, placeholder: "?" },
  short_answer: { placeholder: "Type your answer" },
  ordering: { moveMode: "buttons", shuffle: true },
  drag_drop: { zones: [] },
  number_line: { min: 0, max: 10, step: 1 },
  shape_lab: { interaction: "select" },
  manipulatives: { mode: "counters", start: 0 },
};

export function createInteractionAuthoring(type: string): InteractionAuthoring {
  const normalized = normalizeInteractionType({ prompt: "", answer: "", interaction_type: type });
  return {
    interaction_type: normalized,
    interaction_config: { ...(INTERACTION_PRESETS[normalized] || {}) },
    points: 10,
  };
}

export function applyInteractionAuthoring(
  question: InteractiveQuestion,
  authoring: Partial<InteractionAuthoring>,
): InteractiveQuestion {
  const type = normalizeInteractionType({
    ...question,
    interaction_type: authoring.interaction_type || question.interaction_type,
  });

  return {
    ...question,
    interaction_type: type,
    interaction_config: {
      ...(question.interaction_config || {}),
      ...(authoring.interaction_config || {}),
    },
    ...(authoring.hint !== undefined ? { hint: authoring.hint } : {}),
    ...(authoring.explanation !== undefined ? { explanation: authoring.explanation } : {}),
    ...(authoring.points !== undefined ? { points: authoring.points } : {}),
  };
}

export function validateInteractiveQuestion(question: InteractiveQuestion): string[] {
  const errors: string[] = [];
  const type = normalizeInteractionType(question);
  if (!question.prompt?.trim()) errors.push("Question prompt is required.");
  if (!String(question.answer ?? "").trim()) errors.push("Answer is required.");

  if (type === "multiple_choice" || type === "true_false") {
    const options = type === "true_false" ? ["True", "False"] : question.options || [];
    if (options.length < 2) errors.push("At least two answer options are required.");
    if (!options.some((option) => answersMatch(option, question.answer))) {
      errors.push("The correct answer must exist in the answer options.");
    }
  }

  if (type === "ordering" && (question.options || []).length < 2) {
    errors.push("Ordering questions need at least two items.");
  }
  if (type === "drag_drop") {
    const zones = question.interaction_config?.zones;
    if (!Array.isArray(zones) || zones.length < 1) errors.push("Drag-and-drop questions need at least one zone.");
  }
  if (type === "number_line") {
    const c = question.interaction_config || {};
    if (Number(c.max ?? 10) <= Number(c.min ?? 0)) errors.push("Number-line max must be greater than min.");
  }
  return errors;
}
