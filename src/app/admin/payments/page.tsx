"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, ExternalLink, Loader2, X, CreditCard, Search, RefreshCw } from "lucide-react";
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
  const [tab,setTab]=useState<"pending"|"approved"|"rejected">("pending");
  const [search,setSearch]=useState("");

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

  const filtered=payments.filter(p=>p.status===tab).filter(p=>{const q=search.trim().toLowerCase(); if(!q)return true; const learner=profiles[p.learner_id]; const parent=profiles[p.parent_id]; return [learner?.display_name,learner?.full_name,parent?.display_name,parent?.full_name,p.transfer_reference].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)); });
  const counts={pending:payments.filter(p=>p.status==="pending").length,approved:payments.filter(p=>p.status==="approved").length,rejected:payments.filter(p=>p.status==="rejected").length};

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#f4f8fc]"><Loader2 className="animate-spin"/></main>;
  return <main className="min-h-screen bg-[#f4f8fc] px-4 py-8 text-[#083d78] sm:px-8">
    <div className="mx-auto max-w-6xl"><div className="rounded-[28px] bg-gradient-to-br from-[#073b73] via-[#174c91] to-[#2563eb] p-7 text-white shadow-xl sm:p-9"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-widest text-yellow-300">Admin · Payments & Premium</p><h1 className="mt-2 text-4xl font-black">Payment approvals</h1><p className="mt-2 max-w-2xl font-semibold text-white/75">Review parent payment slips, confirm the bank transfer, and activate one month of Premium learner access.</p></div><div className="rounded-3xl bg-white/10 p-4 backdrop-blur"><CreditCard size={28}/><p className="mt-2 text-xs font-bold text-white/70">Pending review</p><p className="text-3xl font-black">{counts.pending}</p></div></div></div>
    {error&&<div className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}<div className="mt-5 grid gap-3 sm:grid-cols-3">{(["pending","approved","rejected"] as const).map(k=><button key={k} onClick={()=>setTab(k)} className={`rounded-2xl p-4 text-left ring-1 transition ${tab===k?"bg-[#073b73] text-white ring-[#073b73]":"bg-white text-slate-700 ring-slate-200"}`}><div className="flex items-center justify-between"><span className="text-sm font-black capitalize">{k}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${tab===k?"bg-white/15 text-white":"bg-slate-100 text-slate-600"}`}>{counts[k]}</span></div><p className={`mt-1 text-xs ${tab===k?"text-white/70":"text-slate-400"}`}>{k==="pending"?"Needs verification":k==="approved"?"Premium activated":"Payment declined"}</p></button>)}</div><div className="mt-4 flex flex-wrap gap-3"><div className="relative flex-1 min-w-[240px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search learner, parent or transfer reference" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"/></div><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-600"><RefreshCw size={17}/> Refresh</button></div>
    <div className="mt-6 space-y-4">{filtered.map(p=>{const learner=profiles[p.learner_id];const parent=profiles[p.parent_id];return <article key={p.id} className="rounded-[26px] bg-white p-6 shadow-md border border-slate-200">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-black">{learner?.display_name||learner?.full_name||p.learner_id}</h2><p className="text-sm font-semibold text-slate-500">Parent: {parent?.display_name||parent?.full_name||p.parent_id}</p></div><span className={`rounded-full px-3 py-2 text-xs font-black ${p.status==="pending"?"bg-amber-50 text-amber-700":p.status==="approved"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>{p.status}</span></div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><div><b>Amount:</b> MVR {p.amount_mvr}</div><div><b>Reference:</b> {p.transfer_reference||"—"}</div><div><b>Submitted:</b> {new Date(p.submitted_at).toLocaleString()}</div></div>
      <div className="mt-5 flex flex-wrap gap-3"><button onClick={()=>viewSlip(p.slip_path)} disabled={!p.slip_path} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-black disabled:opacity-40"><ExternalLink size={17}/> View transfer slip</button>
      {p.status==="pending"&&<><input value={note[p.id]||""} onChange={e=>setNote(v=>({...v,[p.id]:e.target.value}))} placeholder="Admin note (optional)" className="min-w-[220px] flex-1 rounded-xl border px-4 py-3 outline-none"/><button onClick={()=>review(p.id,true)} disabled={busy===p.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-black text-white"><Check size={17}/> Approve & activate</button><button onClick={()=>review(p.id,false)} disabled={busy===p.id} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white"><X size={17}/> Reject</button></>}</div>
    </article>})}{!filtered.length&&<div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">No matching payments in this section.</div>}</div></div>
  </main>
}