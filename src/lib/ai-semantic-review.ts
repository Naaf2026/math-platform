import { answersMatch, normalizeInteractionType, type InteractiveQuestion } from "@/lib/interactive-question";
import type { QuestionBankItem, QuestionDifficulty } from "@/lib/question-bank-management";

export type SemanticReviewSeverity = "pass" | "warning" | "error";
export type SemanticReviewCheck = { key: string; label: string; severity: SemanticReviewSeverity; message: string };
export type SemanticReview = {
  score: number;
  checks: SemanticReviewCheck[];
  suggestions: string[];
  summary: string;
};

const difficultyOrder: QuestionDifficulty[] = ["foundation", "developing", "proficient", "challenge"];
const weakDistractorPatterns = [/^option\s*\d+$/i, /^answer\s*\d+$/i, /^none$/i];

function review(key: string, label: string, severity: SemanticReviewSeverity, message: string): SemanticReviewCheck {
  return { key, label, severity, message };
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function semanticWording(question: InteractiveQuestion): SemanticReviewCheck {
  const prompt = question.prompt?.trim() || "";
  if (!prompt) return review("semantic-wording", "Semantic clarity", "error", "The question has no usable prompt.");
  if (/\b(\?\?\?|tbd|lorem ipsum)\b/i.test(prompt)) return review("semantic-wording", "Semantic clarity", "error", "Placeholder or unfinished wording was detected.");
  if (wordCount(prompt) < 4) return review("semantic-wording", "Semantic clarity", "warning", "The prompt is very short; confirm that the learner has enough context.");
  if (/[A-Z]{5,}/.test(prompt)) return review("semantic-wording", "Semantic clarity", "warning", "Unusually capitalized text may make the question feel machine-generated or unclear.");
  return review("semantic-wording", "Semantic clarity", "pass", "The prompt is readable and contains enough wording for basic semantic review.");
}

function distractors(question: InteractiveQuestion): SemanticReviewCheck {
  if (normalizeInteractionType(question) !== "multiple_choice") return review("distractors", "Distractor quality", "pass", "Distractor review is not required for this interaction type.");
  const options = (question.options || []).map((value) => value.trim()).filter(Boolean);
  if (options.length < 3) return review("distractors", "Distractor quality", "warning", "Consider at least three options so incorrect choices provide useful discrimination.");
  if (options.some((option) => weakDistractorPatterns.some((pattern) => pattern.test(option)))) return review("distractors", "Distractor quality", "warning", "One or more distractors look like generic placeholders rather than meaningful mathematical choices.");
  const lengths = options.map((option) => wordCount(option));
  if (Math.max(...lengths) - Math.min(...lengths) >= 8) return review("distractors", "Distractor quality", "warning", "Option lengths vary substantially; check that the correct answer is not visually obvious.");
  return review("distractors", "Distractor quality", "pass", "Options appear intentionally authored and provide a reasonable basic distractor set.");
}

function explanationReview(question: InteractiveQuestion): SemanticReviewCheck {
  const explanation = question.explanation?.trim() || "";
  if (!explanation) return review("semantic-explanation", "Teaching explanation", "warning", "Add a concise explanation that teaches the method, not only the final answer.");
  if (wordCount(explanation) < 4) return review("semantic-explanation", "Teaching explanation", "warning", "The explanation is very short; consider adding the reasoning or key step.");
  return review("semantic-explanation", "Teaching explanation", "pass", "An explanation is present and is long enough for a basic teaching review.");
}

function interactionFit(question: InteractiveQuestion): SemanticReviewCheck {
  const type = normalizeInteractionType(question);
  if (type === "number_input" && !/[0-9]/.test(question.prompt || "")) return review("interaction-fit", "Interaction fit", "warning", "Number input is selected but the prompt contains no visible numeric context; verify the interaction design.");
  if (type === "ordering" && !Array.isArray(question.interaction_config?.items)) return review("interaction-fit", "Interaction fit", "warning", "Ordering interaction should provide ordered items in its configuration.");
  if (type === "drag_drop" && !Array.isArray(question.interaction_config?.zones)) return review("interaction-fit", "Interaction fit", "error", "Drag-and-drop interaction is missing zones.");
  return review("interaction-fit", "Interaction fit", "pass", `The “${type.replaceAll("_", " ")}” interaction is structurally compatible with the question.`);
}

function difficultyReview(question: QuestionBankItem): SemanticReviewCheck {
  const prompt = question.prompt || "";
  const hardSignals = /\b(explain|justify|compare|multi-step|prove|strategy|reasoning)\b/i.test(prompt);
  const easySignals = /\b(what is|count|name|identify|which number)\b/i.test(prompt);
  const index = difficultyOrder.indexOf(question.difficulty);
  if (hardSignals && index === 0) return review("difficulty", "Difficulty fit", "warning", "The wording suggests reasoning beyond foundation level; confirm the assigned difficulty.");
  if (easySignals && index === 3) return review("difficulty", "Difficulty fit", "warning", "The wording appears relatively direct for challenge level; confirm the assigned difficulty.");
  return review("difficulty", "Difficulty fit", "pass", `Difficulty “${question.difficulty}” is plausible from the available wording signals.`);
}

function buildSuggestions(question: QuestionBankItem, checks: SemanticReviewCheck[]): string[] {
  const suggestions: string[] = [];
  if (checks.some((item) => item.key === "distractors" && item.severity !== "pass")) suggestions.push("Replace generic distractors with plausible mathematical misconceptions.");
  if (!question.explanation?.trim()) suggestions.push("Add a short worked explanation showing the key reasoning step.");
  if (checks.some((item) => item.key === "difficulty" && item.severity === "warning")) suggestions.push("Review the difficulty label against the intended learner level.");
  if (normalizeInteractionType(question) === "multiple_choice" && (question.options || []).some((option) => answersMatch(option, question.answer))) suggestions.push("Keep exactly one option equivalent to the stored correct answer.");
  if (!suggestions.length) suggestions.push("Content passes the deterministic semantic screen; human or model review can still refine wording and pedagogy.");
  return suggestions.slice(0, 4);
}

export function reviewQuestionSemantics(question: QuestionBankItem, bank: QuestionBankItem[] = []): SemanticReview {
  const checks = [semanticWording(question), distractors(question), explanationReview(question), interactionFit(question), difficultyReview(question)];
  const duplicateTopic = bank.find((item) => item.id !== question.id && item.topic === question.topic && item.difficulty === question.difficulty && item.prompt.trim().toLowerCase() === question.prompt.trim().toLowerCase());
  if (duplicateTopic) checks.push(review("semantic-duplicate", "Semantic duplicate", "warning", `An identical prompt already exists in this topic: “${duplicateTopic.title}”.`));
  const errors = checks.filter((item) => item.severity === "error").length;
  const warnings = checks.filter((item) => item.severity === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - errors * 25 - warnings * 8));
  const suggestions = buildSuggestions(question, checks);
  const summary = errors ? `${errors} semantic issue${errors === 1 ? "" : "s"} needs attention.` : warnings ? `Semantic screen passed with ${warnings} review item${warnings === 1 ? "" : "s"}.` : "Semantic screen passed.";
  return { score, checks, suggestions, summary };
}
