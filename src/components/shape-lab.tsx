"use client";

import { useEffect, useMemo, useState } from "react";

type ShapeLabProps = {
  question: {
    answer: string;
    options?: string[];
    interaction_config?: Record<string, unknown> | null;
  };
  selected: string | null;
  disabled?: boolean;
  onAnswer: (answer: string) => void;
};

const DEFAULT_SHAPES = ["circle", "triangle", "square", "rectangle", "pentagon", "hexagon"];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function shapeKey(value: string) {
  const v = normalize(value);
  if (v.includes("triangle")) return "triangle";
  if (v.includes("rectangle")) return "rectangle";
  if (v.includes("square")) return "square";
  if (v.includes("pentagon")) return "pentagon";
  if (v.includes("hexagon")) return "hexagon";
  if (v.includes("circle")) return "circle";
  return v;
}

export default function ShapeLab({ question, selected, disabled, onAnswer }: ShapeLabProps) {
  const config = question.interaction_config || {};
  const configured = Array.isArray(config.shapes) ? config.shapes.map(String) : [];
  const optionShapes = (question.options || []).map(String).filter(Boolean);
  const shapes = useMemo(() => {
    const source = configured.length ? configured : optionShapes.length >= 2 ? optionShapes : DEFAULT_SHAPES;
    const seen = new Set<string>();
    return source.map(shapeKey).filter((s) => {
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  }, [configured.join("|"), optionShapes.join("|")]);

  const [value, setValue] = useState("");
  const [pulse, setPulse] = useState("");
  const [angle, setAngle] = useState(0);
  const [size, setSize] = useState(1);
  const done = selected !== null;

  useEffect(() => {
    setValue("");
    setPulse("");
    setAngle(0);
    setSize(1);
  }, [question.answer]);

  const choose = (shape: string) => {
    if (disabled || done) return;
    setValue(shape);
    setPulse(shape);
  };

  const correctKey = shapeKey(question.answer);
  const selectedValue = value || selected || "";

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] border-2 border-sky-100 bg-gradient-to-b from-sky-50 via-white to-indigo-50 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 shadow-sm">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-600">Shape Lab</div>
          <div className="mt-0.5 text-sm font-bold text-slate-600">Tap a shape to select it</div>
        </div>
        <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">🔎 Explore</div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shapes.map((shape) => {
          const active = selectedValue === shape;
          const correct = shape === correctKey;
          return (
            <button
              key={shape}
              type="button"
              aria-label={`Select ${shape}`}
              onClick={() => choose(shape)}
              disabled={disabled || done}
              className={`group relative min-h-[150px] overflow-hidden rounded-[1.5rem] border-2 bg-white p-3 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-95 disabled:cursor-default ${
                active
                  ? "border-sky-500 bg-sky-50 shadow-lg ring-4 ring-sky-100"
                  : "border-slate-200 hover:border-sky-300"
              } ${pulse === shape ? "animate-[pulse_0.45s_ease-out]" : ""}`}
            >
              <div className="pointer-events-none absolute inset-x-4 top-3 h-1 rounded-full bg-gradient-to-r from-sky-200 via-violet-200 to-emerald-200 opacity-70" />
              <div className="flex h-[105px] items-center justify-center pt-2 transition-transform duration-200 group-hover:scale-105">
                <ShapeVisual name={shape} angle={angle} size={size} active={active} />
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="capitalize font-black text-slate-700">{shape}</span>
                {active && <span className="text-sky-600">✓</span>}
              </div>
              {done && active && (
                <div className={`mt-1 text-[11px] font-black ${correct ? "text-emerald-600" : "text-rose-600"}`}>
                  {correct ? "Correct choice" : "Selected"}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
          <span>Shape rotation</span><span>{angle}°</span>
        </div>
        <input aria-label="Shape rotation" className="w-full accent-sky-500" type="range" min={0} max={360} step={15} value={angle} onChange={(e) => setAngle(Number(e.target.value))} disabled={disabled || done} />
        <div className="mb-2 mt-3 flex items-center justify-between text-xs font-black text-slate-500">
          <span>Shape size</span><span>{size.toFixed(1)}×</span>
        </div>
        <input aria-label="Shape size" className="w-full accent-violet-500" type="range" min={0.8} max={1.3} step={0.1} value={size} onChange={(e) => setSize(Number(e.target.value))} disabled={disabled || done} />
      </div>

      {!done ? (
        <>
          <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-600">
            {value ? `Selected: ${value}` : "Choose the shape that matches the instruction above."}
          </div>
          <button
            type="button"
            onClick={() => value && onAnswer(answerValue(question.answer, value, correctKey))}
            disabled={disabled || !value}
            className="mx-auto mt-4 flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✓ Check shape
          </button>
        </>
      ) : (
        <div className={`mt-4 rounded-2xl border-2 p-4 text-center font-black ${selected === question.answer ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {selected === question.answer ? "Correct! 🎉 Great job!" : "Not quite yet — keep trying!"}
        </div>
      )}
    </div>
  );
}

function answerValue(answer: string, chosen: string, correctKey: string) {
  return shapeKey(chosen) === correctKey ? answer : chosen;
}

function ShapeVisual({ name, angle, size, active }: { name: string; angle: number; size: number; active: boolean }) {
  const points: Record<string, string> = {
    triangle: "50,8 92,88 8,88",
    square: "12,12 88,12 88,88 12,88",
    rectangle: "7,27 93,27 93,73 7,73",
    pentagon: "50,7 94,38 76,90 24,90 6,38",
    hexagon: "25,8 75,8 94,50 75,92 25,92 6,50",
  };
  const style = { transform: `rotate(${angle}deg) scale(${size})`, transformOrigin: "center" };
  if (name === "circle") return <div className={`h-20 w-20 rounded-full border-[7px] ${active ? "border-sky-500 bg-sky-100" : "border-sky-400 bg-sky-50"} shadow-inner transition-transform`} style={style} />;
  return <svg viewBox="0 0 100 100" className="h-24 w-24 overflow-visible transition-transform" style={style} aria-hidden="true"><polygon points={points[name] || points.square} fill={active ? "rgb(224 242 254)" : "white"} stroke={active ? "rgb(14 165 233)" : "rgb(56 189 248)"} strokeWidth="6" strokeLinejoin="round" /></svg>;
}
