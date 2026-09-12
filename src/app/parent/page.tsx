"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Flame, GraduationCap, History, Plus, ShieldCheck, Trophy } from "lucide-react";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

export default function ParentPage() {
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setLearners(await getMyLearners());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your learners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-28 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700">
            <ArrowLeft size={18} /> Dashboard
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/parent/learners" className="inline-flex items-center gap-2 rounded-full bg-[#071b3a] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#0d2a52]">
              <Plus size={16} /> Manage learners
            </Link>
            <Link href="/parent/history" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm ring-1 ring-violet-100 hover:bg-violet-50">
              <History size={16} /> Learning history
            </Link>
          </div>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3"><ShieldCheck size={28} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-100">Parent dashboard</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Your learners</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">Choose a learner to review their learning history, progress and recent practice.</p>
            </div>
          </div>
        </section>

        {error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}

        {loading ? (
          <section className="mt-6 rounded-3xl bg-white p-10 text-center font-bold text-slate-500 shadow-sm">Loading your learners…</section>
        ) : learners.length === 0 ? (
          <section className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-violet-100">
            <GraduationCap className="mx-auto text-violet-500" size={46} />
            <h2 className="mt-4 text-2xl font-black text-[#071b3a]">No learners yet</h2>
            <p className="mt-2 text-sm text-slate-500">Add your first learner to start managing their learning journey.</p>
            <Link href="/parent/learners" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-3 font-black text-white">
              <Plus size={17} /> Add learner
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {learners.map((learner) => {
              const active = learner.account_status === "active";
              return (
                <article key={learner.learner_id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-4xl">{learner.avatar_emoji || "🧑‍🎓"}</div>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black text-[#071b3a]">{learner.display_name}</h2>
                      <p className="mt-1 text-sm font-bold text-violet-600">{learner.grade || "Grade not set"}</p>
                      <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {active ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-violet-50 p-3 text-center">
                      <Trophy className="mx-auto text-violet-600" size={18} />
                      <p className="mt-1 text-lg font-black text-[#071b3a]">{learner.xp}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">XP</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-3 text-center">
                      <Flame className="mx-auto text-amber-600" size={18} />
                      <p className="mt-1 text-lg font-black text-[#071b3a]">{learner.current_streak}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Streak</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-50 p-3 text-center">
                      <CalendarDays className="mx-auto text-cyan-600" size={18} />
                      <p className="mt-1 text-lg font-black text-[#071b3a]">{learner.best_streak}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Best</p>
                    </div>
                  </div>

                  <Link href={`/parent/history?learner=${encodeURIComponent(learner.learner_id)}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-sm transition hover:bg-violet-700">
                    <History size={18} /> View {learner.display_name}&apos;s history
                  </Link>
                </article>
              );
            })}
          </section>
        )}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-600">Learner accounts</p>
              <h2 className="mt-1 text-xl font-black text-[#071b3a]">Need to manage an account?</h2>
              <p className="mt-1 text-sm text-slate-500">Add learners, change passwords or enable and disable learner accounts.</p>
            </div>
            <Link href="/parent/learners" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700 hover:bg-slate-200">Manage learner accounts</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
