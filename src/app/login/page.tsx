"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
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
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#fffdf3] via-[#fffefb] to-[#eef8ff] px-4 py-5 text-[#202c42] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-[490px] flex-col justify-center sm:min-h-[calc(100dvh-80px)]">
        <Link href="/" className="mb-3 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#63758b] hover:text-[#157bb5]"><ArrowLeft size={15}/> Back to home</Link>
        <div className="mb-4 flex justify-center sm:mb-6">
          <img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[76px] w-auto max-w-[270px] object-contain sm:h-[100px] sm:max-w-[340px]" />
        </div>
        <section className="rounded-[30px] border-[2.5px] border-[#263449] bg-white px-5 py-6 shadow-[0_5px_0_#263449] sm:rounded-[38px] sm:px-9 sm:py-9">
          <div className="text-center">
            <h1 className="text-[25px] font-black tracking-tight sm:text-[31px]">{mode === "parent" ? "Welcome, parents!" : "Welcome, learners!"}</h1>
            <p className="mt-2 text-sm leading-5 text-[#718096] sm:text-base">{mode === "parent" ? "Sign in to your account to continue." : "Ready for another fun maths adventure?"}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-[#eef5fb] p-1">
            <button type="button" onClick={() => { setMode("parent"); setIdentifier(""); setMessage(""); }} className={`rounded-full px-2 py-2.5 text-[13px] font-extrabold transition ${mode === "parent" ? "bg-[#ffdc62] text-[#253047] shadow-sm" : "text-[#6a7d92]"}`}>Parent / Staff</button>
            <button type="button" onClick={() => { setMode("learner"); setIdentifier(""); setMessage(""); }} className={`rounded-full px-2 py-2.5 text-[13px] font-extrabold transition ${mode === "learner" ? "bg-[#ffdc62] text-[#253047] shadow-sm" : "text-[#6a7d92]"}`}>Learner</button>
          </div>

          {mode === "parent" && <>
            <button type="button" onClick={continueWithGoogle} disabled={googleLoading} className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border-[2px] border-[#263449] bg-white px-4 py-3 text-sm font-extrabold shadow-[0_4px_0_#263449] transition active:translate-y-1 active:shadow-none disabled:opacity-60 sm:text-base">
              {googleLoading ? <Loader2 className="animate-spin" size={19}/> : <svg aria-label="Google" role="img" viewBox="0 0 48 48" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.89 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}{googleLoading ? "Connecting…" : "Continue with Google"}
            </button>
            <p className="mt-4 text-center text-[13px] text-[#718096]">Don&apos;t have an account? <Link href="/register" className="font-bold text-[#176eb2] underline underline-offset-2">Sign up</Link></p>
            <div className="my-5 flex items-center gap-2"><span className="h-px flex-1 bg-[#e0e8f0]"/><span className="text-xs text-[#74859a]">Or use email and password</span><span className="h-px flex-1 bg-[#e0e8f0]"/></div>
          </>}

          <form onSubmit={submit} className={mode === "learner" ? "mt-6 space-y-4" : "space-y-4"}>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">{mode === "parent" ? "Email" : "Learner username"}</span><input type={mode === "parent" ? "email" : "text"} autoComplete={mode === "parent" ? "email" : "username"} value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={mode === "parent" ? "name@example.com" : "Your learner username"} className="w-full rounded-full border-[1.5px] border-[#344159] bg-[#f6f9ff] px-5 py-3 text-base outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/15"/></label>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor="login-password" className="text-sm font-semibold">Password</label>{mode === "parent" && <Link href="/forgot-password" className="text-xs font-semibold text-[#176eb2] underline underline-offset-2">Forgot password?</Link>}</div>
              <div className="relative"><input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Enter your password" className="w-full rounded-full border-[1.5px] border-[#dce5f0] bg-[#fbfcff] px-5 py-3 pr-12 text-base outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/15"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-[#56677e]">{showPassword ? <EyeOff size={21}/> : <Eye size={21}/>}</button></div>
            </div>
            {message && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
            <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-[2px] border-[#263449] bg-[#ff6b22] px-4 py-3 text-base font-black text-white shadow-[0_5px_0_#263449] transition active:translate-y-1 active:shadow-none disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={18}/>}{loading ? "Signing in…" : mode === "learner" ? "Let's Learn!" : "Sign in"}</button>
          </form>
          {mode === "learner" && <p className="mt-5 text-center text-xs leading-5 text-[#718096]">Your parent provides your learner username and password.</p>}
        </section>
        <p className="mx-auto mt-5 max-w-[380px] text-center text-xs leading-5 text-[#74859a]">Learn Maths. <span className="text-[#e29c18]">Play Smart.</span> <span className="text-[#159c89]">Grow Confident.</span></p>
      </div>
    </main>
  );
}
