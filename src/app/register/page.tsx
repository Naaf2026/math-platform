"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function continueWithGoogle() {
    setStatus("");
    const supabase = createClient();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }

    setGoogleBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?signup=parent`,
      },
    });

    if (error) {
      setGoogleBusy(false);
      setStatus(error.message);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const supabase = createClient();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim(), full_name: name.trim(), requested_role: "parent" },
      },
    });

    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }

    if (data.session && data.user) {
      const { error: roleError } = await supabase.rpc("register_user_role", { p_role: "parent" });
      if (roleError) {
        setStatus(`Account created, but parent role setup needs attention: ${roleError.message}`);
        setBusy(false);
        return;
      }
      window.location.href = "/parent";
      return;
    }

    setStatus("Parent account created. Check your email to confirm your account, then sign in.");
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-white to-[#eef8f7] px-5 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[92vh] max-w-md items-center">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl sm:p-9">
          <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-[#071b3a]">← Back to sign in</Link>
          <div className="mt-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071b3a] text-xl font-black text-white">FV</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#0d666b]">PARENT ACCOUNT</p>
            <h1 className="mt-2 text-3xl font-black text-[#071b3a]">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Parents create the family account and manage learner access.</p>
          </div>

          <button type="button" onClick={continueWithGoogle} disabled={googleBusy} className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
            {googleBusy ? <Loader2 className="animate-spin" size={18} /> : <span className="text-lg font-black">G</span>}
            {googleBusy ? "Connecting…" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs font-bold uppercase tracking-wider text-slate-400">or use email</span><div className="h-px flex-1 bg-slate-200" /></div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="text-sm font-bold text-slate-700">Parent / guardian name</span><input required value={name} onChange={e => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0d666b] focus:ring-2 focus:ring-[#0d666b]/10" placeholder="Your full name" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-700">Email address</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0d666b] focus:ring-2 focus:ring-[#0d666b]/10" placeholder="parent@example.com" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-700">Password</span><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0d666b] focus:ring-2 focus:ring-[#0d666b]/10" placeholder="At least 6 characters" /></label>
            {status && <div role="alert" className="rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">{status}</div>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3.5 font-black text-white shadow-lg transition hover:bg-[#0d2a52] disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18} />}{busy ? "Creating account…" : "Create parent account"}</button>
          </form>

          <div className="mt-6 rounded-2xl bg-[#f7f9fc] p-4 text-xs leading-5 text-slate-500">After you create your parent account, you will be able to add your children and give each learner their own username and password.</div>
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-black text-[#0d666b]">Sign in</Link></p>
          <p className="mt-4 text-center text-xs text-slate-400">Teacher and admin accounts are created by an administrator.</p>
        </section>
      </div>
    </main>
  );
}
