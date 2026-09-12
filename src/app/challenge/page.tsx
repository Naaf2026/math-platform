"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Gift,
  Home,
  Lightbulb,
  LockKeyhole,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
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
    mode?: string;
    [key: string]: unknown;
  };
};
type P = { xp: number; current_streak: number; best_streak: number };

const level = (xp: number) => Math.floor(Math.max(0, xp) / 100) + 1;

const difficultyTone: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-700",
};

export default function Challenge() {
  const [q, setQ] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [earned, setEarned] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [builtGroups, setBuiltGroups] = useState(0);

  const cur = q[i];
  const isManipulative = cur?.question_type === "manipulatives";
  const groupSize = Number(cur?.interaction_config?.each ?? 0);
  const targetGroups = Number(cur?.interaction_config?.groups ?? 0);
  const targetObjects = Number(cur?.interaction_config?.target ?? cur?.answer ?? 0);
  const progress = q.length ? ((i + (pick ? 1 : 0)) / q.length) * 100 : 0;
  const accuracy = q.length ? Math.round((correct / q.length) * 100) : 0;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const s = createClient();
    if (!s) {
      setError("Your learning account is not configured yet.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await s.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [{ data, error }, { data: p }] = await Promise.all([
      s.rpc("get_adaptive_questions", { p_limit: 5 }),
      s.from("profiles").select("xp,current_streak,best_streak").eq("id", user.id).maybeSingle(),
    ]);

    if (error || !data?.length) {
      setError(error?.message || "No challenge questions are available yet.");
      setLoading(false);
      return;
    }

    setQ(
      data.map((x: Q) => ({
        ...x,
        options: Array.isArray(x.options) ? x.options : [],
      })),
    );
    setXp(p?.xp ?? 0);
    setStreak(p?.current_streak ?? 0);
    setBest(p?.best_streak ?? 0);
    setLoading(false);
  }

  async function choose(option: string) {
    if (pick || saving || !cur) return;
    setPick(option);
    setSaving(true);
    setError("");

    const s = createClient();
    if (!s) {
      setPick(null);
      setSaving(false);
      return;
    }

    const { data, error } = await s.rpc("submit_learning_answer", {
      p_question_id: cur.id,
      p_selected_answer: option,
    });

    if (error) {
      setError(error.message || "Your answer could not be saved. Please try again.");
      setPick(null);
      setSaving(false);
      return;
    }

    const r = data?.[0];
    if (r?.is_correct) {
      const n = r.xp_awarded || 0;
      setCorrect((v) => v + 1);
      setEarned((v) => v + n);
    }

    const { data: p } = await s
      .from("profiles")
      .select("xp,current_streak,best_streak")
      .eq("id", (await s.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();

    if (p) {
      setXp(p.xp ?? 0);
      setStreak(p.current_streak ?? 0);
      setBest(p.best_streak ?? 0);
    }
    setSaving(false);
  }

  function buildGroup() {
    if (!isManipulative || pick || saving || !groupSize || !targetGroups) return;

    const nextCount = Math.min(targetGroups, builtGroups + 1);
    setBuiltGroups(nextCount);

    if (nextCount === targetGroups) {
      void choose(String(targetObjects));
    }
  }

  function removeGroup() {
    if (pick || saving) return;
    setBuiltGroups((v) => Math.max(0, v - 1));
  }

  function next() {
    if (!pick) return;
    if (i === q.length - 1) setDone(true);
    else {
      setI((v) => v + 1);
      setPick(null);
      setBuiltGroups(0);
    }
  }

  function again() {
    setQ([]);
    setI(0);
    setPick(null);
    setBuiltGroups(0);
    setCorrect(0);
    setEarned(0);
    setDone(false);
    setError("");
    setLoading(true);
    load();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5ff] grid place-items-center p-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-10 text-center shadow-2xl">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-yellow-200/70" />
          <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-pink-200/70" />
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
            <Sparkles size={48} />
          </div>
          <h1 className="relative mt-6 text-2xl font-black">Getting your challenge ready!</h1>
          <p className="relative mt-2 text-slate-500">Picking fun questions for your level...</p>
          <div className="relative mx-auto mt-6 h-2 max-w-[220px] overflow-hidden rounded-full bg-violet-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-yellow-400" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !cur) {
    return (
      <main className="min-h-screen bg-[#f7f5ff] grid place-items-center p-6">
        <div className="max-w-md rounded-[2.5rem] bg-white p-9 text-center shadow-2xl">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-100 text-rose-500">
            <Target size={40} />
          </div>
          <h1 className="mt-5 text-2xl font-black">Challenge unavailable</h1>
          <p className="mt-3 text-slate-500">{error}</p>
          <Link href="/dashboard" className="mt-7 inline-flex rounded-2xl bg-violet-600 px-6 py-3 font-black text-white shadow-lg shadow-violet-200">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    const perfect = correct === q.length;
    return (
      <main className="min-h-screen overflow-hidden bg-[#f7f5ff] text-slate-900">
        <div className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-12">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-yellow-300/40 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[3rem] bg-white shadow-2xl">
              <div className="relative bg-gradient-to-br from-violet-700 via-indigo-600 to-fuchsia-600 px-7 py-10 text-center text-white sm:px-12 sm:py-14">
                <div className="absolute left-7 top-7 text-yellow-300"><Star size={24} fill="currentColor" /></div>
                <div className="absolute right-10 top-12 text-pink-200"><Sparkles size={26} /></div>
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2.2rem] bg-white text-yellow-500 shadow-xl">
                  {perfect ? <Trophy size={60} /> : <Medal size={60} />}
                </div>
                <div className="mt-6 text-xs font-black uppercase tracking-[.24em] text-yellow-200">Daily Challenge Complete</div>
                <h1 className="mt-2 text-4xl font-black sm:text-5xl">{perfect ? "Perfect! You smashed it! 🎉" : "Amazing effort! 🌟"}</h1>
                <p className="mx-auto mt-3 max-w-xl text-indigo-100">You completed today&apos;s maths challenge and earned rewards for your effort.</p>
              </div>

              <div className="p-6 sm:p-9">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat l="Correct" v={`${correct}/${q.length}`} tone="violet" />
                  <Stat l="Accuracy" v={`${accuracy}%`} tone="pink" />
                  <Stat l="XP earned" v={`+${earned}`} tone="yellow" />
                  <Stat l="Streak" v={`${streak} 🔥`} tone="blue" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[2rem] bg-gradient-to-br from-yellow-50 to-orange-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-yellow-400 text-white shadow-md"><Gift size={21} /></div>
                      <div><div className="text-xs font-black uppercase tracking-wider text-orange-500">Today&apos;s reward</div><div className="font-black">+{earned} XP</div></div>
                    </div>
                    <p className="mt-3 text-sm text-orange-900/70">Keep practising to unlock more rewards and badges.</p>
                  </div>
                  <div className="rounded-[2rem] bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-white shadow-md"><Flame size={21} /></div>
                      <div><div className="text-xs font-black uppercase tracking-wider text-violet-500">Best streak</div><div className="font-black">{best} days</div></div>
                    </div>
                    <p className="mt-3 text-sm text-violet-900/70">Come back tomorrow and keep your learning streak alive.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[2rem] bg-slate-50 p-5">
                  <div className="flex justify-between text-sm font-black"><span>Level {level(xp)}</span><span>{xp} XP</span></div>
                  <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-yellow-400" style={{ width: `${xp % 100}%` }} /></div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{100 - (xp % 100)} XP until the next level</p>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button onClick={again} className="inline-flex justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700"><Sparkles size={18} />Play Again</button>
                  <Link href="/rewards" className="inline-flex justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3.5 font-black text-slate-900 shadow-lg shadow-yellow-100"><Trophy size={18} />View Rewards</Link>
                  <Link href="/dashboard" className="inline-flex justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-3.5 font-black text-slate-700"><Home size={18} />Dashboard</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ff] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-black text-slate-500 hover:bg-slate-100"><ArrowLeft size={18} />Dashboard</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700 sm:block">LEVEL {level(xp)}</div>
            <div className="rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-black text-yellow-800"><Zap size={15} className="mr-1 inline" />{xp} XP</div>
            <div className="rounded-full bg-orange-100 px-3 py-1.5 text-sm font-black text-orange-700"><Flame size={15} className="mr-1 inline" />{streak}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-[2.6rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-fuchsia-600 px-6 py-7 text-white shadow-2xl sm:px-9 sm:py-9">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-yellow-300/10 blur-2xl" />
          <div className="absolute left-1/2 top-8 text-yellow-300/80"><Sparkles size={28} /></div>
          <div className="relative grid gap-7 lg:grid-cols-[1fr_230px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider ring-1 ring-white/15"><Trophy size={14} className="text-yellow-300" />Daily Challenge</div>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] sm:text-5xl">Your daily maths adventure starts here! 🚀</h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-indigo-100 sm:text-lg">Solve today&apos;s questions, collect XP, build your streak and become today&apos;s Maths Star.</p>
              <div className="mt-7 max-w-2xl">
                <div className="flex items-center justify-between text-xs font-black text-indigo-100"><span>CHALLENGE PROGRESS</span><span>{i + 1} / {q.length}</span></div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-black/20 p-0.5"><div className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 transition-all duration-500" style={{ width: `${Math.max(8, progress)}%` }} /></div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[210px] rounded-[2rem] bg-white/10 p-4 text-center ring-1 ring-white/15 backdrop-blur-sm">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-yellow-300 to-orange-400 text-5xl shadow-xl">🧑‍🚀</div>
              <div className="mt-3 text-sm font-black">You&apos;ve got this!</div>
              <div className="mt-1 text-xs text-indigo-100">+{cur?.points ?? 0} XP waiting</div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_270px]">
          <section className="rounded-[2.4rem] bg-white p-5 shadow-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1.5 text-xs font-black uppercase ${difficultyTone[cur?.difficulty?.toLowerCase()] || "bg-violet-100 text-violet-700"}`}>{cur?.difficulty}</span>
                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-700">{cur?.skill}</span>
              </div>
              <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-sm font-black text-yellow-800"><Zap size={15} className="mr-1 inline" />+{cur?.points ?? 0} XP</span>
            </div>

            <div className="mt-7 flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white shadow-lg sm:grid"><Lightbulb size={25} /></div>
              <div>
                <div className="text-xs font-black uppercase tracking-[.16em] text-violet-500">Question {i + 1}</div>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{cur?.prompt}</h2>
              </div>
            </div>

            {isManipulative && groupSize > 0 && targetGroups > 0 ? (
              <div className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-50 via-fuchsia-50 to-yellow-50 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-violet-700">Build your groups</div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Make {targetGroups} groups with {groupSize} objects in each group.</p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-700 shadow-sm">{builtGroups} / {targetGroups} groups</div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: targetGroups }).map((_, groupIndex) => {
                    const built = groupIndex < builtGroups;
                    return (
                      <div key={groupIndex} className={`rounded-[1.5rem] border-2 p-4 transition-all ${built ? "border-violet-300 bg-white shadow-md" : "border-dashed border-slate-200 bg-white/60"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Group {groupIndex + 1}</span>
                          {built && <CheckCircle2 size={18} className="text-emerald-500" />}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Array.from({ length: groupSize }).map((_, objectIndex) => (
                            <span key={objectIndex} className={`grid h-9 w-9 place-items-center rounded-xl text-lg shadow-sm ${built ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-300"}`}>●</span>
                          ))}
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-400">{built ? `${groupSize} objects` : "Empty group"}</div>
                      </div>
                    );
                  })}
                </div>

                {!pick && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button onClick={removeGroup} disabled={builtGroups === 0 || saving} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-40">Remove group</button>
                    <button onClick={buildGroup} disabled={builtGroups >= targetGroups || saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-black text-white shadow-lg shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={18} />Build group</button>
                  </div>
                )}

                <div className="mt-4 text-center text-xs font-bold text-slate-500">
                  {pick ? `You built ${targetGroups} groups × ${groupSize} objects = ${targetObjects} objects.` : `Objects altogether: ${builtGroups * groupSize}`}
                </div>
              </div>
            ) : (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {cur?.options.map((o, n) => {
                  const ok = !!pick && o === cur.answer;
                  const wrong = pick === o && o !== cur.answer;
                  const selected = pick === o;
                  return (
                    <button
                      key={o}
                      onClick={() => choose(o)}
                      disabled={!!pick || saving}
                      className={`group min-h-[76px] rounded-[1.5rem] border-2 p-4 text-left font-black transition-all duration-200 ${ok ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-lg shadow-emerald-100" : wrong ? "border-rose-400 bg-rose-50 text-rose-800" : selected ? "border-violet-400 bg-violet-50" : "border-slate-100 bg-slate-50 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-lg"}`}
                    >
                      <span className={`mr-3 inline-grid h-10 w-10 place-items-center rounded-xl text-sm shadow-sm ${ok ? "bg-emerald-500 text-white" : wrong ? "bg-rose-500 text-white" : "bg-white text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700"}`}>{String.fromCharCode(65 + n)}</span>
                      {o}
                      {ok && <CheckCircle2 className="float-right mt-2" size={21} />}
                      {wrong && <XCircle className="float-right mt-2" size={21} />}
                    </button>
                  );
                })}
              </div>
            )}

            {pick && (
              <div className={`mt-6 rounded-[1.7rem] p-5 ${pick === cur.answer ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900" : "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900"}`}>
                <div className="flex items-start gap-3"><div className="text-2xl">{pick === cur.answer ? "🎉" : "💡"}</div><div><div className="font-black">{pick === cur.answer ? "Correct! Brilliant work!" : `Almost! The answer is ${cur.answer}.`}</div><p className="mt-1 text-sm leading-6 opacity-80">{cur.explanation}</p></div></div>
              </div>
            )}

            {error && pick === null && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

            <div className="mt-7 flex items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-400">{saving ? "Saving your answer..." : pick ? "Nice! Ready for the next one?" : isManipulative ? "Build all the groups to answer" : "Choose an answer to continue"}</div>
              <button onClick={next} disabled={!pick || saving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">{i === q.length - 1 ? "Finish Challenge" : "Next Question"}<ArrowRight size={18} /></button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] bg-gradient-to-br from-yellow-300 to-orange-400 p-5 text-slate-900 shadow-xl">
              <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-orange-500"><Flame size={24} fill="currentColor" /></div><div><div className="text-xs font-black uppercase tracking-wider text-orange-800">Streak</div><div className="text-2xl font-black">{streak} days</div></div></div>
              <p className="mt-4 text-sm font-bold text-orange-950/70">Answer questions every day to keep your flame growing!</p>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-black"><Gift size={19} className="text-fuchsia-500" />Today&apos;s Rewards</div>
              <div className="mt-4 space-y-3">
                <RewardRow icon="⚡" label="XP" value={`+${cur?.points ?? 0}`} />
                <RewardRow icon="🔥" label="Streak" value="+1 day" />
                <RewardRow icon="🏆" label="Challenge" value="Complete" />
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-indigo-50 to-violet-100 p-5">
              <div className="flex items-center gap-2 text-sm font-black text-violet-800"><Medal size={18} />Challenge Map</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {q.map((item, n) => (
                  <div key={item.id} className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black ${n < i ? "bg-emerald-400 text-white" : n === i ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-white text-slate-400"}`}>{n < i ? <CheckCircle2 size={17} /> : n + 1}</div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-violet-700"><LockKeyhole size={14} />Complete the challenge to unlock your reward.</div>
            </div>
          </aside>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Mini icon={<Target size={18} />} l="Today" v={`${q.length} questions`} />
          <Mini icon={<Zap size={18} />} l="XP earned" v={`+${earned}`} />
          <Mini icon={<Flame size={18} />} l="Best streak" v={`${best} days`} />
        </div>
      </div>
    </main>
  );
}

function Stat({ l, v, tone }: { l: string; v: string; tone: "violet" | "pink" | "yellow" | "blue" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    pink: "bg-pink-50 text-pink-700",
    yellow: "bg-yellow-50 text-yellow-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return <div className={`rounded-2xl p-4 ${tones[tone]}`}><div className="text-2xl font-black">{v}</div><div className="mt-1 text-xs font-black uppercase tracking-wider opacity-60">{l}</div></div>;
}

function RewardRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5"><div className="flex items-center gap-2"><span className="text-lg">{icon}</span><span className="text-sm font-bold text-slate-600">{label}</span></div><span className="text-sm font-black text-slate-900">{value}</span></div>;
}

function Mini({ icon, l, v }: { icon: React.ReactNode; l: string; v: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><div className="rounded-xl bg-violet-100 p-2 text-violet-600">{icon}</div><div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{l}</div><div className="font-black">{v}</div></div></div>;
}
