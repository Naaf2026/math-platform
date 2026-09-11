"use client";

import { useEffect } from "react";

/** Bridges rendered answer feedback into one authoritative Mission event. */
export default function MissionAnswerBridge() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/mission")) return;
    let lastSignature = "";
    let timer = 0;

    const inspect = () => {
      const text = document.body.innerText || "";
      const question = (text.match(/Math Adventure · ([^\n]+)/)?.[1] || "").trim();
      if (!question) return;
      const correct = /(?:^|\n)(?:Correct!|Great job|Well done|Excellent)/i.test(text);
      const incorrect = /(?:^|\n)(?:Not quite|Incorrect|Try again|Good try)/i.test(text);
      if (!correct && !incorrect) return;
      const result = correct ? "correct" : "incorrect";
      const signature = `${question}::${result}`;
      if (signature === lastSignature) return;
      lastSignature = signature;

      const pointsMatch = text.match(/⭐\s*\+\s*(\d+)\s*XP/i);
      const difficulty = /\bBOSS\b/i.test(text) ? "hard" : /\bSTARTER\b/i.test(text) ? "easy" : "medium";
      const hintUsed = /Helpful hint/i.test(text);
      window.dispatchEvent(new CustomEvent("fv:answer-result", {
        detail: {
          correct,
          questionId: question,
          points: pointsMatch ? Number(pointsMatch[1]) : 0,
          difficulty,
          hintUsed,
        },
      }));
    };

    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(inspect, 0);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    inspect();

    const resetForQuestion = () => {
      lastSignature = "";
      window.clearTimeout(timer);
      timer = window.setTimeout(inspect, 0);
    };
    window.addEventListener("fv:retry-question", resetForQuestion);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("fv:retry-question", resetForQuestion);
    };
  }, []);
  return null;
}
