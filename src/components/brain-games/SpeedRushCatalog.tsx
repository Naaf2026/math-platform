"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search, Sparkles, Zap } from "lucide-react";
import { SPEED_GAMES, SPEED_CATEGORIES } from "@/lib/brain-games/speed-catalog";
import styles from "./speed-rush.module.css";

export default function SpeedRushCatalog(){
 const [filter,setFilter]=useState("All games"),[search,setSearch]=useState("");
 const shown=useMemo(()=>SPEED_GAMES.filter(g=>(filter==="All games"||g.category===filter)&&[g.title,g.description,g.category].join(" ").toLowerCase().includes(search.trim().toLowerCase())),[filter,search]);
 return <main className={styles.shell}>
  <div className={styles.catalog}>
   <header className={styles.topbar}><Link href="/brain-games"><ArrowLeft size={17}/> Mind Games</Link><Link href="/dashboard">Home <ArrowRight size={16}/></Link></header>
   <section className={styles.hero}>
    <div className={styles.heroCopy}><span className={styles.eyebrow}><Zap size={15} fill="currentColor"/> LITTLE BRAINS. BIG ADVENTURES.</span><h1>Ready, set…<br/><span>Speed Rush!</span></h1><p>30 little adventures for quick thinkers.<br/>Pick a game, find your rhythm, and have fun.</p><div className={styles.heroTags}><span>🎮 30 games</span><span>✋ Tap & play</span><span>🌱 Go at your pace</span></div></div>
    <div className={styles.heroArt}><img src={SPEED_GAMES[0].image} alt="A friendly rocket racing among colourful number blocks" width={768} height={512}/><span className={styles.heroSticker}>YOUR NEXT<br/>ADVENTURE ↗</span></div>
   </section>
   <nav className={styles.categoryNav} aria-label="Brain game categories">{[["🧠","Brain Boost","memory"],["🔄","Brain Twist","flexibility"],["⚡","Speed Rush","speed"],["🎯","Spot On!","attention"],["🧩","Puzzle Power","problem-solving"],["🗺️","Brain Quest","adventure"]].map(([icon,title,slug])=><Link key={slug} href={`/brain-games/${slug}`} aria-current={slug==="speed"?"page":undefined}>{icon} {title}</Link>)}</nav>
   <section aria-labelledby="speed-games-heading">
    <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>PLAY SOMETHING WONDERFUL</span><h2 id="speed-games-heading">Where shall we go?</h2></div><label className={styles.search}><Search size={18}/><span className={styles.srOnly}>Find a speed game</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a game…"/></label></div>
    <div className={styles.filters} role="group" aria-label="Filter games">{["All games",...SPEED_CATEGORIES].map(c=><button key={c} aria-pressed={filter===c} onClick={()=>setFilter(c)}>{c}</button>)}</div>
    <p className={styles.resultCount} role="status">{shown.length} {shown.length===1?"adventure":"adventures"} to explore</p>
    <div className={styles.cardGrid}>{shown.map((g,i)=><article className={styles.gameCard} key={g.id}>
     <Link href={`/brain-games/challenge/${g.id}`} className={styles.cardArt} tabIndex={-1} aria-hidden="true"><img src={g.image} alt="" loading={i<4?"eager":"lazy"} width={768} height={512}/><span className={styles.cardNumber}>{g.id.slice(-2)}</span></Link>
     <div className={styles.cardBody}><span className={styles.gameCategory}>{g.category}</span><h3><Link href={`/brain-games/challenge/${g.id}`}>{g.title}</Link></h3><p>{g.description}</p><div className={styles.cardBottom}><span><Sparkles size={13}/> 3 Mind Sparks</span><Link href={`/brain-games/challenge/${g.id}`} aria-label={`Play ${g.title}`}>Play <ArrowRight size={17}/></Link></div></div>
    </article>)}</div>
    {!shown.length&&<div className={styles.empty}><span>🔎</span><h3>No games found yet</h3><p>Try another word or explore all the games.</p><button onClick={()=>{setSearch("");setFilter("All games");}}>Show all 30 games</button></div>}
   </section>
   <footer className={styles.footer}>🌟 A little practice. A little play. A big smile.<p>Every game has a relaxed, untimed mode. Mind Sparks and daily Mind Time still apply.</p></footer>
  </div>
 </main>;
}

