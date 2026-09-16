"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BarChart3, Gamepad2, GraduationCap, Home, LogOut, Trophy, Gift, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LearnerLoginModal from "@/components/auth/LearnerLoginModal";

type Profile = { full_name: string | null; grade: string | null; xp: number; current_streak: number };
type MindStatus = { balance: number; remaining_seconds: number };

function gradeLabel(value: string | null | undefined) { const match = String(value || "").match(/[1-7]/); return match ? `Grade ${match[0]}` : "Grade 3"; }
function formatMindTime(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); const minutes = Math.floor(safe / 60); const secs = safe % 60; return `${minutes}:${String(secs).padStart(2, "0")}`; }

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mind, setMind] = useState<MindStatus>({ balance: 0, remaining_seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: auth } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!auth.user) { setProfile(null); setLoading(false); return; }
      const [{ data }, { data: mindData }] = await Promise.all([
        supabase.from("profiles").select("full_name,grade,xp,current_streak").eq("id", auth.user.id).maybeSingle(),
        supabase.rpc("get_mind_spark_status")
      ]);
      if (!mounted) return;
      setProfile(data ?? { full_name: auth.user.user_metadata?.full_name ?? "Student", grade: null, xp: 0, current_streak: 0 });
      if (mindData) {
        const status = Array.isArray(mindData) ? mindData[0] : mindData;
        setMind({ balance: Number(status?.balance ?? 0), remaining_seconds: Number(status?.remaining_seconds ?? 0) });
      }
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!profile) return;
    const timer = window.setInterval(() => {
      setMind((value) => ({ ...value, remaining_seconds: Math.max(0, value.remaining_seconds - 1) }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [profile]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setMind({ balance: 0, remaining_seconds: 0 });
    setLoggingOut(false);
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#eef9ff]"><div className="rounded-3xl bg-white px-8 py-6 font-black text-[#083d78] shadow-xl">Loading…</div></main>;

  const loggedOut = !profile;
  const firstName = (profile?.full_name || "Learner").split(" ")[0];
  const grade = gradeLabel(profile?.grade);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      <header className="sticky top-0 z-40 h-[76px] border-b border-white/10 bg-[#073b73] text-white shadow-sm lg:h-[90px]">
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3 lg:gap-4"><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN Math Learning Platform" className="h-[44px] w-auto max-w-[220px] object-contain lg:h-[57px] lg:max-w-none" /></Link>
          {loggedOut ? (
            <button type="button" onClick={() => setLoginOpen(true)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#073b73] shadow-md transition hover:bg-[#eef8ff]"><LogIn size={17} /> Learner Login</button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3"><nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><Home size={25} /> Home<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400" /></Link><Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><Gamepad2 size={25} /> Games</Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><Trophy size={25} /> Leaderboard</Link><Link href="/rewards" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><Gift size={25} /> Rewards</Link><Link href="/progress" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><BarChart3 size={25} /> Progress</Link></nav><div className="flex items-center gap-2 sm:gap-3"><div className="hidden items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 sm:flex"><span className="text-sm font-black">✨ {mind.balance}</span><span className="text-sm font-black">⏱️ Mind Time {formatMindTime(mind.remaining_seconds)}</span></div><button aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 sm:h-12 sm:w-12"><Bell size={24} /><span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-400" /></button></div></div>
          )}
        </div>
      </header>

      {loggedOut ? (
        <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1680px] items-center justify-center px-5 py-12 lg:min-h-[calc(100vh-90px)] lg:px-12">
          <div className="w-full max-w-5xl rounded-[36px] border border-[#cfe6f7] bg-white p-7 shadow-xl sm:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
              <div><div className="inline-flex items-center gap-2 rounded-full bg-[#eaf7ff] px-4 py-2 text-sm font-black text-[#176a9c]">🎓 Learner Dashboard</div><h1 className="mt-5 text-4xl font-black leading-tight text-[#083d78] sm:text-5xl">Welcome to your maths adventure! 👋</h1><p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-[#6685a4]">Log in to continue your challenges, training, progress, rewards and Mind Games.</p><button type="button" onClick={() => setLoginOpen(true)} className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#197fe9] px-7 py-4 text-lg font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#126fce]"><LogIn size={20} /> Learner Login</button></div>
              <div className="rounded-[28px] bg-[#eef9ff] p-6 sm:p-8"><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">🎯</span><p className="mt-2 font-black text-[#083d78]">Challenges</p></div><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">🧠</span><p className="mt-2 font-black text-[#083d78]">Mind Games</p></div><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">🏆</span><p className="mt-2 font-black text-[#083d78]">Rewards</p></div><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">📈</span><p className="mt-2 font-black text-[#083d78]">Progress</p></div></div></div>
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto flex min-h-screen max-w-[1680px] lg:min-h-[calc(100vh-90px)]">
          <aside className="hidden min-h-full w-[245px] shrink-0 flex-col border-r border-[#dcecf6] bg-[#f5fbff] px-7 py-9 lg:flex"><div className="flex flex-col items-center text-center"><div className="h-[148px] w-[148px] overflow-hidden rounded-full border-4 border-white bg-[#dff7ff] shadow-lg"><img src="/dashboard-assets/dashboard-avatar.svg" alt="Student avatar" className="h-full w-full object-cover" /></div><h2 className="mt-5 text-[34px] font-black tracking-tight">{firstName}</h2><div className="mt-1 flex items-center gap-2 text-[19px] font-bold"><GraduationCap size={22} /> {grade}</div></div><div className="mt-7 border-t border-[#dcecf6] pt-5"><div className="flex items-center gap-3 py-2"><span className="text-2xl">🔥</span><p className="text-[17px] font-black">{profile?.current_streak ?? 0} Day Streak</p></div><div className="flex items-center gap-3 py-2"><span className="text-2xl">⭐</span><p className="text-[17px] font-black">{profile?.xp ?? 0} XP</p></div><div className="flex items-center gap-3 py-2"><span className="text-2xl">🏅</span><p className="text-[17px] font-black">12 Badges</p></div></div><div className="mt-5 border-t border-[#dcecf6] pt-4 space-y-2"><div className="flex items-center justify-between rounded-xl bg-[#fff8d9] px-3 py-2"><span className="text-xs font-black text-[#806a12]">Mind Sparks</span><span className="text-sm font-black">✨ {mind.balance}</span></div><div className="flex items-center justify-between rounded-xl bg-[#eaf7ff] px-3 py-2"><span className="text-xs font-black text-[#25638d]">Mind Time</span><span className="text-sm font-black">⏱️ {formatMindTime(mind.remaining_seconds)}</span></div></div><button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-black text-[#d43d3d] transition hover:bg-[#ffeaea] disabled:opacity-60"><LogOut size={18} />{loggingOut ? "Logging out…" : "Log Out"}</button></aside>
          <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-12 xl:px-14"><div className="mx-auto max-w-[1340px]"><div className="mb-5 rounded-[24px] border border-[#d7eaf7] bg-white/85 p-4 shadow-sm lg:hidden sm:p-5"><div className="flex items-center gap-3"><div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#dff7ff] shadow-md sm:h-[76px] sm:w-[76px]"><img src="/dashboard-assets/dashboard-avatar.svg" alt="Student avatar" className="h-full w-full object-cover" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-[25px] font-black leading-tight sm:text-[30px]">{firstName}</h2><button type="button" onClick={handleLogout} disabled={loggingOut} aria-label="Log out" title="Log out" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#ffd7d7] bg-[#fff5f5] px-3 text-[12px] font-black text-[#d43d43] shadow-sm transition active:scale-95 disabled:opacity-60 sm:h-10 sm:px-3.5"><LogOut size={15} />{loggingOut ? "Logging out…" : "Log Out"}</button></div><div className="mt-1 flex items-center gap-1.5 text-[16px] font-bold text-[#55708b] sm:text-[18px]"><GraduationCap size={19} /> {grade}</div></div></div><div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-[#dcecf6] pt-3 sm:gap-2"><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fff6df] px-1.5 py-1.5"><span className="text-base">🔥</span><p className="text-[11px] font-black leading-none">{profile?.current_streak ?? 0} Streak</p></div><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fff8d9] px-1.5 py-1.5"><span className="text-base">⭐</span><p className="text-[11px] font-black leading-none">{profile?.xp ?? 0} XP</p></div><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#eef8ff] px-1.5 py-1.5"><span className="text-base">🏅</span><p className="text-[11px] font-black leading-none">12 Badges</p></div></div><div className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-[#dcecf6] pt-1.5"><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fff8d9] px-1.5 py-1.5"><span className="text-sm">✨</span><p className="text-[11px] font-black leading-none">Mind Sparks <span className="text-[#806a12]">{mind.balance}</span></p></div><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#eaf7ff] px-1.5 py-1.5"><span className="text-sm">⏱️</span><p className="text-[11px] font-black leading-none">Mind Time <span className="text-[#25638d]">{formatMindTime(mind.remaining_seconds)}</span></p></div></div></div><div className="mb-7 pl-1 sm:mb-8 sm:pl-2 lg:pl-5"><h1 className="text-[38px] font-black leading-none tracking-tight sm:text-[48px] lg:text-[54px]">Hi {firstName}! <span className="inline-block">👋</span></h1><p className="mt-3 text-[19px] font-semibold text-[#6685a4] sm:text-[23px] lg:text-[25px]">Ready for today’s math adventure?</p></div><div className="grid gap-6 md:grid-cols-3 lg:gap-7"><Link href="/challenge" className="group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#ffbd28] bg-[#fff3cc] shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:h-[500px] md:min-h-0"><div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#ffd45c]"><img src="/dashboard-assets/dashboard-daily.svg" alt="Daily Challenge" className="block h-full w-full object-cover" /></div><div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#fffaf0] px-2 pt-7 sm:pt-8"><h2 className="text-[34px] font-black leading-[0.95] sm:text-[38px]">Daily<br />Challenge</h2><p className="mt-4 text-[17px] font-bold text-[#55708b]">📋 &nbsp;10 Questions • Earn XP</p><div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#ffad16] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Start →</div></div></Link><Link href="/training" className="group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#43bdf4] bg-[#e4f6ff] shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:h-[500px] md:min-h-0"><div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#219eea]"><img src="/dashboard-assets/dashboard-training.svg" alt="Math Training" className="block h-full w-full object-contain px-2 py-1" /></div><div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#e8f7ff] px-2 pt-7 sm:pt-8"><h2 className="text-[38px] font-black leading-none">Training</h2><p className="mt-4 text-[18px] font-bold text-[#55708b]">Practice your skills</p><div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#197fe9] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Practice →</div></div></Link><Link href="/peer-challenge" className="group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#ffab8d] bg-[#fff0e9] shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:h-[500px] md:min-h-0"><div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#ff855f]"><img src="/dashboard-assets/dashboard-peer.svg" alt="Peer Challenge" className="block h-full w-full object-cover" /></div><div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#fff3ef] px-2 pt-7 sm:pt-8"><h2 className="text-[34px] font-black leading-none sm:text-[36px]">Peer Challenge</h2><p className="mt-4 text-[18px] font-bold text-[#55708b]">Challenge a friend</p><div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#ff6035] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Play →</div></div></Link></div></div></section>
        </div>
      )}
      <LearnerLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
