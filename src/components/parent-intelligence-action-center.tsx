"use client";

import Link from "next/link";
import { BellRing, BrainCircuit, Target, TrendingUp } from "lucide-react";

export default function ParentIntelligenceActionCenter() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-4 sm:px-8">
      <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm ring-1 ring-violet-50">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <BrainCircuit size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Parent intelligence</p>
              <h2 className="mt-1 text-xl font-black text-[#071b3a]">Turn learning data into the next action</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Review goal pacing, smart recommendations and learning signals, then take action from one place.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
            <Link href="/parent#goals" className="group rounded-2xl bg-violet-50 p-3 text-center transition hover:bg-violet-100">
              <Target className="mx-auto text-violet-700" size={18} />
              <span className="mt-1 block text-[11px] font-black text-violet-800">Goals</span>
            </Link>
            <Link href="/parent#intelligence" className="group rounded-2xl bg-cyan-50 p-3 text-center transition hover:bg-cyan-100">
              <TrendingUp className="mx-auto text-cyan-700" size={18} />
              <span className="mt-1 block text-[11px] font-black text-cyan-800">Insights</span>
            </Link>
            <Link href="/parent/notifications" className="group rounded-2xl bg-amber-50 p-3 text-center transition hover:bg-amber-100">
              <BellRing className="mx-auto text-amber-700" size={18} />
              <span className="mt-1 block text-[11px] font-black text-amber-800">Alerts</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
