"use client";

import Link from "next/link";
import { Award, Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
};

type StudentStats = Profile & { achievementCount: number };

export function getLevel(xp: number) {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

export function getLevelProgress(xp: number) {
  const safeXp = Math.max(0, xp);
  const level = getLevel(safeXp);
  const intoLevel = safeXp % 100;
  return {
    level,
    intoLevel,
    remaining: intoLevel === 0 ? 100 : 100 - intoLevel,
    percent: intoLevel,
  };
}

function useStudentStats() {
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    if (!supabase) return;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const [{ data: profile }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,xp,current_streak,best_streak")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("student_achievements")
          .select("id", { count: "exact", head: true })
          .eq("student_id", user.id),
      ]);

      if (mounted) {
        setStats({
          full_name: profile?.full_name ?? null,
          xp: profile?.xp ?? 0,
          current_streak: profile?.current_streak ?? 0,
          best_streak: profile?.best_streak ?? 0,
          achievementCount: count ?? 0,
        });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return stats;
}

export function StudentProfilePill({ mobile = false }: { mobile?: boolean }) {
  const stats = useStudentStats();

  if (!stats) {
    return mobile
      ? <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />
      : <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100" aria-hidden="true" />;
  }

  const xp = stats.xp ?? 0;
  const { level, percent } = getLevelProgress(xp);
  const name = stats.full_name?.trim() || "Student";
  const initial = name.charAt(0).toUpperCase();

  if (mobile) {
    return (
      <Link href="/profile" className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-3 py-2.5 shadow-sm transition active:scale-[0.99]">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 text-sm font-black text-white">
          {initial}
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-yellow-400 px-1 text-[9px] font-black text-slate-900">{level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-black text-slate-900">{name}</p>
            <p className="shrink-0 text-[10px] font-black text-violet-600">{xp} XP</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.max(4, percent)}%` }} />
          </div>
        </div>
        <div className="hidden items-center gap-1 text-[10px] font-black text-orange-500 xs:flex sm:flex">
          <Flame className="h-3.5 w-3.5" /> {stats.current_streak ?? 0}
        </div>
      </Link>
    );
  }

  return (
    <Link href="/profile" className="group hidden w-16 flex-col items-center gap-1 rounded-2xl p-1.5 transition hover:bg-violet-50 lg:flex" title="Open student profile" aria-label="Open student profile">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-400 text-base font-black text-white shadow-lg shadow-violet-200 ring-2 ring-white">
        {initial}
        <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-yellow-400 px-1 text-[10px] font-black text-slate-900 shadow-sm">{level}</span>
      </div>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${Math.max(4, percent)}%` }} />
      </div>
    </Link>
  );
}

export default function StudentProfile({ compact = false }: { compact?: boolean }) {
  const stats = useStudentStats();

  if (!stats) return <div className="min-h-72 animate-pulse rounded-[2rem] bg-slate-100" />;

  const xp = stats.xp ?? 0;
  const { level, intoLevel, remaining, percent } = getLevelProgress(xp);
  const name = stats.full_name?.trim() || "Student";
  const initial = name.charAt(0).toUpperCase();

  return (
    <section className={compact ? "rounded-3xl border border-violet-100 bg-white p-5 shadow-sm" : "overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-xl shadow-violet-100/50"}>
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/20 text-2xl font-black ring-4 ring-white/20">{initial}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Student profile</p>
            <h1 className="truncate text-2xl font-black">{name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-900">LEVEL {level}</span>
              <span className="text-sm font-bold text-white/80">{xp.toLocaleString()} XP</span>
            </div>
          </div>
          <Sparkles className="hidden h-8 w-8 text-yellow-300 sm:block" />
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">XP to next level</p>
            <p className="text-xs font-bold text-slate-500">{remaining} XP remaining</p>
          </div>
          <span className="text-sm font-black text-violet-600">{intoLevel}/100</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all" style={{ width: `${Math.max(3, percent)}%` }} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={<Flame className="h-5 w-5" />} label="Current streak" value={`${stats.current_streak ?? 0} days`} />
          <Stat icon={<Trophy className="h-5 w-5" />} label="Best streak" value={`${stats.best_streak ?? 0} days`} />
          <Stat icon={<Award className="h-5 w-5" />} label="Achievements" value={`${stats.achievementCount}`} />
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-50 p-4 text-sm font-bold text-violet-900">
          <Zap className="h-5 w-5 shrink-0 text-yellow-500" />
          Keep learning to earn XP and unlock the next level.
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">{icon}</div>
      <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
