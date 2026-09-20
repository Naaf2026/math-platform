"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LearnerAccessNotice() {
  const [notice,setNotice]=useState<{kind:"trial"|"renewal";days:number}|null>(null);
  useEffect(()=>{
    let mounted=true;
    (async()=>{
      const s=createClient(); if(!s)return;
      const {data:u}=await s.auth.getUser(); if(!u.user)return;
      const {data}=await s.rpc("get_learner_access_state",{p_learner_id:u.user.id});
      if(!mounted||!data||data.access!=="enabled")return;
      const days=Number(data.days_left??0);
      const kind=data.status==="trialing"?"trial":"renewal";
      const threshold=kind==="trial"?2:3;
      if(days>threshold)return;
      const key=`learner-access-notice-${u.user.id}-${kind}-${new Date().toISOString().slice(0,10)}`;
      if(localStorage.getItem(key))return;
      localStorage.setItem(key,"1");
      setNotice({kind,days});
    })();
    return()=>{mounted=false};
  },[]);
  if(!notice)return null;
  const trial=notice.kind==="trial";
  return <div className="fixed inset-0 z-[200] grid place-items-center bg-[#071b3a]/65 p-4 backdrop-blur-sm">
    <section className="relative w-full max-w-md rounded-[30px] bg-white p-7 shadow-2xl sm:p-9">
      <button onClick={()=>setNotice(null)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500"><X size={18}/></button>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff3cc] text-[#806a12]"><BellRing size={28}/></div>
      <h2 className="mt-5 text-center text-3xl font-black text-[#083d78]">{trial?"Your free trial is ending soon":"Your monthly access is ending soon"}</h2>
      <p className="mt-3 text-center font-semibold leading-7 text-slate-600">{notice.days===1?"You have 1 day left.":`You have ${notice.days} days left.`} {trial?"Ask your parent to upgrade so you can keep learning without interruption.":"Ask your parent to renew this learner's monthly access."}</p>
      <Link href="/subscription" className="mt-6 block rounded-2xl bg-[#197fe9] px-5 py-3.5 text-center font-black text-white">Upgrade to Premium → 👑</Link>
      <button onClick={()=>setNotice(null)} className="mt-3 w-full rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-600">Continue for now</button>
    </section>
  </div>;
}
