"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setMessage(error ? error.message : "If an account exists for this email, we have sent password reset instructions.");
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-white to-[#eef8f7] px-5 py-8">
      <div className="mx-auto flex min-h-[92vh] max-w-md items-center">
        <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl sm:p-9">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#071b3a]"><ArrowLeft size={16} /> Back to sign in</Link>
          <div className="mt-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071b3a] text-white"><Mail size={24} /></div><h1 className="mt-5 text-3xl font-black text-[#071b3a]">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Enter your parent account email and we’ll send you a secure reset link.</p></div>
          <form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="text-sm font-bold text-slate-700">Email address</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0d666b] focus:ring-2 focus:ring-[#0d666b]/10" placeholder="parent@example.com" /></label>{message && <div role="status" className="rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">{message}</div>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 font-black text-white disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18} />}{busy ? "Sending…" : "Send reset link"}</button></form>
          <p className="mt-6 text-center text-sm text-slate-500">Remember your password? <Link href="/login" className="font-black text-[#0d666b]">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
