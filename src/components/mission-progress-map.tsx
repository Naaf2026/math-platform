"use client";

import { useEffect, useState } from "react";
import { Check, Map, Sparkles, Star } from "lucide-react";

const TOTAL_STEPS = 10;

export default function MissionProgressMap() {
  const [current, setCurrent] = useState(1);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!window.location.pathname.startsWith("/mission")) return;

    const readProgress = () => {
      const text = document.body.innerText || "";
      const match = text.match(/(\d+)\s*\/\s*10\s*Challenge/i);
      if (match) setCurrent(Math.min(TOTAL_STEPS, Math.max(1, Number(match[1]))));
      setFinished(/Math Champion!|Adventure complete/i.test(text));
    };

    const observer = new MutationObserver(readProgress);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    readProgress();
    return () => observer.disconnect();
  }, []);

  if (finished) return null;

  return (
    <aside className="fixed right-4 top-1/2 z-[55] hidden w-52 -translate-y-1/2 lg:block">
      <div className="rounded-3xl border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Map size={17} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-500">Mission path</p>
            <p className="text-sm font-black text-[#15233f]">Today's adventure</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] font-black text-slate-400">
          <span>Progress</span>
          <span className="text-violet-600">{Math.min(100, Math.round(((current - 1) / (TOTAL_STEPS - 1)) * 100))}%</span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round(((current - 1) / (TOTAL_STEPS - 1)) * 100))}%` }}
          />
        </div>

        <div className="relative mt-4 grid grid-cols-5 gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => {
            const step = index + 1;
            const complete = step < current;
            const active = step === current;
            return (
              <div key={step} className="relative flex justify-center">
                {index < TOTAL_STEPS - 1 && (
                  <span className={`absolute left-1/2 top-1/2 h-1 w-full -translate-y-1/2 ${step < current ? "bg-violet-300" : "bg-slate-100"}`} />
                )}
                <div
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                    complete
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : active
                        ? "bg-orange-400 text-white shadow-lg shadow-orange-200 ring-4 ring-orange-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {complete ? <Check size={13} strokeWidth={3} /> : active ? <Star size={12} fill="currentColor" /> : step}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-50 to-cyan-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-violet-800">
            <Sparkles size={13} /> Challenge {current} of {TOTAL_STEPS}
          </p>
          <p className="mt-1 text-[10px] font-bold leading-4 text-slate-500">Keep going — every correct answer moves you closer to your next power.</p>
        </div>
      </div>
    </aside>
  );
}
