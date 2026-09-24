"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

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

    // Email login is used by staff and parent/guardian accounts.
    // Learner mode remains restricted to student accounts.
    const roleMatchesMode = mode === "learner"
      ? role === "student"
      : role === "admin" || role === "teacher" || role === "parent" || role === "guardian";

    if (!role || !roleMatchesMode) {
      await supabase.auth.signOut();
      throw new Error(mode === "learner"
        ? "This account is not a learner account. Please use the parent login for this account."
        : "This account is not an admin, teacher, or parent account. Please use the learner login if you are signing in as a learner.");
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
    <main className="min-h-screen bg-[#edf8ff] text-[#082b61]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.04fr_.96fr]">
        <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#d9f3ff] via-[#e8faff] to-[#e2fff2] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-[#91ddff]/35 blur-3xl" />
          <div className="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-[#6bdfb3]/30 blur-3xl" />
          <div className="relative z-10 px-12 pt-12 xl:px-16">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#1765a0]"><ArrowLeft size={17}/> Back to home</Link>
            <img src="/fahi-hisaabu-logo.png" alt="Fahi Hisaabu" className="mt-10 h-24 w-auto max-w-[390px] object-contain object-left" />
            <div className="mt-14 inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-[#1387bd] shadow-sm">The Maldives Maths Learning Hub</div>
            <h1 className="mt-7 max-w-xl text-5xl font-black leading-[1.12] tracking-tight xl:text-6xl">Learn Maths.<br/><span className="text-[#f68b21]">Play Smart.</span><br/><span className="text-[#0b9b8b]">Grow Confident.</span></h1>
            <p className="mt-7 max-w-lg text-lg font-semibold leading-8 text-[#436b8b]">A fun place for every Maldivian child to practise, explore and build confidence in maths.</p>
          </div>
          <div className="relative mt-8 flex flex-1 items-end justify-center px-6 pb-8">
            <img src="/homepage-artwork/hero-illustration.webp" alt="Children enjoying maths learning" className="max-h-[370px] w-full rounded-[30px] object-cover object-center shadow-[0_18px_55px_rgba(16,88,143,.16)]" />
          </div>
          <p className="relative pb-8 text-center text-xs font-bold tracking-widest text-[#5683a1]">LEARN • PRACTISE • PLAY • ACHIEVE</p>
        </aside>

        <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-16">
          <section className="w-full max-w-[490px] rounded-[28px] border border-[#dcebf6] bg-white p-6 shadow-[0_20px_70px_rgba(23,91,144,.10)] sm:p-10">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#63829d] hover:text-[#168ff0] lg:hidden"><ArrowLeft size={17}/> Back to home</Link>
            <img src="/fahi-hisaabu-logo.png" alt="Fahi Hisaabu" className="mx-auto mt-4 h-[76px] max-w-[260px] object-contain lg:hidden" />
            <div className="mt-5 text-center lg:mt-0">
              <span className="inline-flex rounded-full bg-[#e8f7ff] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#1388c9]">Welcome to Fahi Hisaabu</span>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Welcome back!</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#66839a]">Sign in and continue your learning journey.</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-[#eef7ff] p-1.5">
              <button type="button" onClick={() => { setMode("parent"); setIdentifier(""); setMessage(""); }} className={`rounded-xl px-2 py-3 text-sm font-black transition ${mode === "parent" ? "bg-white text-[#0c65aa] shadow-sm" : "text-[#6c89a0]"}`}>Parent / Staff</button>
              <button type="button" onClick={() => { setMode("learner"); setIdentifier(""); setMessage(""); }} className={`rounded-xl px-2 py-3 text-sm font-black transition ${mode === "learner" ? "bg-white text-[#0c65aa] shadow-sm" : "text-[#6c89a0]"}`}>Learner</button>
            </div>

            {mode === "parent" && <button type="button" onClick={continueWithGoogle} disabled={googleLoading} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#dceaf4] bg-white px-4 py-3.5 font-extrabold text-[#163f65] transition hover:bg-[#f4faff] disabled:opacity-60">{googleLoading ? <Loader2 className="animate-spin" size={19}/> : <span className="text-xl font-black text-[#4285f4]">G</span>}{googleLoading ? "Connecting…" : "Continue with Google"}</button>}
            {mode === "parent" && <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-[#e2edf5]"/><span className="text-xs font-bold text-[#89a0b2]">or sign in with email</span><div className="h-px flex-1 bg-[#e2edf5]"/></div>}

            <form onSubmit={submit} className={mode === "learner" ? "mt-7 space-y-5" : "space-y-5"}>
              <label className="block"><span className="mb-2 block text-sm font-extrabold text-[#153b64]">{mode === "parent" ? "Email address" : "Learner username"}</span><span className="relative block"><UserRound size={19} className="absolute left-4 top-4 text-[#7596b0]"/><input type={mode === "parent" ? "email" : "text"} autoComplete={mode === "parent" ? "email" : "username"} value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={mode === "parent" ? "Enter your email address" : "Your learner username"} className="w-full rounded-xl border-2 border-[#dbe9f4] bg-[#fbfdff] py-3.5 pl-12 pr-4 text-base font-semibold outline-none transition focus:border-[#168ff0] focus:ring-4 focus:ring-[#168ff0]/10"/></span></label>
              <label className="block"><span className="mb-2 block text-sm font-extrabold text-[#153b64]">Password</span><span className="relative block"><LockKeyhole size={19} className="absolute left-4 top-4 text-[#7596b0]"/><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Enter your password" className="w-full rounded-xl border-2 border-[#dbe9f4] bg-[#fbfdff] py-3.5 pl-12 pr-12 text-base font-semibold outline-none transition focus:border-[#168ff0] focus:ring-4 focus:ring-[#168ff0]/10"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-[#7896ae]">{showPassword ? <EyeOff size={21}/> : <Eye size={21}/>}</button></span></label>
              {mode === "parent" && <div className="text-right"><Link href="/forgot-password" className="text-sm font-extrabold text-[#168bd1] hover:underline">Forgot password?</Link></div>}
              {message && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">{message}</p>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#168ff0] to-[#0c73d6] px-5 py-4 text-base font-black text-white shadow-lg shadow-blue-100 transition hover:brightness-105 disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={19}/ >}{loading ? "Signing in…" : mode === "learner" ? "Let's Learn!" : "Sign in"}</button>
            </form>
            {mode === "parent" ? <p className="mt-7 text-center text-sm font-semibold text-[#718da3]">New parent? <Link href="/register" className="font-black text-[#0c86cb] hover:underline">Create a parent account</Link></p> : <p className="mt-7 text-center text-sm font-semibold leading-6 text-[#718da3]">Your parent provides your learner username and password.</p>}
            <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#edf3f8] pt-5 text-xs font-semibold text-[#90a7b8]"><Mail size={14}/> Secure account access</div>
          </section>
        </div>
      </div>
    </main>
  );
}
