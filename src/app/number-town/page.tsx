"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Coins, Lock, MapPin, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  { target: 7, choices: [5, 7, 9] },
  { target: 3, choices: [3, 6, 8] },
  { target: 9, choices: [4, 7, 9] },
  { target: 6, choices: [2, 6, 8] },
  { target: 4, choices: [1, 4, 9] },
  { target: 8, choices: [5, 8, 10] },
  { target: 2, choices: [2, 6, 7] },
  { target: 10, choices: [3, 8, 10] },
  { target: 5, choices: [2, 5, 9] },
  { target: 1, choices: [1, 4, 7] },
];

export default function NumberTownPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [screen, setScreen] = useState<"world" | "game" | "result">("world");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<{ xp: number; coins: number; stars: number; badge_earned: boolean } | null>(null);
  const q = QUESTIONS[index];

  useEffect(() => {
    document.title = "Number Town | Math Platform";
  }, []);

  function startGame() {
    setIndex(0); setScore(0); setMessage(""); setReward(null); setScreen("game");
  }

  async function choose(value: number) {
    if (message) return;
    const correct = value === q.target;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    setMessage(correct ? "✓ Great!" : `Try again next time — the answer was ${q.target}.`);
    window.setTimeout(async () => {
      if (index === QUESTIONS.length - 1) {
        setSaving(true);
        if (supabase) {
          const { data, error } = await supabase.rpc("complete_number_town_game", { p_score: nextScore, p_total: QUESTIONS.length });
          if (!error && data) setReward(data);
        }
        setSaving(false);
        setScreen("result");
      } else {
        setIndex((v) => v + 1); setMessage("");
      }
    }, 700);
  }

  if (screen === "result") {
    return <main className="nt-shell"><section className="nt-result"><div className="nt-burst">🏆</div><h1>Number Town Complete!</h1><p className="nt-score">{score} / {QUESTIONS.length}</p><div className="nt-rewards"><span><Zap size={18}/> +{reward?.xp ?? score * 10} XP</span><span><Coins size={18}/> +{reward?.coins ?? score * 2}</span><span><Star size={18}/> {reward?.stars ?? 0}</span></div>{reward?.badge_earned && <div className="nt-badge">🏅 Perfect Number Catcher badge earned!</div>}{saving && <p>Saving your progress…</p>}<div className="nt-actions"><button onClick={startGame}>Play Again</button><button className="secondary" onClick={() => setScreen("world")}>Return to Town</button></div></section></main>;
  }

  if (screen === "game") {
    return <main className="nt-shell"><div className="nt-top"><button className="icon-btn" onClick={() => setScreen("world")}><ArrowLeft size={20}/></button><div><strong>Number Catcher</strong><small>Challenge {index + 1} of {QUESTIONS.length}</small></div><div className="pill"><Star size={16}/> {score}</div></div><section className="nt-game"><div className="nt-cloud c1"/><div className="nt-cloud c2"/><div className="nt-house">🏠</div><div className="nt-tree">🌳</div><div className="nt-character">🧑‍🎓</div><div className="nt-question"><span>Find the number</span><b>{q.target}</b></div><div className="nt-choices">{q.choices.map((n) => <button key={n} onClick={() => choose(n)} className={message && n === q.target ? "correct" : ""}>{n}</button>)}</div><div className={`nt-feedback ${message.includes("Great") ? "good" : ""}`}>{message || "Choose the correct number"}</div></section></main>;
  }

  return <main className="nt-shell"><div className="nt-top"><button className="icon-btn" onClick={() => router.push("/dashboard")}><ArrowLeft size={20}/></button><div><strong>Number Town</strong><small>World 1 · Level 1</small></div><div className="pill"><Sparkles size={16}/> Math World</div></div><section className="nt-world"><div className="nt-sky"/><div className="nt-road r1"/><div className="nt-road r2"/><div className="nt-hill h1"/><div className="nt-hill h2"/><div className="landmark school">🏫<span>Number School</span></div><div className="landmark shop">🏪<span>Coin Shop</span></div><div className="landmark park">🌳<span>Number Park</span></div><button className="portal" onClick={startGame}><span>🎮</span><b>Number Catcher</b><small>PLAY GAME</small></button><div className="player"><span>🧑‍🎓</span><b>You</b></div><div className="locked"><Lock size={18}/><span>Logic Valley</span><small>Unlock at Level 2</small></div><div className="town-sign"><MapPin size={18}/> NUMBER TOWN</div></section><div className="nt-bottom"><div><Zap size={17}/> Level 1</div><div><Star size={17}/> 0 Stars</div><div><Coins size={17}/> 0 Coins</div><div><Trophy size={17}/> 0 Badges</div></div></main>;
}
