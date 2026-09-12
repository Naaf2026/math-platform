"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) setMessage("This reset link is invalid or has expired. Please request a new one.");
      else setReady(true);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) return setMessage("Password must be at least 6 characters.");
    if (password !== confirm) return setMessage("Passwords do not match.");
    const supabase = createClient();
    if (!supabase) return setMessage("Supabase is not configured yet.");
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setMessage(error ? error.message : "Password updated successfully. You can now sign in.");
    if (!error) setPassword("");
    if (!error) setConfirm("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-white to-[#eef8f7] px-5 py-8"><div className="mx-auto flex min-h-[92vh] max-w-md items-center"><section className="w-full rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl sm:p-9"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071b3a] text-white"><LockKeyhole size={24} /></div><h1 className="mt-5 text-3xl font-black text-[#071b3a]">Choose a new password</h1><p className="mt-2 text-sm text-slate-500">Create a password you’ll use for your parent account.</p></div>{ready ? <form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="text-sm font-bold text-slate-700">New password</span><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0d666b]" /></label><label className="block"><span className="text-sm font-bold text-slate-700">Confirm password</span><input required minLength={6} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#0d666b]" /></label>{message && <div role="alert" className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</div>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 font-black text-white disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={18} />}{busy ? "Updating…" : "Update password"}</button></form> : <div className="mt-7 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{message || "Checking your reset link…"}</div>}<p className="mt-6 text-center text-sm"><Link href="/login" className="font-black text-[#0d666b]">Return to sign in</Link></p></section></div></main>
  );
}
