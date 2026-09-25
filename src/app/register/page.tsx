"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("+960");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    const normalizedPhone = mobilePhone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setStatus("Enter a mobile number with country code, for example +9607777777.");
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim(), full_name: name.trim(), requested_role: "parent", mobile_phone: normalizedPhone },
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
    <main className="min-h-[100dvh] bg-white px-4 py-5 text-[#202c42] sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-[490px] flex-col justify-center sm:min-h-[calc(100dvh-80px)]">
        <Link href="/" className="mb-3 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#63758b] hover:text-[#157bb5]"><ArrowLeft size={15}/> Back to home</Link>
        <div className="mb-4 flex justify-center sm:mb-6">
          <img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[76px] w-auto max-w-[270px] object-contain sm:h-[100px] sm:max-w-[340px]" />
        </div>
        <section className="rounded-[30px] border-[2.5px] border-[#263449] bg-white px-5 py-6 shadow-[0_5px_0_#263449] sm:rounded-[38px] sm:px-9 sm:py-9">
          <div className="text-center">
            <h1 className="text-[25px] font-black tracking-tight sm:text-[31px]">Welcome, parents!</h1>
            <p className="mt-2 text-sm leading-5 text-[#718096] sm:text-base">Create your family account to get started.</p>
          </div>
          <button type="button" onClick={continueWithGoogle} disabled={googleBusy} className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border-[2px] border-[#263449] bg-white px-4 py-3 text-sm font-extrabold shadow-[0_4px_0_#263449] transition active:translate-y-1 active:shadow-none disabled:opacity-60 sm:text-base">
            {googleBusy ? <Loader2 className="animate-spin" size={19}/> : <svg aria-label="Google" role="img" viewBox="0 0 48 48" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 6.51 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.89 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
            {googleBusy ? "Connecting…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-center text-[13px] text-[#718096]">Already have an account? <Link href="/login" className="font-bold text-[#176eb2] underline underline-offset-2">Sign in</Link></p>
          <div className="my-5 flex items-center gap-2"><span className="h-px flex-1 bg-[#e0e8f0]"/><span className="text-xs text-[#74859a]">Or use email and password</span><span className="h-px flex-1 bg-[#e0e8f0]"/></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Parent / guardian name</span><input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-full border-[1.5px] border-[#344159] bg-[#f6f9ff] px-5 py-3 text-base outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/15" placeholder="Your full name" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Email</span><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-full border-[1.5px] border-[#344159] bg-[#f6f9ff] px-5 py-3 text-base outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/15" placeholder="name@example.com" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Mobile phone number <span className="text-red-600">*</span></span><input required type="tel" autoComplete="tel" inputMode="tel" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} className="w-full rounded-full border-[1.5px] border-[#344159] bg-[#f6f9ff] px-5 py-3 text-base outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/15" placeholder="+9607777777" /><span className="mt-1 block text-xs text-[#718096]">Include your country code.</span></label>
            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Password</span><span className="relative block"><input required minLength={6} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-full border-[1.5px] border-[#dce5f0] bg-[#fbfcff] px-5 py-3 pr-12 text-base outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/15" placeholder="At least 6 characters" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-[#56677e]">{showPassword ? <EyeOff size={21}/> : <Eye size={21}/>}</button></span></label>
            {status && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{status}</p>}
            <button type="submit" disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-[2px] border-[#263449] bg-[#ff6b22] px-4 py-3 text-base font-black text-white shadow-[0_5px_0_#263449] transition active:translate-y-1 active:shadow-none disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18}/>}{busy ? "Creating account…" : "Create parent account"}</button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-[#718096]">After signup, you can add your children and give each learner a username and password.</p>
        </section>
        <p className="mx-auto mt-6 max-w-[410px] text-center text-sm leading-6 text-[#718096]">Teacher and admin accounts are created by an administrator.</p>
        <p className="mx-auto mt-4 max-w-[380px] text-center text-xs leading-5 text-[#74859a]">Learn Maths. <span className="text-[#e29c18]">Play Smart.</span> <span className="text-[#159c89]">Grow Confident.</span></p>
      </div>
    </main>
  );
}
