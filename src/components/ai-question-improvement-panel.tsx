"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { QuestionBankItem } from "@/lib/question-bank-management";
import { improveQuestion, improvementIsSaferThanOriginal, type QuestionImprovement } from "@/lib/ai-question-improvement";

export default function AIQuestionImprovementPanel({ question, onApply }: { question: QuestionBankItem; onApply: (question: QuestionBankItem) => void }) {
  const [result, setResult] = useState<QuestionImprovement | null>(null);

  const improve = () => setResult(improveQuestion(question));
  const apply = () => {
    if (!result || !improvementIsSaferThanOriginal(result)) return;
    onApply(result.improved);
    setResult(null);
  };

  return <section className="mt-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-violet-600"><Sparkles size={15}/> AI Question Improvement</p><h3 className="mt-1 text-lg font-black text-[#071b3a]">Improve this question</h3><p className="mt-1 max-w-2xl text-sm text-slate-500">Create a proposed revision for wording, explanation, options and difficulty. The original stays untouched until you approve the revision.</p></div>
      <button onClick={improve} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow"><Sparkles size={16}/>Improve Question</button>
    </div>

    {result && <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-600">Proposed revision</p><p className="mt-1 text-sm font-bold text-slate-600">Confidence: {result.confidence}% · Saved as draft if approved</p></div><button onClick={() => setResult(null)} className="rounded-full bg-slate-100 p-2 text-slate-500" aria-label="Discard proposed revision"><X size={17}/></button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">Original</p><p className="mt-2 font-bold text-slate-700">{question.prompt}</p><p className="mt-3 text-sm text-slate-500">{question.explanation || "No explanation"}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase text-emerald-600">Improved draft</p><p className="mt-2 font-bold text-slate-800">{result.improved.prompt}</p><p className="mt-3 text-sm text-slate-600">{result.improved.explanation}</p>{result.improved.options?.length ? <div className="mt-3 flex flex-wrap gap-2">{result.improved.options.map((option) => <span key={option} className={`rounded-full px-3 py-1 text-xs font-bold ${option.toLowerCase() === String(result.improved.answer).toLowerCase() ? "bg-emerald-200 text-emerald-800" : "bg-white text-slate-600"}`}>{option}</span>)}</div> : null}</div></div>
      <div className="mt-4"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Changes</p><ul className="mt-2 space-y-1">{result.changes.map((change) => <li key={change} className="flex gap-2 text-sm font-semibold text-slate-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600"/>{change}</li>)}</ul></div>
      <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{result.reviewNote}</div>
      <div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={() => setResult(null)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700">Keep original</button><button onClick={apply} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white">Approve revision</button></div>
    </div>}
  </section>;
}
