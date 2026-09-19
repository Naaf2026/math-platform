"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, ExternalLink, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Payment = { id:string; parent_id:string; learner_id:string; amount_mvr:number; transfer_reference:string|null; slip_path:string|null; status:string; submitted_at:string; review_note:string|null; };
type Profile = { id:string; full_name:string|null; display_name:string|null; };
export default function AdminPaymentsPage() {
  const [payments,setPayments]=useState<Payment[]>([]);
  const [profiles,setProfiles]=useState<Record<string,Profile>>({});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string|null>(null);
  const [note,setNote]=useState<Record<string,string>>({});
  const [error,setError]=useState("");

  async function load() {
    const s=createClient(); if(!s) return;
    const {data}=await s.from("subscription_payments").select("*").order("submitted_at",{ascending:false});
    const rows=(data??[]) as Payment[];
    const ids=[...new Set(rows.flatMap(p=>[p.parent_id,p.learner_id]))];
    const {data:ps}=ids.length?await s.from("profiles").select("id,full_name,display_name").in("id",ids):{data:[]};
    const map:Record<string,Profile>={}; (ps??[]).forEach(p=>map[p.id]=p);
    setPayments(rows); setProfiles(map); setLoading(false);
  }
  useEffect(()=>{void load()},[]);

  async function review(id:string, approve:boolean) {
    const s=createClient(); if(!s) return;
    setBusy(id); setError("");
    const fn=approve?"approve_subscription_payment":"reject_subscription_payment";
    const {error:e}=await s.rpc(fn,{p_payment_id:id,p_note:note[id]||null});
    if(e)setError(e.message); else await load();
    setBusy(null);
  }

  async function viewSlip(path:string|null) {
    if(!path)return;
    const s=createClient(); if(!s)return;
    const {data,error:e}=await s.storage.from("payment-slips").createSignedUrl(path,600);
    if(e){setError(e.message);return}
    if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#f4f8fc]"><Loader2 className="animate-spin"/></main>;
  return <main className="min-h-screen bg-[#f4f8fc] px-4 py-8 text-[#083d78] sm:px-8">
    <div className="mx-auto max-w-6xl"><div className="rounded-[28px] bg-[#073b73] p-7 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-widest text-yellow-300">Admin</p><h1 className="mt-2 text-4xl font-black">Learner payment approvals</h1><p className="mt-2 font-semibold text-white/75">Verify the bank transfer before activating one month of full learner access.</p></div>
    {error&&<div className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
    <div className="mt-6 space-y-4">{payments.map(p=>{const learner=profiles[p.learner_id];const parent=profiles[p.parent_id];return <article key={p.id} className="rounded-[26px] bg-white p-6 shadow-md border border-slate-200">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-black">{learner?.display_name||learner?.full_name||p.learner_id}</h2><p className="text-sm font-semibold text-slate-500">Parent: {parent?.display_name||parent?.full_name||p.parent_id}</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${p.status==="pending"?"bg-amber-50 text-amber-700":p.status==="approved"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>{p.status}</span></div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><div><b>Amount:</b> MVR {p.amount_mvr}</div><div><b>Reference:</b> {p.transfer_reference||"—"}</div><div><b>Submitted:</b> {new Date(p.submitted_at).toLocaleString()}</div></div>
      <div className="mt-5 flex flex-wrap gap-3"><button onClick={()=>viewSlip(p.slip_path)} disabled={!p.slip_path} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-black disabled:opacity-40"><ExternalLink size={17}/> View transfer slip</button>
      {p.status==="pending"&&<><input value={note[p.id]||""} onChange={e=>setNote(v=>({...v,[p.id]:e.target.value}))} placeholder="Admin note (optional)" className="min-w-[220px] flex-1 rounded-xl border px-4 py-3 outline-none"/><button onClick={()=>review(p.id,true)} disabled={busy===p.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-black text-white"><Check size={17}/> Approve & activate</button><button onClick={()=>review(p.id,false)} disabled={busy===p.id} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white"><X size={17}/> Reject</button></>}</div>
    </article>})}{!payments.length&&<div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">No payment submissions yet.</div>}</div></div>
  </main>
}