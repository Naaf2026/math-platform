"use client";

import Link from "next/link";

type Zone = {
  id: string;
  label: string;
  href: string;
  x: string;
  y: string;
  width: string;
  height: string;
};

const zones: Zone[] = [
  {
    id: "memory",
    label: "Brain Boost — Explore Brain Boost Games",
    href: "/brain-games/memory",
    x: "10%",
    y: "30%",
    width: "31%",
    height: "19%",
  },
  {
    id: "flexibility",
    label: "Brain Twist — Explore Brain Twist Games",
    href: "/brain-games/flexibility",
    x: "37%",
    y: "34%",
    width: "27%",
    height: "20%",
  },
  {
    id: "speed",
    label: "Speed Rush — Explore Speed Rush Games",
    href: "/brain-games/speed",
    x: "68%",
    y: "29%",
    width: "25%",
    height: "20%",
  },
  {
    id: "attention",
    label: "Spot On! — Explore Spot On! Games",
    href: "/brain-games/attention",
    x: "10%",
    y: "52%",
    width: "30%",
    height: "22%",
  },
  {
    id: "problem-solving",
    label: "Puzzle Power — Explore Puzzle Power Games",
    href: "/brain-games/problem-solving",
    x: "37%",
    y: "61%",
    width: "29%",
    height: "21%",
  },
  {
    id: "adventure",
    label: "Brain Quest — Explore Brain Quest Games",
    href: "/brain-games/adventure",
    x: "68%",
    y: "52%",
    width: "27%",
    height: "22%",
  },
];

export default function BrainGamesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05b8d8]">
      <section className="relative mx-auto w-full max-w-[1800px]">
        <div className="relative aspect-[1672/940] w-full">
          <img
            src="/assets/brain-games/brain-games-map.webp"
            alt="FAHI VISSNUN Brain Games Maldives-inspired island world"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {zones.map((zone) => (
            <Link
              key={zone.id}
              href={zone.href}
              aria-label={zone.label}
              className="group absolute z-10 rounded-[24px] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/90"
              style={{
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
              }}
            >
              <span className="absolute inset-1 rounded-[22px] border-2 border-transparent transition-all duration-200 group-hover:border-white/70 group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(255,255,255,.28)]" />
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#062b57]/90 px-4 py-2 text-xs font-extrabold text-white opacity-0 shadow-xl backdrop-blur transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                {zone.label.replace(" — ", " • ")}
              </span>
            </Link>
          ))}

          <Link
            href="/"
            aria-label="Back to FAHI VISSNUN home"
            className="absolute bottom-[3.5%] left-[1.5%] z-20 grid h-[5%] min-h-9 w-[5%] min-w-9 place-items-center rounded-full border-2 border-white/80 bg-[#062b57]/75 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-[#062b57]"
          >
            <span aria-hidden className="text-lg leading-none">‹</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
