"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, Coins, Gamepad2, Lock, MapPin, Maximize2, Minimize2, Sparkles, Star, Trophy, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  { target: 7, choices: [5, 7, 9] }, { target: 3, choices: [3, 6, 8] },
  { target: 9, choices: [4, 7, 9] }, { target: 6, choices: [2, 6, 8] },
  { target: 4, choices: [1, 4, 9] }, { target: 8, choices: [5, 8, 10] },
  { target: 2, choices: [2, 6, 7] }, { target: 10, choices: [3, 8, 10] },
  { target: 5, choices: [2, 5, 9] }, { target: 1, choices: [1, 4, 7] },
];

const SCHOOL_QUESTIONS = [
  { prompt: "Which number is 3?", choices: [2, 3, 5], answer: 3 },
  { prompt: "Which number is 7?", choices: [4, 7, 9], answer: 7 },
  { prompt: "Which number is 5?", choices: [1, 5, 8], answer: 5 },
  { prompt: "Which number is 10?", choices: [6, 8, 10], answer: 10 },
  { prompt: "Which number is 2?", choices: [2, 6, 9], answer: 2 },
];

type Screen = "world" | "school" | "game" | "result";
type Vec = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Landmark = "school" | "shop" | "park" | "portal" | null;

const PLAYER = { w: 4.2, h: 7.5 };
const SPEED = 0.95;
const START: Vec = { x: 27, y: 68 };
const OBSTACLES: Rect[] = [
  { x: 7, y: 23, w: 16, h: 17 }, { x: 79, y: 27, w: 14, h: 15 },
  { x: 39, y: 67, w: 15, h: 13 }, { x: 74, y: 67, w: 22, h: 9 },
];

function intersects(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function distance(a: Vec, b: Vec) { return Math.hypot(a.x - b.x, a.y - b.y); }

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
  const [nearSchool, setNearSchool] = useState(false);
  const [nearShop, setNearShop] = useState(false);
  const [nearPark, setNearPark] = useState(false);
  const [nearLocked, setNearLocked] = useState(false);
  const [activeLandmark, setActiveLandmark] = useState<Landmark>(null);
  const [schoolIndex, setSchoolIndex] = useState(0);
  const [schoolScore, setSchoolScore] = useState(0);
  const [schoolMessage, setSchoolMessage] = useState("");
  const [schoolDone, setSchoolDone] = useState(false);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const joystickRef = useRef({ active: false, x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const q = QUESTIONS[index];
  const schoolQ = SCHOOL_QUESTIONS[schoolIndex];

  useEffect(() => { document.title = "Number Town | Math Platform"; }, []);
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);
  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch {} }
  }, []);
  const enterFullscreen = useCallback(async () => {
    if (document.fullscreenElement) return;
    try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch {}
  }, []);
  const startGame = useCallback(() => {
    setIndex(0); setScore(0); setMessage(""); setReward(null); setActiveLandmark(null); setScreen("game"); void enterFullscreen();
  }, [enterFullscreen]);
  const openSchool = useCallback(() => {
    setActiveLandmark(null); setSchoolIndex(0); setSchoolScore(0); setSchoolMessage(""); setSchoolDone(false); setScreen("school");
  }, []);
  const tryInteract = useCallback(() => {
    if (nearPortal) startGame(); else if (nearSchool) openSchool(); else if (nearShop) setActiveLandmark("shop"); else if (nearPark) setActiveLandmark("park");
  }, [nearPortal, nearSchool, nearShop, nearPark, startGame, openSchool]);

  useEffect(() => {
    if (screen !== "world") return;
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d","e","enter"].includes(key)) {
        event.preventDefault(); keysRef.current[key] = true;
        if ((key === "e" || key === "enter") && (nearPortal || nearSchool || nearShop || nearPark)) tryInteract();
      }
    };
    const up = (event: KeyboardEvent) => { keysRef.current[event.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [nearPortal, nearSchool, nearShop, nearPark, screen, tryInteract]);

  useEffect(() => {
    if (screen !== "world") return;
    lastTimeRef.current = null;
    const tick = (time: number) => {
      const previous = lastTimeRef.current ?? time; const dt = Math.min((time - previous) / 16.67, 2); lastTimeRef.current = time;
      let dx = 0, dy = 0; const k = keysRef.current;
      if (k.arrowleft || k.a) dx -= 1; if (k.arrowright || k.d) dx += 1; if (k.arrowup || k.w) dy -= 1; if (k.arrowdown || k.s) dy += 1;
      dx += joystickRef.current.x; dy += joystickRef.current.y; const length = Math.hypot(dx, dy);
      if (length > 1) { dx /= length; dy /= length; } setMoving(length > 0.08);
      if (length > 0.08) setPlayer(current => {
        const proposed = { x: Math.max(2, Math.min(94, current.x + dx * SPEED * dt)), y: Math.max(9, Math.min(88, current.y + dy * SPEED * dt)) };
        const playerRect: Rect = { x: proposed.x - PLAYER.w / 2, y: proposed.y - PLAYER.h / 2, w: PLAYER.w, h: PLAYER.h };
        return OBSTACLES.some(obstacle => intersects(playerRect, obstacle)) ? current : proposed;
      });
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick); return () => { if (frameRef.current) window.cancelAnimationFrame(frameRef.current); };
  }, [screen]);

  useEffect(() => {
    setNearPortal(distance(player, { x: 50, y: 46 }) < 12); setNearSchool(distance(player, { x: 18, y: 34 }) < 13);
    setNearShop(distance(player, { x: 86, y: 38 }) < 13); setNearPark(distance(player, { x: 50, y: 67 }) < 13); setNearLocked(distance(player, { x: 86, y: 80 }) < 13);
  }, [player]);
  useEffect(() => { if (screen !== "game" && document.fullscreenElement) void exitFullscreen(); }, [screen, exitFullscreen]);

  async function choose(value: number) {
    if (message) return; const correct = value === q.target; const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore); setMessage(correct ? "✓ Great!" : `Try again next time — the answer was ${q.target}.`);
    window.setTimeout(async () => {
      if (index === QUESTIONS.length - 1) { setSaving(true); const { data, error } = await supabase.rpc("complete_number_town_game", { p_score: nextScore, p_total: QUESTIONS.length }); if (!error && data) setReward(data); setSaving(false); setScreen("result"); }
      else { setIndex(v => v + 1); setMessage(""); }
    }, 700);
  }

  function chooseSchool(value: number) {
    if (schoolMessage || schoolDone) return;
    const correct = value === schoolQ.answer; const nextScore = schoolScore + (correct ? 1 : 0);
    setSchoolScore(nextScore); setSchoolMessage(correct ? "✓ Excellent! You found the right number." : `Not quite. The correct number is ${schoolQ.answer}.`);
    window.setTimeout(() => {
      if (schoolIndex === SCHOOL_QUESTIONS.length - 1) setSchoolDone(true);
      else { setSchoolIndex(v => v + 1); setSchoolMessage(""); }
    }, 750);
  }

  const updateJoystick = (event: PointerEvent<HTMLDivElement>) => {
    if (!joystickRef.current.active) return; const rect = event.currentTarget.getBoundingClientRect(); const max = rect.width * 0.32;
    const rawX = event.clientX - (rect.left + rect.width / 2), rawY = event.clientY - (rect.top + rect.height / 2); const length = Math.min(max, Math.hypot(rawX, rawY)); const angle = Math.atan2(rawY, rawX);
    const next = { x: Math.cos(angle) * (length / max), y: Math.sin(angle) * (length / max) }; joystickRef.current.x = next.x; joystickRef.current.y = next.y; setJoystick(next);
  };
  const joystickStart = (event: PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); joystickRef.current.active = true; updateJoystick(event); };
  const joystickEnd = () => { joystickRef.current.active = false; joystickRef.current.x = 0; joystickRef.current.y = 0; setJoystick({ x: 0, y: 0 }); };

  const interaction = nearPortal ? { label: "Number Catcher", action: "PLAY GAME", icon: <Gamepad2 size={18} /> } : nearSchool ? { label: "Number School", action: "ENTER", icon: <Sparkles size={18} /> } : nearShop ? { label: "Coin Shop", action: "OPEN SHOP", icon: <Coins size={18} /> } : nearPark ? { label: "Number Park", action: "EXPLORE", icon: <Star size={18} /> } : null;

  if (screen === "school") {
    return <main className="nt-shell" style={{ minHeight: "100vh", background: "linear-gradient(135deg,#e0f2fe,#fef3c7 45%,#dcfce7)" }}>
      <div className="nt-top"><button className="icon-btn" aria-label="Back to Number Town" onClick={() => setScreen("world")}><ArrowLeft size={20}/></button><div><strong>Number School</strong><small>Number Town · Level 1</small></div><button className="pill" onClick={() => router.push("/games")}><Gamepad2 size={16}/> Game Hub</button></div>
      <section style={{ maxWidth: 900, margin: "24px auto", padding: "0 18px 40px" }}>
        <div style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "white", borderRadius: 28, padding: "30px 24px", textAlign: "center", boxShadow: "0 18px 45px rgba(37,99,235,.22)" }}>
          <div style={{ fontSize: 58 }}>🏫</div><h1 style={{ margin: "6px 0", fontSize: "clamp(28px,5vw,44px)" }}>Welcome to Number School!</h1><p style={{ margin: 0, opacity: .92 }}>Learn your numbers through short, playful challenges.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginTop: 18 }}>
          {["🔢 Number Recognition","🧮 Count & Choose","⭐ Number Practice"].map((item,i) => <div key={item} style={{ background: "white", borderRadius: 20, padding: 18, border: i === 0 ? "3px solid #60a5fa" : "1px solid #e2e8f0", boxShadow: "0 8px 22px rgba(15,23,42,.08)" }}><b>{item}</b><p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 14 }}>{i === 0 ? "Active lesson" : "Coming next"}</p></div>)}
        </div>
        {!schoolDone ? <div style={{ marginTop: 18, background: "white", borderRadius: 24, padding: 24, boxShadow: "0 10px 28px rgba(15,23,42,.09)", textAlign: "center" }}>
          <div style={{ color: "#64748b", fontWeight: 700 }}>LESSON 1 · QUESTION {schoolIndex + 1} / {SCHOOL_QUESTIONS.length}</div><h2 style={{ fontSize: "clamp(23px,4vw,34px)", margin: "12px 0 22px" }}>{schoolQ.prompt}</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>{schoolQ.choices.map(n => <button key={n} onClick={() => chooseSchool(n)} disabled={Boolean(schoolMessage)} style={{ width: 90, height: 80, borderRadius: 20, border: "2px solid #bfdbfe", background: "#eff6ff", color: "#1e3a8a", fontSize: 34, fontWeight: 900, cursor: "pointer" }}>{n}</button>)}</div>
          <div style={{ minHeight: 34, marginTop: 18, fontWeight: 800, color: schoolMessage.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{schoolMessage}</div>
        </div> : <div style={{ marginTop: 18, background: "white", borderRadius: 24, padding: 28, textAlign: "center", boxShadow: "0 10px 28px rgba(15,23,42,.09)" }}><div style={{ fontSize: 64 }}>🎉</div><h2 style={{ margin: "8px 0" }}>Lesson Complete!</h2><p>You scored <b>{schoolScore} / {SCHOOL_QUESTIONS.length}</b>.</p><div className="nt-actions" style={{ justifyContent: "center" }}><button onClick={openSchool}>Practice Again</button><button className="secondary" onClick={() => setScreen("world")}>Return to Town</button></div></div>}
      </section>
    </main>;
  }

  if (screen === "result") return <main className="nt-shell"><section className="nt-result"><div className="nt-burst">🏆</div><h1>Number Town Complete!</h1><p className="nt-score">{score} / {QUESTIONS.length}</p><div className="nt-rewards"><span><Zap size={18}/> +{reward?.xp ?? score * 10} XP</span><span><Coins size={18}/> +{reward?.coins ?? score * 2}</span><span><Star size={18}/> {reward?.stars ?? 0}</span></div>{reward?.badge_earned && <div className="nt-badge">🏅 Perfect Number Catcher badge earned!</div>}{saving && <p>Saving your progress…</p>}<div className="nt-actions"><button onClick={startGame}>Play Again</button><button className="secondary" onClick={() => setScreen("world")}>Return to Town</button><button className="secondary" onClick={() => router.push("/games")}>Game Hub</button></div></section></main>;

  if (screen === "game") return <main className="nt-shell nt-game-fullscreen"><div className="nt-top"><button className="icon-btn" aria-label="Back to Number Town" onClick={() => { void exitFullscreen(); setScreen("world"); }}><ArrowLeft size={20}/></button><div><strong>Number Catcher</strong><small>Challenge {index + 1} of {QUESTIONS.length}</small></div><button className="pill" onClick={() => isFullscreen ? exitFullscreen() : enterFullscreen()}>{isFullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button><button className="pill" onClick={() => { void exitFullscreen(); router.push("/games"); }}><Gamepad2 size={16}/> Game Hub</button></div><section className="nt-game"><div className="nt-cloud c1"/><div className="nt-cloud c2"/><div className="nt-house">🏠</div><div className="nt-tree">🌳</div><div className="nt-character">🧑‍🎓</div><div className="nt-question"><span>Find the number</span><b>{q.target}</b></div><div className="nt-choices">{q.choices.map(n => <button key={n} onClick={() => choose(n)} className={message && n === q.target ? "correct" : ""}>{n}</button>)}</div><div className={`nt-feedback ${message.includes("Great") ? "good" : ""}`}>{message || "Choose the correct number"}</div></section></main>;

  return <main className="nt-shell"><div className="nt-top"><button className="icon-btn" aria-label="Back to Game Hub" onClick={() => router.push("/games")}><ArrowLeft size={20}/></button><div><strong>Number Town</strong><small>World 1 · Level 1</small></div><button className="pill" onClick={() => router.push("/games")}><Gamepad2 size={16}/> Game Hub</button></div>
    <section className="nt-world"><div className="nt-sky"/><div className="nt-road r1"/><div className="nt-road r2"/><div className="nt-hill h1"/><div className="nt-hill h2"/>
      <button className="landmark school landmark-button" onClick={openSchool} aria-label="Open Number School">🏫<span>Number School</span></button><button className="landmark shop landmark-button" onClick={() => setActiveLandmark("shop")} aria-label="Open Coin Shop">🏪<span>Coin Shop</span></button><button className="landmark park landmark-button" onClick={() => setActiveLandmark("park")} aria-label="Open Number Park">🌳<span>Number Park</span></button><button className="portal" onClick={startGame}><span>🎮</span><b>Number Catcher</b><small>PLAY GAME</small></button>
      <div className={`player ${moving ? "walking" : ""}`} style={{ left: `${player.x}%`, top: `${player.y}%` }}><span>🧑‍🎓</span><b>You</b></div><div className="locked"><Lock size={18}/><span>Logic Valley</span><small>Unlock at Level 2</small></div><div className="town-sign"><MapPin size={18}/> NUMBER TOWN</div>
      {interaction && <button className="nt-interact" onClick={tryInteract}>{interaction.icon} Press E / Tap · {interaction.action}</button>}{nearLocked && <div className="nt-locked-hint"><Lock size={16}/> Logic Valley unlocks at Level 2</div>}<div className="nt-controls-help">⌨️ WASD / Arrow Keys &nbsp; • &nbsp; 📱 Move with the joystick</div>
      <div className="nt-joystick" onPointerDown={joystickStart} onPointerMove={updateJoystick} onPointerUp={joystickEnd} onPointerCancel={joystickEnd} onPointerLeave={joystickEnd}><div className="nt-joystick-knob" style={{ transform: `translate(${joystick.x * 35}px, ${joystick.y * 35}px)` }} /></div>
    </section><div className="nt-bottom"><div><Zap size={17}/> Level 1</div><div><Star size={17}/> 0 Stars</div><div><Coins size={17}/> 0 Coins</div><div><Trophy size={17}/> 0 Badges</div></div>
    {activeLandmark && <div className="nt-modal-backdrop" onClick={() => setActiveLandmark(null)}><section className="nt-landmark-modal" onClick={event => event.stopPropagation()}><button className="nt-modal-close" aria-label="Close" onClick={() => setActiveLandmark(null)}><X size={20}/></button><div className="nt-modal-icon">{activeLandmark === "shop" ? "🏪" : "🌳"}</div><h2>{activeLandmark === "shop" ? "Coin Shop" : "Number Park"}</h2><p>{activeLandmark === "shop" ? "The Coin Shop is being prepared for rewards and items." : "Number Park is being prepared with number activities."}</p><button className="nt-modal-primary" onClick={() => setActiveLandmark(null)}>Back to Town</button></section></div>}
  </main>;
}
