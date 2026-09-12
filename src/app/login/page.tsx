"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole, roleHome, type AppRole } from "@/app/auth/role-router";

const requestedRoles: AppRole[] = ["student", "teacher", "parent", "guardian"];
const learnerAuthDomain = "learner.fahi-vissnun.local";
type LoginMode = "parent" | "learner";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("parent");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function finishLogin(supabase: ReturnType<typeof createClient>, userId: string) {
    if (!supabase) return;

    const { data: accountStatus, error: statusError } = await supabase.rpc("get_my_account_status");
    if (statusError) throw new Error("We could not verify your account status. Please try again.");

    if (accountStatus !== "active") {
      await supabase.auth.signOut();
      throw new Error(accountStatus === "inactive"
        ? "This account is currently inactive. Please contact an administrator."
        : "This account is not active yet. Please contact an administrator.");
    }

    let role = await getUserRole(supabase, userId);

    if (!role) {
      const requestedRole = (await supabase.auth.getUser()).data.user?.user_metadata?.requested_role;
      if (typeof requestedRole === "string" && requestedRoles.includes(requestedRole as AppRole)) {
        const { error: roleError } = await supabase.rpc("register_user_role", { p_role: requestedRole });
        if (!roleError) role = await getUserRole(supabase, userId);
      }
    }

    window.location.href = roleHome(role);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the project URL and publishable key to the deployment environment.");
      return;
    }

    setLoading(true);
    const rawIdentifier = identifier.trim();
    const email = mode === "learner" && !rawIdentifier.includes("@")
      ? `${rawIdentifier.toLowerCase()}@${learnerAuthDomain}`
      : rawIdentifier;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setMessage(mode === "learner"
        ? "We could not sign you in. Please check the learner username and password provided by your parent."
        : error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setMessage("Sign-in completed, but no user session was returned. Please try again.");
      return;
    }

    try {
      await finishLogin(supabase, data.user.id);
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "We could not complete sign-in.");
    }
  }

  async function continueWithGoogle() {
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setGoogleLoading(false);
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-white to-[#eef8f7] px-5 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[92vh] max-w-md items-center">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl sm:p-9">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#071b3a]"><ArrowLeft size={16} /> Back to home</Link>
          <div className="mt-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071b3a] text-xl font-black text-white">FV</div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#0d666b]">FAHI VISSNUN</p>
            <h1 className="mt-2 text-3xl font-black text-[#071b3a]">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue learning and supporting your learner.</p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button type="button" onClick={() => { setMode("parent"); setIdentifier(""); setMessage(""); }} className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${mode === "parent" ? "bg-white text-[#071b3a] shadow-sm" : "text-slate-500"}`}>Parent</button>
            <button type="button" onClick={() => { setMode("learner"); setIdentifier(""); setMessage(""); }} className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${mode === "learner" ? "bg-white text-[#071b3a] shadow-sm" : "text-slate-500"}`}>Learner</button>
          </div>

          {mode === "parent" && <button type="button" onClick={continueWithGoogle} disabled={googleLoading} className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">{googleLoading ? <Loader2 className="animate-spin" size={18} /> : <span className="text-lg font-black">G</span>}{googleLoading ? "Connecting…" : "Continue with Google"}</button>}
          {mode === "parent" && <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs font-bold uppercase tracking-wider text-slate-400">or continue with email</span><div className="h-px flex-1 bg-slate-200" /></div>}

          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{mode === "parent" ? "Email address" : "Learner username"}</span><div className="relative"><UserRound className="absolute left-3 top-3 text-slate-400" size={18} /><input type={mode === "parent" ? "email" : "text"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b] focus:ring-2 focus:ring-[#0d666b]/10" placeholder={mode === "parent" ? "parent@example.com" : "Your learner username"} /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b] focus:ring-2 focus:ring-[#0d666b]/10" placeholder="Your password" /></div></label>
            {mode === "parent" && <div className="text-right"><Link href="/forgot-password" className="text-sm font-bold text-[#0d666b] hover:underline">Forgot password?</Link></div>}
            {message && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">{message}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 font-black text-white transition hover:bg-[#0d2a52] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={18} />}{loading ? "Signing in…" : "Sign in"}</button>
          </form>

          {mode === "parent" ? <p className="mt-6 text-center text-sm text-slate-500">New parent? <Link href="/register" className="font-black text-[#0d666b]">Create a parent account</Link></p> : <p className="mt-6 text-center text-xs leading-5 text-slate-400">Learner accounts are created and managed by a parent. Your parent will provide your username and password.</p>}
          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400"><Mail size={14} /> Secure account access powered by Supabase</div>
        </section>
      </div>
    </main>
  );
}
