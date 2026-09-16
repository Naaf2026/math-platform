"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, House } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Zone = { id: string; label: string; href: string; x: string; y: string; width: string; height: string };
const zones: Zone[] = [
  { id: "memory", label: "Brain Boost", href: "/brain-games/memory", x: "10%", y: "30%", width: "31%", height: "19%" },
  { id: "flexibility", label: "Brain Twist", href: "/brain-games/flexibility", x: "37%", y: "34%", width: "27%", height: "20%" },
  { id: "speed", label: "Speed Rush", href: "/brain-games/speed", x: "68%", y: "29%", width: "25%", height: "20%" },
  { id: "attention", label: "Spot On!", href: "/brain-games/attention", x: "10%", y: "52%", width: "30%", height: "22%" },
  { id: "problem-solving", label: "Puzzle Power", href: "/brain-games/problem-solving", x: "37%", y: "61%", width: "29%", height: "21%" },
  { id: "adventure", label: "Brain Quest", href: "/brain-games/adventure", x: "68%", y: "52%", width: "27%", height: "22%" },
];
const mobileCards = [
  ["memory", "Brain Boost", "🧠", "/brain-games/memory", "/assets/brain-games-cards/memory-tiles.png"],
  ["flexibility", "Brain Twist", "🔄", "/brain-games/flexibility", "/assets/brain-games-cards/pattern-quest.png"],
  ["speed", "Speed Rush", "⚡", "/brain-games/speed", "/assets/brain-games-cards/number-rush.png"],
  ["attention", "Spot On!", "🎯", "/brain-games/attention", "/assets/brain-games-cards/even-odd.png"],
  ["problem-solving", "Puzzle Power", "🧩", "/brain-games/problem-solving", "/assets/brain-games-cards/whats-missing.png"],
  ["adventure", "Brain Quest", "🗺️", "/brain-games/adventure", "/assets/brain-games-cards/hidden-numbers.png"],
];
function formatTime(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); return `${Math.floor(safe / 60).toString().padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`; }

export default function BrainGamesPage() {
  const [mindSparks, setMindSparks] = useState<number | null>(null);
  const [freePlayAvailable, setFreePlayAvailable] = useState(false);
  const [brainTime, setBrainTime] = useState<number | null>(null);
  useEffect(() => {
    let active = true; const supabase = createClient();
    async function loadStatus() {
      const { data: userData } = await supabase.auth.getUser(); if (!userData.user || !active) return;
      const [{ data, error }, { data: timerData, error: timerError }] = await Promise.all([supabase.rpc("get_mind_spark_status"), supabase.rpc("get_brain_game_timer_status")]);
      if (!active) return; const row = Array.isArray(data) ? data[0] : data; const timerRow = Array.isArray(timerData) ? timerData[0] : timerData;
      if (!error && row) { setMindSparks(Number(row.balance ?? 0)); setFreePlayAvailable(Boolean(row.free_play_available)); }
      if (!timerError && timerRow) setBrainTime(Number(timerRow.seconds_remaining ?? 0));
    }
    loadStatus(); const refresh = window.setInterval(loadStatus, 15000); return () => { active = false; window.clearInterval(refresh); };
  }, []);

  return <main className="min-h-screen overflow-x-hidden bg-[#05b8d8]">
    <section className="relative min-h-screen overflow-hidden px-3 pb-5 pt-3 md:hidden">
      <img src="/assets/brain-games/brain-games-map.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-slate-950/20" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-md">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/60 bg-[#062b57]/85 px-3 py-2 text-white shadow-xl backdrop-blur-md">
          <Link href="/dashboard" aria-label="Home" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-2.5 text-[10px] font-black text-white ring-1 ring-white/30 transition active:scale-95"><House size={14} /> Home</Link>
          <div className="text-center leading-tight"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Mind Games</div><div className="text-lg font-black text-white">Pick Your Challenge! 🎮</div></div>
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-white/15 px-2 py-1 ring-1 ring-white/20"><span className="text-[9px] font-bold text-white/70">SPARKS</span><span className="text-[11px] font-black">✨ {mindSparks === null ? "—" : mindSparks}</span></div>
        </div>
        <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-extrabold text-white drop-shadow-md"><Clock3 size={13} /> {brainTime === null ? "--:--" : formatTime(brainTime)} Mind Time</div>
        <div className="grid grid-cols-2 gap-2.5">
          {mobileCards.map(([id, name, emoji, href, image]) => <Link key={id} href={href} className="group overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-2 shadow-xl backdrop-blur-sm transition active:scale-[.98]">
            <div className="relative h-[108px] overflow-hidden rounded-xl bg-white/70"><img src={image} alt="" className="h-full w-full object-contain transition duration-200 group-hover:scale-105" /><span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-1 text-sm shadow-sm">{emoji}</span></div>
            <div className="flex items-center justify-between gap-1 px-1 pt-2"><span className="truncate text-[13px] font-black text-slate-800">{name}</span><span className="shrink-0 rounded-full bg-sky-500 px-2 py-1 text-[9px] font-black text-white">PLAY</span></div>
          </Link>)}
        </div>
        {freePlayAvailable && <div className="mt-3 rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-center text-[11px] font-extrabold text-slate-700 shadow-lg backdrop-blur-sm">🎁 Free Play available</div>}
      </div>
    </section>

    <section className="relative mx-auto hidden w-full max-w-[1800px] md:block"><div className="relative aspect-[1672/940] w-full">
      <img src="/assets/brain-games/brain-games-map.webp" alt="FAHI VISSNUN Mind Games Maldives-inspired island world" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute right-[2%] top-[2.5%] z-30 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-white/50 bg-[#062b57]/85 px-3 py-2 text-white shadow-xl backdrop-blur-md sm:rounded-full sm:px-4"><span className="flex items-center gap-1.5 text-sm font-black"><Clock3 size={15} /> {brainTime === null ? "--:--" : formatTime(brainTime)}</span><span className="text-[10px] font-bold text-white/75 sm:text-xs">Mind Time</span><span className="h-4 w-px bg-white/25" /><span className="text-sm font-black">✨ {mindSparks === null ? "—" : mindSparks}</span>{freePlayAvailable && <span className="hidden rounded-full bg-white/15 px-2 py-1 text-[10px] font-extrabold sm:inline">🎁 Free Play</span>}</div>
      {zones.map(zone => <Link key={zone.id} href={zone.href} aria-label={zone.label} className="group absolute z-10 rounded-[24px] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/90" style={{ left: zone.x, top: zone.y, width: zone.width, height: zone.height }}><span className="absolute inset-1 rounded-[22px] border-2 border-transparent transition-all duration-200 group-hover:border-white/70 group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(255,255,255,.28)]" /><span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#062b57]/90 px-4 py-2 text-xs font-extrabold text-white opacity-0 shadow-xl backdrop-blur transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">{zone.label}</span></Link>)}
      <Link href="/dashboard" aria-label="Home" className="absolute bottom-[3.5%] left-[1.5%] z-20 inline-flex h-[5%] min-h-9 w-auto min-w-9 items-center justify-center gap-1.5 rounded-full border-2 border-white/80 bg-[#062b57]/80 px-3 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-[#062b57]"><House size={15} /><span className="text-[10px] font-black uppercase tracking-wide">Home</span></Link>
    </div></section>
  </main>;
}
