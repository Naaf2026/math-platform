"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Users, Shuffle, UserRound, Loader2, ChevronRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Candidate={id:string;display_name:string;avatar_emoji:string;grade:string;learning_level:string;class_name:string};

export default function BuddySelectPage(){
 const params=useSearchParams(); const mode=params.get("mode")||"buddy";
 const [items,setItems]=useState<Candidate[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(""); const [error,setError]=useState("");
 const automatic=mode==="random"||mode==="my_buddy";
 useEffect(()=>{void load()},[mode]);

 async function load(){
   setLoading(true); setError("");
   if(automatic){
     await autoMatch();
     return;
   }
   const s=createClient();
   if(!s){setError("Learning account is not configured.");setLoading(false);return}
   const {data,error}=await s.rpc("get_buddy_candidates",{p_mode:mode});
   if(error)setError(error.message); else setItems((data||[]) as Candidate[]);
   setLoading(false)
 }

 async function autoMatch(){
   const s=createClient();
   if(!s){setError("Learning account is not configured.");setLoading(false);return}
   const {data,error}=await s.rpc("create_buddy_challenge",{p_challenged_id:null,p_challenge_type:mode});
   if(error){setError(error.message);setLoading(false);return}
   const id=data?.id||data?.[0]?.id;
   if(!id){setError("No eligible learner was found.");setLoading(false);return}
   window.location.href=`/peer-challenge/play?id=${id}`;
 }

 async function challenge(id:string){
   setBusy(id);setError("");
   const s=createClient();
   if(!s){setError("Learning account is not configured.");setBusy("");return}
   const {data,error}=await s.rpc("create_buddy_challenge",{p_challenged_id:id,p_challenge_type:mode});
   if(error){setError(error.message);setBusy("");return}
   window.location.href=`/peer-challenge/play?id=${data?.id||data?.[0]?.id}`
 }

 const title=mode==="buddy"?"Choose a Classmate":mode==="my_buddy"?"My Buddy":"Random Challenger";
 const Icon=mode==="buddy"?Users:mode==="my_buddy"?UserRound:Shuffle;

 return <main className="min-h-screen bg-[#eef9ff] text-[#083d78]">
  <header className="sticky top-0 z-40 h-[76px] bg-[#073b73] text-white shadow-sm">
   <div className="mx-auto flex h-full max-w-[1200px] items-center px-4 sm:px-6">
    <Link href="/peer-challenge" className="mr-4 grid h-11 w-11 place-items-center rounded-full bg-white/10"><ArrowLeft size={21}/></Link>
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ff855f]"><Icon size={23}/></div>
    <div className="ml-3"><p className="text-xs font-black uppercase tracking-wider text-white/70">Buddy Challenge</p><h1 className="text-xl font-black sm:text-2xl">{title}</h1></div>
   </div>
  </header>

  <section className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:py-12">
   <div className="rounded-[32px] border border-[#d7eaf7] bg-white p-5 shadow-sm sm:p-8">
    <div className="text-center">
     <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eef8ff] text-[#197fe9]"><Sparkles size={30}/></div>
     <h2 className="mt-4 text-3xl font-black">{automatic?(mode==="random"?"Finding a random challenger":"Finding your Buddy"):"Choose who to challenge"}</h2>
     <p className="mx-auto mt-2 max-w-xl font-semibold leading-6 text-[#6685a4]">
      {mode==="buddy"?"Only eligible classmates are shown.":mode==="my_buddy"?"We will find an available learner at a similar level.":"We will randomly match you with an eligible learner."}
     </p>
    </div>

    {error&&<div className="mt-6 rounded-2xl bg-rose-50 p-4 text-center text-sm font-bold text-rose-700">{error}</div>}

    {loading&&<div className="grid place-items-center py-20"><Loader2 className="animate-spin text-[#197fe9]" size={34}/><p className="mt-4 font-bold text-[#6685a4]">{automatic?"Matching you with an eligible learner...":"Loading eligible learners..."}</p></div>}

    {!loading&&!automatic&&items.length===0&&<div className="mt-8 rounded-3xl bg-[#eef8ff] p-8 text-center"><div className="text-5xl">👥</div><h3 className="mt-4 text-xl font-black">No eligible learners yet</h3><p className="mt-2 font-semibold text-[#6685a4]">Try another Buddy Challenge option later.</p></div>}

    {!loading&&!automatic&&items.length>0&&<div className="mt-8 grid gap-4 sm:grid-cols-2">{items.map(p=><div key={p.id} className="flex items-center gap-4 rounded-3xl border-2 border-[#dcecf7] bg-[#f9fdff] p-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#e7f5ff] text-3xl">{p.avatar_emoji||"🧑‍🎓"}</div>
      <div className="min-w-0 flex-1"><h3 className="truncate text-lg font-black">{p.display_name}</h3><p className="mt-1 text-sm font-bold text-[#6685a4]">{[p.class_name,p.grade,p.learning_level].filter(Boolean).join(" • ")}</p></div>
      <button onClick={()=>void challenge(p.id)} disabled={!!busy} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff6035] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy===p.id?"Sending...":"Challenge"}<ChevronRight size={16}/></button>
    </div>)}</div>}

    {!loading&&automatic&&error&&<Link href="/peer-challenge" className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-[#197fe9] px-5 py-3 text-sm font-black text-white">Back to Buddy Challenge</Link>}
   </div>
  </section>
 </main>;
}