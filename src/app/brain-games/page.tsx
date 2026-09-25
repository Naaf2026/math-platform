"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/learner-notification-bell";
import { useEffect, useState } from "react";
import { BarChart3, Gamepad2, Gift, GraduationCap, Home, Trophy } from "lucide-react";

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

type Profile = { full_name:string|null; grade:string|null; avatar_url:string|null; avatar_emoji:string|null; xp:number|null; current_streak:number|null };
function gradeLabel(v:string|null|undefined){const m=String(v||"").match(/[1-7]/);return m?`Grade ${m[0]}`:"Student";}

export default function BrainGamesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<(typeof challenges)[number] | null>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  useEffect(()=>{(async()=>{const s=createClient();if(!s)return;const {data:a}=await s.auth.getUser();if(!a.user){window.location.href="/login";return;}const {data:p}=await s.from("profiles").select("full_name,grade,avatar_url,avatar_emoji,xp,current_streak").eq("id",a.user.id).maybeSingle();setProfile(p as Profile|null);})();},[]);
  const first=(profile?.full_name||"Learner").split(" ")[0];
  const avatar=profile?.avatar_url;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      <header className="sticky top-0 z-40 hidden h-[90px] border-b border-white/10 bg-[#073b73] text-white shadow-sm lg:block"><div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12">
        <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center rounded-2xl bg-white px-3 py-1.5 shadow-md ring-1 ring-white/40 transition hover:shadow-lg"><img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[44px] w-auto max-w-[200px] object-contain lg:h-[57px] lg:max-w-[220px]" /></Link>
        <nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Home size={25}/>Home</Link><Link href="/brain-games" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><Gamepad2 size={25}/>Games<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400"/></Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Trophy size={25}/>Leaderboard</Link><Link href="/rewards" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gift size={25}/>Rewards</Link><Link href="/progress" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><BarChart3 size={25}/>Progress</Link><Link href="/profile" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><GraduationCap size={25}/>Profile</Link></nav><NotificationBell/>
      </div></header>
      <div className="mx-auto flex max-w-[1680px]">
        
        <section className="min-w-0 flex-1 px-0 py-0 sm:px-6 sm:py-5 lg:px-10 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-[1380px]">
            <div className="relative overflow-hidden bg-white sm:rounded-[28px] sm:border sm:border-[#cde7f4] sm:shadow-[0_20px_55px_rgba(8,61,120,.14)]">
              <picture className="block">
                <source media="(max-width: 767px)" srcSet="/brain-games/mind-sparks-maldives-mobile.webp" />
                <img src="/brain-games/mind-sparks-maldives-desktop.webp" alt="Mind Sparks Maldives game world" className="block h-auto w-full select-none object-contain" draggable={false}/>
              </picture>
              <div className="absolute inset-0">
                {challenges.map((challenge) => (
                  <button key={challenge.title} type="button" className={`mind-sparks-hotspot ${challenge.position}`} aria-label={`Play ${challenge.title}`} onClick={() => setSelectedChallenge(challenge)} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      {selectedChallenge && (
        <div className="brain-games-rules-backdrop" role="presentation" onClick={() => setSelectedChallenge(null)}>
          <section className="brain-games-rules" role="dialog" aria-modal="true" aria-labelledby="brain-games-rules-title" onClick={(event) => event.stopPropagation()}>
            <div className="brain-games-rules-art" aria-hidden="true"><span><MindMascot size={82} /></span><i>✦</i><b>✦</b></div>
            <div className="brain-games-rules-copy">
              <p className="brain-games-rules-kicker">FAHI HISAABU - MIND GAMES</p>
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
