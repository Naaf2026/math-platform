"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

export default function ParentProfilePage() {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("+960");
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
        setMobilePhone(profile?.mobile_phone || "+960");
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

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Account service is unavailable.");
      const normalizedPhone = mobilePhone.replace(/[\s()-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) throw new Error("Enter a mobile number with country code, for example +9607777777.");
      const { data, error: saveError } = await supabase.rpc("update_my_parent_profile", { p_full_name: name.trim(), p_mobile_phone: normalizedPhone });
      if (saveError) throw new Error(saveError.message);
      const updatedName = String(data);
      setName(updatedName);
      setSavedName(updatedName);
      setMobilePhone(normalizedPhone);
      setSavedMobilePhone(normalizedPhone);
      if (email.trim().toLowerCase() !== savedEmail.toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailError) {
          setError(`Your name and mobile number were saved, but the email change could not be started: ${emailError.message}`);
          return;
        }
        setMessage("Your name and mobile number were saved. Check your email for a confirmation link to finish changing your sign-in address.");
      } else {
        setMessage("Your profile has been updated.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-28 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/parent" className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-violet-700"><ArrowLeft size={18}/> Parent dashboard</Link>
        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-9">
          <div className="flex items-center gap-4"><div className="rounded-2xl bg-white/15 p-3"><UserRound size={28}/></div><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-100">Family account</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Parent Profile</h1><p className="mt-2 text-sm text-indigo-100">Manage your account details and your learners in one place.</p></div></div>
        </section>
        {loading ? <div className="mt-6 rounded-3xl bg-white p-8 text-center font-bold text-slate-500"><Loader2 className="mx-auto mb-2 animate-spin" size={22}/> Loading profile…</div> : <>
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8">
            <h2 className="text-xl font-black text-[#071b3a]">Your details</h2>
            <p className="mt-1 text-sm text-slate-500">Your name is displayed on your family account.</p>
            <form onSubmit={save} className="mt-6 space-y-5">
              <label className="block"><span className="text-sm font-bold text-slate-700">Full name</span><input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="Your full name" /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700">Email address</span><span className="relative mt-1.5 block"><Mail size={18} className="absolute left-4 top-3.5 text-slate-400"/><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" /></span><span className="mt-1 block text-xs text-slate-500">Changing your sign-in email requires confirmation by email.</span></label><label className="block"><span className="text-sm font-bold text-slate-700">Mobile phone number <span className="text-red-600">*</span></span><input required type="tel" autoComplete="tel" inputMode="tel" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="+9607777777" /><span className="mt-1 block text-xs text-slate-500">Include your country code, for example +9607777777.</span></label>
              {joined && <p className="text-xs font-semibold text-slate-500">Account created {new Intl.DateTimeFormat("en-MV", { day: "numeric", month: "long", year: "numeric" }).format(new Date(joined))}</p>}
              {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
              {message && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={17}/>{message}</p>}
              <button type="submit" disabled={saving || (name.trim() === savedName && mobilePhone.replace(/[\s()-]/g, "") === savedMobilePhone && email.trim().toLowerCase() === savedEmail.toLowerCase())} className="inline-flex items-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 className="animate-spin" size={17}/>} {saving ? "Saving…" : "Save changes"}</button>
            </form>
          </section>
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black text-[#071b3a]"><Users className="text-violet-600" size={21}/> Your learners</h2><p className="mt-1 text-sm text-slate-500">{learners.length} {learners.length === 1 ? "learner" : "learners"} linked to this account</p></div><Link href="/parent/learners" className="rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700 hover:bg-violet-100">Manage learners</Link></div>
            {learners.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{learners.map(learner => <div key={learner.learner_id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="text-3xl">{learner.avatar_emoji || "🧑‍🎓"}</span><div className="min-w-0"><p className="truncate font-black text-[#071b3a]">{learner.display_name}</p><p className="text-sm text-slate-500">{learner.grade || "Grade not set"}</p></div></div>)}</div> : <p className="mt-5 text-sm text-slate-500">No learners linked yet. <Link href="/parent/learners" className="font-bold text-violet-700 underline">Add a learner</Link></p>}
          </section>
        </>}
      </div>
    </main>
  );
}
