"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type BankQuestion = { id: string; prompt: string; options: unknown; answer: string; explanation: string | null; difficulty: string | null; question_type: string | null };
type Option = { id?: string; text?: string };

function normalizeGrade(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return `Grade ${raw}`;
  return raw.toLowerCase().startsWith("grade ") ? `Grade ${raw.slice(6).trim()}` : raw;
}

function getOptions(question: BankQuestion): Option[] {
  return Array.isArray(question.options) ? question.options as Option[] : [];
}

export default function NumberSchoolModal({ onClose }: { onClose: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [grade, setGrade] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [complete, setComplete] = useState(false);

  async function loadQuestions() {
    setLoading(true); setError(""); setComplete(false); setIndex(0); setScore(0); setSelected(null); setInput(""); setFeedback(null);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setError("Please sign in to open Number School."); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("grade").eq("id", userData.user.id).single();
    if (profileError) { setError("We could not load your grade."); setLoading(false); return; }
    const learnerGrade = normalizeGrade(profile?.grade);
    setGrade(learnerGrade);
    if (!learnerGrade) { setError("Your grade is not set yet. Please ask your teacher to set your grade."); setLoading(false); return; }

    const { data, error: questionError } = await supabase.from("learning_questions")
      .select("id,prompt,options,answer,explanation,difficulty,question_type")
      .eq("grade_level", learnerGrade).eq("subject", "Mathematics")
      .in("status", ["published", "active"]).limit(50);
    if (questionError) { setError("We could not load the questions for your grade."); setLoading(false); return; }

    const bank = [...(data ?? [])] as BankQuestion[];
    const groups = {
      hard: bank.filter(q => q.difficulty === "hard").sort(() => Math.random() - 0.5),
      medium: bank.filter(q => q.difficulty === "medium").sort(() => Math.random() - 0.5),
      easy: bank.filter(q => q.difficulty !== "hard" && q.difficulty !== "medium").sort(() => Math.random() - 0.5),
    };
    const picked = [...groups.hard.slice(0, 2), ...groups.medium.slice(0, 4), ...groups.easy.slice(0, 4)];
    if (picked.length < Math.min(10, bank.length)) {
      for (const q of bank.sort(() => Math.random() - 0.5)) if (!picked.some(p => p.id === q.id)) picked.push(q);
    }
    if (!picked.length) { setError(`No published Mathematics questions are available for ${learnerGrade}.`); setLoading(false); return; }
    setQuestions(picked.slice(0, 10)); setLoading(false);
  }

  useEffect(() => { void loadQuestions(); }, []);

  const question = questions[index];
  const options = question ? getOptions(question) : [];
  const isInput = question?.question_type === "number_input" || question?.question_type === "text_input";

  function submit(answer: string) {
    if (!question || feedback) return;
    const normalized = answer.trim().toLowerCase();
    const correct = String(question.answer ?? "").trim().toLowerCase();
    const chosen = options.find(o => String(o.id ?? "").toLowerCase() === normalized || String(o.text ?? "").trim().toLowerCase() === normalized);
    const isCorrect = normalized === correct || String(chosen?.id ?? "").toLowerCase() === correct || String(chosen?.text ?? "").trim().toLowerCase() === correct;
    setSelected(answer); setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore(v => v + 1);
  }

  function next() {
    if (index >= questions.length - 1) { setComplete(true); return; }
    setIndex(v => v + 1); setSelected(null); setInput(""); setFeedback(null);
  }

  return <div className="ns-modal-backdrop" onClick={onClose}>
    <section className="ns-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="number-school-title">
      <button className="ns-modal-close" onClick={onClose} aria-label="Close Number School"><X size={22}/></button>
      {loading ? <div className="ns-loading"><div className="ns-school-mark">🏫</div><Loader2 className="animate-spin" size={30}/><h2>Number School</h2><p>Loading your {grade ?? "grade-level"} Mathematics lesson…</p></div> : error ? <div className="ns-loading"><div className="ns-school-mark">🏫</div><h2>Number School</h2><p>{error}</p><button className="ns-primary" onClick={() => void loadQuestions()}>Try Again</button></div> : complete ? <div className="ns-complete"><div className="ns-complete-icon">🎓</div><span className="ns-kicker">LESSON COMPLETE</span><h2>Great work!</h2><div className="ns-score">{score}<small> / {questions.length}</small></div><p>You completed your {grade} Number School lesson.</p><div className="ns-complete-actions"><button className="ns-primary" onClick={() => void loadQuestions()}>Practice Again</button><button className="ns-secondary" onClick={onClose}>Return to Town</button></div></div> : <>
        <header className="ns-header"><div className="ns-school-mark">🏫</div><div><span className="ns-kicker">{grade} · MATHEMATICS</span><h2 id="number-school-title">Number School</h2></div><div className="ns-counter">{index + 1}<small>/{questions.length}</small></div></header>
        <div className="ns-progress"><span style={{width: `${((index + (feedback ? 1 : 0)) / questions.length) * 100}%`}}/></div>
        <div className="ns-question-card"><div className={`ns-difficulty ${question.difficulty ?? "easy"}`}>{question.difficulty ?? "practice"}</div><h3>{question.prompt}</h3>
          {isInput ? <div className="ns-input-row"><input autoFocus value={input} onChange={e => setInput(e.target.value)} disabled={Boolean(feedback)} placeholder="Type your answer" onKeyDown={e => { if (e.key === "Enter") submit(input); }}/><button className="ns-primary" disabled={!input.trim() || Boolean(feedback)} onClick={() => submit(input)}>Check</button></div> : <div className="ns-options">{options.map((option, i) => { const value = String(option.id ?? option.text ?? i); const chosen = selected === value || selected === option.text; return <button key={value} className={chosen ? "chosen" : ""} disabled={Boolean(feedback)} onClick={() => submit(value)}><b>{String.fromCharCode(65 + i)}</b><span>{option.text ?? value}</span></button>; })}</div>}
        </div>
        {feedback && <div className={`ns-feedback ${feedback}`}><div className="ns-feedback-title">{feedback === "correct" ? <CheckCircle2 size={21}/> : <XCircle size={21}/>}<b>{feedback === "correct" ? "Correct!" : "Not quite"}</b></div>{feedback === "wrong" && <p>Correct answer: <strong>{question.answer}</strong></p>}{question.explanation && <small>{question.explanation}</small>}<button className="ns-next" onClick={next}>{index === questions.length - 1 ? "Finish Lesson" : "Next Question →"}</button></div>}
        <footer className="ns-footer">✨ Grade-level question bank · {grade}</footer>
      </>}
    </section>
  </div>;
}
