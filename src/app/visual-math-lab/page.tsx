"use client";

import Link from "next/link";
import { ArrowLeft, Crown, Minus, Plus, Shapes } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LabProfile = { is_premium: boolean };

export default function VisualMathLabPage() {
  const [profile, setProfile] = useState<LabProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState(347);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase.from("profiles").select("is_premium").eq("id", auth.user.id).maybeSingle();
      if (mounted) {
        setProfile({ is_premium: data?.is_premium === true });
        setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f1ff]"><p className="font-black text-violet-900">Opening Visual Math Lab…</p></main>;
  }

  if (!profile?.is_premium) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#f4f1ff] via-white to-cyan-50 px-5 py-12">
        <section className="w-full max-w-xl rounded-[2rem] border border-violet-100 bg-white p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Crown size={32} /></div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-violet-600">Premium learning space</p>
          <h1 className="mt-2 text-3xl font-black text-[#071b3a]">Visual Math Lab</h1>
          <p className="mt-4 leading-7 text-slate-500">Explore numbers with interactive models, place-value blocks and visual challenges. This lab is available to Premium learners.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/profile" className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Upgrade to Premium → 👑</Link>
            <Link href="/dashboard" className="rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700">Back to Dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f4f1ff] via-white to-cyan-50 px-5 py-8 text-[#071b3a] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-violet-700"><ArrowLeft size={17} /> Dashboard</Link>
        <header className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-cyan-500 p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div><p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><Crown size={14} /> Premium Lab</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">See maths come alive.</h1><p className="mt-3 max-w-2xl text-indigo-100">Build numbers with visual models and understand what each digit means.</p></div>
            <Shapes className="h-14 w-14 text-cyan-200" />
          </div>
        </header>
        <section className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[2rem] border border-violet-100 bg-white p-6 shadow-lg sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Place-value explorer</p><h2 className="mt-1 text-2xl font-black">Build a number</h2></div><div className="flex items-center gap-2"><button type="button" onClick={() => setNumber(value => Math.max(100, value - 1))} aria-label="Decrease number" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-violet-700"><Minus size={18} /></button><span className="min-w-20 text-center text-3xl font-black">{number}</span><button type="button" onClick={() => setNumber(value => Math.min(999, value + 1))} aria-label="Increase number" className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Plus size={18} /></button></div></div>
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">{[{ label: "Hundreds", value: hundreds, color: "bg-violet-500", text: "violet" }, { label: "Tens", value: tens, color: "bg-cyan-500", text: "cyan" }, { label: "Ones", value: ones, color: "bg-amber-400", text: "amber" }].map(({ label, value, color }) => <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><div className="mt-4 flex min-h-28 flex-wrap content-center justify-center gap-1">{Array.from({ length: value }).map((_, index) => <span key={index} className={`h-5 w-5 rounded-md ${color}`} />)}</div><p className="mt-3 text-3xl font-black">{value}</p></div>)}</div>
            <p className="mt-6 rounded-2xl bg-violet-50 p-4 text-center font-bold text-violet-900">{number} = {hundreds} hundreds + {tens} tens + {ones} ones</p>
          </div>
          <div className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-lg sm:p-8"><p className="text-xs font-black uppercase tracking-wider text-cyan-600">Coming next</p><h2 className="mt-1 text-2xl font-black">More visual investigations</h2><div className="mt-5 space-y-3"><div className="rounded-2xl bg-cyan-50 p-4"><p className="font-black">Fraction walls</p><p className="mt-1 text-sm text-slate-500">Compare equivalent fractions by sight.</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="font-black">Area builder</p><p className="mt-1 text-sm text-slate-500">Discover multiplication with arrays.</p></div><div className="rounded-2xl bg-violet-50 p-4"><p className="font-black">Pattern studio</p><p className="mt-1 text-sm text-slate-500">Find rules hidden in growing patterns.</p></div></div></div>
        </section>
      </div>
    </main>
  );
}
