import { normalizeInteractionType, type InteractiveQuestion } from "@/lib/interactive-question";
import type { QuestionBankItem, QuestionDifficulty } from "@/lib/question-bank-management";

export type QuestionImprovement = {
  original: QuestionBankItem;
  improved: QuestionBankItem;
  changes: string[];
  confidence: number;
  reviewNote: string;
};

const difficultyOrder: QuestionDifficulty[] = ["foundation", "developing", "proficient", "challenge"];

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function improvePrompt(prompt: string): string {
  const value = clean(prompt);
  if (!value) return value;
  if (/^what is \d+\s*[+\-×x*÷/]\s*\d+\??$/i.test(value)) {
    return value.endsWith("?") ? value : `${value}?`;
  }
  return value.replace(/\?+$/, "?");
}

function improveExplanation(question: QuestionBankItem): string {
  const existing = clean(question.explanation || "");
  if (existing.length >= 20) return existing;
  const prompt = question.prompt || "";
  const arithmetic = prompt.match(/(-?\d+(?:\.\d+)?)\s*([+\-×x*÷/])\s*(-?\d+(?:\.\d+)?)/);
  if (arithmetic) {
    const left = Number(arithmetic[1]);
    const right = Number(arithmetic[3]);
    const operator = arithmetic[2];
    let result: number | null = null;
    if (operator === "+") result = left + right;
    if (operator === "-") result = left - right;
    if (["×", "x", "*"].includes(operator)) result = left * right;
    if (["÷", "/"].includes(operator) && right !== 0) result = left / right;
    if (result !== null && Number(question.answer) === result) {
      return `Work out ${left} ${operator} ${right}. The result is ${result}, so the correct answer is ${result}.`;
    }
  }
  return existing || `Use the information in the question to work through the calculation carefully, then choose the answer that matches your result.`;
}

function improveDistractors(question: QuestionBankItem): string[] | undefined {
  if (normalizeInteractionType(question) !== "multiple_choice") return question.options;
  const options = [...(question.options || [])].map(clean).filter(Boolean);
  const answer = clean(String(question.answer));
  const unique = Array.from(new Set(options));
  const answerIndex = unique.findIndex((option) => option.toLowerCase() === answer.toLowerCase());
  if (answerIndex < 0) return unique;
  return [answer, ...unique.filter((_, index) => index !== answerIndex)];
}

function recommendDifficulty(question: QuestionBankItem): QuestionDifficulty {
  const prompt = question.prompt || "";
  if (/\b(prove|justify|multi-step|strategy|reasoning)\b/i.test(prompt)) return "challenge";
  if (/\b(compare|explain)\b/i.test(prompt)) return "proficient";
  return question.difficulty;
}

export function improveQuestion(question: QuestionBankItem): QuestionImprovement {
  const improvedPrompt = improvePrompt(question.prompt || "");
  const improvedExplanation = improveExplanation(question);
  const improvedOptions = improveDistractors(question);
  const improvedDifficulty = recommendDifficulty(question);
  const changes: string[] = [];

  if (improvedPrompt !== question.prompt) changes.push("Cleaned and clarified the question wording.");
  if (improvedExplanation !== (question.explanation || "")) changes.push("Added or strengthened the teaching explanation.");
  if (JSON.stringify(improvedOptions) !== JSON.stringify(question.options)) changes.push("Removed duplicate options and kept the correct option explicit.");
  if (improvedDifficulty !== question.difficulty) changes.push(`Adjusted difficulty from ${question.difficulty} to ${improvedDifficulty}.`);
  if (normalizeInteractionType(question) === "multiple_choice" && (question.options || []).length < 3) changes.push("Flagged the MCQ for more meaningful distractors; no unsafe distractors were invented automatically.");

  const improved: QuestionBankItem = {
    ...question,
    prompt: improvedPrompt,
    title: improvedPrompt.slice(0, 72) || "Untitled question",
    explanation: improvedExplanation,
    options: improvedOptions,
    difficulty: improvedDifficulty,
    status: "draft",
    version: question.version + 1,
    missionIds: [],
    publishedAt: null,
    updatedAt: new Date().toISOString(),
  };

  return {
    original: question,
    improved,
    changes: changes.length ? changes : ["No deterministic changes were necessary; the question already meets the improvement rules."],
    confidence: changes.length ? 88 : 96,
    reviewNote: "This is a deterministic improvement pass. Teacher approval is required before the revised version is published.",
  };
}

export function improvementIsSaferThanOriginal(result: QuestionImprovement): boolean {
  const originalIndex = difficultyOrder.indexOf(result.original.difficulty);
  const improvedIndex = difficultyOrder.indexOf(result.improved.difficulty);
  return result.improved.prompt.length > 0 && Math.abs(improvedIndex - originalIndex) <= 1;
}
