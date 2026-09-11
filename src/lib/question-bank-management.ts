import { validateInteractiveQuestion } from "@/lib/interactive-question-authoring";
import { normalizeInteractionType, type InteractiveQuestion } from "@/lib/interactive-question";

export type QuestionBankStatus = "draft" | "published" | "archived";
export type QuestionDifficulty = "foundation" | "developing" | "proficient" | "challenge";

export type QuestionBankItem = InteractiveQuestion & {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: QuestionDifficulty;
  status: QuestionBankStatus;
  version: number;
  tags: string[];
  missionIds: string[];
  usageCount: number;
  correctCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

export type QuestionBankPatch = Partial<Omit<QuestionBankItem, "id" | "version" | "createdAt" | "updatedAt">>;

export function createQuestionBankItem(question: InteractiveQuestion = {}): QuestionBankItem {
  const now = new Date().toISOString();
  const id = question.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: question.prompt?.slice(0, 72) || "Untitled question",
    subject: "Mathematics",
    topic: "General",
    difficulty: "developing",
    status: "draft",
    version: 1,
    tags: [],
    missionIds: [],
    usageCount: 0,
    correctCount: 0,
    createdAt: now,
    updatedAt: now,
    ...question,
    interaction_type: normalizeInteractionType(question),
    interaction_config: question.interaction_config || {},
  };
}

export function updateQuestionBankItem(item: QuestionBankItem, patch: QuestionBankPatch): QuestionBankItem {
  return { ...item, ...patch, version: item.version + 1, updatedAt: new Date().toISOString() };
}

export function duplicateQuestionBankItem(item: QuestionBankItem): QuestionBankItem {
  const copy = createQuestionBankItem({ ...item, id: undefined });
  return { ...copy, title: `${item.title} (Copy)`, status: "draft", version: 1, usageCount: 0, correctCount: 0, missionIds: [] };
}

export function validateQuestionBankItem(item: QuestionBankItem): string[] {
  return validateInteractiveQuestion(item);
}

export function publishQuestionBankItem(item: QuestionBankItem): QuestionBankItem {
  const errors = validateQuestionBankItem(item);
  if (errors.length) throw new Error(errors.join(" "));
  const now = new Date().toISOString();
  return { ...item, status: "published", publishedAt: now, updatedAt: now };
}

export function archiveQuestionBankItem(item: QuestionBankItem): QuestionBankItem {
  return { ...item, status: "archived", updatedAt: new Date().toISOString() };
}

export function recordQuestionUsage(item: QuestionBankItem, correct: boolean): QuestionBankItem {
  return { ...item, usageCount: item.usageCount + 1, correctCount: item.correctCount + (correct ? 1 : 0), updatedAt: new Date().toISOString() };
}

export function questionAccuracy(item: QuestionBankItem): number {
  return item.usageCount ? Math.round((item.correctCount / item.usageCount) * 100) : 0;
}
