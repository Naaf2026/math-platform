import React from "react";

type Props = { type: string };

const CARD_ART: Record<string, { src: string; alt: string }> = {
  memory: { src: "/assets/brain-games-cards/memory-tiles.png", alt: "Memory Tiles game illustration" },
  flash: { src: "/assets/brain-games-cards/flash-memory.png", alt: "Flash Memory game illustration" },
  order: { src: "/assets/brain-games-cards/number-order.png", alt: "Number Order game illustration" },
  pattern: { src: "/assets/brain-games-cards/pattern-quest.png", alt: "Pattern Quest game illustration" },
  rush: { src: "/assets/brain-games-cards/number-rush.png", alt: "Number Rush game illustration" },
  even: { src: "/assets/brain-games-cards/even-odd.png", alt: "Even or Odd game illustration" },
  missing: { src: "/assets/brain-games-cards/whats-missing.png", alt: "What's Missing game illustration" },
  hidden: { src: "/assets/brain-games-cards/hidden-numbers.png", alt: "Hidden Numbers game illustration" },
};

const MIND_SPARK_COST: Record<string, number> = {
  memory: 3, flash: 3, order: 3, pattern: 3, rush: 3, even: 3, missing: 3, hidden: 3, inside: 3,
};

export default function CategoryGameIllustration({ type }: Props) {
  const key = type.toLowerCase();
  const art = CARD_ART[key];
  const cost = MIND_SPARK_COST[key];

  if (key === "inside") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#fff7cf,transparent_45%),linear-gradient(135deg,#fff5dc,#ffe6ef)]">
        <div className="absolute left-4 top-4 text-xl opacity-70">✦</div><div className="absolute right-5 top-5 text-lg opacity-70">✦</div>
        <div className="relative mt-3 flex h-24 w-28 items-center justify-center rounded-[22px] border-[5px] border-amber-700/20 bg-gradient-to-b from-amber-300 to-orange-500 shadow-[0_12px_18px_rgba(120,53,15,.2)] sm:h-28 sm:w-32">
          <div className="absolute -top-7 left-1/2 h-10 w-24 -translate-x-1/2 rotate-[-5deg] rounded-t-[18px] border-4 border-amber-700/20 bg-gradient-to-b from-orange-400 to-amber-500 shadow-md" />
          <div className="relative z-10 flex gap-1.5 text-2xl sm:text-3xl"><span>⭐</span><span>🍎</span><span>🚀</span></div>
          <div className="absolute -bottom-2 rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-orange-600 shadow">WHAT'S INSIDE?</div>
        </div>
      </div>
    );
  }

  if (!art) return null;
  return <div className="relative h-full w-full"><img src={art.src} alt={art.alt} className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(15,23,42,.22)]" loading="eager" draggable={false}/>{cost !== undefined && <div className="absolute right-2 top-2 z-20 rounded-full border border-white/80 bg-slate-950/75 px-2.5 py-1 text-[10px] font-black text-white shadow-lg backdrop-blur-sm">✨ {cost} Mind Sparks</div>}</div>;
}
