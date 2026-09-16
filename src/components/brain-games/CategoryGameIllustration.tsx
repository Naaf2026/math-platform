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

export default function CategoryGameIllustration({ type }: Props) {
  const art = CARD_ART[type.toLowerCase()];

  if (!art) return null;

  return (
    <img
      src={art.src}
      alt={art.alt}
      className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(15,23,42,.22)]"
      loading="eager"
      draggable={false}
    />
  );
}
