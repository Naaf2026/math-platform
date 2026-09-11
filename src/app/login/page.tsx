"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole, roleHome, type AppRole } from "@/app/auth/role-router";

const requestedRoles: AppRole[] = ["student", "teacher", "parent", "guardian"];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setMessage("Sign-in completed, but no user session was returned. Please try again.");
      return;
    }

    let role = await getUserRole(supabase, data.user.id);

    // Accounts created before role registration was introduced can still be
    // assigned their requested public role on first successful sign-in.
    if (!role) {
      const requestedRole = data.user.user_metadata?.requested_role;
      if (typeof requestedRole === "string" && requestedRoles.includes(requestedRole as AppRole)) {
        const { error: roleError } = await supabase.rpc("register_user_role", {
          p_role: requestedRole,
        });
        if (!roleError) role = await getUserRole(supabase, data.user.id);
      }
    }

    setLoading(false);
    window.location.href = roleHome(role);
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#071b3a]"><ArrowLeft size={16} /> Back to home</Link>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071b3a] text-xl font-black text-white">F</div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-[#0d666b]">FAHI VISSNUN account</p>
          <h1 className="mt-2 text-3xl font-black text-[#071b3a]">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in and continue your mathematics learning journey.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email</span><div className="relative"><Mail className="absolute left-3 top-3 text-slate-400" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b]" placeholder="you@example.com" /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><div className="relative"><LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#0d666b]" placeholder="At least 6 characters" /></div></label>
            {message && <p className="rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">{message}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3 font-bold text-white transition hover:bg-[#0d2a52] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={18} />}{loading ? "Signing in…" : "Sign in"}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">New to the platform? <Link href="/register" className="font-black text-[#0d666b]">Create an account</Link></p>
        </div>
      </div>
    </main>
  );
}
