"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, GraduationCap, KeyRound, Loader2, LockKeyhole, Plus, ShieldCheck, UnlockKeyhole } from "lucide-react";
import { createLearnerAccount, getMyLearners, manageLearnerAccount, type LearnerAccount } from "@/lib/parent-learners";

const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];
const avatars = ["🧑‍🎓", "👩‍🎓", "👨‍🎓", "🧒", "⭐", "🚀", "🦊", "🐼"];

export default function ParentLearnersPage() {
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [avatar, setAvatar] = useState("🧑‍🎓");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [passwordLearner, setPasswordLearner] = useState<LearnerAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionBusy, setActionBusy] = useState("");

  async function load() {
    try { setLearners(await getMyLearners()); setStatus(""); }
    catch (e) { setStatus(e instanceof Error ? e.message : "Could not load learners."); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setStatus(""); setCredentials(null);
    try {
      const result = await createLearnerAccount({ display_name: name, username, password, grade, avatar_emoji: avatar });
      setCredentials({ username: result.username, password });
      setName(""); setUsername(""); setPassword(""); setGrade(""); setAvatar("🧑‍🎓"); setShowForm(false);
      await load();
    } catch (e) { setStatus(e instanceof Error ? e.message : "Could not create learner account."); }
    finally { setBusy(false); }
  }

  async function changeStatus(learner: LearnerAccount) {
    const enabled = learner.account_status !== "active";
    setActionBusy(`${learner.learner_id}:status`); setStatus("");
    try {
      await manageLearnerAccount({ learner_id: learner.learner_id, action: enabled ? "enable" : "disable" });
      await load();
    } catch (e) { setStatus(e instanceof Error ? e.message : "Could not update learner account."); }
    finally { setActionBusy(""); }
  }

  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordLearner) return;
    setActionBusy(`${passwordLearner.learner_id}:password`); setStatus("");
    try {
      await manageLearnerAccount({ learner_id: passwordLearner.learner_id, action: "reset_password", new_password: newPassword });
      setPasswordLearner(null); setNewPassword("");
      setStatus("Learner password changed successfully. Give the new password to the learner securely.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Could not change learner password."); }
    finally { setActionBusy(""); }
  }

  async function copyCredentials() {
    if (!credentials) return;
    await navigator.clipboard?.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 pb-24 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/parent" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18} /> Parent dashboard</Link>
          <button onClick={() => { setShowForm(v => !v); setStatus(""); setCredentials(null); }} className="inline-flex items-center gap-2 rounded-full bg-[#071b3a] px-5 py-3 font-black text-white shadow-lg"><Plus size={18} /> Add learner</button>
        </header>

        <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-500 p-7 text-white shadow-2xl sm:p-9">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-white/15 p-3"><ShieldCheck size={25} /></div><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-100">Family accounts</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Your learners</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Manage each learner's access, credentials and learning account from one place.</p></div></div>
        </section>

        {showForm && <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8"><div className="flex items-center gap-3"><GraduationCap className="text-violet-600" /><div><h2 className="text-2xl font-black text-[#071b3a]">Add a learner</h2><p className="text-sm text-slate-500">Learners do not sign up themselves.</p></div></div><form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm font-bold text-slate-700">Learner name</span><input required value={name} onChange={e => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="Child's name" /></label><label className="block"><span className="text-sm font-bold text-slate-700">Username</span><input required pattern="[a-z0-9][a-z0-9._-]{2,31}" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="e.g. ali2026" /><span className="mt-1 block text-xs text-slate-400">3–32 lowercase letters, numbers, . _ or -</span></label><label className="block"><span className="text-sm font-bold text-slate-700">Password</span><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="At least 6 characters" /></label><label className="block"><span className="text-sm font-bold text-slate-700">Grade</span><select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="">Select grade</option>{grades.map(g => <option key={g}>{g}</option>)}</select></label><div className="sm:col-span-2"><span className="text-sm font-bold text-slate-700">Avatar</span><div className="mt-2 flex flex-wrap gap-2">{avatars.map(a => <button type="button" key={a} onClick={() => setAvatar(a)} className={`rounded-xl px-3 py-2 text-2xl ${avatar === a ? "bg-violet-100 ring-2 ring-violet-500" : "bg-slate-50"}`}>{a}</button>)}</div></div>{status && <p role="alert" className="sm:col-span-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{status}</p>}<div className="sm:col-span-2 flex flex-wrap gap-3"><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#071b3a] px-5 py-3 font-black text-white disabled:opacity-60">{busy && <Loader2 className="animate-spin" size={17} />}{busy ? "Creating learner…" : "Create learner account"}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-600">Cancel</button></div></form></section>}

        {credentials && <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 text-emerald-600" /><div className="flex-1"><h2 className="font-black text-emerald-900">Learner account created</h2><p className="mt-1 text-sm text-emerald-800">Give these credentials to the learner. Keep them private.</p><div className="mt-4 grid gap-2 rounded-2xl bg-white p-4 font-mono text-sm text-slate-700 sm:grid-cols-2"><div><span className="font-sans text-xs text-slate-400">USERNAME</span><p className="font-black">{credentials.username}</p></div><div><span className="font-sans text-xs text-slate-400">PASSWORD</span><p className="font-black">{credentials.password}</p></div></div><button onClick={copyCredentials} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-emerald-700"><Copy size={15} /> Copy credentials</button></div></div></section>}

        {status && !showForm && <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{status}</p>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{learners.map(learner => { const active = learner.account_status === "active"; const statusBusy = actionBusy === `${learner.learner_id}:status`; return <article key={learner.learner_id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-3xl">{learner.avatar_emoji || "🧑‍🎓"}</div><div className="min-w-0"><h2 className="truncate font-black text-[#071b3a]">{learner.display_name}</h2><p className="text-sm font-bold text-violet-600">@{learner.username}</p></div></div><div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}"><span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />{active ? "Account enabled" : "Account disabled"}</div><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-400">Grade</span><p className="font-bold">{learner.grade || "Not set"}</p></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-400">XP</span><p className="font-bold">{learner.xp}</p></div></div><p className="mt-4 text-xs text-slate-400">Streak: {learner.current_streak} days · Best: {learner.best_streak} days</p><div className="mt-5 grid gap-2"><button disabled={statusBusy} onClick={() => changeStatus(learner)} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-50 ${active ? "bg-slate-100 text-slate-700" : "bg-emerald-600 text-white"}`}>{statusBusy ? <Loader2 className="animate-spin" size={16} /> : active ? <LockKeyhole size={16} /> : <UnlockKeyhole size={16} />}{active ? "Disable account" : "Enable account"}</button><button onClick={() => { setPasswordLearner(learner); setNewPassword(""); setStatus(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700"><KeyRound size={16} /> Change password</button></div></article>; })}{learners.length === 0 && <div className="rounded-3xl bg-white p-8 text-center shadow-sm sm:col-span-2 lg:col-span-3"><GraduationCap className="mx-auto text-violet-500" size={40} /><h2 className="mt-3 text-xl font-black text-[#071b3a]">No learner accounts yet</h2><p className="mt-2 text-sm text-slate-500">Add your first learner to get started.</p><button onClick={() => setShowForm(true)} className="mt-5 rounded-xl bg-[#071b3a] px-5 py-3 font-black text-white">Add first learner</button></div>}</section>

        {passwordLearner && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-50 p-3 text-violet-600"><KeyRound size={22} /></div><div><h2 className="text-xl font-black text-[#071b3a]">Change password</h2><p className="text-sm text-slate-500">@{passwordLearner.username}</p></div></div><form onSubmit={resetPassword} className="mt-6"><label className="block"><span className="text-sm font-bold text-slate-700">New password</span><input autoFocus required minLength={6} maxLength={128} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="At least 6 characters" /></label><p className="mt-2 text-xs text-slate-400">The learner will use this new password at the next login.</p><div className="mt-5 flex gap-2"><button disabled={actionBusy === `${passwordLearner.learner_id}:password`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3 font-black text-white disabled:opacity-50">{actionBusy === `${passwordLearner.learner_id}:password` && <Loader2 className="animate-spin" size={16} />}Update password</button><button type="button" onClick={() => { setPasswordLearner(null); setNewPassword(""); }} className="rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-600">Cancel</button></div></form></section></div>}
      </div>
    </main>
  );
}
