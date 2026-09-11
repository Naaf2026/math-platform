"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type Tone = "tap" | "correct" | "incorrect" | "complete";

function playTone(type: Tone, muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = type === "correct" ? [523.25, 659.25, 783.99] : type === "complete" ? [392, 523.25, 659.25, 783.99] : type === "incorrect" ? [220, 185] : [330];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === "incorrect" ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.075);
      gain.gain.exponentialRampToValueAtTime(type === "tap" ? 0.025 : 0.055, now + i * 0.075 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.075 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.075);
      osc.stop(now + i * 0.075 + 0.18);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {}
}

function burst() {
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  for (let i = 0; i < 44; i++) {
    const p = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 360;
    p.textContent = ["✦", "★", "●", "◆"][i % 4];
    p.style.cssText = `position:absolute;left:50%;top:45%;font-size:${10 + Math.random() * 14}px;opacity:1;transform:translate(-50%,-50%);animation:fv-confetti 900ms cubic-bezier(.2,.8,.2,1) forwards;--x:${Math.cos(angle) * distance}px;--y:${Math.sin(angle) * distance}px;--r:${Math.random() * 540 - 270}deg`;
    root.appendChild(p);
  }
  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), 1000);
}

export default function SoundCelebrationSystem() {
  const [muted, setMuted] = useState(false);
  const lastText = useRef("");

  useEffect(() => {
    setMuted(localStorage.getItem("fv-math-muted") === "1");
    const style = document.createElement("style");
    style.textContent = "@keyframes fv-confetti{to{transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) rotate(var(--r));opacity:0}}";
    document.head.appendChild(style);

    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement)?.closest("button") as HTMLButtonElement | null;
      if (!el || el.disabled) return;
      const text = (el.innerText || el.getAttribute("aria-label") || "").trim().toLowerCase();
      if (text.includes("next challenge") || text.includes("finish adventure")) {
        playTone("complete", muted);
        burst();
      } else if (text.includes("check") || text.includes("finish race") || text.includes("check order") || text.includes("check answers")) {
        playTone("tap", muted);
      } else {
        playTone("tap", muted);
      }
    };

    const observer = new MutationObserver(() => {
      const bodyText = document.body.innerText || "";
      const recent = bodyText.slice(-500);
      if (recent === lastText.current) return;
      lastText.current = recent;
      if (/\b(correct|great job|nice work|well done)\b/i.test(recent)) {
        playTone("correct", muted);
        burst();
      } else if (/\b(try again|not quite|incorrect)\b/i.test(recent)) {
        playTone("incorrect", muted);
      }
    });

    document.addEventListener("click", onClick);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      document.removeEventListener("click", onClick);
      observer.disconnect();
      style.remove();
    };
  }, [muted]);

  const toggle = () => {
    setMuted(v => {
      const next = !v;
      localStorage.setItem("fv-math-muted", next ? "1" : "0");
      if (!next) playTone("tap", false);
      return next;
    });
  };

  return <button onClick={toggle} aria-label={muted ? "Turn sound on" : "Mute sounds"} title={muted ? "Sound off" : "Sound on"} className="fixed bottom-5 right-5 z-[80] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/95 text-slate-700 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
    {muted ? <VolumeX size={19}/> : <Volume2 size={19}/>}<span className="sr-only">{muted ? "Sound off" : "Sound on"}</span>
  </button>;
}
