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

export default function BrainGamesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<(typeof challenges)[number] | null>(null);

  return (
    <main className="brain-games-page">
      <div className="brain-games-shade" />
      <header className="brain-games-header">
        <Link href="/dashboard" className="brain-games-home"><ArrowLeft size={18} /> Home</Link>
        <div className="brain-games-logo"><span>F</span> FAHI VISSNUN <small>Math Learning Platform</small></div>
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
            <div className="brain-games-rules-art" aria-hidden="true"><span>F</span><i>✦</i><b>✦</b></div>
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
