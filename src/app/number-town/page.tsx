"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, Coins, Gamepad2, Lock, MapPin, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  { target: 7, choices: [5, 7, 9] }, { target: 3, choices: [3, 6, 8] },
  { target: 9, choices: [4, 7, 9] }, { target: 6, choices: [2, 6, 8] },
  { target: 4, choices: [1, 4, 9] }, { target: 8, choices: [5, 8, 10] },
  { target: 2, choices: [2, 6, 7] }, { target: 10, choices: [3, 8, 10] },
  { target: 5, choices: [2, 5, 9] }, { target: 1, choices: [1, 4, 7] },
];

type Screen = "world" | "game" | "result";
type Vec = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const PLAYER = { w: 4.2, h: 7.5 };
const SPEED = 0.95;
const START: Vec = { x: 27, y: 68 };
const OBSTACLES: Rect[] = [
  { x: 7, y: 23, w: 16, h: 17 },
  { x: 79, y: 27, w: 14, h: 15 },
  { x: 39, y: 67, w: 15, h: 13 },
  { x: 74, y: 67, w: 22, h: 9 },
];

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function distance(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function NumberTownPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [screen, setScreen] = useState<Screen>("world");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<{ xp: number; coins: number; stars: number; badge_earned: boolean } | null>(null);
  const [player, setPlayer] = useState<Vec>(START);
  const [moving, setMoving] = useState(false);
  const [nearPortal, setNearPortal] = useState(false);
  const [nearLocked, setNearLocked] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ active: false, x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const q = QUESTIONS[index];

  useEffect(() => { document.title = "Number Town | Math Platform"; }, []);

  const startGame = useCallback(() => {
    setIndex(0); setScore(0); setMessage(""); setReward(null); setScreen("game");
  }, []);

  const tryInteract = useCallback(() => { if (nearPortal) startGame(); }, [nearPortal, startGame]);

  useEffect(() => {
    if (screen !== "world") return;
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", "enter"].includes(key)) {
        event.preventDefault();
        keysRef.current[key] = true;
        if ((key === "e" || key === "enter") && nearPortal) startGame();
      }
    };
    const up = (event: KeyboardEvent) => { keysRef.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [nearPortal, screen, startGame]);

  useEffect(() => {
    if (screen !== "world") return;
    lastTimeRef.current = null;
    const tick = (time: number) => {
      const previous = lastTimeRef.current ?? time;
      const dt = Math.min((time - previous) / 16.67, 2);
      lastTimeRef.current = time;
      let dx = 0; let dy = 0;
      const k = keysRef.current;
      if (k.arrowleft || k.a) dx -= 1; if (k.arrowright || k.d) dx += 1;
      if (k.arrowup || k.w) dy -= 1; if (k.arrowdown || k.s) dy += 1;
      dx += joystickRef.current.x; dy += joystickRef.current.y;
      const length = Math.hypot(dx, dy);
      if (length > 1) { dx /= length; dy /= length; }
      setMoving(length > 0.08);
      if (length > 0.08) {
        setPlayer((current) => {
          const proposed = { x: Math.max(2, Math.min(94, current.x + dx * SPEED * dt)), y: Math.max(9, Math.min(88, current.y + dy * SPEED * dt)) };
          const playerRect: Rect = { x: proposed.x - PLAYER.w / 2, y: proposed.y - PLAYER.h / 2, w: PLAYER.w, h: PLAYER.h };
          return OBSTACLES.some((obstacle) => intersects(playerRect, obstacle)) ? current : proposed;
        });
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
    return () => { if (frameRef.current) window.cancelAnimationFrame(frameRef.current); };
  }, [screen]);

  useEffect(() => {
    setNearPortal(distance(player, { x: 50, y: 46 }) < 12);
    setNearLocked(distance(player, { x: 86, y: 80 }) < 13);
  }, [player]);

  async function choose(value: number) {
    if (message) return;
    const correct = value === q.target;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore); setMessage(correct ? "✓ Great!" : `Try again next time — the answer was ${q.target}.`);
    window.setTimeout(async () => {
      if (index === QUESTIONS.length - 1) {
        setSaving(true);
        const { data, error } = await supabase.rpc("complete_number_town_game", { p_score: nextScore, p_total: QUESTIONS.length });
        if (!error && data) setReward(data);
        setSaving(false); setScreen("result");
      } else { setIndex((v) => v + 1); setMessage(""); }
    }, 700);
  }

  const updateJoystick = (event: PointerEvent<HTMLDivElement>) => {
    if (!joystickRef.current.active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const max = rect.width * 0.32;
    const rawX = event.clientX - (rect.left + rect.width / 2);
    const rawY = event.clientY - (rect.top + rect.height / 2);
    const length = Math.min(max, Math.hypot(rawX, rawY));
    const angle = Math.atan2(rawY, rawX);
    const next = { x: Math.cos(angle) * (length / max), y: Math.sin(angle) * (length / max) };
    joystickRef.current.x = next.x; joystickRef.current.y = next.y; setJoystick(next);
  };
  const joystickStart = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId); joystickRef.current.active = true; updateJoystick(event);
  };
  const joystickEnd = () => {
    joystickRef.current.active = false; joystickRef.current.x = 0; joystickRef.current.y = 0; setJoystick({ x: 0, y: 0 });
  };

  if (screen === "result") {
    return <main className="nt-shell"><section className="nt-result"><div className="nt-burst">🏆</div><h1>Number Town Complete!</h1><p className="nt-score">{score} / {QUESTIONS.length}</p><div className="nt-rewards"><span><Zap size={18}/> +{reward?.xp ?? score * 10} XP</span><span><Coins size={18}/> +{reward?.coins ?? score * 2}</span><span><Star size={18}/> {reward?.stars ?? 0}</span></div>{reward?.badge_earned && <div className="nt-badge">🏅 Perfect Number Catcher badge earned!</div>}{saving && <p>Saving your progress…</p>}<div className="nt-actions"><button onClick={startGame}>Play Again</button><button className="secondary" onClick={() => setScreen("world")}>Return to Town</button></div></section></main>;
  }

  if (screen === "game") {
    return <main className="nt-shell"><div className="nt-top"><button className="icon-btn" onClick={() => setScreen("world")}><ArrowLeft size={20}/></button><div><strong>Number Catcher</strong><small>Challenge {index + 1} of {QUESTIONS.length}</small></div><div className="pill"><Star size={16}/> {score}</div></div><section className="nt-game"><div className="nt-cloud c1"/><div className="nt-cloud c2"/><div className="nt-house">🏠</div><div className="nt-tree">🌳</div><div className="nt-character">🧑‍🎓</div><div className="nt-question"><span>Find the number</span><b>{q.target}</b></div><div className="nt-choices">{q.choices.map((n) => <button key={n} onClick={() => choose(n)} className={message && n === q.target ? "correct" : ""}>{n}</button>)}</div><div className={`nt-feedback ${message.includes("Great") ? "good" : ""}`}>{message || "Choose the correct number"}</div></section></main>;
  }

  return <main className="nt-shell">
    <div className="nt-top"><button className="icon-btn" onClick={() => router.push("/dashboard")}><ArrowLeft size={20}/></button><div><strong>Number Town</strong><small>World 1 · Level 1</small></div><div className="pill"><Sparkles size={16}/> Math World</div></div>
    <section className="nt-world">
      <div className="nt-sky"/><div className="nt-road r1"/><div className="nt-road r2"/><div className="nt-hill h1"/><div className="nt-hill h2"/>
      <div className="landmark school">🏫<span>Number School</span></div><div className="landmark shop">🏪<span>Coin Shop</span></div><div className="landmark park">🌳<span>Number Park</span></div>
      <button className="portal" onClick={startGame}><span>🎮</span><b>Number Catcher</b><small>PLAY GAME</small></button>
      <div className={`player ${moving ? "walking" : ""}`} style={{ left: `${player.x}%`, top: `${player.y}%` }}><span>🧑‍🎓</span><b>You</b></div>
      <div className="locked"><Lock size={18}/><span>Logic Valley</span><small>Unlock at Level 2</small></div><div className="town-sign"><MapPin size={18}/> NUMBER TOWN</div>
      {nearPortal && <button className="nt-interact" onClick={tryInteract}><Gamepad2 size={18}/> Press E / Tap to Play</button>}
      {nearLocked && <div className="nt-locked-hint"><Lock size={16}/> Logic Valley unlocks at Level 2</div>}
      <div className="nt-controls-help">⌨️ WASD / Arrow Keys &nbsp; • &nbsp; 📱 Move with the joystick</div>
      <div className="nt-joystick" onPointerDown={joystickStart} onPointerMove={updateJoystick} onPointerUp={joystickEnd} onPointerCancel={joystickEnd} onPointerLeave={joystickEnd}><div className="nt-joystick-knob" style={{ transform: `translate(${joystick.x * 35}px, ${joystick.y * 35}px)` }} /></div>
    </section>
    <div className="nt-bottom"><div><Zap size={17}/> Level 1</div><div><Star size={17}/> 0 Stars</div><div><Coins size={17}/> 0 Coins</div><div><Trophy size={17}/> 0 Badges</div></div>
  </main>;
}
