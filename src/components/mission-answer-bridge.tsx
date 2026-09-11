"use client";

import { useEffect } from "react";

/**
 * Bridges the existing question engine to the Mission game-mechanics layer.
 * The engine renders explicit correctness feedback after an answer is submitted;
 * this bridge watches that feedback and emits the authoritative game event once.
 */
export default function MissionAnswerBridge() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/mission")) return;

    let lastSignature = "";
    let timer = 0;

    const inspect = () => {
      const root = document.body;
      const text = root.innerText || "";
      const question = (text.match(/Math Adventure · ([^\n]+)/)?.[1] || "").trim();
      if (!question) return;

      // The interactive engine's Feedback view renders one of these states after
      // submit. We only emit once per question + result, so MutationObserver churn
      // cannot consume multiple lives for one answer.
      const correct = /(?:^|\n)(?:Correct!|Great job|Well done|Excellent)/i.test(text);
      const incorrect = /(?:^|\n)(?:Not quite|Incorrect|Try again|Good try)/i.test(text);
      if (!correct && !incorrect) return;

      const result = correct ? "correct" : "incorrect";
      const signature = `${question}::${result}`;
      if (signature === lastSignature) return;
      lastSignature = signature;

      window.dispatchEvent(new CustomEvent("fv:answer-result", {
        detail: { correct, questionId: question },
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
