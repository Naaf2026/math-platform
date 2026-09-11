"use client";

import { useEffect, useState } from "react";

/** Presents the Mission's existing question engine as a focused game window. */
export default function MissionQuestionPopup() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const applyWindow = () => {
      document.querySelectorAll<HTMLElement>(".question-enter").forEach((el) => {
        el.classList.add("mission-question-window");
      });
    };
    const clearWindow = () => {
      document.querySelectorAll<HTMLElement>(".question-enter").forEach((el) => {
        el.classList.remove("mission-question-window");
      });
    };
    const onComplete = () => { setActive(false); clearWindow(); };
    const onRestart = () => { setActive(true); window.setTimeout(applyWindow, 0); };
    const onRetry = () => { setActive(true); window.setTimeout(applyWindow, 0); };

    applyWindow();
    const observer = new MutationObserver(applyWindow);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("fv:mission-complete", onComplete);
    window.addEventListener("fv:mission-restart", onRestart);
    window.addEventListener("fv:retry-question", onRetry);

    return () => {
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
        .mission-question-window > div:first-child {
          border-radius: 32px;
        }
        @keyframes mission-question-pop {
          0% { opacity: 0; transform: translate(-50%, -46%) scale(.94); }
          60% { opacity: 1; transform: translate(-50%, -50%) scale(1.015); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @media (max-width: 640px) {
          .mission-question-window { width: calc(100vw - 16px) !important; max-height: 92vh !important; border-radius: 24px; }
        }
        @media (prefers-reduced-motion: reduce) { .mission-question-window { animation: none; } }
      `}</style>
      <div className="mission-question-backdrop" aria-hidden="true" />
    </>
  );
}
