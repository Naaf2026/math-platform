"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Loader2, LockKeyhole, Mail, Phone, ShieldCheck, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

export default function ParentProfilePage() {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [savedMobilePhone, setSavedMobilePhone] = useState("");
  const [joined, setJoined] = useState("");
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Account service is unavailable.");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Please sign in again.");
        const [{ data: profile, error: profileError }, linkedLearners] = await Promise.all([
          supabase.from("profiles").select("full_name,display_name,mobile_phone").eq("id", user.id).single(),
          getMyLearners(),
        ]);
        if (profileError) throw new Error(profileError.message);
        if (cancelled) return;
        const displayName = profile?.display_name || profile?.full_name || "";
        setName(displayName);
        setSavedName(displayName);
        setEmail(user.email || "");
        setSavedEmail(user.email || "");
        setPendingEmail(user.new_email && user.new_email.toLowerCase() !== user.email?.toLowerCase() ? user.new_email : "");
        setMobilePhone(profile?.mobile_phone || "");
        setSavedMobilePhone(profile?.mobile_phone || "");
        setJoined(user.created_at || "");
        setLearners(linkedLearners);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    async function refreshEmail() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;
      setSavedEmail(user.email || "");
      setPendingEmail(user.new_email && user.new_email.toLowerCase() !== user.email?.toLowerCase() ? user.new_email : "");
      // Do not replace an address the parent is currently editing.
      setEmail(current => current === savedEmail ? user.email || "" : current);
    }
    window.addEventListener("focus", refreshEmail);
    return () => window.removeEventListener("focus", refreshEmail);
  }, [savedEmail]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Account service is unavailable.");
      const normalizedPhone = mobilePhone.replace(/[\s()-]/g, "");
      const profileChanged = name.trim() !== savedName || normalizedPhone !== savedMobilePhone;
      const requestedEmail = email.trim();
      const emailChanged = requestedEmail.toLowerCase() !== savedEmail.toLowerCase();
      if (profileChanged) {
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) throw new Error("Enter a mobile number with country code, for example +9607777777.");
        const { data, error: saveError } = await supabase.rpc("update_my_parent_profile", { p_full_name: name.trim(), p_mobile_phone: normalizedPhone });
        if (saveError) throw new Error(saveError.message);
        const updatedName = String(data);
        setName(updatedName);
        setSavedName(updatedName);
        setMobilePhone(normalizedPhone);
        setSavedMobilePhone(normalizedPhone);
      }
      if (emailChanged && requestedEmail.toLowerCase() !== pendingEmail.toLowerCase()) {
        const { data: emailData, error: emailError } = await supabase.auth.updateUser({ email: requestedEmail });
        if (emailError) {
          setError(`${profileChanged ? "Your other changes were saved, but " : ""}The email change could not be started: ${emailError.message}`);
          return;
        }
        setSavedEmail(emailData.user.email || savedEmail);
        setEmail(emailData.user.email || savedEmail);
        setPendingEmail(emailData.user.new_email || (emailData.user.email?.toLowerCase() === requestedEmail.toLowerCase() ? "" : requestedEmail));
        if (emailData.user.email?.toLowerCase() === requestedEmail.toLowerCase()) {
          setMessage("Your email address has been updated.");
        } else {
          setMessage("Verification requested. Follow the confirmation link sent to your new email address to finish the change.");
        }
      } else if (profileChanged) {
        setMessage("Your profile has been updated.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = savedName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "P";

  return (
    <main className="min-h-screen bg-[#f3f8fd] px-4 py-7 text-[#10294b] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#087b92]">Parent dashboard / Profile</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#0c2c51] sm:text-4xl">Your profile</h1><p className="mt-2 text-sm text-slate-600 sm:text-base">Your family account, all in one place.</p></div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dceaf4] bg-white px-4 py-2.5 text-sm font-bold text-[#285671]"><ShieldCheck size={17} /> Parent account</span>
        </header>

        {loading ? <div className="rounded-3xl bg-white p-8 text-center font-bold text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" size={22} /> Loading profile…</div> : <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#073e78] via-[#096d9e] to-[#0ca69f] p-6 text-white shadow-[0_17px_33px_#063d722c] sm:p-8" aria-label="Parent account summary">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6"><div className="flex min-w-0 items-center gap-5"><span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white text-2xl font-black text-[#0876ab] shadow-lg sm:h-[90px] sm:w-[90px] sm:text-3xl" aria-hidden="true">{initials}</span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#bcf2f4]">Your account</p><h2 className="mt-1 break-words text-2xl font-black sm:text-3xl">{savedName || "Parent account"}</h2><p className="mt-1 break-all text-sm text-[#d7f6fc]">{savedEmail}</p></div></div><div className="text-left sm:text-right"><p className="text-sm text-[#cff3f6]">Family overview</p><p className="mt-1 text-lg font-black">{learners.length} linked {learners.length === 1 ? "learner" : "learners"}</p></div></div>
          </section>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]">
            <section className="rounded-[19px] border border-[#e2edf5] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="personal-info-title">
              <div className="flex items-start justify-between gap-3"><div><h2 id="personal-info-title" className="text-xl font-black text-[#133d5f]">Personal information</h2><p className="mt-1 text-sm text-slate-600">These details appear on your family account.</p></div><UserRound size={22} className="shrink-0 text-[#0aa6a2]" /></div>
              <form onSubmit={save} className="mt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block sm:col-span-2"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#31536d]"><UserRound size={16} className="text-[#0da4a0]" /> Full name</span><input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8e5ef] bg-[#fafdff] px-4 py-3 text-base text-[#133653] outline-none focus:border-[#0aa6a2] focus:ring-2 focus:ring-[#0aa6a2]/20" placeholder="Your full name" /></label>
                  <label className="block"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#31536d]"><Mail size={16} className="text-[#0da4a0]" /> Email address</span><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8e5ef] bg-[#fafdff] px-4 py-3 text-base text-[#133653] outline-none focus:border-[#0aa6a2] focus:ring-2 focus:ring-[#0aa6a2]/20" /><span className="mt-1.5 block text-xs text-slate-500">A new address must be confirmed before it becomes your sign-in email.</span></label>
                  <label className="block"><span className="inline-flex items-center gap-2 text-sm font-bold text-[#31536d]"><Phone size={16} className="text-[#0da4a0]" /> Mobile number</span><input type="tel" autoComplete="tel" inputMode="tel" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8e5ef] bg-[#fafdff] px-4 py-3 text-base text-[#133653] outline-none focus:border-[#0aa6a2] focus:ring-2 focus:ring-[#0aa6a2]/20" placeholder="+9607777777" /><span className="mt-1.5 block text-xs text-slate-500">Include your country code, for example +9607777777.</span></label>
                </div>
                {pendingEmail && <div role="status" className="mt-5 rounded-xl border border-[#bde6e4] bg-[#effafa] p-4 text-sm text-[#17475c]"><p className="font-black">Email verification pending</p><p className="mt-1 break-all">New address: <strong>{pendingEmail}</strong></p><p className="mt-2">Open the confirmation email sent to your new address. You may also need to confirm a message at your current address. Until the change is verified, sign in with {savedEmail}.</p></div>}
                {error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
                {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={17} />{message}</p>}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#e7eef5] pt-5"><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><LockKeyhole size={16} /> {joined ? `Account created ${new Intl.DateTimeFormat("en-MV", { day: "numeric", month: "long", year: "numeric" }).format(new Date(joined))}` : "Your details are private"}</span><button type="submit" disabled={saving || (name.trim() === savedName && mobilePhone.replace(/[\s()-]/g, "") === savedMobilePhone && (email.trim().toLowerCase() === savedEmail.toLowerCase() || email.trim().toLowerCase() === pendingEmail.toLowerCase()))} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#087bc3] to-[#0da59d] px-5 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />} {saving ? "Saving…" : "Save changes"}</button></div>
              </form>
            </section>
            <aside className="grid gap-5">
              <section className="rounded-[19px] border border-[#e2edf5] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="linked-learners-title"><h2 id="linked-learners-title" className="text-lg font-black text-[#133d5f]">Your learners</h2><p className="mt-1 text-sm text-slate-600">Accounts linked to you.</p><div className="mt-4 space-y-2">{learners.length ? learners.map(learner => <div key={learner.learner_id} className="flex items-center gap-3 rounded-xl bg-[#f0f9fb] p-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl" aria-hidden="true">{learner.avatar_emoji || "🧑‍🎓"}</span><div className="min-w-0"><p className="truncate text-sm font-black text-[#153e5d]">{learner.display_name}</p><p className="text-xs text-slate-600">{learner.grade || "Grade not set"}{learner.account_status ? ` · ${learner.account_status === "active" ? "Account enabled" : "Account disabled"}` : ""}</p></div></div>) : <p className="rounded-xl bg-[#f0f9fb] p-4 text-sm text-slate-600">No learners linked yet.</p>}</div><Link href="/parent/learners" className="mt-4 flex items-center justify-between rounded-xl bg-[#e9f7f6] px-4 py-3 text-sm font-black text-[#078287] hover:bg-[#dcf2ef]"><span>Manage learners</span><ArrowUpRight size={18} /></Link></section>
              <section className="rounded-[19px] border border-[#e2edf5] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-black text-[#133d5f]">Account protection</h2><div className="mt-4 flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e7f8ee] text-[#1eac6e]"><ShieldCheck size={19} /></span><div><p className="text-sm font-bold text-[#264b62]">Your learner information stays connected to your account.</p><p className="mt-1 text-xs leading-5 text-slate-600">Keep your contact details current to receive important account updates.</p></div></div></section>
            </aside>
          </div>
        </>}
      </div>
    </main>
  );
}
