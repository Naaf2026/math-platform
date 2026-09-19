"use client";

import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole, roleHome } from "@/app/auth/role-router";

type Props = { open: boolean; onClose: () => void };

export default function LearnerLoginModal({ open, onClose }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    setLoading(true);
    const rawIdentifier = identifier.trim();
    const email = rawIdentifier.includes("@")
      ? rawIdentifier
      : `${rawIdentifier.toLowerCase()}@learner.fahi-vissnun.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setLoading(false);
      setMessage("We could not sign you in. Please check your learner username and password.");
      return;
    }

    try {
      const { data: accountStatus, error: statusError } = await supabase.rpc("get_my_account_status");
      if (statusError || accountStatus !== "active") {
        await supabase.auth.signOut();
        setLoading(false);
        setMessage(accountStatus === "inactive" ? "This learner account is currently inactive." : "This learner account is not active yet.");
        return;
      }

      const { data: accessState, error: accessError } = await supabase.rpc("get_learner_access_state", { p_learner_id: data.user.id });
      if (accessError || accessState?.access !== "enabled") {
        await supabase.auth.signOut();
        setLoading(false);
        setMessage("Your access has ended. Please ask your parent to complete the monthly payment to restore access.");
        return;
      }

      const role = await getUserRole(supabase, data.user.id);
      if (role !== "student") {
        await supabase.auth.signOut();
        setLoading(false);
        setMessage("This account is not a learner account. Please use the appropriate login.");
        return;
      }

      window.location.href = roleHome(role);
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "We could not complete sign-in.");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071b3a]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="learner-login-title">
      <button type="button" aria-label="Close learner login" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-7 shadow-2xl sm:p-9">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"><X size={18} /></button>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#20265B] text-xl font-black text-white">FV</div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#5B5CE2]">FAHI VISSNUN</p>
          <h2 id="learner-login-title" className="mt-2 text-3xl font-black text-[#20265B]">Learner Login</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in and continue your maths adventure.</p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Learner username</span>
            <div className="relative"><UserRound className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10" placeholder="Your learner username" /></div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <div className="relative"><LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-[#5B5CE2] focus:ring-2 focus:ring-[#5B5CE2]/10" placeholder="Your password" /></div>
          </label>
          {message && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">{message}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20265B] px-4 py-3.5 font-black text-white transition hover:bg-[#303878] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={18} />}{loading ? "Signing in…" : "Log In"}</button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">Learner accounts are created and managed by a parent.</p>
      </section>
    </div>
  );
}
