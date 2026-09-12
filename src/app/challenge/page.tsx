"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Q = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  skill: string;
  points: number;
  question_type?: string;
  interaction_config?: {
    each?: number;
    groups?: number;
    target?: number;
    [key: string]: unknown;
  };
};

type Profile = {
  xp: number;
  current_streak: number;
  best_streak: number;
};

const stages = [
  { name: "Elementary", unlock: 0, icon: "🌱", color: "from-emerald-300 to-lime-300" },
  { name: "Intermediate", unlock: 15, icon: "🚀", color: "from-sky-300 to-cyan-300" },
  { name: "Advanced", unlock: 50, icon: "🦊", color: "from-violet-300 to-fuchsia-300" },
  { name: "Master", unlock: 100, icon: "👑", color: "from-amber-300 to-orange-300" },
];

export default function Challenge() {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [earned, setEarned] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [built, setBuilt] = useState(0);
  const [stage, setStage] = useState(0);

  const current = questions[index];
  const isManipulative = current?.question_type === "manipulatives";
  const each = Number(current?.interaction_config?.each ?? 0);
  const groups = Number(current?.interaction_config?.groups ?? 0);
  const target = Number(current?.interaction_config?.target ?? current?.answer ?? 0);
  const unlocked = stages.map((item, n) => n === 0 || xp >= item.unlock);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const supabase = createClient();
    if (!supabase) {
      setError("Your learning account is not configured yet.");
      setLoading(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [{ data, error: questionError }, { data: profile }] = await Promise.all([
      supabase.rpc("get_adaptive_questions", { p_limit: 10 }),
      supabase
        .from("profiles")
        .select("xp,current_streak,best_streak")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (questionError || !data?.length) {
      setError(questionError?.message || "No challenge questions are available yet.");
      setLoading(false);
      return;
    }

    setQuestions(
      data.map((item: Q) => ({
        ...item,
        options: Array.isArray(item.options) ? item.options : [],
      })),
    );
    setXp(profile?.xp ?? 0);
    setStreak(profile?.current_streak ?? 0);
    setBest(profile?.best_streak ?? 0);
    setStage(0);
    setLoading(false);
  }

  async function choose(answer: string) {
    if (selected !== null || saving || !current) return;

    setSelected(answer);
    setSaving(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setSelected(null);
      setSaving(false);
      return;
    }

    const { data, error: submitError } = await supabase.rpc("submit_learning_answer", {
      p_question_id: current.id,
      p_selected_answer: answer,
    });

    if (submitError) {
      setError(submitError.message || "Your answer could not be saved.");
      setSelected(null);
      setSaving(false);
      return;
    }

    const result = data?.[0];
    if (result?.is_correct) {
      const amount = Number(result.xp_awarded || 0);
      setCorrect((value) => value + 1);
      setEarned((value) => value + amount);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("xp,current_streak,best_streak")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();

    if (profile) {
      setXp(profile.xp ?? 0);
      setStreak(profile.current_streak ?? 0);
      setBest(profile.best_streak ?? 0);
    }

    setSaving(false);
  }

  function buildGroup() {
    if (!isManipulative || selected !== null || saving) return;
    const nextBuilt = Math.min(groups, built + 1);
    setBuilt(nextBuilt);
    if (nextBuilt === groups) void choose(String(target));
  }

  function nextQuestion() {
    if (!selected || saving) return;

    if (index === questions.length - 1) {
      setDone(true);
      return;
    }

    setIndex((value) => value + 1);
    setSelected(null);
    setBuilt(0);
    setError("");
  }

  function again() {
    setQuestions([]);
    setIndex(0);
    setSelected(null);
    setBuilt(0);
    setCorrect(0);
    setEarned(0);
    setDone(false);
    setError("");
    setLoading(true);
    void load();
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef4ff] p-6">
        <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-violet-500 to-fuchsia-500 text-5xl">
            🚀
          </div>
          <h1 className="mt-6 text-2xl font-black">Getting your challenge ready!</h1>
          <p className="mt-2 text-slate-500">Picking today's maths adventure...</p>
        </div>
      </main>
    );
  }

  if (error && !current) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef4ff] p-6">
        <div className="rounded-[2.5rem] bg-white p-9 text-center shadow-2xl">
          <h1 className="text-2xl font-black">Challenge unavailable</h1>
          <p className="mt-3 text-slate-500">{error}</p>
          <button
            onClick={again}
            className="mt-6 rounded-2xl bg-violet-600 px-6 py-3 font-black text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef4ff] p-6">
        <div className="w-full max-w-2xl rounded-[3rem] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2.2rem] bg-yellow-100 text-yellow-500">
            <Trophy size={60} />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-violet-500">
            Daily Challenge Complete
          </p>
          <h1 className="mt-2 text-4xl font-black">Amazing work! 🎉</h1>
          <div className="mt-7 grid grid-cols-3 gap-3">
            <Stat label="Correct" value={`${correct}/${questions.length}`} />
            <Stat label="XP earned" value={`+${earned}`} />
            <Stat label="Streak" value={`${streak} 🔥`} />
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={again}
              className="rounded-2xl bg-violet-600 px-6 py-3 font-black text-white"
            >
              Play Again
            </button>
            <Link href="/dashboard" className="rounded-2xl bg-slate-100 px-6 py-3 font-black">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const progress = questions.length
    ? Math.round(((index + (selected ? 1 : 0)) / questions.length) * 100)
    : 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eaf5dc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-[#17251c] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-black"
          >
            <ArrowLeft size={17} />
            Back
          </Link>
          <div className="font-black tracking-wide">FAHI VISSNUN MATHS</div>
          <div className="flex gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black">⚡ {xp} XP</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black">🔥 {streak}</span>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-300 px-4 pb-7 pt-5 shadow-md">
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#eaf5dc] to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="rounded-full bg-white/25 px-5 py-2 font-black text-white shadow-sm"
            >
              ‹ Back
            </Link>
            <h1 className="text-2xl font-black text-white drop-shadow-sm sm:text-3xl">Daily Challenge</h1>
            <div className="w-20" />
          </div>

          <div className="mt-5 overflow-x-auto pb-2">
            <div className="mx-auto flex min-w-[700px] items-start justify-center gap-4 sm:gap-8">
              {stages.map((item, n) => {
                const active = n === stage;
                const isUnlocked = unlocked[n];
                return (
                  <div key={item.name} className="flex min-w-[135px] flex-col items-center">
                    <button
                      onClick={() => isUnlocked && selected === null && setStage(n)}
                      disabled={!isUnlocked || selected !== null}
                      className={`relative grid h-20 w-20 place-items-center rounded-full border-4 bg-gradient-to-br text-4xl transition ${item.color} ${active ? "scale-110 border-white shadow-2xl" : "border-white/50"} ${!isUnlocked ? "grayscale opacity-50" : ""}`}
                    >
                      {item.icon}
                      {!isUnlocked && (
                        <span className="absolute -right-1 bottom-0 grid h-7 w-7 place-items-center rounded-full bg-slate-700 text-white">
                          <LockKeyhole size={14} />
                        </span>
                      )}
                    </button>
                    <div className={`mt-2 text-sm font-black ${active ? "text-slate-900" : "text-slate-700"}`}>
                      {item.name}
                    </div>
                    {n > 0 && (
                      <div className="mt-1 text-[10px] font-black text-slate-700/60">
                        {isUnlocked ? "UNLOCKED" : `🔒 ${item.unlock} XP`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-5 sm:px-6">
        <div className="-mt-2 rounded-[2.5rem] bg-gradient-to-b from-[#184b20] to-[#0b3016] p-5 shadow-2xl sm:p-8">
          <div className="relative overflow-hidden rounded-[2rem] border-4 border-white/10 bg-[#3f9a3e] p-4 sm:p-7">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, white 0 3px, transparent 4px), radial-gradient(circle at 70% 60%, white 0 2px, transparent 3px)",
                backgroundSize: "90px 80px,120px 100px",
              }}
            />
            <div className="relative mx-auto max-w-5xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[.2em] text-white/70">
                    {stages[stage].name} Challenge
                  </div>
                  <h2 className="mt-1 text-2xl font-black text-white">Today's Adventure</h2>
                </div>
                <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-700">
                  {index + 1} / {questions.length}
                </div>
              </div>

              <div className="relative min-h-[230px] rounded-[2rem] bg-[#6fb85b] p-5 shadow-inner sm:min-h-[280px]">
                <div className="absolute left-[8%] right-[8%] top-[42%] h-20 -rotate-2 rounded-[3rem] border-[18px] border-[#1f3325] bg-transparent shadow-[0_0_0_5px_rgba(255,255,255,.16)]" />
                <div className="absolute left-[28%] right-[27%] top-[58%] h-20 rotate-2 rounded-[3rem] border-[18px] border-[#1f3325] bg-transparent" />

                <div className="relative z-10 grid grid-cols-5 gap-3 sm:grid-cols-10">
                  {Array.from({ length: questions.length }).map((_, n) => {
                    const complete = n < index || (n === index && selected !== null);
                    const currentNode = n === index && selected === null;
                    return (
                      <div key={n} className="flex flex-col items-center">
                        <button
                          onClick={() => n === index && setSelected(null)}
                          className={`grid h-14 w-14 place-items-center rounded-full border-4 text-xl font-black shadow-xl transition hover:scale-105 sm:h-16 sm:w-16 ${complete ? "border-white bg-emerald-400 text-white" : currentNode ? "scale-110 border-white bg-amber-300 text-slate-800 ring-4 ring-white/30" : "border-white/60 bg-slate-200 text-slate-500"}`}
                        >
                          {complete ? <CheckCircle2 size={26} /> : n + 1}
                        </button>
                        <span className="mt-1 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-black text-white">
                          {n < 5 ? "+1 XP" : n < 8 ? "+2 XP" : "+3 XP"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute bottom-3 left-4 text-4xl">🌳</div>
                <div className="absolute bottom-3 right-5 text-4xl">🌳</div>
                <div className="absolute right-[15%] top-4 text-4xl">☁️</div>
                <div className="absolute bottom-3 left-[45%] text-4xl">🧑‍🚀</div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-black text-slate-700">
                  🏆 Complete all questions to earn your daily reward
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-black text-white">⭐ {earned} XP</span>
                  <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-black text-white">🔥 {streak} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
        <section className="rounded-[2.3rem] bg-white p-5 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase text-amber-700">
                {current.difficulty}
              </span>
              <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-700">
                {current.skill}
              </span>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-black text-yellow-800">
              ⚡ +{current.points} XP
            </span>
          </div>

          <div className="mt-6 flex gap-4">
            <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-pink-500 text-white sm:grid">💡</div>
            <div>
              <div className="text-xs font-black uppercase tracking-[.16em] text-violet-500">Question {index + 1}</div>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{current.prompt}</h2>
            </div>
          </div>

          {isManipulative && each > 0 && groups > 0 ? (
            <div className="mt-6 rounded-[2rem] bg-gradient-to-br from-violet-50 to-yellow-50 p-5">
              <div className="flex justify-between font-black">
                <span>Build your groups</span>
                <span>{built} / {groups}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: groups }).map((_, groupIndex) => (
                  <div
                    key={groupIndex}
                    className={`rounded-2xl border-2 p-4 ${groupIndex < built ? "border-violet-300 bg-white" : "border-dashed border-slate-200 bg-white/60"}`}
                  >
                    <div className="text-xs font-black text-slate-500">GROUP {groupIndex + 1}</div>
                    <div className="mt-3 flex gap-2">
                      {Array.from({ length: each }).map((_, objectIndex) => (
                        <span
                          key={objectIndex}
                          className={`grid h-9 w-9 place-items-center rounded-xl ${groupIndex < built ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-300"}`}
                        >
                          ●
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {!selected && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={buildGroup}
                    disabled={saving || built >= groups}
                    className="rounded-2xl bg-violet-600 px-7 py-3 font-black text-white disabled:opacity-40"
                  >
                    ✨ Build group
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {current.options.map((option, optionIndex) => {
                const isCorrect = selected !== null && option === current.answer;
                const isWrong = selected === option && option !== current.answer;
                return (
                  <button
                    key={option}
                    onClick={() => choose(option)}
                    disabled={selected !== null || saving}
                    className={`min-h-[72px] rounded-2xl border-2 p-4 text-left font-black ${isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-800" : isWrong ? "border-rose-400 bg-rose-50 text-rose-800" : "border-slate-100 bg-slate-50 hover:border-violet-300"}`}
                  >
                    <span className="mr-3 inline-grid h-9 w-9 place-items-center rounded-xl bg-white">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {selected && (
            <div
              className={`mt-5 rounded-2xl p-4 font-bold ${selected === current.answer ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
            >
              {selected === current.answer ? "🎉 Correct!" : "💡 Almost!"}{" "}
              <span className="font-medium">{current.explanation}</span>
            </div>
          )}

          {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400">
              {saving
                ? "Saving your answer..."
                : selected
                  ? "Great! Continue your adventure."
                  : isManipulative
                    ? "Build all groups to answer"
                    : "Choose an answer to continue"}
            </span>
            <button
              onClick={nextQuestion}
              disabled={!selected || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 font-black text-white disabled:opacity-40"
            >
              {index === questions.length - 1 ? "Finish" : "Next Question"}
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}
