"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Flame, Home, Target, Trophy, Users, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  grade: string | null;
  xp: number;
  current_streak: number;
};
type Topic = { id: string; title: string; description: string };
type TopicProgress = { topic_id: string; questions_answered: number; correct_answers: number };

const topicIds = ["place-value", "fractions", "addition-subtraction", "multiplication"];
const topicVisuals = [
  { icon: "🔢", bg: "from-sky-50 to-cyan-50", bar: "from-cyan-400 to-blue-500" },
  { icon: "🍕", bg: "from-violet-50 to-fuchsia-50", bar: "from-violet-500 to-fuchsia-500" },
  { icon: "➕", bg: "from-emerald-50 to-teal-50", bar: "from-emerald-400 to-teal-500" },
  { icon: "✖️", bg: "from-orange-50 to-amber-50", bar: "from-orange-400 to-rose-500" },
];

function gradeLabel(value: string | null | undefined) {
  const match = String(value || "").match(/[1-7]/);
  return match ? `Grade ${match[0]}` : "Grade 3";
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }

      const [{ data: row }, { data: ts }, { data: tp }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,grade,xp,current_streak")
          .eq("id", auth.user.id)
          .maybeSingle(),
        supabase.from("learning_topics").select("id,title,description").order("sort_order"),
        supabase
          .from("topic_progress")
          .select("topic_id,questions_answered,correct_answers")
          .eq("user_id", auth.user.id),
      ]);

      setProfile(
        row ?? {
          full_name: auth.user.user_metadata?.full_name ?? "Student",
          grade: null,
          xp: 0,
          current_streak: 0,
        },
      );
      setTopics((ts ?? []) as Topic[]);
      setTopicProgress((tp ?? []) as TopicProgress[]);
      setLoading(false);
    }

    void load();
  }, []);

  const firstName = (profile?.full_name || "Student").split(" ")[0];
  const grade = gradeLabel(profile?.grade);
  const displayTopics = useMemo(
    () =>
      topicIds.map((id, index) => {
        const topic = topics.find((item) => item.id === id);
        const progress = topicProgress.find((item) => item.topic_id === id);
        const percent =
          progress && progress.questions_answered > 0
            ? Math.min(100, Math.round((progress.correct_answers / progress.questions_answered) * 100))
            : 0;
        return {
          id,
          title:
            topic?.title ||
            id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
          percent,
          visual: topicVisuals[index],
        };
      }),
    [topics, topicProgress],
  );

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef8ff] p-6">
        <div className="rounded-3xl bg-white px-8 py-6 font-black text-[#073d78] shadow-xl">
          Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      {/* Simple child-first header */}
      <header className="sticky top-0 z-40 h-[68px] bg-[#073d78] text-white shadow-md">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-black text-[#073d78] shadow-sm">
              FV
            </div>
            <div>
              <p className="text-sm font-black tracking-wide sm:text-base">FAHI VISSNUN</p>
              <p className="text-[10px] font-semibold text-blue-200 sm:text-xs">Math Learning Platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-sm font-black sm:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
              <Home size={17} /> <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="rounded-full bg-white/10 px-3 py-2 text-xs sm:px-4 sm:text-sm">{grade}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:py-7">
        {/* Compact learner identity strip */}
        <section className="rounded-[2rem] bg-gradient-to-r from-[#c9f0ff] via-[#e8faff] to-white px-5 py-5 shadow-sm sm:px-8 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-300 to-orange-400 text-4xl shadow-md sm:h-[88px] sm:w-[88px]">
                🧒
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 sm:text-sm">{grade}</p>
                <h1 className="mt-0.5 text-2xl font-black tracking-tight sm:text-4xl">Hi {firstName}! 👋</h1>
                <p className="mt-1 text-xs font-semibold text-[#55758f] sm:text-sm">Ready for today’s math adventure?</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                <Flame className="mx-auto text-orange-500" size={20} />
                <p className="mt-1 text-sm font-black">{profile?.current_streak ?? 0}</p>
                <p className="text-[10px] font-bold text-slate-400">Day Streak</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                <span className="text-xl">⭐</span>
                <p className="mt-1 text-sm font-black">{profile?.xp ?? 0}</p>
                <p className="text-[10px] font-bold text-slate-400">XP</p>
              </div>
            </div>
          </div>
        </section>

        {/* Only the three requested activities */}
        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <Link
            href="/challenge"
            className="group relative min-h-[285px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ffd91f] via-[#ffc20d] to-[#ff8b00] p-6 text-[#4b2700] shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[310px] sm:p-8"
          >
            <div className="absolute -right-4 -top-5 text-[120px] opacity-20 transition group-hover:scale-105">🏆</div>
            <span className="relative rounded-full bg-white/30 px-4 py-1.5 text-xs font-black uppercase">Daily</span>
            <h2 className="relative mt-10 text-4xl font-black leading-[0.95] sm:text-5xl">Daily<br />Challenge</h2>
            <p className="relative mt-4 font-bold">10 Questions • Earn XP ⭐</p>
            <span className="absolute bottom-7 left-6 right-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#19a95b] px-6 py-3.5 text-base font-black text-white shadow-md sm:left-8 sm:right-8">
              START <Zap size={18} fill="currentColor" />
            </span>
          </Link>

          <Link
            href="/training"
            className="group relative min-h-[285px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2bc2f4] to-[#197bdc] p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[310px] sm:p-8"
          >
            <div className="absolute -right-3 -top-4 text-[115px] opacity-20 transition group-hover:scale-105">📚</div>
            <BookOpen size={42} />
            <h2 className="relative mt-14 text-4xl font-black sm:text-5xl">Training</h2>
            <p className="relative mt-2 text-lg font-bold text-blue-50">Practice your skills</p>
            <span className="absolute bottom-7 left-6 right-6 rounded-full bg-white/15 px-6 py-3.5 text-center font-black ring-2 ring-white/80 sm:left-8 sm:right-8">
              PRACTICE →
            </span>
          </Link>

          <Link
            href="/peer-challenge"
            className="group relative min-h-[285px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ff9f22] to-[#ff5d10] p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[310px] sm:p-8"
          >
            <div className="absolute -right-2 -top-3 text-[105px] opacity-20 transition group-hover:scale-105">🤝</div>
            <Users size={42} />
            <h2 className="relative mt-14 text-3xl font-black sm:text-4xl">Peer Challenge</h2>
            <p className="relative mt-2 text-lg font-bold text-orange-50">Challenge a friend</p>
            <span className="absolute bottom-7 left-6 right-6 rounded-full bg-white/15 px-6 py-3.5 text-center font-black ring-2 ring-white/80 sm:left-8 sm:right-8">
              PLAY →
            </span>
          </Link>
        </section>

        {/* Simple continuation area — no extra dashboard modules */}
        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-lg shadow-blue-100/50 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Target className="text-red-500" size={27} />
              <h2 className="text-2xl font-black sm:text-3xl">Continue Learning</h2>
            </div>
            <Link href="/training" className="text-sm font-black text-blue-600">View All →</Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {displayTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/training?topic=${encodeURIComponent(topic.id)}`}
                className={`rounded-2xl bg-gradient-to-br ${topic.visual.bg} p-4 transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{topic.visual.icon}</span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black sm:text-lg">{topic.title}</h3>
                    <p className="text-xs font-bold text-slate-500">{grade}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
                    <div className={`h-full rounded-full bg-gradient-to-r ${topic.visual.bar}`} style={{ width: `${topic.percent}%` }} />
                  </div>
                  <span className="text-xs font-black">{topic.percent}%</span>
                </div>
                <div className="mt-3 rounded-full border border-white/90 bg-white/65 py-2 text-center text-xs font-black">
                  CONTINUE →
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile navigation intentionally stays minimal */}
      <nav className="sticky bottom-0 z-30 grid grid-cols-3 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="grid place-items-center gap-1 rounded-xl bg-blue-50 py-2 text-[10px] font-black text-blue-600">
          <Home size={19} /> Home
        </Link>
        <Link href="/training" className="grid place-items-center gap-1 py-2 text-[10px] font-black text-slate-500">
          <BookOpen size={19} /> Training
        </Link>
        <Link href="/peer-challenge" className="grid place-items-center gap-1 py-2 text-[10px] font-black text-slate-500">
          <Users size={19} /> Peer
        </Link>
      </nav>
    </main>
  );
}
