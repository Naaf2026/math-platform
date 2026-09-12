import { answersMatch, normalizeInteractionType, type InteractiveQuestion } from "@/lib/interactive-question";
import { validateInteractiveQuestion } from "@/lib/interactive-question-authoring";
import { verifyQuestionMath } from "@/lib/math-question-verification";
import type { QuestionBankItem } from "@/lib/question-bank-management";

export type ValidationSeverity = "error" | "warning" | "pass";
export type ValidationCheck = { key: string; label: string; severity: ValidationSeverity; message: string };
export type QuestionValidationReport = { score: number; publishable: boolean; checks: ValidationCheck[]; summary: string };

function check(key: string, label: string, severity: ValidationSeverity, message: string): ValidationCheck { return { key, label, severity, message }; }
function normalizedWords(value: string): string[] { return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2); }
function similarity(a: string, b: string): number {
  const left = new Set(normalizedWords(a)); const right = new Set(normalizedWords(b));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((word) => right.has(word)).length;
  return intersection / new Set([...left, ...right]).size;
}
function answerConsistency(question: InteractiveQuestion): ValidationCheck {
  const type = normalizeInteractionType(question);
  if (type !== "multiple_choice") return check("answer", "Answer consistency", "pass", "Answer format is handled by the selected interaction type.");
  const options = question.options || []; const matches = options.filter((option) => answersMatch(option, question.answer));
  return matches.length === 1 ? check("answer", "Answer consistency", "pass", "Exactly one option matches the correct answer.") : check("answer", "Answer consistency", "error", matches.length === 0 ? "The correct answer is not present in the options." : "More than one option matches the correct answer.");
}
function wordingQuality(question: InteractiveQuestion): ValidationCheck {
  const prompt = question.prompt?.trim() || "";
  if (prompt.length < 12) return check("wording", "Question wording", "warning", "Prompt is very short; add enough context for a learner to understand the task.");
  if (/\?\s*\?/.test(prompt) || /\.{4,}/.test(prompt)) return check("wording", "Question wording", "warning", "Prompt contains unusual punctuation that may make the question unclear.");
  return check("wording", "Question wording", "pass", "Prompt has a usable length and punctuation pattern.");
}
function optionQuality(question: InteractiveQuestion): ValidationCheck {
  if (normalizeInteractionType(question) !== "multiple_choice") return check("options", "Option quality", "pass", "Option review is not required for this interaction type.");
  const options = (question.options || []).map((item) => item.trim()).filter(Boolean); const unique = new Set(options.map((item) => item.toLowerCase()));
  if (unique.size !== options.length) return check("options", "Option quality", "error", "Duplicate answer options detected.");
  if (options.some((item) => item.length > 120)) return check("options", "Option quality", "warning", "At least one option is unusually long.");
  return check("options", "Option quality", "pass", "Options are present and unique.");
}
function interactionQuality(question: InteractiveQuestion): ValidationCheck {
  const type = normalizeInteractionType(question); const config = question.interaction_config || {};
  if (type === "drag_drop" && (!Array.isArray(config.zones) || config.zones.length < 1)) return check("interaction", "Interaction setup", "error", "Drag-and-drop questions need at least one zone.");
  if (type === "number_line" && Number(config.max ?? 10) <= Number(config.min ?? 0)) return check("interaction", "Interaction setup", "error", "Number-line maximum must be greater than minimum.");
  return check("interaction", "Interaction setup", "pass", `Interaction type “${type.replaceAll("_", " ")}” has a valid basic configuration.`);
}
function explanationQuality(question: InteractiveQuestion): ValidationCheck { return question.explanation?.trim() ? check("explanation", "Explanation", "pass", "Explanation is provided for learner feedback.") : check("explanation", "Explanation", "warning", "Add an explanation so learners can understand why the answer is correct."); }

export function validateQuestionForPublishing(question: QuestionBankItem | InteractiveQuestion, bank: QuestionBankItem[] = []): QuestionValidationReport {
  const structuralErrors = validateInteractiveQuestion(question).map((message, index) => check(`structure-${index}`, "Core validation", "error", message));
  const checks: ValidationCheck[] = [...structuralErrors, answerConsistency(question), wordingQuality(question), optionQuality(question), interactionQuality(question), explanationQuality(question)];
  verifyQuestionMath(question).forEach((item, index) => checks.push(check(`math-${index}`, "Math verification", item.severity, item.message)));
  const duplicate = bank.find((item) => item.id !== ("id" in question ? question.id : "") && similarity(item.prompt, question.prompt) >= 0.82);
  checks.push(duplicate ? check("duplicate", "Duplicate detection", "warning", `Very similar question found: “${duplicate.title}”. Review before publishing.`) : check("duplicate", "Duplicate detection", "pass", "No close duplicate was found in the current question bank."));
  const errors = checks.filter((item) => item.severity === "error").length; const warnings = checks.filter((item) => item.severity === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - errors * 25 - warnings * 7)); const publishable = errors === 0;
  const summary = publishable ? (warnings ? `Ready with ${warnings} review ${warnings === 1 ? "item" : "items"}.` : "All validation checks passed.") : `${errors} blocking ${errors === 1 ? "issue" : "issues"} must be fixed before publishing.`;
  return { score, publishable, checks, summary };
}
