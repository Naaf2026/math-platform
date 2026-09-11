import type { QuestionBankItem, QuestionDifficulty } from "@/lib/question-bank-management";

export type MasteryBand = "unknown" | "emerging" | "developing" | "mastered";
export type AdaptiveAction = "remediate" | "practice" | "advance" | "challenge";

export type LearnerPerformance = {
  attempts: number;
  correct: number;
  recentResults?: boolean[];
  topicAttempts?: number;
  topicCorrect?: number;
  consecutiveCorrect?: number;
  consecutiveIncorrect?: number;
};

export type AdaptiveProfile = {
  mastery: number;
  masteryBand: MasteryBand;
  weakTopic: boolean;
  recommendedDifficulty: QuestionDifficulty;
  recommendedInteraction: string;
  action: AdaptiveAction;
};

const difficultyRank: Record<QuestionDifficulty, number> = {
  foundation: 0,
  developing: 1,
  proficient: 2,
  challenge: 3,
};

const interactions = ["multiple_choice", "true_false", "number_input", "short_answer", "ordering", "drag_drop", "number_line", "shape_lab", "manipulatives"];

export function masteryScore(performance: LearnerPerformance): number {
  const attempts = Math.max(0, performance.attempts || 0);
  if (!attempts) return 0;
  const base = (Math.max(0, performance.correct || 0) / attempts) * 100;
  const recent = performance.recentResults || [];
  const recentBonus = recent.length ? ((recent.filter(Boolean).length / recent.length) - 0.5) * 10 : 0;
  return Math.max(0, Math.min(100, Math.round(base + recentBonus)));
}

export function masteryBand(score: number): MasteryBand {
  if (score <= 0) return "unknown";
  if (score < 60) return "emerging";
  if (score < 80) return "developing";
  return "mastered";
}

export function weaknessScore(performance: LearnerPerformance): number {
  const attempts = Math.max(0, performance.topicAttempts ?? performance.attempts ?? 0);
  if (!attempts) return 0;
  return Math.max(0, Math.min(100, 100 - Math.round(((performance.topicCorrect ?? performance.correct ?? 0) / attempts) * 100)));
}

export function recommendDifficulty(score: number, consecutiveCorrect = 0, consecutiveIncorrect = 0): QuestionDifficulty {
  if (consecutiveIncorrect >= 2 || score < 50) return "foundation";
  if (consecutiveCorrect >= 3 || score >= 90) return "challenge";
  if (score >= 80) return "proficient";
  if (score >= 60) return "developing";
  return "foundation";
}

export function recommendInteraction(performance: LearnerPerformance, previousType?: string): string {
  if ((performance.consecutiveIncorrect || 0) >= 2) {
    return previousType === "multiple_choice" ? "manipulatives" : "multiple_choice";
  }
  if ((performance.consecutiveCorrect || 0) >= 3) return "short_answer";
  return previousType && interactions.includes(previousType) ? previousType : "multiple_choice";
}

export function chooseAdaptiveAction(score: number, consecutiveCorrect = 0, consecutiveIncorrect = 0): AdaptiveAction {
  if (consecutiveIncorrect >= 2 || score < 50) return "remediate";
  if (consecutiveCorrect >= 3 && score >= 85) return score >= 95 ? "challenge" : "advance";
  return "practice";
}

export function buildAdaptiveProfile(performance: LearnerPerformance, previousInteraction?: string): AdaptiveProfile {
  const mastery = masteryScore(performance);
  return {
    mastery,
    masteryBand: masteryBand(mastery),
    weakTopic: weaknessScore(performance) >= 40,
    recommendedDifficulty: recommendDifficulty(mastery, performance.consecutiveCorrect, performance.consecutiveIncorrect),
    recommendedInteraction: recommendInteraction(performance, previousInteraction),
    action: chooseAdaptiveAction(mastery, performance.consecutiveCorrect, performance.consecutiveIncorrect),
  };
}

export function rankQuestions(questions: QuestionBankItem[], profile: AdaptiveProfile, recentQuestionIds: string[] = []): QuestionBankItem[] {
  const recent = new Set(recentQuestionIds);
  return [...questions].sort((a, b) => {
    const score = (question: QuestionBankItem) => {
      let value = 0;
      if (question.status !== "published") value -= 1000;
      value -= Math.abs(difficultyRank[question.difficulty] - difficultyRank[profile.recommendedDifficulty]) * 25;
      if (profile.weakTopic && question.topic) value += 15;
      if (question.interaction_type === profile.recommendedInteraction) value += 12;
      if (recent.has(question.id)) value -= 20;
      value += Math.max(0, 10 - Math.min(question.usageCount, 10));
      return value;
    };
    return score(b) - score(a);
  });
}

export function shouldRemediate(performance: LearnerPerformance): boolean {
  return chooseAdaptiveAction(masteryScore(performance), performance.consecutiveCorrect, performance.consecutiveIncorrect) === "remediate";
}

export function shouldChallenge(performance: LearnerPerformance): boolean {
  const action = chooseAdaptiveAction(masteryScore(performance), performance.consecutiveCorrect, performance.consecutiveIncorrect);
  return action === "challenge";
}
