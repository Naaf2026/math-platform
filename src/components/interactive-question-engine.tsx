"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, GripVertical, Lightbulb, Sparkles, XCircle, Zap } from "lucide-react";

type InteractiveQuestion = {
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
  interaction_type?: string | null;
  question_type?: string | null;
  hint?: string | null;
};

type Props = {
  question: InteractiveQuestion;
  selected: string | null;
  disabled?: boolean;
  onAnswer: (answer: string) => void;
};

const colors = [
  "border-sky-200 bg-sky-50 hover:border-sky-400 hover:bg-sky-100",
  "border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100",
  "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100",
  "border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100",
];
const letters = ["A", "B", "C", "D"];

function normalizeType(question: InteractiveQuestion) {
  return (question.interaction_type || question.question_type || "multiple_choice").toLowerCase().replace(/[- ]/g, "_");
}

export default function InteractiveQuestionEngine({ question, selected, disabled, onAnswer }: Props) {
  const type = normalizeType(question);
  const [value, setValue] = useState("");
  const [ordered, setOrdered] = useState<string[]>(question.options || []);
  const [showHint, setShowHint] = useState(false);
  const isAnswered = selected !== null;
  const correct = selected === question.answer;

  const answerState = useMemo(() => {
    if (!isAnswered) return null;
    return correct ? "correct" : "incorrect";
  }, [correct, isAnswered]);

  function submit(valueToSubmit = value.trim()) {
    if (!valueToSubmit || disabled || isAnswered) return;
    onAnswer(valueToSubmit);
  }

  if (["number_input", "numeric", "text_input", "short_answer"].includes(type)) {
    return (
      <div className="mt-6">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[1.75rem] border-2 border-slate-100 bg-[#fbfcff] p-6 sm:p-8">
          <div className="flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">
            <Zap size={15} /> Type your answer
          </div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            disabled={disabled || isAnswered}
            inputMode={type === "number_input" || type === "numeric" ? "numeric" : "text"}
            aria-label="Your answer"
            className={`w-full rounded-2xl border-2 bg-white px-5 py-4 text-center text-3xl font-black text-[#15233f] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 ${answerState === "correct" ? "border-emerald-400" : answerState === "incorrect" ? "border-rose-400" : "border-slate-200"}`}
            placeholder="?"
          />
          {!isAnswered && <button onClick={() => submit()} disabled={!value.trim() || disabled} className="w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">Check answer</button>}
          {isAnswered && <Feedback question={question} correct={correct} />}
        </div>
      </div>
    );
  }

  if (type === "true_false" || type === "truefalse") {
    return <ChoiceView options={["True", "False"]} question={question} selected={selected} disabled={disabled} onAnswer={onAnswer} />;
  }

  if (["ordering", "order", "sort"].includes(type)) {
    function move(index: number, direction: -1 | 1) {
      if (disabled || isAnswered) return;
      const next = [...ordered];
      const target = index + direction;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      setOrdered(next);
    }
    return (
      <div className="mt-6 rounded-[1.75rem] border-2 border-slate-100 bg-[#fbfcff] p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">↕ Put these in order</span><span className="text-xs font-bold text-slate-400">Tap ▲ / ▼</span></div>
        <div className="mx-auto max-w-xl space-y-2">
          {ordered.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-sm">
              <GripVertical className="text-slate-300" size={19} />
              <span className="flex-1 px-2 py-2 font-black text-[#15233f]">{item}</span>
              <button onClick={() => move(index, -1)} disabled={index === 0 || disabled || isAnswered} className="h-9 w-9 rounded-xl bg-slate-100 font-black disabled:opacity-30">▲</button>
              <button onClick={() => move(index, 1)} disabled={index === ordered.length - 1 || disabled || isAnswered} className="h-9 w-9 rounded-xl bg-slate-100 font-black disabled:opacity-30">▼</button>
            </div>
          ))}
        </div>
        {!isAnswered && <button onClick={() => submit(ordered.join("|"))} disabled={disabled} className="mx-auto mt-5 block rounded-2xl bg-orange-500 px-7 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600">Check order</button>}
        {isAnswered && <Feedback question={question} correct={correct} />}
      </div>
    );
  }

  return <ChoiceView options={question.options || []} question={question} selected={selected} disabled={disabled} onAnswer={onAnswer} />;
}

function ChoiceView({ options, question, selected, disabled, onAnswer }: Props & { options: string[] }) {
  const isAnswered = selected !== null;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {options.map((option, index) => {
        const isSelected = selected === option;
        const isCorrect = option === question.answer;
        let cls = colors[index % colors.length];
        if (isAnswered && isCorrect) cls = "border-emerald-400 bg-emerald-100 ring-4 ring-emerald-100";
        else if (isAnswered && isSelected) cls = "border-rose-400 bg-rose-100 ring-4 ring-rose-100";
        return (
          <button key={option} onClick={() => onAnswer(option)} disabled={disabled || isAnswered} className={`group relative flex min-h-[88px] items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left font-black text-[#15233f] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg disabled:cursor-default disabled:hover:translate-y-0 ${cls}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-base font-black shadow-sm ring-1 ring-slate-200">{letters[index] || "•"}</span>
            <span className="flex-1 text-lg sm:text-xl">{option}</span>
            {!isAnswered && <Sparkles className="opacity-0 transition group-hover:opacity-100" size={19} />}
            {isAnswered && isCorrect && <CheckCircle2 className="text-emerald-600" size={27} />}
            {isAnswered && isSelected && !isCorrect && <XCircle className="text-rose-600" size={27} />}
          </button>
        );
      })}
      {isAnswered && <div className="sm:col-span-2"><Feedback question={question} correct={selected === question.answer} /></div>}
    </div>
  );
}

function Feedback({ question, correct }: { question: InteractiveQuestion; correct: boolean }) {
  return (
    <div className={`mt-5 rounded-2xl border-2 p-5 ${correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <div className="flex items-start gap-3">
        {correct ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={26} /> : <XCircle className="mt-0.5 shrink-0 text-rose-600" size={26} />}
        <div>
          <p className={`text-lg font-black ${correct ? "text-emerald-700" : "text-rose-700"}`}>{correct ? "Excellent! You got it! 🎉" : `Good try! The correct answer is ${question.answer}.`}</p>
          {question.explanation && <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{question.explanation}</p>}
        </div>
      </div>
    </div>
  );
}
