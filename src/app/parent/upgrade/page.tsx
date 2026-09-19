"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, CreditCard, FileUp, Loader2, ArrowLeft, RefreshCw, ShieldCheck, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Learner = { learner_id: string; username: string; name: string; grade: string | null };
type Setting = { account_name: string; bank_name: string; account_number: string; instructions: string };
type Payment = { id: string; learner_id: string; status: string; amount_mvr: number; submitted_at: string; slip_path: string | null; review_note: string | null };
type AccessState = { access: string; status?: string; days_left?: number; payment_required?: boolean; reason?: string };

export default function ParentUpgradePage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [accessStates, setAccessStates] = useState<Record<string, AccessState>>({});
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/"; return; }
    const [{ data: accounts }, { data: setting }, { data: submitted }] = await Promise.all([
      supabase.from("parent_learner_accounts").select("learner_id,username").eq("parent_id", auth.user.id).order("created_at"),
      supabase.from("payment_settings").select("account_name,bank_name,account_number,instructions").eq("id", true).maybeSingle(),
      supabase.from("subscription_payments").select("id,learner_id,status,amount_mvr,submitted_at,slip_path,review_note").eq("parent_id", auth.user.id).order("submitted_at", { ascending: false })
    ]);
    const ids = (accounts ?? []).map(a => a.learner_id);
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id,full_name,display_name,grade").in("id", ids) : { data: [] as any[] };
    const learnerList = (accounts ?? []).map(a => {
      const p = (profiles ?? []).find(x => x.id === a.learner_id);
      return { learner_id: a.learner_id, username: a.username, name: p?.display_name || p?.full_name || a.username, grade: p?.grade ?? null };
    });
    setLearners(learnerList);
    if (learnerList.length) {
      const states = await Promise.all(learnerList.map(async learner => {
        const { data } = await supabase.rpc("get_learner_access_state", { p_learner_id: learner.learner_id });
        return [learner.learner_id, (data ?? { access: "disabled" }) as AccessState] as const;
      }));
      setAccessStates(Object.fromEntries(states));
    }
    setSettings(setting);
    setPayments(submitted ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function submit(learnerId: string) {
    const supabase = createClient();
    const file = files[learnerId];
    if (!supabase || !file) { setMessage("Please upload the bank transfer slip before submitting."); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage("The bank slip must be 5 MB or smaller."); return; }
    setBusy(learnerId); setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${auth.user.id}/${learnerId}-${Date.now()}.${ext}`;
    const upload = await supabase.storage.from("payment-slips").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) { setMessage(upload.error.message); setBusy(null); return; }
    const { error } = await supabase.rpc("submit_subscription_payment", {
      p_learner_id: learnerId,
      p_transfer_reference: refs[learnerId] || null,
      p_slip_path: path
    });
    if (error) { await supabase.storage.from("payment-slips").remove([path]); setMessage(error.message); setBusy(null); return; }
    setMessage("Payment submitted. Admin will verify the bank transfer and activate this learner.");
    setFiles(v => ({ ...v, [learnerId]: null })); setRefs(v => ({ ...v, [learnerId]: "" }));
    await load(); setBusy(null);
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#eef9ff]"><div className="rounded-3xl bg-white px-8 py-6 font-black text-[#083d78] shadow-xl">Loading…</div></main>;

  return <main className="min-h-screen bg-[#eef9ff] px-4 py-8 text-[#083d78] sm:px-6 lg:px-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-[#176a9c]"><ArrowLeft size={17}/> Learner dashboard</Link>
      <div className="mt-5 rounded-[30px] bg-[#073b73] p-7 text-white shadow-xl sm:p-10">
        <p className="text-sm font-black uppercase tracking-widest text-yellow-300">Premium access</p>
        <h1 className="mt-2 text-4xl font-black">Upgrade each learner</h1>
        <p className="mt-3 max-w-2xl font-semibold text-white/80">Each learner is billed separately. Monthly full access is MVR 150 per learner.</p>
      </div>

      <section className="mt-6 rounded-[28px] border border-[#d7eaf7] bg-white p-5 shadow-lg sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-widest text-[#197fe9]">Learner subscriptions</p><h2 className="mt-1 text-2xl font-black">Access overview</h2></div>
          <p className="text-sm font-bold text-slate-500">{learners.length} learner{learners.length === 1 ? "" : "s"}</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0">
            <thead><tr className="text-left text-xs font-black uppercase tracking-wider text-slate-500">
              <th className="border-b border-slate-100 px-4 py-3">Learner</th><th className="border-b border-slate-100 px-4 py-3">Status</th><th className="border-b border-slate-100 px-4 py-3">Monthly fee</th><th className="border-b border-slate-100 px-4 py-3 text-right">Action</th>
            </tr></thead>
            <tbody>
              {learners.map(learner => {
                const state = accessStates[learner.learner_id];
                const latest = payments.find(p => p.learner_id === learner.learner_id);
                const pending = latest?.status === "pending";
                let statusText = "Checking…"; let statusClass = "bg-slate-100 text-slate-600"; let action = "Upgrade";
                if (state?.reason === "grandfathered") { statusText = "Full access"; statusClass = "bg-emerald-50 text-emerald-700"; action = "Included"; }
                else if (pending) { statusText = "Payment pending"; statusClass = "bg-amber-50 text-amber-700"; action = "View submission"; }
                else if (state?.status === "trialing") { const d = state.days_left ?? 0; statusText = `Trial – ${d} day${d === 1 ? "" : "s"} left`; statusClass = "bg-blue-50 text-blue-700"; }
                else if (state?.status === "active") { statusText = "Premium active"; statusClass = "bg-emerald-50 text-emerald-700"; action = "Renew"; }
                else if (state?.status === "expired" || state?.payment_required) { statusText = "Access disabled"; statusClass = "bg-red-50 text-red-700"; }
                return <tr key={learner.learner_id}>
                  <td className="border-b border-slate-100 px-4 py-4"><div className="font-black text-[#083d78]">{learner.name}</div><div className="text-xs font-bold text-slate-400">{learner.username}{learner.grade ? ` · ${learner.grade}` : ""}</div></td>
                  <td className="border-b border-slate-100 px-4 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${statusClass}`}>{state?.reason === "grandfathered" ? <ShieldCheck size={14}/> : pending ? <Clock3 size={14}/> : state?.status === "active" ? <CheckCircle2 size={14}/> : null}{statusText}</span></td>
                  <td className="border-b border-slate-100 px-4 py-4 font-black text-[#083d78]">MVR 150</td>
                  <td className="border-b border-slate-100 px-4 py-4 text-right"><button onClick={() => setSelectedLearner(learner.learner_id)} disabled={action === "View"} className="inline-flex items-center gap-2 rounded-xl bg-[#197fe9] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:opacity-90 disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-700 disabled:shadow-none">{action === "Renew" ? <RefreshCw size={16}/> : action === "Included" ? <ShieldCheck size={16}/> : <Eye size={16}/>} {action}</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      {settings && <section className="mt-6 rounded-[28px] border border-[#cfe4f2] bg-white p-6 shadow-lg">
        <div className="flex items-center gap-3"><CreditCard className="text-[#197fe9]"/><h2 className="text-2xl font-black">Make the bank transfer</h2></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-[#f5fbff] p-4"><p className="text-xs font-black uppercase text-slate-500">Account name</p><p className="mt-1 font-black">{settings.account_name}</p></div>
          <div className="rounded-2xl bg-[#f5fbff] p-4"><p className="text-xs font-black uppercase text-slate-500">Bank</p><p className="mt-1 font-black">{settings.bank_name || "Our bank account"}</p></div>
          <div className="rounded-2xl bg-[#fff8d9] p-4"><p className="text-xs font-black uppercase text-slate-500">Account number</p><p className="mt-1 break-all text-xl font-black">{settings.account_number}</p></div><div className="rounded-2xl bg-[#eaf8ee] p-4"><p className="text-xs font-black uppercase text-slate-500">Payment</p><p className="mt-1 text-xl font-black">MVR 150 / month</p></div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">{settings.instructions}</p>
      </section>}

      {message && <div className="mt-5 rounded-2xl bg-white p-4 font-bold text-[#176a9c] shadow-sm">{message}</div>}

      <section className="mt-6 space-y-5">
        {learners.filter(learner => selectedLearner === learner.learner_id).map(learner => {
          const latest = payments.find(p => p.learner_id === learner.learner_id);
          return <article key={learner.learner_id} className="rounded-[28px] border border-[#d7eaf7] bg-white p-6 shadow-lg">
            <div className="mb-4 flex justify-end"><button onClick={() => setSelectedLearner(null)} className="text-sm font-black text-slate-500 hover:text-[#197fe9]">Close</button></div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-2xl font-black">{learner.name}</h2><p className="mt-1 text-sm font-bold text-slate-500">{learner.username}{learner.grade ? ` · ${learner.grade}` : ""}</p></div>
              {latest?.status === "pending" ? <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-700"><Clock3 size={16}/> Payment under review</span> :
               latest?.status === "approved" ? <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700"><CheckCircle2 size={16}/> Approved</span> : null}
            </div>
            <div className="mt-5 rounded-2xl bg-[#f7fbff] p-4"><p className="text-sm font-black text-[#083d78]">Payment for {learner.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">Transfer MVR 150 to the account above, then provide your transfer reference and upload the bank slip.</p></div><div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <input value={refs[learner.learner_id] || ""} onChange={e => setRefs(v => ({...v,[learner.learner_id]:e.target.value}))} placeholder="Bank transfer reference (recommended)" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#197fe9]"/>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 font-bold text-slate-600"><FileUp size={19}/><span className="min-w-0 truncate">{files[learner.learner_id]?.name || "Upload bank transfer slip"}</span><input type="file" className="hidden" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e => setFiles(v => ({...v,[learner.learner_id]:e.target.files?.[0] || null}))}/></label>
              <button onClick={() => submit(learner.learner_id)} disabled={busy===learner.learner_id || latest?.status==="pending"} className="rounded-xl bg-[#197fe9] px-5 py-3 font-black text-white disabled:opacity-50">{busy===learner.learner_id ? <Loader2 className="animate-spin"/> : "Submit payment"}</button>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">MVR 150 · 1 month Premium access · Bank transfer verification and admin approval are required.</p>
          </article>
        })}
        {!learners.length && <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-500">No learners are linked to this parent account yet.</div>}
        {!selectedLearner && learners.length > 0 && <div className="rounded-3xl bg-white p-8 text-center shadow-lg"><p className="text-lg font-black text-[#083d78]">Select a learner above to manage payment</p><p className="mt-1 text-sm font-semibold text-slate-500">Upgrade, renew, or view a submitted payment for that learner.</p></div>}
      </section>
    </div>
  </main>;
}
