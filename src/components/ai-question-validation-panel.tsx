"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { validateQuestionForPublishing } from "@/lib/ai-question-validation";
import { reviewQuestionSemantics } from "@/lib/ai-semantic-review";
import type { QuestionBankItem } from "@/lib/question-bank-management";

export default function AIQuestionValidationPanel({ question, bank }: { question: QuestionBankItem; bank: QuestionBankItem[] }) {
  const report = useMemo(() => validateQuestionForPublishing(question, bank), [question, bank]);
  const semantic = useMemo(() => reviewQuestionSemantics(question, bank), [question, bank]);

  return (
    <section className="mt-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg"><Sparkles size={20} /></span>
          <div><p className="text-xs font-black uppercase tracking-wider text-violet-600">AI Question Validation</p><h3 className="text-lg font-black text-[#071b3a]">Content quality gate</h3></div>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-slate-100"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quality score</p><p className="text-2xl font-black text-[#071b3a]">{report.score}<span className="text-sm text-slate-400">/100</span></p></div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-100">
        {report.publishable ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertCircle className="text-rose-600" size={18} />}
        {report.summary}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {report.checks.map((item) => (
          <div key={item.key} className="flex items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            {item.severity === "pass" ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={16} /> : item.severity === "error" ? <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={16} /> : <ShieldCheck className="mt-0.5 shrink-0 text-amber-600" size={16} />}
            <div><p className="text-xs font-black text-slate-700">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{item.message}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Semantic review</p><p className="text-sm font-bold text-slate-600">Clarity, distractors, teaching value, interaction fit and difficulty</p></div><span className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-black text-violet-700">{semantic.score}/100</span></div>
        <p className="mt-3 text-sm font-bold text-slate-700">{semantic.summary}</p>
        <div className="mt-3 space-y-2">{semantic.checks.map((item) => <div key={item.key} className="flex items-start gap-2 text-xs"><span className="mt-0.5">{item.severity === "pass" ? "✓" : item.severity === "error" ? "✕" : "!"}</span><span className="font-semibold text-slate-600"><strong>{item.label}:</strong> {item.message}</span></div>)}</div>
        <div className="mt-4 rounded-xl bg-violet-50 p-3"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Suggestions</p><ul className="mt-2 space-y-1 text-xs font-semibold text-slate-600">{semantic.suggestions.map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}</ul></div>
      </div>
    </section>
  );
}
