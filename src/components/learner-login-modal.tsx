"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, LockKeyhole, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole, roleHome } from "@/app/auth/role-router";

const learnerAuthDomain = "learner.fahi-vissnun.local";

export default function LearnerLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    const supabase = createClient();
    if (!supabase) { setMessage("Login is temporarily unavailable. Please try again later."); return; }
    setLoading(true);
    try {
      const identifier = username.trim();
      const email = identifier.includes("@") ? identifier : `${identifier.toLowerCase()}@${learnerAuthDomain}`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error("Please check your learner username and password.");
      const { data: status, error: statusError } = await supabase.rpc("get_my_account_status");
      if (statusError) throw new Error("We could not verify your account status. Please try again.");
      if (status !== "active") {
        await supabase.auth.signOut();
        throw new Error("This learner account is not active. Please contact an administrator.");
      }
      let role = await getUserRole(supabase, data.user.id);
      if (!role) {
        const requestedRole = (await supabase.auth.getUser()).data.user?.user_metadata?.requested_role;
        if (requestedRole === "student") {
          const { error: roleError } = await supabase.rpc("register_user_role", { p_role: "student" });
          if (!roleError) role = await getUserRole(supabase, data.user.id);
        }
      }
      if (role !== "student") {
        await supabase.auth.signOut();
        throw new Error("This is not a learner account. Please use the parent or staff login.");
      }
      window.location.href = roleHome(role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not sign you in.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071b3a]/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="learner-login-title" className="relative w-full max-w-[420px] rounded-[28px] bg-white p-6 text-[#082b61] shadow-2xl sm:p-8">
        <button type="button" aria-label="Close learner login" onClick={onClose} disabled={loading} className="absolute right-4 top-4 rounded-full bg-[#edf7ff] p-2 text-[#164473]"><X size={20}/></button>
        <img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="mx-auto h-20 max-w-[230px] object-contain" />
        <h2 id="learner-login-title" className="mt-3 text-center text-2xl font-black">Learner Login</h2>
        <p className="mt-2 text-center text-sm font-semibold text-[#557794]">Welcome back! Ready to learn maths?</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-bold">Learner username
            <span className="relative mt-2 block"><UserRound size={19} className="absolute left-3 top-3.5 text-[#7191a8]"/><input autoFocus required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your learner username" className="w-full rounded-xl border border-[#cbddea] px-4 py-3 pl-11 outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/20"/></span>
          </label>
          <label className="block text-sm font-bold">Password
            <span className="relative mt-2 block"><LockKeyhole size={19} className="absolute left-3 top-3.5 text-[#7191a8]"/><input required minLength={6} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="w-full rounded-xl border border-[#cbddea] px-4 py-3 pl-11 outline-none focus:border-[#168ff0] focus:ring-2 focus:ring-[#168ff0]/20"/></span>
          </label>
          {message && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b22] px-5 py-3.5 text-base font-black text-white disabled:opacity-60">{loading && <Loader2 size={18} className="animate-spin"/>}{loading ? "Signing in…" : "Let's Learn!"}</button>
        </form>
        <p className="mt-5 text-center text-xs font-semibold text-[#6a879d]">Your parent provides your learner username and password.</p>
      </section>
    </div>
  );
}
