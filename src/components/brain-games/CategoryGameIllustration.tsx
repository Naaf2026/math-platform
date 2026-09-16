import React from "react";

type Props = { type: string };

const CARD_ART: Record<string, { src: string; alt: string }> = {
  memory: {
    src: "/assets/brain-games-cards/memory-tiles.png",
    alt: "Memory Tiles game illustration",
  },
  flash: {
    src: "/assets/brain-games-cards/flash-memory.png",
    alt: "Flash Memory game illustration",
  },
  order: {
    src: "/assets/brain-games-cards/number-order.png",
    alt: "Number Order game illustration",
  },
  pattern: {
    src: "/assets/brain-games-cards/pattern-quest.png",
    alt: "Pattern Quest game illustration",
  },
  rush: {
    src: "/assets/brain-games-cards/number-rush.png",
    alt: "Number Rush game illustration",
  },
  even: {
    src: "/assets/brain-games-cards/even-odd.png",
    alt: "Even or Odd game illustration",
  },
  missing: {
    src: "/assets/brain-games-cards/whats-missing.png",
    alt: "What's Missing game illustration",
  },
  hidden: {
    src: "/assets/brain-games-cards/hidden-numbers.png",
    alt: "Hidden Numbers game illustration",
  },
};

// All catalog Brain Games have one consistent 3 Mind Sparks entry cost.
const MIND_SPARK_COST: Record<string, number> = {
  memory: 3,
  flash: 3,
  order: 3,
  pattern: 3,
  rush: 3,
};

export default function CategoryGameIllustration({ type }: Props) {
  const key = type.toLowerCase();
  const art = CARD_ART[key];
  const cost = MIND_SPARK_COST[key];

  if (!art) return null;

  return (
    <div className="relative h-full w-full">
      <img
        src={art.src}
        alt={art.alt}
        className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(15,23,42,.22)]"
        loading="eager"
        draggable={false}
      />
      {cost !== undefined && (
        <div className="absolute right-2 top-2 z-20 rounded-full border border-white/80 bg-slate-950/75 px-2.5 py-1 text-[10px] font-black text-white shadow-lg backdrop-blur-sm">
          ✨ {cost} Mind Sparks
        </div>
      )}
    </div>
  );
}
