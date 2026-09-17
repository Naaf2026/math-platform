import Link from "next/link";
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
            <Link key={challenge.title} href={challenge.href} className={`brain-games-zone ${challenge.position}`} aria-label={`Play ${challenge.title}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
