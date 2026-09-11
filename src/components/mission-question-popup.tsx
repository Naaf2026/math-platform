"use client";

import { useEffect, useState } from "react";
import { interactiveMotionCss } from "@/lib/interactive-motion";

/** Presents the Mission's existing question engine as a focused game window. */
export default function MissionQuestionPopup() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const applyWindow = () => {
      document.querySelectorAll<HTMLElement>(".question-enter").forEach((el) => {
        el.classList.add("mission-question-window");
        el.classList.add("fv-motion-idle");
      });
    };
    const clearWindow = () => {
      document.querySelectorAll<HTMLElement>(".question-enter").forEach((el) => {
        el.classList.remove("mission-question-window", "fv-motion-idle");
      });
    };

    let advanceTimer = 0;
    let lastFeedback = "";
    const scheduleAdvance = () => {
      window.clearTimeout(advanceTimer);
      advanceTimer = window.setTimeout(() => {
        const panel = document.querySelector<HTMLElement>(".mission-question-window");
        if (!panel) return;
        const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
        const nextButton = buttons.find((button) => {
          const label = (button.innerText || button.getAttribute("aria-label") || "").trim().toLowerCase();
          return /^(next|next question|continue|continue adventure|next challenge|finish)$/i.test(label);
        });
        if (nextButton && !nextButton.disabled) nextButton.click();
      }, 1100);
    };

    const inspectFeedback = () => {
      const panel = document.querySelector<HTMLElement>(".mission-question-window");
      if (!panel) return;
      const text = panel.innerText || "";
      const correct = /(?:^|\n)(?:Correct!|Great job|Well done|Excellent)/i.test(text);
      const incorrect = /(?:^|\n)(?:Not quite|Incorrect|Try again|Good try)/i.test(text);
      if (!correct && !incorrect) return;
      const result = correct ? "correct" : "incorrect";
      const signature = `${result}::${text.slice(-500)}`;
      if (signature === lastFeedback) return;
      lastFeedback = signature;
      document.querySelectorAll<HTMLElement>(".mission-question-window").forEach((el) => {
        el.classList.remove("fv-motion-idle", "fv-motion-correct", "fv-motion-incorrect");
        el.classList.add(result === "correct" ? "fv-motion-correct" : "fv-motion-incorrect");
      });
      scheduleAdvance();
    };

    const onComplete = () => {
      window.clearTimeout(advanceTimer);
      setActive(false);
      clearWindow();
    };
    const onRestart = () => {
      lastFeedback = "";
      setActive(true);
      window.setTimeout(applyWindow, 0);
    };
    const onRetry = () => {
      window.clearTimeout(advanceTimer);
      lastFeedback = "";
      setActive(true);
      window.setTimeout(applyWindow, 0);
    };

    applyWindow();
    const observer = new MutationObserver(() => {
      applyWindow();
      inspectFeedback();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("fv:mission-complete", onComplete);
    window.addEventListener("fv:mission-restart", onRestart);
    window.addEventListener("fv:retry-question", onRetry);

    return () => {
      window.clearTimeout(advanceTimer);
      observer.disconnect();
      clearWindow();
      window.removeEventListener("fv:mission-complete", onComplete);
      window.removeEventListener("fv:mission-restart", onRestart);
      window.removeEventListener("fv:retry-question", onRetry);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        ${interactiveMotionCss}
        .mission-question-backdrop {
          position: fixed;
          inset: 0;
          z-index: 55;
          pointer-events: none;
          background: rgba(15, 23, 42, 0.34);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          opacity: ${active ? 1 : 0};
          transition: opacity 220ms ease;
        }
        .mission-question-window {
          position: fixed !important;
          left: 50% !important;
          top: 50% !important;
          z-index: 60 !important;
          width: min(920px, calc(100vw - 28px)) !important;
          max-height: min(86vh, 820px) !important;
          overflow-y: auto !important;
          transform: translate(-50%, -50%) !important;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 32px;
          background: white;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.32), 0 8px 30px rgba(99, 102, 241, 0.18);
          animation: mission-question-pop 360ms cubic-bezier(.2,.8,.2,1) both;
          overscroll-behavior: contain;
        }
        .mission-question-window > div:first-child { border-radius: 32px; }
        .mission-exit-button {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 75;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 10px 15px;
          background: rgba(255, 255, 255, 0.96);
          color: #475569;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
          border: 1px solid rgba(226, 232, 240, 0.95);
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
        }
        .mission-exit-button:hover { transform: translateY(-1px); background: white; color: #dc2626; }
        .mission-exit-button:focus-visible { outline: 3px solid rgba(139, 92, 246, 0.35); outline-offset: 2px; }
        @keyframes mission-question-pop {
          0% { opacity: 0; transform: translate(-50%, -46%) scale(.94); }
          60% { opacity: 1; transform: translate(-50%, -50%) scale(1.015); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @media (max-width: 640px) {
          .mission-question-window { width: calc(100vw - 16px) !important; max-height: 92vh !important; border-radius: 24px; }
          .mission-exit-button { top: 10px; right: 10px; padding: 9px 12px; }
        }
        @media (prefers-reduced-motion: reduce) { .mission-question-window { animation: none; } }
      `}</style>
      <div className="mission-question-backdrop" aria-hidden="true" />
      {active && (
        <a className="mission-exit-button" href="/dashboard" aria-label="Exit mission and return to dashboard">
          <span aria-hidden="true">✕</span>
          Exit Mission
        </a>
      )}
    </>
  );
}
