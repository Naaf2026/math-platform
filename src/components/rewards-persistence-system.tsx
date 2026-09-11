"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Coins, Gem, Gift, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RewardResult={coins_awarded:number;gems_awarded:number;badge_key:string|null;daily_bonus:number};

export default function RewardsPersistenceSystem(){
 const [coins,setCoins]=useState(0),[gems,setGems]=useState(0),[badges,setBadges]=useState(0),[flash,setFlash]=useState<RewardResult|null>(null);
 const claimed=useRef(false);
 useEffect(()=>{
  if(typeof window!=="undefined"&&!window.location.pathname.startsWith("/mission"))return;
  const supabase=createClient(); if(!supabase)return;
  let active=true;
  (async()=>{const {data}=await supabase.rpc("get_student_rewards");if(active&&data?.[0]){setCoins(data[0].coins??0);setGems(data[0].gems??0);} const b=await supabase.from("student_badges").select("id",{count:"exact",head:true});if(active)setBadges(b.count??0);})();
  const finish=async()=>{
   if(claimed.current)return;
   const text=document.body.innerText||"";
   if(!/Math Champion!|Adventure complete/i.test(text))return;
   claimed.current=true;
   const correct=Number((text.match(/(\d+)\s*\/\s*(\d+)\s*Correct/i)||[])[1]||0),total=Number((text.match(/(\d+)\s*\/\s*(\d+)\s*Correct/i)||[])[2]||10);
   const combo=Number((text.match(/Best Combo[^\d]*(\d+)/i)||[])[1]||0);
   const xp=Number((text.match(/(?:Score|XP)[^\d]*(\d+)/i)||[])[1]||0);
   const perfect=/PERFECT|Perfect Run/i.test(text);
   const {data}=await supabase.rpc("award_mission_rewards",{p_xp:xp,p_combo:combo,p_correct:correct,p_total:total,p_perfect:perfect});
   const r=data?.[0] as RewardResult|undefined;
   if(r){setCoins(v=>v+(r.coins_awarded||0));setGems(v=>v+(r.gems_awarded||0));setFlash(r);window.setTimeout(()=>setFlash(null),5000);}
  };
  const observer=new MutationObserver(finish);observer.observe(document.body,{childList:true,subtree:true,characterData:true});finish();
  return()=>{active=false;observer.disconnect()};
 },[]);
 if(typeof window!=="undefined"&&!window.location.pathname.startsWith("/mission"))return null;
 return <>
  <div className="fixed right-4 top-20 z-[68] flex items-center gap-2 rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-black text-slate-700 shadow-xl backdrop-blur sm:right-6 sm:top-24"><span className="flex items-center gap-1"><Coins size={15} className="text-amber-500"/>{coins}</span><span className="flex items-center gap-1"><Gem size={15} className="text-cyan-500"/>{gems}</span><span className="hidden items-center gap-1 sm:flex"><Award size={15} className="text-violet-500"/>{badges}</span></div>
  {flash&&<div className="fixed bottom-24 left-1/2 z-[90] flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 rounded-3xl border-2 border-amber-200 bg-white p-4 shadow-2xl"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100"><Gift size={23} className="text-amber-600"/></div><div className="min-w-0 flex-1"><p className="font-black text-[#15233f]">Rewards unlocked! 🎉</p><p className="text-xs font-bold text-slate-500">+{flash.coins_awarded} coins · +{flash.gems_awarded} gems{flash.badge_key?" · 🏅 Perfect Run badge":""}</p></div><Trophy size={21} className="text-orange-500"/></div>}
 </>;
}
