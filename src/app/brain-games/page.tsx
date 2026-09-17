"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Flame, Home, Star } from "lucide-react";

const challenges = [
  { title: "Brain Boost", href: "/brain-games/memory", position: "challenge-one" },
  { title: "Brain Twist", href: "/brain-games/flexibility", position: "challenge-two" },
  { title: "Speed Rush", href: "/brain-games/speed", position: "challenge-three" },
  { title: "Spot On!", href: "/brain-games/attention", position: "challenge-four" },
  { title: "Puzzle Power", href: "/brain-games/problem-solving", position: "challenge-five" },
  { title: "Brain Quest", href: "/brain-games/adventure", position: "challenge-six" },
];

function MindMascot({ size = 62 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M28 76C16 72 13 60 19 51C12 39 20 24 34 23C40 10 59 10 66 21C82 19 91 34 84 46C94 58 84 76 70 76C60 88 39 88 28 76Z" fill="#ff82b8" stroke="#fff" strokeWidth="5" />
      <path d="M33 27C28 34 34 38 28 44M48 20C41 27 50 32 43 39M66 25C59 31 67 37 60 43M76 46C68 49 75 57 67 62M27 55C35 57 29 65 38 68M48 51C42 57 51 62 46 70" fill="none" stroke="#d9478d" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="37" cy="51" rx="6" ry="8" fill="#fff" /><ellipse cx="64" cy="51" rx="6" ry="8" fill="#fff" />
      <circle cx="39" cy="53" r="3" fill="#263d69" /><circle cx="62" cy="53" r="3" fill="#263d69" />
      <path d="M43 65Q50 72 57 65" fill="none" stroke="#263d69" strokeWidth="3" strokeLinecap="round" />
      <circle cx="28" cy="63" r="4" fill="#ffb3c9" /><circle cx="72" cy="63" r="4" fill="#ffb3c9" />
      <path d="M84 14l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffe54b" /><path d="M15 17l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" fill="#ffe54b" />
    </svg>
  );
}

export default function BrainGamesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<(typeof challenges)[number] | null>(null);

  return (
    <main className="brain-games-page">
      <div className="brain-games-shade" />
      <header className="brain-games-header">
        <Link href="/dashboard" className="brain-games-home"><ArrowLeft size={18} /> Home</Link>
        <div className="brain-games-logo"><span><MindMascot size={24} /></span> FAHI VISSNUN <small>Math Learning Platform</small></div>
        <div className="brain-games-stats"><span><Flame size={17} fill="currentColor" /> 3</span><span><Star size={17} fill="currentColor" /> 120</span><Home size={18} /></div>
      </header>
      <section className="brain-games-content">
        <div className="brain-games-cloud cloud-one" aria-hidden="true" />
        <div className="brain-games-cloud cloud-two" aria-hidden="true" />
        <div className="brain-games-cloud cloud-three" aria-hidden="true" />
        <div className="brain-games-sparkles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="brain-games-image">
          {challenges.map((challenge) => (
            <button key={challenge.title} type="button" className={`brain-games-zone ${challenge.position}`} aria-label={`Play ${challenge.title}`} onClick={() => setSelectedChallenge(challenge)} />
          ))}
        </div>
      </section>
      {selectedChallenge && (
        <div className="brain-games-rules-backdrop" role="presentation" onClick={() => setSelectedChallenge(null)}>
          <section className="brain-games-rules" role="dialog" aria-modal="true" aria-labelledby="brain-games-rules-title" onClick={(event) => event.stopPropagation()}>
            <div className="brain-games-rules-art" aria-hidden="true"><span><MindMascot size={82} /></span><i>✦</i><b>✦</b></div>
            <div className="brain-games-rules-copy">
              <p className="brain-games-rules-kicker">FAHI VISSNUN - MIND GAMES</p>
              <h2 id="brain-games-rules-title">Rules of Main Games</h2>
              <ol>
                <li><span>1</span><p>Mind Games are open from <b>10:00 a.m. to 8:00 p.m.</b> every day.</p></li>
                <li><span>2</span><p>You can play for a maximum of <b>30 minutes in a day.</b></p></li>
                <li><span>3</span><p>Each game needs <b>3 Mind Sparks per day</b> to unlock.</p></li>
              </ol>
              <p className="brain-games-rules-note">(Earn Mind Sparks from Homework, Daily Bonus and Daily Challenge)</p>
              <div className="brain-games-rules-actions">
                <button type="button" className="brain-games-rules-cancel" onClick={() => setSelectedChallenge(null)}>Back to map</button>
                <Link href={selectedChallenge.href} className="brain-games-rules-start">Start game <span>→</span></Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
