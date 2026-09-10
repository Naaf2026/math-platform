"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, LogOut, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = { full_name: string | null; grade: string | null; learning_level: string | null; xp: number };

const topics = [
  ["Number Sense", "Numbers, place value and mental maths"],
  ["Arithmetic", "Operations, fractions and decimals"],
  ["Problem Solving", "Reasoning and mathematical thinking"],
  ["Geometry", "Shapes, space and measurement"],
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("Loading your learning space…");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setStatus("Supabase is not configured yet."); return; }
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) { window.location.href = "/login"; return; }
      const { data: row } = await supabase.from("profiles").select("full_name, grade, learning_level, xp").eq("id", data.user.id).maybeSingle();
      setProfile(row ?? { full_name: data.user.user_metadata?.full_name ?? "Student", grade: null, learning_level: null, xp: 0 });
      setStatus("");
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (status) return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] p-6"><div className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-semibold text-[#071b3a]">{status}</p><Link href="/login" className="mt-4 inline-block text-sm font-bold text-[#0d666b]">Go to student login</Link></div></main>;

  return <main className="min-h-screen bg-[#f7f9fc]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><div><p className="text-sm font-black tracking-wide text-[#071b3a]">FAHI VISSNUN</p><p className="text-xs text-slate-500">Student Learning Space</p></div><button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"><LogOut size={16}/> Sign out</button></div></header>
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <section className="rounded-3xl bg-[#071b3a] p-7 text-white shadow-xl sm:p-9"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#e2b75d]">Welcome back</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">{profile?.full_name || "Student"} 👋</h1><p className="mt-2 text-sm text-slate-300">Ready for your next maths challenge?</p></div><div className="flex gap-3"><div className="rounded-2xl bg-white/10 px-5 py-4"><Trophy className="text-[#e2b75d]" size={20}/><p className="mt-2 text-xl font-black">{profile?.xp ?? 0}</p><p className="text-xs text-slate-300">XP</p></div><div className="rounded-2xl bg-white/10 px-5 py-4"><Sparkles className="text-[#e2b75d]" size={20}/><p className="mt-2 text-xl font-black">0</p><p className="text-xs text-slate-300">Streak</p></div></div></div></section>
      <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">Your pathway</p><h2 className="mt-1 text-2xl font-black text-[#071b3a]">Choose a topic</h2></div><BookOpen className="text-[#0d666b]"/></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{topics.map(([name, detail]) => <Link key={name} href="#" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d666b]/10 font-black text-[#0d666b]">{name[0]}</div><h3 className="mt-5 font-extrabold text-[#071b3a]">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0d666b]">Start <ArrowRight size={15}/></span></Link>)}</div></section>
    </div>
  </main>;
}
