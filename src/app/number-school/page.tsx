"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Gamepad2, Loader2, Sparkles, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type BankQuestion = { id: string; prompt: string; options: unknown; answer: string; explanation: string | null; difficulty: string | null; question_type: string | null };
type Option = { id?: string; text?: string };

function normalizeGrade(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return `Grade ${raw}`;
  return raw.toLowerCase().startsWith("grade ") ? `Grade ${raw.slice(6).trim()}` : raw;
}
function optionsFor(question: BankQuestion): Option[] { return Array.isArray(question.options) ? question.options as Option[] : []; }

export default function NumberSchoolPage() {
  const router = useRouter();
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

  const loadQuestions = useCallback(async () => {
    setLoading(true); setError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setError("Please sign in to open Number School."); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("profiles").select("grade").eq("id", userData.user.id).single();
    if (profileError) { setError("We could not load your grade."); setLoading(false); return; }
    const learnerGrade = normalizeGrade(profile?.grade);
    setGrade(learnerGrade);
    if (!learnerGrade) { setError("Your grade is not set yet. Please ask your teacher to set your grade."); setLoading(false); return; }

    const { data, error: questionError } = await supabase.from("learning_questions")
      .select("id,prompt,options,answer,explanation,difficulty,question_type")
      .eq("grade_level", learnerGrade).eq("subject", "Mathematics").in("status", ["published", "active"]).limit(50);
    if (questionError) { setError("We could not load the questions for your grade."); setLoading(false); return; }

    const bank = [...(data ?? [])] as BankQuestion[];
    const weight: Record<string, number> = { hard: 0, medium: 1, easy: 2 };
    bank.sort((a, b) => (weight[a.difficulty ?? "easy"] ?? 3) - (weight[b.difficulty ?? "easy"] ?? 3) || Math.random() - 0.5);
    const picked = bank.slice(0, Math.min(10, bank.length));
    if (!picked.length) { setError(`No published Mathematics questions are available for ${learnerGrade}.`); setLoading(false); return; }
    setQuestions(picked); setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadQuestions(); }, [loadQuestions]);

  const question = questions[index];
  const options = question ? optionsFor(question) : [];

  function submit(answer: string) {
    if (!question || feedback) return;
    const normalized = answer.trim().toLowerCase();
    const correctAnswer = String(question.answer ?? "").trim().toLowerCase();
    const chosenOption = options.find(o => String(o.id ?? "").toLowerCase() === normalized || String(o.text ?? "").trim().toLowerCase() === normalized);
    const isCorrect = normalized === correctAnswer || String(chosenOption?.id ?? "").toLowerCase() === correctAnswer || String(chosenOption?.text ?? "").trim().toLowerCase() === correctAnswer;
    setSelected(answer); setFeedback(isCorrect ? "correct" : "wrong"); if (isCorrect) setScore(v => v + 1);
  }
  function next() {
    if (index >= questions.length - 1) { setComplete(true); return; }
    setIndex(v => v + 1); setSelected(null); setInput(""); setFeedback(null);
  }

  if (loading) return <main className="nt-shell"><section className="nt-result"><Loader2 className="animate-spin" size={34}/><h1>Number School</h1><p>Loading your grade-level questions…</p></section></main>;
  if (error) return <main className="nt-shell"><section className="nt-result"><div className="nt-burst">🏫</div><h1>Number School</h1><p>{error}</p><div className="nt-actions"><button onClick={() => void loadQuestions()}>Try Again</button><button className="secondary" onClick={() => router.push("/number-town")}>Back to Town</button></div></section></main>;
  if (complete) return <main className="nt-shell"><section className="nt-result"><div className="nt-burst">🎓</div><h1>Number School Complete!</h1><p className="nt-score">{score} / {questions.length}</p><p>Great work in {grade}. Your next lesson will continue from your grade-level question bank.</p><div className="nt-actions"><button onClick={() => { setIndex(0); setScore(0); setSelected(null); setInput(""); setFeedback(null); setComplete(false); void loadQuestions(); }}>Practice Again</button><button className="secondary" onClick={() => router.push("/number-town")}>Return to Town</button><button className="secondary" onClick={() => router.push("/games")}><Gamepad2 size={16}/> Game Hub</button></div></section></main>;

  const isInput = question.question_type === "number_input" || question.question_type === "text_input";
  return <main className="nt-shell nt-school-shell">
    <div className="nt-top"><button className="icon-btn" aria-label="Back to Number Town" onClick={() => router.push("/number-town")}><ArrowLeft size={20}/></button><div><strong>Number School</strong><small>{grade} · Mathematics</small></div><button className="pill" onClick={() => router.push("/games")}><Gamepad2 size={16}/> Game Hub</button></div>
    <section className="nt-school-card">
      <div className="nt-school-hero"><div className="nt-school-icon">🏫</div><div><span>GRADE-LEVEL LESSON</span><h1>Number School</h1><p>Question {index + 1} of {questions.length}</p></div><div className="nt-school-progress"><b>{Math.round(((index + (feedback ? 1 : 0)) / questions.length) * 100)}%</b><small>progress</small></div></div>
      <div className="nt-school-question"><div className="nt-difficulty">{question.difficulty ?? "practice"}</div><h2>{question.prompt}</h2>
        {isInput ? <div className="nt-school-input-row"><input value={input} onChange={e => setInput(e.target.value)} disabled={Boolean(feedback)} placeholder="Type your answer" onKeyDown={e => { if (e.key === "Enter") submit(input); }}/><button disabled={!input.trim() || Boolean(feedback)} onClick={() => submit(input)}>Check Answer</button></div> : <div className="nt-school-options">{options.map((option, optionIndex) => { const value = String(option.id ?? option.text ?? optionIndex); return <button key={value} className={selected === value || selected === option.text ? "selected" : ""} disabled={Boolean(feedback)} onClick={() => submit(value)}><span>{String.fromCharCode(65 + optionIndex)}</span>{option.text ?? value}</button>; })}</div>}
        {feedback && <div className={`nt-school-feedback ${feedback}`}><div>{feedback === "correct" ? <CheckCircle2 size={22}/> : <XCircle size={22}/>}<b>{feedback === "correct" ? "Correct!" : "Not quite"}</b></div>{feedback === "wrong" && <p>Correct answer: {question.answer}</p>}{question.explanation && <small>{question.explanation}</small>}<button onClick={next}>{index === questions.length - 1 ? "Finish Lesson" : "Next Question"}</button></div>}
      </div>
      <div className="nt-school-footer"><Sparkles size={17}/> Questions are selected from the {grade} Mathematics question bank.</div>
    </section>
  </main>;
}
