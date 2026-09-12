import { answersMatch, type InteractiveQuestion } from "@/lib/interactive-question";

export type MathVerification = {
  severity: "pass" | "warning" | "error";
  message: string;
};

const arithmeticPattern = /^\s*(-?\d+(?:\.\d+)?)\s*([+\-×x*÷/])\s*(-?\d+(?:\.\d+)?)\s*[=?]?\s*$/i;

function numeric(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function calculate(left: number, operator: string, right: number): number | null {
  switch (operator) {
    case "+": return left + right;
    case "-": return left - right;
    case "×": case "x": case "*": return left * right;
    case "÷": case "/": return right === 0 ? null : left / right;
    default: return null;
  }
}

export function verifyArithmeticAnswer(question: InteractiveQuestion): MathVerification {
  const match = question.prompt?.match(arithmeticPattern);
  if (!match) return { severity: "warning", message: "No simple arithmetic expression was detected; semantic verification should be handled by the AI/content review layer." };
  const expected = calculate(Number(match[1]), match[2], Number(match[3]));
  if (expected === null) return { severity: "error", message: "The arithmetic expression cannot be evaluated safely (for example, division by zero)." };
  const answer = numeric(String(question.answer));
  if (answer === null) return { severity: "error", message: "This arithmetic question has a non-numeric answer." };
  return Math.abs(answer - expected) < 1e-9
    ? { severity: "pass", message: `Arithmetic answer verified: ${expected}.` }
    : { severity: "error", message: `Arithmetic answer is incorrect. Expected ${expected}, received ${question.answer}.` };
}

export function verifyOptionAnswer(question: InteractiveQuestion): MathVerification {
  const options = question.options || [];
  if (!options.length) return { severity: "warning", message: "No options are available for option-level verification." };
  const matches = options.filter((option) => answersMatch(option, question.answer));
  if (matches.length === 1) return { severity: "pass", message: "Exactly one answer option matches the stored answer." };
  return { severity: "error", message: matches.length ? "Multiple options match the stored answer." : "The stored answer does not match any option." };
}

export function verifyQuestionMath(question: InteractiveQuestion): MathVerification[] {
  const checks: MathVerification[] = [];
  const arithmetic = verifyArithmeticAnswer(question);
  if (arithmetic.severity !== "warning") checks.push(arithmetic);
  if ((question.options || []).length) checks.push(verifyOptionAnswer(question));
  return checks;
}
