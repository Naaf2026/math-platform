"use client";

import { useMemo, useState } from "react";
import { createInteractionAuthoring, applyInteractionAuthoring, validateInteractiveQuestion } from "@/lib/interactive-question-authoring";
import { SUPPORTED_INTERACTIONS, type InteractiveQuestion } from "@/lib/interactive-question";

type Props = { initialQuestion?: InteractiveQuestion; onChange?: (question: InteractiveQuestion) => void };

export default function InteractiveQuestionAuthoringPanel({ initialQuestion, onChange }: Props) {
  const [question, setQuestion] = useState<InteractiveQuestion>(initialQuestion || { prompt: "", answer: "", interaction_type: "multiple_choice", options: ["Option 1", "Option 2"] });
  const [type, setType] = useState(question.interaction_type || "multiple_choice");
  const errors = useMemo(() => validateInteractiveQuestion(question), [question]);

  const update = (patch: Partial<InteractiveQuestion>) => {
    const next = { ...question, ...patch };
    setQuestion(next);
    onChange?.(next);
  };

  const changeType = (nextType: string) => {
    const next = applyInteractionAuthoring(question, createInteractionAuthoring(nextType));
    setType(nextType);
    setQuestion(next);
    onChange?.(next);
  };

  const options = question.options || [];
  const updateOption = (index: number, value: string) => {
    const next = options.map((option, i) => i === index ? value : option);
    update({ options: next });
  };
  const addOption = () => update({ options: [...options, `Option ${options.length + 1}`] });
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== index);
    const answerStillExists = next.some((option) => option.trim() && option.trim().toLowerCase() === String(question.answer || "").trim().toLowerCase());
    update({ options: next, ...(answerStillExists ? {} : { answer: "" }) });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Question Authoring</p><h2 className="text-xl font-black text-slate-900">Interactive Question Builder</h2></div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${errors.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{errors.length ? `${errors.length} issue${errors.length === 1 ? "" : "s"}` : "Ready"}</span>
      </div>
      <label className="block text-sm font-black text-slate-700">Interaction type<select value={type} onChange={(e) => changeType(e.target.value)} className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold">{SUPPORTED_INTERACTIONS.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
      <label className="mt-4 block text-sm font-black text-slate-700">Question prompt<textarea value={question.prompt} onChange={(e) => update({ prompt: e.target.value })} rows={3} className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3" placeholder="Write the learner-facing question..." /></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-black text-slate-700">Correct answer<input value={question.answer} onChange={(e) => update({ answer: e.target.value })} className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3" /></label><label className="text-sm font-black text-slate-700">Points<input type="number" min={0} value={question.points ?? 10} onChange={(e) => update({ points: Number(e.target.value) })} className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3" /></label></div>
      {type === "multiple_choice" && (
        <div className="mt-4 rounded-2xl border-2 border-violet-100 bg-violet-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-black text-slate-800">Answer options</p><p className="mt-1 text-xs font-semibold text-slate-500">Enter each choice in its own box, then choose the correct answer above.</p></div>
            <button type="button" onClick={addOption} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white">+ Add option</button>
          </div>
          <div className="mt-3 space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-violet-600 ring-1 ring-violet-100">{String.fromCharCode(65 + index)}</span>
                <input value={option} onChange={(e) => updateOption(index, e.target.value)} className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 font-semibold outline-none focus:border-violet-300" placeholder={`Option ${index + 1}`} />
                <button type="button" onClick={() => removeOption(index)} disabled={options.length <= 2} className="rounded-xl px-2 py-2 text-lg font-black text-rose-500 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Remove option ${index + 1}`}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <label className="mt-4 block text-sm font-black text-slate-700">Explanation<textarea value={question.explanation || ""} onChange={(e) => update({ explanation: e.target.value })} rows={2} className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3" placeholder="Explain why the answer is correct..." /></label>
      <label className="mt-4 block text-sm font-black text-slate-700">Hint<input value={question.hint || ""} onChange={(e) => update({ hint: e.target.value })} className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-3" placeholder="Optional learner hint" /></label>
      {errors.length > 0 && <ul className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">{errors.map((error) => <li key={error}>• {error}</li>)}</ul>}
      <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Configuration</p><pre className="mt-2 overflow-x-auto text-xs text-slate-600">{JSON.stringify(question.interaction_config || {}, null, 2)}</pre></div>
    </section>
  );
}
