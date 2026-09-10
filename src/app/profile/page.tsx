"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Flame, Trophy, Target } from "lucide-react";
import StudentProfile from "@/components/student-profile";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:pl-28 lg:pr-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-white hover:text-violet-600">
          <ArrowLeft className="h-4 w-4" /> Back to learning hub
        </Link>

        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-600">Your learning identity</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Student Profile</h1>
          <p className="mt-2 max-w-2xl font-medium text-slate-500">Track your level, XP, streaks and achievements in one place.</p>
        </div>

        <StudentProfile />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link href="/mission" className="rounded-3xl bg-violet-600 p-5 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5">
            <Target className="h-7 w-7" />
            <p className="mt-4 text-lg font-black">Continue Mission</p>
            <p className="mt-1 text-sm font-bold text-white/75">Earn XP and build your streak.</p>
          </Link>
          <Link href="/progress" className="rounded-3xl bg-cyan-500 p-5 text-white shadow-lg shadow-cyan-100 transition hover:-translate-y-0.5">
            <BookOpen className="h-7 w-7" />
            <p className="mt-4 text-lg font-black">View Progress</p>
            <p className="mt-1 text-sm font-bold text-white/75">See your maths mastery.</p>
          </Link>
          <Link href="/rewards" className="rounded-3xl bg-yellow-400 p-5 text-slate-950 shadow-lg shadow-yellow-100 transition hover:-translate-y-0.5">
            <Trophy className="h-7 w-7" />
            <p className="mt-4 text-lg font-black">Open Rewards</p>
            <p className="mt-1 text-sm font-bold text-slate-700/75">Check badges and milestones.</p>
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <Flame className="mt-0.5 h-6 w-6 shrink-0 text-orange-500" />
            <div>
              <p className="font-black text-orange-950">Streak tip</p>
              <p className="mt-1 text-sm font-medium text-orange-900/75">Complete at least one learning activity each day to keep your current streak growing.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
