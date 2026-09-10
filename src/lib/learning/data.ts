export type Topic = {
  id: string;
  title: string;
  description: string;
  level: string;
  lessons: number;
};

export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export const topics: Topic[] = [
  { id: "place-value", title: "Place Value", description: "Read, write and compare numbers with confidence.", level: "Foundation", lessons: 4 },
  { id: "addition-subtraction", title: "Addition & Subtraction", description: "Build accuracy with mental and written strategies.", level: "Foundation", lessons: 5 },
  { id: "multiplication", title: "Multiplication", description: "Develop fluency with facts, patterns and strategies.", level: "Development", lessons: 6 },
  { id: "fractions", title: "Fractions", description: "Understand parts, equivalence and simple operations.", level: "Development", lessons: 6 },
];

export const questions: Record<string, Question[]> = {
  "place-value": [
    { id: "pv-1", prompt: "What is the value of the 7 in 3,742?", options: ["7", "70", "700", "7,000"], answer: "700", explanation: "The 7 is in the hundreds place, so its value is 700." },
    { id: "pv-2", prompt: "Which number is greatest?", options: ["2,405", "2,450", "2,045", "2,405"], answer: "2,450", explanation: "Compare the hundreds and tens: 2,450 is the greatest." },
  ],
  "addition-subtraction": [
    { id: "as-1", prompt: "What is 48 + 27?", options: ["65", "75", "85", "95"], answer: "75", explanation: "48 + 20 = 68, then 68 + 7 = 75." },
    { id: "as-2", prompt: "What is 93 − 38?", options: ["45", "55", "65", "75"], answer: "55", explanation: "93 − 30 = 63, then 63 − 8 = 55." },
  ],
  multiplication: [
    { id: "mul-1", prompt: "What is 6 × 7?", options: ["36", "42", "48", "54"], answer: "42", explanation: "Six groups of seven make 42." },
    { id: "mul-2", prompt: "What is 8 × 5?", options: ["35", "40", "45", "50"], answer: "40", explanation: "Eight groups of five make 40." },
  ],
  fractions: [
    { id: "fr-1", prompt: "Which fraction is equivalent to 1/2?", options: ["1/3", "2/4", "3/5", "4/10"], answer: "2/4", explanation: "Multiplying the numerator and denominator of 1/2 by 2 gives 2/4." },
    { id: "fr-2", prompt: "Which fraction is greater?", options: ["1/4", "1/2", "1/8", "1/10"], answer: "1/2", explanation: "With the same numerator, the fraction with the smaller denominator is greater." },
  ],
};
