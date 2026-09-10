"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet. Add the project URL and publishable key to the deployment environment.");
      return;
    }

    setLoading(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. If email confirmation is enabled in Supabase, check your inbox before signing in.");
      setMode("login");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#071b3a]"><ArrowLeft size={16} /> Back to home</Link>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071b3a] text-xl font-black text-white">F</div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">Student account</p>
          <h1 className="mt-2 text-3xl font-black text-[#071b3a]">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{mode === "login" ? "Continue your mathematics learning journey." : "Start learning, practising and building mastery."}</p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button onClick={() => setMode("login")} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-white text-[#071b3a] shadow-sm" : "text-slate-500"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "signup" ? "bg-white text-[#071b3a] shadow-sm" : "text-slate-500"}`}>Create account</button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Student name</span><div className="relative"><UserRound className="absolute left-3 top-3 text-slate-400" size={18} /><input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b]" placeholder="Your name" /></div></label>}
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><div className="relative"><Mail className="absolute left-3 top-3 text-slate-400" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b]" placeholder="student@example.com" /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b]" placeholder="At least 6 characters" /></div></label>
            {message && <p className="rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">{message}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3 font-bold text-white transition hover:bg-[#0d2a52] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={18} />}{mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
        </div>
      </div>
    </main>
  );
}
