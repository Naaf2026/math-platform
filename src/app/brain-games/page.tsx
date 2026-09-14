"use client";

import Link from "next/link";
import { ArrowLeft, Brain, Lock, Play, Star, Timer } from "lucide-react";
import { useState } from "react";

const games = [
  { title: "Memory Tiles", href: "/brain-games/memory-tiles", active: true, color: "from-cyan-400 to-blue-500", kind: "memory", cost: 1 },
  { title: "Number Rush", href: "/brain-games/number-rush", active: true, color: "from-orange-300 to-pink-500", kind: "rush", cost: 1 },
  { title: "Even or Odd", href: "/brain-games/even-odd", active: true, color: "from-purple-400 to-fuchsia-500", kind: "evenodd", cost: 1 },
  { title: "Flash Memory", href: "/brain-games/flash-memory", active: true, color: "from-sky-400 to-teal-500", kind: "flash", cost: 1 },
  { title: "Number Order", href: "/brain-games/number-order", active: true, color: "from-amber-300 to-rose-500", kind: "order", cost: 1 },
  { title: "Pattern Quest", href: "/brain-games/pattern-quest", active: true, color: "from-pink-400 to-red-500", kind: "pattern", cost: 1 },
  { title: "Hidden Numbers", href: "#", active: false, color: "from-emerald-400 to-cyan-600", kind: "hidden", cost: 1 },
  { title: "What's Missing?", href: "#", active: false, color: "from-indigo-400 to-violet-600", kind: "missing", cost: 1 },
];

function Art({ kind }: { kind: string }) {
  if (kind === "memory") return <div className="relative h-full w-full"><Tile x="13" y="28" text="2+3" rotate="-8"/><Tile x="36" y="12" text="5" rotate="7"/><Tile x="59" y="29" text="4+4" rotate="-5"/><Tile x="38" y="55" text="8" rotate="6"/><span className="absolute left-[45%] top-[67%] text-5xl">🧠</span></div>;
  if (kind === "rush") return <div className="relative h-full w-full"><span className="absolute bottom-[15%] left-[22%] text-7xl">🏃</span><span className="absolute right-[18%] top-[20%] text-5xl">⚡</span><Bubble x="12" y="22" text="7+6"/><Bubble x="61" y="42" text="13"/></div>;
  if (kind === "evenodd") return <div className="relative h-full w-full"><Circle x="14" text="8"/><Circle x="59" text="7"/><span className="absolute bottom-[12%] left-[39%] text-5xl">👀</span></div>;
  if (kind === "flash") return <div className="relative h-full w-full"><div className="absolute left-[19%] top-[27%] rounded-[28px] bg-white/90 px-6 py-4 text-4xl font-black text-teal-600 shadow-xl">4 8 2</div><span className="absolute bottom-[14%] left-[28%] text-5xl">✨</span><div className="absolute right-[17%] bottom-[20%] rounded-xl bg-white/90 px-4 py-2 text-2xl font-black text-cyan-600">?</div></div>;
  if (kind === "order") return <div className="relative h-full w-full"><Tile x="10" y="30" text="42" rotate="-7"/><Tile x="37" y="18" text="17" rotate="4"/><Tile x="64" y="32" text="31" rotate="7"/><span className="absolute bottom-[13%] left-[43%] text-5xl">🔀</span></div>;
  if (kind === "pattern") return <div className="relative h-full w-full"><Bubble x="10" y="32" text="2"/><Bubble x="31" y="21" text="4"/><Bubble x="52" y="33" text="6"/><Bubble x="73" y="21" text="?"/><span className="absolute bottom-[13%] left-[43%] text-5xl">🧩</span></div>;
  return <div className="relative h-full w-full"><div className="absolute left-[13%] top-[25%] grid grid-cols-4 gap-2">{[1,2,3,4,5,6,7,8].map(n=><span key={n} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-lg font-black text-indigo-600 shadow-sm">{n}</span>)}</div><span className="absolute bottom-[12%] right-[20%] text-5xl">🔎</span></div>;
}

function Tile({ x, y, text, rotate }: { x: string; y: string; text: string; rotate: string }) { return <div style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${rotate}deg)` }} className="absolute flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/80 bg-white/90 text-xl font-black text-cyan-700 shadow-lg">{text}</div>; }
function Bubble({ x, y, text }: { x: string; y: string; text: string }) { return <div style={{ left: `${x}%`, top: `${y}%` }} className="absolute rounded-2xl border-2 border-white/70 bg-white/90 px-4 py-3 text-2xl font-black text-pink-600 shadow-lg">{text}</div>; }
function Circle({ x, text }: { x: string; text: string }) { return <div style={{ left: `${x}%` }} className="absolute top-[24%] flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/90 text-4xl font-black text-purple-600 shadow-lg">{text}</div>; }

export default function BrainGamesPage() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Memory", "Speed", "Attention", "Problem Solving"];
  const shown = filter === "All" ? games : games.filter((g) => (filter === "Memory" ? ["memory", "flash"].includes(g.kind) : filter === "Speed" ? g.kind === "rush" : filter === "Attention" ? ["evenodd", "hidden", "missing"].includes(g.kind) : filter === "Problem Solving" ? g.kind === "pattern" : g.kind === "order"));

  return (
    <main className="min-h-screen bg-[#17b9e5] px-3 py-3 text-slate-700 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#079bd2] px-3 py-2 text-white shadow-sm">
          <Link href="/games" className="rounded-xl p-2 hover:bg-white/10"><ArrowLeft size={21}/></Link>
          <div className="flex items-center gap-2 text-lg font-black"><Brain size={22}/> Brain Games</div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-black"><Timer size={16}/> 25:00</div>
        </div>

        <section className="relative mt-3 overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-r from-[#0aa7dc] to-[#0d83d0] px-5 py-5 text-white shadow-lg sm:px-8">
          <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full bg-white/10"/>
          <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-yellow-300/10"/>
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div><div className="text-xs font-black uppercase tracking-[.25em] text-white/70">Brain Arena</div><h1 className="mt-1 text-3xl font-black sm:text-5xl">Memory · Speed · Focus · Logic</h1></div>
            <div className="flex items-center gap-2"><div className="rounded-2xl bg-white px-4 py-3 text-center text-slate-800 shadow"><Star className="mx-auto text-yellow-400" size={21} fill="currentColor"/><div className="mt-1 text-xl font-black">680</div></div><div className="rounded-2xl bg-yellow-300 px-4 py-3 text-center text-slate-900 shadow"><div className="text-xl font-black">5</div><div className="text-[9px] font-black uppercase">Tokens</div></div></div>
          </div>
        </section>

        <div className="mt-3 flex gap-2 overflow-x-auto rounded-2xl bg-white/95 p-2 shadow">{filters.map((item)=><button key={item} onClick={()=>setFilter(item)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${filter===item ? "bg-[#079ddd] text-white" : "text-slate-600 hover:bg-cyan-50"}`}>{item}</button>)}</div>

        <section className="mt-3 rounded-[26px] border-4 border-white bg-[#f8fdff] p-4 shadow-lg sm:p-5">
          <div className="mb-3 flex items-center justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.2em] text-amber-600">Daily Challenge</div><h2 className="text-2xl font-black">Memory</h2></div><Link href="/brain-games/memory-tiles" className="rounded-xl bg-[#08a6df] px-4 py-2 font-black text-white shadow"><Play size={15} className="mr-1 inline" fill="currentColor"/> Play</Link></div>
          <div className="h-2 overflow-hidden rounded-full bg-cyan-100"><div className="h-full w-[72%] rounded-full bg-[#09a8df]"/></div>
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((game)=><article key={game.title} className="overflow-hidden rounded-[24px] border-4 border-white bg-white shadow-[0_8px_0_rgba(0,70,100,.12)] transition hover:-translate-y-1 hover:shadow-xl">
            <div className={`relative h-44 bg-gradient-to-br ${game.color}`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.25),transparent_25%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,.2),transparent_25%)]"/><div className="relative h-full"><Art kind={game.kind}/>{!game.active&&<div className="absolute inset-0 flex items-center justify-center bg-slate-900/10"><span className="rounded-full bg-white/95 px-4 py-2 text-xs font-black shadow"><Lock size={14} className="mr-1 inline"/> Locked</span></div>}</div></div>
            <div className="flex items-center justify-between px-4 py-3"><h3 className="text-lg font-black">{game.title}</h3><span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-black text-amber-700">🪙 {game.cost}</span></div>
            {game.active ? <Link href={game.href} className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#08a6df] py-2.5 text-sm font-black text-white shadow"><Play size={15} fill="currentColor"/> Play</Link> : <div className="mx-4 mb-4 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-black text-slate-400">Coming Soon</div>}
          </article>)}
        </div>
      </div>
    </main>
  );
}
