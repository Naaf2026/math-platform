"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, CheckCircle2, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdaptiveMissionFeedback from "@/components/adaptive-mission-feedback";

type Item = {
  id: string;
  topic_id: string;
  topic: string;
  difficulty: string;
  adaptive_reason: string;
};

type TopicProgress = {
  topic_id: string;
  topic: string;
  questions_answered: number;
  correct_answers: number;
};

function mastery(row: TopicProgress) {
  return Math.round((row.correct_answers / Math.max(row.questions_answered, 1)) * 100);
}

function reason(score: number) {
  if (score < 50) return "Remediation: strengthen this skill";
  if (score < 70) return "Practice: build consistency";
  if (score < 90) return "Progression: increase difficulty";
  return "Challenge: extend mastery";
}

export default function AdaptiveMissionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      if (!supabase) {
        setError("Your learning account is not configured yet.");
        setLoading(false);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }

      const [{ data, error: pathError }, { data: progress, error: progressError }] = await Promise.all([
        supabase.rpc("get_adaptive_learning_path", { p_limit: 10 }),
        supabase.from("topic_progress").select("topic_id,topic,questions_answered,correct_answers").eq("user_id", auth.user.id),
      ]);

      if (pathError || progressError) {
        setError(pathError?.message || progressError?.message || "Adaptive insights are unavailable right now.");
        setLoading(false);
        return;
      }

      setItems((data || []) as Item[]);
      setTopics((progress || []) as TopicProgress[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-[#eef4ff] p-6"><div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center"><div className="rounded-[2rem] bg-white p-10 text-center shadow-xl"><div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Brain /></div><p className="mt-5 font-black text-slate-700">Analysing your learning path…</p></div></div></main>;
  }

  if (error) {
    return <main className="min-h-screen bg-[#eef4ff] p-6"><div className="mx-auto max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-xl"><p className="font-bold text-amber-700">{error}</p><Link href="/mission" className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-black text-white">Back to Mission</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#eef4ff] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center gap-3">
          <Link href="/mission" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm"><ArrowLeft size={18} /></Link>
          <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-600">FAHI VISSNUN MATHS</p><h1 className="text-2xl font-black text-[#15233f]">Your Adaptive Learning Path</h1></div>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Sparkles /></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/70">Adaptive Intelligence</p><h2 className="text-2xl font-black">Every challenge has a reason.</h2></div></div>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-white/75">Your recent performance determines whether the next activity reinforces a foundation, builds consistency, increases difficulty, or stretches mastery.</p>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[2rem] bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Next challenges</p><h2 className="mt-1 text-xl font-black text-[#15233f]">Why these questions?</h2></div><Target className="text-violet-500" /></div>
            <div className="mt-5 space-y-3">
              {items.map((item) => <AdaptiveMissionFeedback key={item.id} reason={item.adaptive_reason} topic={item.topic} />)}
              {!items.length && <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">Complete a few questions in Daily Mission to generate adaptive recommendations.</p>}
            </div>
          </section>

          <aside className="rounded-[2rem] bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-center gap-2"><TrendingUp size={18} className="text-violet-600" /><h2 className="font-black text-[#15233f]">Topic mastery</h2></div>
            <div className="mt-5 space-y-4">
              {topics.map((topic) => { const score = mastery(topic); return <div key={topic.topic_id}><div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-700">{topic.topic}</p><span className="text-xs font-black text-violet-600">{score}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${Math.min(100, score)}%` }} /></div><p className="mt-1 text-[10px] font-bold text-slate-400">{topic.questions_answered} answered · {topic.correct_answers} correct</p><div className="mt-2 flex items-center gap-1 text-[10px] font-black text-slate-500"><CheckCircle2 size={12} className="text-emerald-500" /> {reason(score).split(":")[0]}</div></div>; })}
              {!topics.length && <p className="text-sm font-bold text-slate-500">No topic history yet. Start your Daily Mission.</p>}
            </div>
            <div className="mt-6 rounded-2xl bg-orange-50 p-4"><div className="flex items-center gap-2 text-orange-700"><Flame size={16} /><p className="text-xs font-black uppercase tracking-wider">Keep going</p></div><p className="mt-1 text-xs font-bold leading-5 text-orange-900">Consistent practice gives the adaptive engine more evidence and makes recommendations more precise.</p></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
