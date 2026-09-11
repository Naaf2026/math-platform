"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RefreshCw, Search, ShieldCheck, UserCog, Users, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/app/auth/role-router";

type AppRole = "student" | "teacher" | "parent" | "guardian";
type AccountStatus = "active" | "inactive" | "pending";
type UserRow = { id: string; full_name: string | null; display_name: string | null; grade: string | null; learning_level: string | null; role: string; account_status: AccountStatus };

const roleOptions: { value: AppRole; label: string }[] = [
  { value: "student", label: "Student" }, { value: "teacher", label: "Teacher" }, { value: "parent", label: "Parent" }, { value: "guardian", label: "Guardian" },
];
const filterOptions = [
  { value: "student", label: "Students" }, { value: "teacher", label: "Teachers" }, { value: "parent", label: "Parents" }, { value: "guardian", label: "Guardians" }, { value: "unassigned", label: "Needs role" },
];

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Loading user directory…");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    if (!supabase) { setStatus("Supabase is not configured yet."); return; }
    setStatus("Loading user directory…"); setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const role = await getUserRole(supabase, user.id);
    if (role !== "admin") { setStatus("Administrator access is required."); return; }
    const { data, error } = await supabase.rpc("get_admin_user_directory", { p_role: filter === "all" ? null : filter });
    if (error) { setStatus(error.message); return; }
    setUsers((data ?? []) as UserRow[]); setStatus("");
  }
  useEffect(() => { void load(); }, [filter]);

  async function changeRole(user: UserRow, role: AppRole) {
    if (!supabase || user.role === role || user.role === "admin") return;
    setBusyId(user.id); setNotice("");
    const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: user.id, p_role: role });
    if (error) setNotice(error.message);
    else { setNotice(`${user.display_name || user.full_name || "User"} is now a ${role}.`); await load(); }
    setBusyId(null);
  }

  async function changeStatus(user: UserRow, nextStatus: AccountStatus) {
    if (!supabase || user.role === "admin" || user.account_status === nextStatus) return;
    setBusyId(user.id); setNotice("");
    const { error } = await supabase.rpc("admin_set_user_account_status", { p_user_id: user.id, p_status: nextStatus });
    if (error) setNotice(error.message);
    else { setNotice(`${user.display_name || user.full_name || "User"} is now ${nextStatus}.`); await load(); }
    setBusyId(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return users;
    return users.filter(u => [u.display_name, u.full_name, u.grade, u.learning_level, u.role, u.account_status].some(v => v?.toLowerCase().includes(q)));
  }, [users, search]);

  if (status) return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-xl ring-1 ring-slate-100"><ShieldCheck className="mx-auto text-violet-600" size={48}/><h1 className="mt-4 text-2xl font-black text-[#071b3a]">Admin User Management</h1><p className="mt-3 text-sm leading-6 text-slate-500">{status}</p><Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><ArrowLeft size={17}/> Admin dashboard</Link></div></main>;

  const counts = filterOptions.reduce<Record<string, number>>((acc, r) => { acc[r.value] = users.filter(u => u.role === r.value).length; return acc; }, {});
  const activeCount = users.filter(u => u.account_status === "active").length;
  const inactiveCount = users.filter(u => u.account_status === "inactive").length;

  return <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5 pb-24 sm:p-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4"><Link href="/admin" className="inline-flex items-center gap-2 font-bold text-slate-600"><ArrowLeft size={18}/> Admin dashboard</Link><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"><RefreshCw size={16}/> Refresh</button></header>
    <section className="mt-7 rounded-[2rem] bg-gradient-to-br from-[#17234f] via-violet-700 to-blue-600 p-7 text-white shadow-2xl sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider"><ShieldCheck size={14}/> Secure administrator view</div><h1 className="mt-4 text-4xl font-black">User Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Review users, assign approved roles, and control whether an account is active. Inactive accounts can be reactivated later.</p></div><div className="rounded-2xl bg-white/10 p-4 text-center"><Users className="mx-auto text-indigo-100" size={25}/><div className="mt-1 text-2xl font-black">{users.length}</div><div className="text-xs font-bold text-indigo-100">Users shown</div></div></div></section>
    <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-7">{filterOptions.map(r=><button key={r.value} onClick={()=>setFilter(filter===r.value?"all":r.value)} className={`rounded-2xl p-4 text-left shadow-sm ring-1 transition ${filter===r.value?"bg-violet-50 ring-violet-200":"bg-white ring-slate-100 hover:ring-violet-100"}`}><div className="text-xs font-black uppercase tracking-wider text-slate-500">{r.label}</div><div className="mt-1 text-2xl font-black text-[#071b3a]">{counts[r.value] ?? 0}</div></button>)}<div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-100"><div className="text-xs font-black uppercase tracking-wider text-emerald-600">Active</div><div className="mt-1 text-2xl font-black text-[#071b3a]">{activeCount}</div></div><div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rose-100"><div className="text-xs font-black uppercase tracking-wider text-rose-600">Inactive</div><div className="mt-1 text-2xl font-black text-[#071b3a]">{inactiveCount}</div></div></section>
    {counts.unassigned > 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900">{counts.unassigned} account{counts.unassigned === 1 ? "" : "s"} need a role. Select <span className="font-black">Needs role</span> above, then assign Student, Teacher, Parent or Guardian.</div>}
    {notice&&<div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm font-bold text-violet-800">{notice}</div>}
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Directory</p><h2 className="text-2xl font-black text-[#071b3a]">Platform users</h2></div><div className="relative w-full md:max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, grade, role or status" className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500"/></div></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400"><th className="px-3 py-3">User</th><th className="px-3 py-3">Grade</th><th className="px-3 py-3">Level</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Account</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{filtered.length===0?<tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">No matching users.</td></tr>:filtered.map(u=><tr key={u.id} className="border-b border-slate-50 last:border-0"><td className="px-3 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 font-black text-violet-700"><UserCog size={18}/></div><div><div className="font-black text-[#071b3a]">{u.display_name||u.full_name||"Unnamed user"}</div><div className="max-w-[260px] truncate text-xs text-slate-400">{u.id}</div></div></div></td><td className="px-3 py-4 text-sm font-semibold text-slate-600">{u.grade||"—"}</td><td className="px-3 py-4 text-sm font-semibold text-slate-600">{u.learning_level||"—"}</td><td className="px-3 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${u.role === "unassigned" ? "bg-amber-100 text-amber-800" : u.role === "admin" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-700"}`}>{u.role}</span></td><td className="px-3 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black capitalize ${u.account_status === "active" ? "bg-emerald-100 text-emerald-800" : u.account_status === "inactive" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{u.account_status === "active" ? <CheckCircle2 size={13}/> : <XCircle size={13}/>} {u.account_status}</span></td><td className="px-3 py-4"><div className="flex flex-wrap gap-2">{u.role === "admin" ? <span className="text-xs font-bold text-slate-400">Protected</span> : <><select disabled={busyId===u.id} value={u.role === "unassigned" ? "" : u.role} onChange={e=>{ if(e.target.value) void changeRole(u,e.target.value as AppRole); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-violet-500"><option value="">Assign role…</option>{roleOptions.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select><button disabled={busyId===u.id} onClick={()=>void changeStatus(u,u.account_status === "active" ? "inactive" : "active")} className={`rounded-xl px-3 py-2 text-sm font-black transition disabled:opacity-50 ${u.account_status === "active" ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>{u.account_status === "active" ? "Deactivate" : "Activate"}</button></>}</div></td></tr>)}</tbody></table></div></section>
    <p className="mt-5 text-center text-xs text-slate-400">Administrator accounts are protected. Account status is controlled by a server-side administrator function and can be changed again later.</p>
  </div></main>;
}
