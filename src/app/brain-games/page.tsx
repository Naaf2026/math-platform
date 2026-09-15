"use client";

import Link from "next/link";
import { Brain, CalendarDays, ChevronRight, Coins, Gift, GraduationCap, Home, Lock, Play, Puzzle, Repeat2, Settings, Star, Target, UserCircle, Zap } from "lucide-react";
import { useState } from "react";

type Art = "memory"|"rush"|"evenodd"|"flash"|"order"|"pattern"|"hidden"|"missing";
type Game = { title:string; href:string; active:boolean; reward:number; level?:number; art:Art };

const games:Game[]=[
 {title:"Memory Tiles",href:"/brain-games/memory-tiles",active:true,reward:10,art:"memory"},
 {title:"Number Rush",href:"/brain-games/number-rush",active:true,reward:15,art:"rush"},
 {title:"Even or Odd",href:"/brain-games/even-odd",active:true,reward:10,art:"evenodd"},
 {title:"Flash Memory",href:"/brain-games/flash-memory",active:true,reward:15,art:"flash"},
 {title:"Number Order",href:"/brain-games/number-order",active:true,reward:10,art:"order"},
 {title:"Pattern Quest",href:"/brain-games/pattern-quest",active:true,reward:15,art:"pattern"},
 {title:"Hidden Numbers",href:"#",active:false,reward:20,level:5,art:"hidden"},
 {title:"What's Missing?",href:"#",active:false,reward:20,level:7,art:"missing"},
];

const filters=[
 {name:"Memory",icon:Brain},
 {name:"Speed",icon:Zap},
 {name:"Attention",icon:Target},
 {name:"Flexibility",icon:Repeat2},
 {name:"Problem Solving",icon:Puzzle},
];

function matches(g:Game,f:string){
 if(f==="All")return true;
 if(f==="Memory")return ["Memory Tiles","Flash Memory"].includes(g.title);
 if(f==="Speed")return g.title==="Number Rush";
 if(f==="Attention")return ["Even or Odd","Hidden Numbers"].includes(g.title);
 if(f==="Flexibility")return g.title==="Number Order";
 return ["Pattern Quest","What's Missing?"].includes(g.title);
}

const positions:Record<Art,string>={
 memory:"0% 0%",rush:"33.333% 0%",evenodd:"66.666% 0%",flash:"100% 0%",
 order:"0% 100%",pattern:"33.333% 100%",hidden:"66.666% 100%",missing:"100% 100%"
};

function CardArt({game}:{game:Game}){
 return <div role="img" aria-label={`${game.title} illustration`} className="h-full w-full bg-no-repeat transition duration-300 group-hover:scale-[1.025]" style={{backgroundImage:"url('/assets/brain-games-art-rich.svg')",backgroundSize:"400% 200%",backgroundPosition:positions[game.art]}}/>;
}

function Hero(){
 return <section className="relative overflow-hidden bg-gradient-to-b from-[#18c4ef] via-[#08b9e7] to-[#06addc]">
   <div className="absolute inset-0 opacity-35" style={{backgroundImage:"radial-gradient(circle at 4% 55%,#fff 0 34px,transparent 35px),radial-gradient(circle at 18% 24%,#fff 0 10px,transparent 11px),radial-gradient(circle at 74% 25%,#fff 0 5px,transparent 6px),radial-gradient(circle at 92% 62%,#fff 0 12px,transparent 13px)"}}/>
   <div className="absolute -right-16 top-3 h-32 w-32 rounded-full bg-[#68d65f]/70 blur-[1px]"/>
   <div className="relative mx-auto flex min-h-[190px] max-w-[1500px] items-center justify-between gap-4 px-5 py-5 sm:min-h-[205px] sm:px-10">
     <div className="flex items-center gap-4 sm:gap-7">
       <div className="relative hidden h-[145px] w-[145px] shrink-0 sm:block">
         <div className="absolute left-3 top-4 h-[112px] w-[112px] rounded-[48%] bg-[#ff9dca] shadow-[inset_-10px_-8px_0_rgba(178,54,113,.16),0_8px_0_rgba(0,91,157,.18)]"/>
         <div className="absolute left-9 top-10 h-4 w-4 rounded-full bg-[#17264d]"/><div className="absolute left-[78px] top-10 h-4 w-4 rounded-full bg-[#17264d]"/>
         <div className="absolute left-10 top-[77px] h-5 w-16 rounded-b-full border-b-4 border-[#17264d]"/>
         <div className="absolute left-1 top-6 h-8 w-28 -rotate-[8deg] rounded-full border-8 border-[#167bd0]"/>
         <div className="absolute bottom-3 left-8 h-5 w-5 rounded-full bg-[#167bd0]"/><div className="absolute bottom-3 right-8 h-5 w-5 rounded-full bg-[#167bd0]"/>
       </div>
       <div>
         <div className="text-[46px] font-black leading-[.88] tracking-tight text-[#ffd33d] drop-shadow-[0_4px_0_#18558f] sm:text-[64px]">Brain</div>
         <div className="text-[47px] font-black leading-[.9] tracking-tight text-white drop-shadow-[0_5px_0_#18558f] sm:text-[66px]">Games</div>
       </div>
     </div>
     <Link href="/challenge" className="flex w-[285px] shrink-0 items-center justify-between rounded-[24px] border-2 border-white/45 bg-[#0874d1]/90 px-5 py-4 text-white shadow-[0_8px_0_rgba(0,78,143,.22)] sm:w-[365px] sm:px-6">
       <div className="flex items-center gap-3"><CalendarDays size={32}/><div><div className="text-lg font-black sm:text-xl">Daily Challenge</div><div className="mt-1 flex items-center gap-2 text-sm font-black text-white/90"><Gift size={20} fill="currentColor"/> Bonus reward +20</div></div></div><ChevronRight size={31}/>
     </Link>
   </div>
 </section>;
}

export default function BrainGamesPage(){
 const[filter,setFilter]=useState("All");
 const shown=games.filter(g=>matches(g,filter));
 return <main className="min-h-screen overflow-x-hidden bg-[#08bce7] text-slate-700">
   <header className="h-[66px] bg-[#086fc1] px-4 text-white shadow-lg sm:px-7">
     <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between">
       <div className="flex items-center gap-4">
         <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#086fc1] shadow"><GraduationCap size={25} strokeWidth={2.8}/></div>
         <span className="h-8 w-px bg-white/30"/>
         <Link href="/dashboard" aria-label="Home" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10"><Home size={24} fill="currentColor"/></Link>
       </div>
       <div className="flex items-center gap-2 sm:gap-3">
         <div className="flex items-center gap-1.5 rounded-full bg-[#075ba8] px-3 py-2 font-black sm:px-4"><Coins size={22} className="text-yellow-300" fill="currentColor"/>320</div>
         <div className="flex items-center gap-1.5 rounded-full bg-[#075ba8] px-3 py-2 font-black sm:px-4"><Star size={23} className="text-yellow-300" fill="currentColor"/>5</div>
         <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 sm:h-11 sm:w-11"><UserCircle size={30}/></div>
         <Settings size={24}/>
       </div>
     </div>
   </header>

   <Hero/>

   <section className="px-4 py-4 sm:px-8">
     <div className="mx-auto flex max-w-[1380px] gap-3 overflow-x-auto pb-1">
       {filters.map(f=>{const Icon=f.icon;const active=filter===f.name;return <button key={f.name} onClick={()=>setFilter(active?"All":f.name)} className={`flex min-w-[155px] items-center justify-center gap-2.5 rounded-full px-5 py-3 text-base font-black shadow-[0_5px_0_rgba(0,85,145,.18)] transition hover:-translate-y-0.5 ${active?"bg-white text-[#086fc1]":"bg-[#0877c4] text-white hover:bg-[#076db5]"}`}><Icon size={26} strokeWidth={2.8}/>{f.name}</button>})}
     </div>
   </section>

   <section className="px-4 pb-10 sm:px-8">
     <div className="mx-auto max-w-[1440px] rounded-[30px] border-4 border-cyan-300/75 bg-[#08b5e4]/65 p-3 shadow-inner sm:p-4">
       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
         {shown.map(game=><article key={game.title} className="group overflow-hidden rounded-[24px] border-4 border-white/95 bg-white shadow-[0_8px_0_rgba(0,90,140,.18)] transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
           <div className="relative aspect-[360/230] overflow-hidden bg-cyan-100">
             {game.active?<Link href={game.href} className="block h-full" aria-label={`Play ${game.title}`}><CardArt game={game}/></Link>:<><CardArt game={game}/><div className="absolute inset-0 bg-[#164d79]/48"/><div className="absolute inset-0 flex items-center justify-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#1689cf] shadow-xl"><Lock size={29} fill="currentColor"/></span></div></>}
           </div>
           <div className="flex min-h-[78px] items-center justify-between gap-2 bg-white px-4 py-3">
             <div><h2 className="text-[17px] font-black leading-tight text-[#075a9d]">{game.title}</h2>{game.active?<div className="mt-2 flex items-center gap-1.5 text-sm font-black text-[#1475ba]"><Coins size={18} className="text-[#ffc928]" fill="currentColor"/>+{game.reward}</div>:<div className="mt-2 inline-flex rounded-full bg-[#6c9cbb] px-3 py-1 text-[11px] font-black text-white">Level {game.level} Required</div>}</div>
             {game.active&&<Link href={game.href} aria-label={`Play ${game.title}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1597e8] text-white shadow-md hover:bg-[#087fcf]"><Play size={22} fill="currentColor"/></Link>}
           </div>
         </article>)}
       </div>
     </div>
   </section>
 </main>;
}
