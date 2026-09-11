"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const roles = [
  { value: "student", label: "Student", note: "Learn, practise and complete missions." },
  { value: "teacher", label: "Teacher", note: "Manage assigned classes and monitor learners." },
  { value: "parent", label: "Parent / Guardian", note: "Follow a linked learner's progress." },
] as const;

export default function RegisterPage() {
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setStatus("");
    const supabase = createClient();
    if (!supabase) { setStatus("Supabase is not configured yet."); setBusy(false); return; }
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim(), requested_role: role } } });
    if (error) { setStatus(error.message); setBusy(false); return; }
    if (data.session) location.href = role === "teacher" ? "/teacher" : role === "parent" ? "/parent" : "/dashboard";
    else setStatus("Account created. Check your email to confirm your account, then sign in.");
    setBusy(false);
  }

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 sm:p-8"><div className="mx-auto flex min-h-[90vh] max-w-lg items-center"><section className="w-full rounded-[2rem] bg-white p-7 shadow-2xl ring-1 ring-slate-100 sm:p-9"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-black text-white">FV</div><h1 className="mt-5 text-3xl font-black text-[#071b3a]">Create your account</h1><p className="mt-2 text-sm text-slate-500">Join the FAHI VISSNUN Math Learning Platform.</p></div><div className="mt-7 grid gap-2">{roles.map(r => <button key={r.value} type="button" onClick={() => setRole(r.value)} className={`rounded-2xl border p-4 text-left transition ${role===r.value?"border-violet-500 bg-violet-50 ring-2 ring-violet-100":"border-slate-200 bg-white hover:bg-slate-50"}`}><div className="font-black text-[#071b3a]">{r.label}</div><div className="mt-1 text-xs text-slate-500">{r.note}</div></button>)}</div><form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="text-sm font-bold text-slate-700">Name</span><input required value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" /></label><label className="block"><span className="text-sm font-bold text-slate-700">Email</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" /></label><label className="block"><span className="text-sm font-bold text-slate-700">Password</span><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" /></label>{status && <div className="rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">{status}</div>}<button disabled={busy} className="w-full rounded-2xl bg-violet-600 px-5 py-3.5 font-black text-white shadow-lg shadow-violet-200 disabled:opacity-60">{busy?"Creating account…":"Create account"}</button></form><p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-black text-violet-600">Sign in</Link></p><p className="mt-4 text-center text-xs text-slate-400">Admin accounts are assigned by an existing administrator and cannot be created from public registration.</p></section></div></main>;
}
