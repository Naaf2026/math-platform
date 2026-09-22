"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, Trophy, Sparkles, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MindSparkGate from "./MindSparkGate";
import { speedGameById, type SpeedGame } from "@/lib/brain-games/speed-catalog";
import { makeSpeedRound, isBuildComplete, moveOnPath, type Round, type Tile } from "@/lib/brain-games/speed-rounds";
import styles from "./speed-rush.module.css";

const TOTAL=8, DURATION=90_000;
type Stats={correct:number;solved:number;combo:number;best:number};
type Reward={xp:number;coins:number;stars:number};
export default function SpeedRushGame({gameId}:{gameId:string}){
 const game=speedGameById(gameId);
 if(!game)return <main className={styles.shell}><Link href="/brain-games/speed">Back to Speed Rush</Link><h1>Game not found</h1></main>;
 return <Session key={game.id} game={game}/>;
}
function Session({game}:{game:SpeedGame}){
 const [phase,setPhase]=useState<"lobby"|"play"|"result">("lobby"),[level,setLevel]=useState(1),[timed,setTimed]=useState(false);
 const [paused,setPaused]=useState(false),[round,setRound]=useState<Round|null>(null),[index,setIndex]=useState(0);
 const [remaining,setRemaining]=useState(DURATION),[stats,setStats]=useState<Stats>({correct:0,solved:0,combo:0,best:0});
 const [feedback,setFeedback]=useState(""),[reward,setReward]=useState<Reward|null>(null),[saveState,setSaveState]=useState(""),[timeUp,setTimeUp]=useState(false);
 const statsRef=useRef(stats),ended=useRef(true),advance=useRef<ReturnType<typeof setTimeout>|null>(null),mounted=useRef(true),run=useRef(0),roundLock=useRef(false);
 const secondsRef=useRef(DURATION),startedSession=useRef<string|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;run.current++;if(advance.current)clearTimeout(advance.current);};},[]);
 const finish=useCallback(async(expired=false)=>{
  if(ended.current)return;ended.current=true;roundLock.current=true;
  if(advance.current)clearTimeout(advance.current);
  setTimeUp(expired);setFeedback("");setPhase("result");setPaused(false);setSaveState("Saving your result…");
  const snapshot=statsRef.current,token=run.current;
  try{
   const client=createClient();if(!client)throw new Error("Learning service unavailable");
   if(startedSession.current){void client.rpc("pause_brain_game",{p_session_id:startedSession.current});}
   const {data,error}=await client.rpc("complete_brain_game",{p_game_key:game.id,p_score:snapshot.correct,p_total:TOTAL,p_combo:snapshot.best});
   if(error)throw error;
   const saved=Array.isArray(data)?data[0]:data;
   if(!saved)throw new Error("No saved result returned");
   if(mounted.current&&token===run.current){setReward({xp:Number(saved.xp??0),coins:Number(saved.coins??0),stars:Number(saved.stars??0)});setSaveState("Result saved to your learning profile.");}
  }catch{
   // Completion can award rewards. Do not retry an uncertain write automatically.
   if(mounted.current&&token===run.current)setSaveState("We could not confirm that your result was saved. Your score is shown here; rewards have not been confirmed.");
  }finally{
   try{if(window.localStorage.getItem("brain_game_active_session")===startedSession.current)window.localStorage.removeItem("brain_game_active_session");}catch{}
  }
 },[game.id]);
 useEffect(()=>{
  if(phase!=="play"||paused||!timed)return;
  let last=performance.now();
  const timer=window.setInterval(()=>{const now=performance.now();secondsRef.current=Math.max(0,secondsRef.current-(now-last));last=now;setRemaining(secondsRef.current);if(secondsRef.current<=0)void finish(true);},100);
  return()=>window.clearInterval(timer);
 },[phase,paused,timed,finish]);
 useEffect(()=>{
  const hide=()=>{if(document.hidden&&phase==="play")setPaused(true);};
  document.addEventListener("visibilitychange",hide);return()=>document.removeEventListener("visibilitychange",hide);
 },[phase]);
 const begin=(result:{session_id:string})=>{
  run.current++;ended.current=false;roundLock.current=false;startedSession.current=result.session_id;
  if(advance.current)clearTimeout(advance.current);
  const clean={correct:0,solved:0,combo:0,best:0};statsRef.current=clean;setStats(clean);setIndex(0);setFeedback("");setReward(null);setSaveState("");setTimeUp(false);setPaused(false);
  secondsRef.current=DURATION;setRemaining(DURATION);setRound(makeSpeedRound(game,level,0));setPhase("play");
 };
 const complete=(firstTry:boolean)=>{
  if(ended.current||roundLock.current)return;
  roundLock.current=true;
  const old=statsRef.current,combo=firstTry?old.combo+1:0;
  const next={correct:old.correct+(firstTry?1:0),solved:old.solved+1,combo,best:Math.max(old.best,combo)};
  statsRef.current=next;setStats(next);setFeedback(firstTry?"Brilliant! You did it!":"You kept trying. Well done!");
 };
 // Keep the feedback visible during a pause and cancel advances on unmount.
 useEffect(()=>{
  if(!feedback||paused||phase!=="play")return;
  advance.current=setTimeout(()=>{if(ended.current)return;if(statsRef.current.solved>=TOTAL){void finish();return;}const next=statsRef.current.solved;setIndex(next);setRound(makeSpeedRound(game,level,next));setFeedback("");roundLock.current=false;},850);
  return()=>{if(advance.current)clearTimeout(advance.current);};
 },[feedback,paused,phase,game,level,finish]);
 return <main className={styles.shell}><div className={styles.playShell}>
  <header className={styles.topbar}><Link href="/brain-games/speed"><ArrowLeft size={18}/> All 30 games</Link><span className={styles.brand}>⚡ SPEED RUSH</span>{phase==="play"?<button onClick={()=>setPaused(true)} aria-label="Pause game"><Pause size={18}/> Pause</button>:<Link href="/dashboard">Home</Link>}</header>
  {phase==="lobby"&&<section className={styles.lobby}>
   <div className={styles.lobbyArt}><img src={game.image} alt={game.title+" game illustration"} width={768} height={512}/><span className={styles.cardNumber}>{game.id.slice(-2)}</span></div>
   <div className={styles.lobbyCopy}><span className={styles.eyebrow}>{game.category}</span><h1>{game.title}</h1><p className={styles.intro}>{game.description}</p><div className={styles.rule}><span>{game.emoji}</span><div><b>How to play</b><p>{game.instructions}</p></div></div>
    <fieldset className={styles.settings}><legend>Choose your challenge</legend><div>{["Gentle","Brave","Super"].map((name,i)=><button key={name} type="button" aria-pressed={level===i+1} onClick={()=>setLevel(i+1)}>{["🌱","🌿","🌳"][i]} {name}</button>)}</div></fieldset>
    <fieldset className={styles.settings}><legend>Your pace</legend><div><button aria-pressed={!timed} onClick={()=>setTimed(false)}>🌈 Relaxed · no countdown</button><button aria-pressed={timed} onClick={()=>setTimed(true)}>⚡ 90-second rush</button></div></fieldset>
    <p className={styles.hint}>8 rounds · large touch controls · 3 Mind Sparks per play</p>
    <MindSparkGate gameKey={game.id} gameTitle={game.title} onStarted={begin} className={styles.primary}><Play size={19} fill="currentColor"/> Let’s play!</MindSparkGate>
   </div>
  </section>}
  {phase==="play"&&round&&<>
   <section className={styles.playHeader}><div><span className={styles.eyebrow}>{game.emoji} {game.category}</span><h1>{game.title}</h1></div><div className={styles.counters}><span>Round <b>{index+1}/{TOTAL}</b></span><span>⭐ First try <b>{stats.correct}</b></span><span className={timed&&remaining<15000?styles.urgent:""}>{timed?"⏱ Time":"🌈 Pace"}<b>{timed?Math.ceil(remaining/1000)+"s":"Relaxed"}</b></span></div></section>
   <div className={styles.progress} role="progressbar" aria-label="Rounds complete" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={stats.solved}><span style={{width:stats.solved/TOTAL*100+"%"}}/></div>
   <section className={styles.arena}><div className={styles.arenaTitle}><span className={styles.mascot} aria-hidden="true">{game.emoji}</span><h2>{round.prompt}</h2><button className={styles.help} onClick={()=>setPaused(true)}>How to play</button></div>
    <RoundBoard key={game.id+"-"+index} data={round} game={game} disabled={paused||!!feedback} paused={paused} onComplete={complete}/>
    <div className={styles.feedback} role="status" aria-live="polite">{feedback||"Take a look. You’ve got this!"}</div>
   </section>
   {paused&&<PauseDialog instructions={game.instructions} onResume={()=>setPaused(false)}/>}
  </>}
  {phase==="result"&&<section className={styles.result}><div className={styles.resultTrophy}><Trophy size={55}/></div><span className={styles.eyebrow}>{timeUp?"NICE RUSH!":"ADVENTURE COMPLETE"}</span><h1>{timeUp?"Look how far you got!":"You did it!"}</h1><p>You solved {stats.solved} of {TOTAL} rounds in {game.title}.</p><div className={styles.resultStats}><span><b>{stats.correct}/{TOTAL}</b>First try</span><span><b>{stats.solved}</b>Rounds solved</span><span><b>{stats.best}</b>Best streak</span></div>
   {reward&&<div className={styles.rewards}><span>⭐ {reward.stars} stars</span><span>✨ +{reward.xp} XP</span><span>🪙 +{reward.coins} coins</span></div>}
   <p className={styles.saveStatus} role="status">{saveState}</p>
   <div className={styles.resultActions}><button className={styles.primary} disabled={saveState==="Saving your result…"} onClick={()=>setPhase("lobby")}><RotateCcw size={17}/> Play again</button><Link className={styles.secondary} href="/brain-games/speed">Choose another game <ArrowRight size={17}/></Link></div>
  </section>}
 </div></main>;
}
function PauseDialog({instructions,onResume}:{instructions:string;onResume:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
 return <dialog ref={ref} className={styles.pauseDialog} onCancel={e=>{e.preventDefault();onResume();}} aria-labelledby="speed-pause-title"><span className={styles.pauseEmoji}>🌤️</span><h2 id="speed-pause-title">Take a little breather</h2><p>{instructions}</p><p className={styles.hint}>Your game countdown is paused.</p><button className={styles.primary} onClick={onResume} autoFocus><Play size={17}/> Keep playing</button><Link href="/brain-games/speed">Leave this game</Link></dialog>;
}
function RoundBoard({data,game,disabled,paused,onComplete}:{data:Round;game:SpeedGame;disabled:boolean;paused:boolean;onComplete:(firstTry:boolean)=>void}){
 const [picked,setPicked]=useState<string[]>([]),[matched,setMatched]=useState<string[]>([]),[note,setNote]=useState(""),[selected,setSelected]=useState<string|null>(null);
 const [flipped,setFlipped]=useState<string[]>([]),[busy,setBusy]=useState(false),[watching,setWatching]=useState(data.mode==="echo"),[flash,setFlash]=useState<string|null>(null),[position,setPosition]=useState(data.start??3);
 const mistakes=useRef(0),done=useRef(false),busyRef=useRef(false),delay=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(delay.current)clearTimeout(delay.current);},[]);
 const success=()=>{if(done.current)return;done.current=true;onComplete(mistakes.current===0);};
 const wrong=(message="Almost! Try another one.")=>{mistakes.current++;setNote(message);};
 useEffect(()=>{
  if(data.mode!=="echo"||paused||done.current)return;
  setWatching(true);setPicked([]);setFlash(null);let cancelled=false;const timers:ReturnType<typeof setTimeout>[]=[];
  data.answer.forEach((id,i)=>{timers.push(setTimeout(()=>{if(!cancelled)setFlash(id);},500+i*750));timers.push(setTimeout(()=>{if(!cancelled)setFlash(null);},1000+i*750));});
  timers.push(setTimeout(()=>{if(!cancelled){setWatching(false);setNote("Your turn!");}},600+data.answer.length*750));
  return()=>{cancelled=true;timers.forEach(clearTimeout);setFlash(null);};
 },[data,paused]);
 const tap=(tile:Tile)=>{
  if(disabled||busyRef.current||done.current||watching)return;
  setNote("");
  if(data.mode==="choice"){if(data.answer.includes(tile.id)){setPicked([tile.id]);success();}else wrong();return;}
  if(data.mode==="order"||data.mode==="echo"){
   if(data.mode==="order"&&picked.includes(tile.id))return;
   if(tile.id!==data.answer[picked.length]){setPicked([]);wrong(data.mode==="echo"?"Try the sequence again from the beginning.":"Start again with the first number.");return;}
   const next=[...picked,tile.id];setPicked(next);if(next.length===data.answer.length)success();return;
  }
  if(data.mode==="hunt"){
   if(picked.includes(tile.id))return;
   if(!data.answer.includes(tile.id)){wrong("That one is different. Keep looking!");return;}
   const next=[...picked,tile.id];setPicked(next);if(next.length===data.answer.length)success();return;
  }
  if(data.mode==="build"){setPicked(picked.includes(tile.id)?picked.filter(id=>id!==tile.id):[...picked,tile.id]);return;}
  if(data.mode==="sort"){if(!matched.includes(tile.id))setSelected(tile.id);return;}
  if(data.mode==="memory"){
   if(matched.includes(tile.id)||flipped.includes(tile.id))return;
   const next=[...flipped,tile.id];setFlipped(next);
   if(next.length===2){
    const same=data.tiles.find(t=>t.id===next[0])!.label===tile.label;
    busyRef.current=true;setBusy(true);
    delay.current=setTimeout(()=>{const found=same?[...matched,...next]:matched;setMatched(found);setFlipped([]);busyRef.current=false;setBusy(false);setNote(same?"A match!":"Remember those cards. Try another pair.");if(found.length===data.tiles.length)success();},same?500:950);
   }
  }
 };
 const putInBin=(bin:string,id=selected)=>{
  if(disabled||done.current||!id||matched.includes(id))return;
  if(data.assignment?.[id]!==bin){wrong("Try the basket with the matching colour.");return;}
  const next=[...matched,id];setMatched(next);setSelected(null);setNote("In it goes!");if(next.length===data.tiles.length)success();
 };
 const move=(direction:string)=>{
  if(disabled||done.current)return;
  const next=moveOnPath(position,direction,data.rocks??[]);
  setPosition(next);if(next===data.goal)success();else setNote(next===position?"A rock or an edge! Try another direction.":"Keep going!");
 };
 // Native buttons remain available as a touch and keyboard alternative.
 useEffect(()=>{
  if(data.mode!=="path")return;
  const key=(event:KeyboardEvent)=>{const direction=({ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"} as Record<string,string>)[event.key];if(direction&&!disabled){event.preventDefault();move(direction);}};
  window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
 },[position,disabled,data]);
 const sum=picked.reduce((total,id)=>total+(data.tiles.find(t=>t.id===id)?.value??0),0);
 return <div className={styles.board}>
  {data.display&&<div className={styles.equation}>{data.display}</div>}
  {data.visual&&data.visual!=="bars"&&<MathVisual data={data}/>}
  {data.mode==="echo"&&<div className={styles.watchStatus} role="status">{watching?"👀 Watch carefully…":"👆 Your turn · "+picked.length+"/"+data.answer.length}</div>}
  {data.mode==="order"&&<div className={styles.trail} aria-label="Your number trail">{picked.length?picked.map(id=>data.tiles.find(t=>t.id===id)!.label).join(" → "):"Your trail starts here…"}</div>}
  {data.mode==="hunt"&&<p className={styles.huntCount}>{picked.length} of {data.answer.length} found</p>}
  {data.mode==="build"&&<div className={styles.buildTotal}><span>Target <b>{data.target}</b></span><span>Your total <b>{sum}</b></span></div>}
  {data.mode!=="path"&&<div className={[styles.tileGrid,data.mode==="memory"?styles.memoryGrid:"",data.mode==="echo"?styles.drumGrid:"",data.visual==="bars"?styles.monsterGrid:""].join(" ")}>
   {data.tiles.map((t,i)=>{
    const memory=data.mode==="memory",faceUp=!memory||flipped.includes(t.id)||matched.includes(t.id),found=matched.includes(t.id)||(data.mode==="hunt"&&picked.includes(t.id));
    const active=selected===t.id||picked.includes(t.id)||flash===t.id;
    return <button key={t.id} type="button" className={[styles.tile,t.tone?styles[t.tone]:"",active?styles.selected:"",found?styles.found:"",memory?styles.memoryTile:"",flash===t.id?styles.lit:"",data.visual==="bars"?styles.monsterTile:""].join(" ")}
     disabled={disabled||busy||found||(data.mode==="order"&&picked.includes(t.id))||watching}
     aria-label={memory?(faceUp?t.label:"Hidden card "+(i+1)):data.mode==="echo"?"Pad "+(i+1)+" "+t.label:data.visual==="bars"?t.label+" monster, "+t.height+" units tall":t.label}
     aria-pressed={["build","sort"].includes(data.mode)?active:undefined}
     draggable={data.mode==="sort"&&!disabled&&!found}
     onDragStart={e=>{setSelected(t.id);e.dataTransfer.setData("text/plain",t.id);}} onClick={()=>tap(t)}>
     {data.visual==="bars"?<><span className={styles.monsterBody} style={{height:40+(t.height??2)*23}}><span>◕ ◕</span><span>◡</span></span><b>{t.label}</b></>:<>{["balloon-order","comet-countdown","frog-skip","robot-compare","treasure-odd","bee-even","banana-bonds","bridge-builder","coin-catcher"].includes(game.slug)&&<span className={styles.tileEmoji} aria-hidden="true">{game.emoji}</span>}<span className={game.slug==="shape-safari"?styles.shape:""}>{memory&&!faceUp?"?":t.label}</span>{found&&<Check size={18} className={styles.check}/>}</>}
    </button>;
   })}
  </div>}
  {data.mode==="sort"&&<div className={styles.bins}>{data.bins!.map((bin,i)=><button key={bin} className={styles[["rose","sky","lime","amber"][i]]} disabled={disabled} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(data.tiles.some(t=>t.id===id))putInBin(bin,id);}} onClick={()=>putInBin(bin)}><span>🧺</span>{bin}<small>{matched.filter(id=>data.assignment?.[id]===bin).length} toys</small></button>)}</div>}
  {data.mode==="build"&&<div className={styles.buildActions}><button className={styles.secondary} disabled={disabled} onClick={()=>setPicked([])}><RotateCcw size={16}/> Clear</button><button className={styles.primary} disabled={disabled||!picked.length} onClick={()=>{if(isBuildComplete(data,picked))success();else wrong(data.pickCount&&picked.length!==data.pickCount?"Choose exactly "+data.pickCount+" pieces.":"Try a different total. You can put a piece back.");}}>Check my total <Check size={17}/></button></div>}
  {data.mode==="path"&&<div className={styles.pathBoard}><div className={styles.maze} aria-label="Three by three maze">{Array.from({length:9},(_,i)=><div key={i} className={i===position?styles.turtleCell:""} aria-label={i===position?"Turtle":i===data.goal?"Flag":data.rocks?.includes(i)?"Rock":"Open space"}>{i===position?"🐢":i===data.goal?"🚩":data.rocks?.includes(i)?"🪨":"🌱"}</div>)}</div><div className={styles.arrows}>{[["up","↑"],["left","←"],["down","↓"],["right","→"]].map(([direction,icon])=><button key={direction} disabled={disabled} onClick={()=>move(direction)} aria-label={"Move "+direction}>{icon}</button>)}</div></div>}
  <p className={styles.boardNote} role="status" aria-live="polite">{note||" "}</p>
 </div>;
}
function MathVisual({data}:{data:Round}){
 const [a=0,b=0]=data.numbers??[];
 if(data.visual==="count")return <div className={styles.countStars} aria-label={a+" stars"}>{Array.from({length:a},(_,i)=><span key={i} aria-hidden="true">⭐</span>)}</div>;
 if(data.visual==="place")return <div className={styles.placeValue}><div><b>Tens</b><div>{Array.from({length:a},(_,i)=><span className={styles.tenRod} key={i}>10</span>)}</div></div><div><b>Ones</b><div>{Array.from({length:b},(_,i)=><span className={styles.oneCube} key={i}>1</span>)}{b===0&&<span>0</span>}</div></div></div>;
 if(data.visual==="domino")return <div className={styles.domino} aria-label={a+" dots and "+b+" dots"}>{[a,b].map((count,i)=><div key={i}>{Array.from({length:count},(_,j)=><i key={j}/>)}</div>)}</div>;
 if(data.visual==="clock")return <svg className={styles.clock} viewBox="0 0 200 200" role="img" aria-label={`Clock showing ${a}:${String(b).padStart(2,"0")}`}><circle cx="100" cy="100" r="92" fill="#fff9e7" stroke="#ffbd59" strokeWidth="10"/>{Array.from({length:12},(_,i)=>{const angle=(i+1)*Math.PI/6;return <text key={i} x={100+Math.sin(angle)*73} y={105-Math.cos(angle)*73} textAnchor="middle" fontSize="16" fontWeight="900" fill="#283654">{i+1}</text>;})}<line x1="100" y1="100" x2="100" y2="53" stroke="#7553d4" strokeWidth="9" strokeLinecap="round" transform={`rotate(${a*30+b/2} 100 100)`}/><line x1="100" y1="100" x2="100" y2="36" stroke="#1a9db0" strokeWidth="5" strokeLinecap="round" transform={`rotate(${b*6} 100 100)`}/><circle cx="100" cy="100" r="7" fill="#273654"/></svg>;
 if(data.visual==="fraction")return <svg className={styles.clock} viewBox="0 0 200 200" role="img" aria-label={a+" of "+b+" equal pieces coloured"}>{Array.from({length:b},(_,i)=>{const start=i*2*Math.PI/b-Math.PI/2,end=(i+1)*2*Math.PI/b-Math.PI/2;return <path key={i} d={`M 100 100 L ${100+88*Math.cos(start)} ${100+88*Math.sin(start)} A 88 88 0 ${b===1?1:0} 1 ${100+88*Math.cos(end)} ${100+88*Math.sin(end)} Z`} fill={i<a?"#ffb651":"#fff4de"} stroke="#fff" strokeWidth="5"/>;})}</svg>;
 return null;
}
