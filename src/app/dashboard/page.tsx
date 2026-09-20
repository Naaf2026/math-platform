"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Gamepad2, GraduationCap, Home, LogOut, Trophy, Gift, LogIn, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LearnerLoginModal from "@/components/auth/LearnerLoginModal";
import LearnerAccessNotice from "@/components/subscription/LearnerAccessNotice";
import NotificationBell from "@/components/learner-notification-bell";

type Profile = { full_name: string | null; grade: string | null; xp: number; current_streak: number; avatar_url: string | null; avatar_emoji: string | null };
type MindStatus = { balance: number; remaining_seconds: number };
type VisualAccess = { enabled?: boolean; plan_name?: string; subscription_status?: string; trial_ends_at?: string | null };

function gradeLabel(value: string | null | undefined) { const match = String(value || "").match(/[1-7]/); return match ? `Grade ${match[0]}` : "Grade 3"; }
function formatMindTime(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); const minutes = Math.floor(safe / 60); const secs = safe % 60; return `${minutes}:${String(secs).padStart(2, "0")}`; }

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mind, setMind] = useState<MindStatus>({ balance: 0, remaining_seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mathPracticeUsed, setMathPracticeUsed] = useState(0);
  const [mathPracticeLimit, setMathPracticeLimit] = useState<number | null>(null);
  const [showPracticeLimit, setShowPracticeLimit] = useState(false);
  const [entitlements, setEntitlements] = useState<Array<{ feature_key?: string; subscription_status?: string; trial_ends_at?: string | null; daily_limit?: number | null }>>([]);
  const [dailyChallengeUsed, setDailyChallengeUsed] = useState(0);
  const [dailyChallengeLimit, setDailyChallengeLimit] = useState<number | null>(null);
  const [showDailyChallengeLimit, setShowDailyChallengeLimit] = useState(false);
  const [showVisualPremium, setShowVisualPremium] = useState(false);
  const [visualAccess, setVisualAccess] = useState<VisualAccess | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: auth } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!auth.user) { setProfile(null); setLoading(false); return; }
      const [{ data }, { data: mindData }, { data: entitlements }, { data: usage }, { data: dailyChallengeAccess }, { data: visualState }] = await Promise.all([
        supabase.from("profiles").select("full_name,grade,xp,current_streak,avatar_url,avatar_emoji").eq("id", auth.user.id).maybeSingle(),
        supabase.rpc("get_mind_spark_status"),
        supabase.rpc("get_my_entitlements"),
        supabase.from("subscription_usage").select("usage_count").eq("user_id", auth.user.id).eq("usage_date", new Date().toISOString().slice(0, 10)).eq("feature_key", "math_practice").maybeSingle(),
        supabase.rpc("get_daily_challenge_access_state").maybeSingle(),
        supabase.rpc("get_visual_question_access").maybeSingle()
      ]);
      if (!mounted) return;
      setProfile(data ?? { full_name: auth.user.user_metadata?.full_name ?? "Student", grade: null, xp: 0, current_streak: 0, avatar_url: null, avatar_emoji: "🧑‍🎓" });
      setEntitlements(Array.isArray(entitlements) ? entitlements : []);
      const mathEntitlement = (Array.isArray(entitlements) ? entitlements : []).find((item: { feature_key?: string }) => item.feature_key === "math_practice");
      setMathPracticeLimit(mathEntitlement?.daily_limit == null ? null : Number(mathEntitlement.daily_limit));
      setMathPracticeUsed(Number(usage?.usage_count ?? 0));
      const dailyEntitlement = (Array.isArray(entitlements) ? entitlements : []).find((item: { feature_key?: string }) => item.feature_key === "daily_challenge");
      setDailyChallengeLimit(dailyChallengeAccess?.daily_limit == null ? null : Number(dailyChallengeAccess.daily_limit));
      setDailyChallengeUsed(Number(dailyChallengeAccess?.used_today ?? 0));
      setVisualAccess((Array.isArray(visualState) ? visualState[0] : visualState) as VisualAccess | null);
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
    const timer = window.setInterval(() => setMind((value) => ({ ...value, remaining_seconds: Math.max(0, value.remaining_seconds - 1) })), 1000);
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

  const loggedOut = !profile;
  const firstName = (profile?.full_name || "Learner").split(" ")[0];
  const grade = gradeLabel(profile?.grade);
  const avatarSrc = profile?.avatar_url || null;
  const avatarEmoji = profile?.avatar_emoji || "🧑‍🎓";
  // Use the authoritative Visual Math entitlement to determine the learner's current subscription.
  // This prevents a Premium learner from being classified as trial/free by a secondary entitlement row.
  const isPremium = visualAccess?.subscription_status === "active" && visualAccess?.plan_name === "Premium";
  const trialEndsAt = visualAccess?.trial_ends_at ?? null;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;
  const isTrial = !isPremium && visualAccess?.subscription_status === "trialing" && trialDaysLeft > 0;

  const Avatar = ({ className }: { className: string }) => avatarSrc
    ? <img src={avatarSrc} alt="Learner avatar" className={`${className} object-cover`} />
    : <div className={`${className} grid place-items-center text-5xl bg-[#dff7ff]`} role="img" aria-label="Learner avatar">{avatarEmoji}</div>;

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#eef9ff]"><div className="rounded-3xl bg-white px-8 py-6 font-black text-[#083d78] shadow-xl">Loading…</div></main>;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      <header className="sticky top-0 z-40 h-[76px] border-b border-white/10 bg-[#073b73] text-white shadow-sm lg:h-[90px]">
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3 lg:gap-4"><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN Math Learning Platform" className="h-[44px] w-auto max-w-[220px] object-contain lg:h-[57px] lg:max-w-none" /></Link>
          {loggedOut ? <button type="button" onClick={() => setLoginOpen(true)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#073b73] shadow-md transition hover:bg-[#eef8ff]"><LogIn size={17} /> Learner Login</button> : <div className="flex items-center gap-2 sm:gap-3"><nav className="hidden items-center gap-8 lg:flex"><Link href="/dashboard" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><Home size={25} /> Home<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400" /></Link><Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><Gamepad2 size={25} /> Games</Link><Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><Trophy size={25} /> Leaderboard</Link><Link href="/rewards" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><Gift size={25} /> Rewards</Link><Link href="/progress" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><BarChart3 size={25} /> Progress</Link><Link href="/profile" className="flex items-center gap-3 px-4 py-7 text-lg font-bold hover:text-yellow-200"><GraduationCap size={25} /> Profile</Link></nav><div className="flex items-center gap-2 sm:gap-3"><div className="hidden items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 sm:flex"><span className="text-sm font-black">✨ {mind.balance}</span><span className="text-sm font-black">⏱️ Mind Time {formatMindTime(mind.remaining_seconds)}</span></div><NotificationBell /></div></div>}
        </div>
      </header>

      {loggedOut ? <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1680px] items-center justify-center px-5 py-12 lg:min-h-[calc(100vh-90px)] lg:px-12"><div className="w-full max-w-5xl rounded-[36px] border border-[#cfe6f7] bg-white p-7 shadow-xl sm:p-12 lg:p-16"><div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]"><div><div className="inline-flex items-center gap-2 rounded-full bg-[#eaf7ff] px-4 py-2 text-sm font-black text-[#176a9c]">🎓 Learner Dashboard</div><h1 className="mt-5 text-4xl font-black leading-tight text-[#083d78] sm:text-5xl">Welcome to your maths adventure! 👋</h1><p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-[#6685a4]">Log in to continue your challenges, training, progress, rewards and Mind Games.</p><button type="button" onClick={() => setLoginOpen(true)} className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#197fe9] px-7 py-4 text-lg font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#126fce]"><LogIn size={20} /> Learner Login</button></div><div className="rounded-[28px] bg-[#eef9ff] p-6 sm:p-8"><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">🎯</span><p className="mt-2 font-black text-[#083d78]">Challenges</p></div><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">🧠</span><p className="mt-2 font-black text-[#083d78]">Mind Games</p></div><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">🏆</span><p className="mt-2 font-black text-[#083d78]">Rewards</p></div><div className="rounded-2xl bg-white p-5 text-center shadow-sm"><span className="text-3xl">📈</span><p className="mt-2 font-black text-[#083d78]">Progress</p></div></div></div></div></div></section> : <div className="mx-auto flex min-h-screen max-w-[1680px] lg:min-h-[calc(100vh-90px)]"><aside className="hidden min-h-full w-[245px] shrink-0 flex-col border-r border-[#dcecf6] bg-[#f5fbff] px-7 py-9 lg:flex"><div className="flex flex-col items-center text-center"><div className="h-[148px] w-[148px] overflow-hidden rounded-full border-4 border-white bg-[#dff7ff] shadow-lg"><Avatar className="h-full w-full" /></div><h2 className="mt-5 text-[34px] font-black tracking-tight">{firstName}</h2><div className="mt-1 flex items-center gap-2 text-[19px] font-bold"><GraduationCap size={22} /> {grade}</div></div><div className="mt-7 border-t border-[#dcecf6] pt-5"><div className="flex items-center gap-3 py-2"><span className="text-2xl">🔥</span><p className="text-[17px] font-black">{profile?.current_streak ?? 0} Day Streak</p></div><div className="flex items-center gap-3 py-2"><span className="text-2xl">⭐</span><p className="text-[17px] font-black">{profile?.xp ?? 0} XP</p></div><div className="flex items-center gap-3 py-2"><span className="text-2xl">🏅</span><p className="text-[17px] font-black">12 Badges</p></div></div><div className="mt-5 border-t border-[#dcecf6] pt-4 space-y-2"><div className="flex items-center justify-between rounded-xl bg-[#fff8d9] px-3 py-2"><span className="text-xs font-black text-[#806a12]">Mind Sparks</span><span className="text-sm font-black">✨ {mind.balance}</span></div><div className="flex items-center justify-between rounded-xl bg-[#eaf7ff] px-3 py-2"><span className="text-xs font-black text-[#25638d]">Mind Time</span><span className="text-sm font-black">⏱️ {formatMindTime(mind.remaining_seconds)}</span></div></div><button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-black text-[#d43d3d] transition hover:bg-[#ffeaea] disabled:opacity-60"><LogOut size={18} />{loggingOut ? "Logging out…" : "Log Out"}</button></aside><section className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-12 lg:pb-8 xl:px-14"><div className="mx-auto max-w-[1340px]"><div className="mb-5 rounded-[24px] border border-[#d7eaf7] bg-white/85 p-4 shadow-sm lg:hidden sm:p-5"><div className="flex items-center gap-3"><div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#dff7ff] shadow-md sm:h-[76px] sm:w-[76px]"><Avatar className="h-full w-full" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-[25px] font-black leading-tight sm:text-[30px]">{firstName}</h2><button type="button" onClick={handleLogout} disabled={loggingOut} aria-label="Log out" title="Log out" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#ffd7d7] bg-[#fff5f5] px-3 text-[12px] font-black text-[#d43d43] shadow-sm transition active:scale-95 disabled:opacity-60 sm:h-10 sm:px-3.5"><LogOut size={15} />{loggingOut ? "Logging out…" : "Log Out"}</button></div><div className="mt-1 flex items-center gap-1.5 text-[16px] font-bold text-[#55708b] sm:text-[18px]"><GraduationCap size={19} /> {grade}</div></div></div><div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-[#dcecf6] pt-3 sm:gap-2"><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fff6df] px-1.5 py-1.5"><span className="text-base">🔥</span><p className="text-[11px] font-black leading-none">{profile?.current_streak ?? 0} Streak</p></div><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fff8d9] px-1.5 py-1.5"><span className="text-base">⭐</span><p className="text-[11px] font-black leading-none">{profile?.xp ?? 0} XP</p></div><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#eef8ff] px-1.5 py-1.5"><span className="text-base">🏅</span><p className="text-[11px] font-black leading-none">12 Badges</p></div></div><div className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-[#dcecf6] pt-1.5"><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#fff8d9] px-1.5 py-1.5"><span className="text-sm">✨</span><p className="text-[11px] font-black leading-none">Mind Sparks <span className="text-[#806a12]">{mind.balance}</span></p></div><div className="flex items-center justify-center gap-1.5 rounded-xl bg-[#eaf7ff] px-1.5 py-1.5"><span className="text-sm">⏱️</span><p className="text-[11px] font-black leading-none">Mind Time <span className="text-[#25638d]">{formatMindTime(mind.remaining_seconds)}</span></p></div></div></div><div className="mb-7 pl-1 sm:mb-8 sm:pl-2 lg:pl-5"><h1 className="text-[38px] font-black leading-none tracking-tight sm:text-[48px] lg:text-[54px]">Hi {firstName}! <span className="inline-block">👋</span></h1><p className="mt-3 text-[19px] font-semibold text-[#6685a4] sm:text-[23px] lg:text-[25px]">Ready for today’s math adventure?</p><Link href="/subscription" className="mt-4 inline-flex w-fit flex-col items-start rounded-2xl bg-[#fff4cf] px-4 py-2.5 text-sm font-black text-[#806a12] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffedaa]">{isTrial ? <><span>Trial balance: {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left</span><span className="mt-1">Upgrade to Premium → 👑</span></> : isPremium ? <><span className="inline-flex items-center gap-2">Premium Active <Crown size={17} /></span></> : <span>Upgrade to Premium → 👑</span>}</Link></div><div className="grid gap-6 md:grid-cols-3 lg:gap-7">
  <button type="button" onClick={() => { if (dailyChallengeLimit !== null && dailyChallengeUsed >= dailyChallengeLimit) setShowDailyChallengeLimit(true); else window.location.href = "/challenge"; }} className="order-1 group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#ffbd28] bg-[#fff3cc] text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:col-start-1 md:row-start-1 md:h-[500px] md:min-h-0">
    <div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#ffd45c]"><img src="/dashboard-assets/dashboard-daily.svg" alt="Daily Challenge" className="block h-full w-full object-cover" /></div>
    <div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#fffaf0] px-2 pt-7 sm:pt-8">
      <h2 className="text-[34px] font-black leading-[0.95] sm:text-[38px]">Daily<br />Challenge</h2>
      <p className="mt-4 text-[17px] font-bold text-[#55708b]">📋 &nbsp;10 Questions • Earn XP</p>
      <div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#ffad16] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Start →</div>
    </div>
  </button>

  <button type="button" onClick={() => { if (isPremium) window.location.href = "/visual-questions"; else setShowVisualPremium(true); }} className="order-2 group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#9b8cff] bg-[#f0edff] text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:col-start-1 md:row-start-2 md:h-[500px] md:min-h-0">
    <div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-gradient-to-br from-[#8d7cf6] via-[#a994ff] to-[#6fc9ff]">
      <div className="relative flex h-full items-center justify-center gap-3 px-3 sm:gap-4 sm:px-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white text-4xl shadow-xl sm:h-24 sm:w-24 sm:text-5xl">👀</div>
        <div className="rounded-2xl bg-white/90 px-4 py-3 text-center shadow-lg sm:px-5">
          <div className="text-[10px] font-black uppercase tracking-[.15em] text-[#735fe6] sm:text-xs sm:tracking-[.18em]">Premium Learning</div>
          <div className="text-[21px] font-black text-[#183b68] sm:text-2xl">Visual Math Lab</div>
        </div>
      </div>
    </div>
    <div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-white px-2 pt-7 sm:pt-8">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 pr-1 text-[34px] font-black leading-[0.95] text-[#183b68] sm:text-[38px]">Visual<br />Math Lab</h2>
        <div className="shrink-0 rounded-full bg-[#fff1c7] px-3 py-2 text-xs font-black text-[#9b6a00]"><Crown size={15} className="mr-1 inline" />Premium</div>
      </div>
      <p className="mt-4 text-[17px] font-bold text-[#55708b]">👀 &nbsp;See, explore and solve maths visually</p>
      <div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#735fe6] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Start →</div>
    </div>
  </button>

  <button type="button" onClick={() => { if (mathPracticeLimit !== null && mathPracticeUsed >= mathPracticeLimit) setShowPracticeLimit(true); else window.location.href = "/training"; }} className="order-3 group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#43bdf4] bg-[#e4f6ff] text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:col-start-2 md:row-start-1 md:h-[500px] md:min-h-0">
    <div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#219eea]"><img src="/dashboard-assets/dashboard-training.svg" alt="Math Training" className="block h-full w-full object-contain px-2 py-1" /></div>
    <div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#e8f7ff] px-2 pt-7 sm:pt-8">
      <h2 className="text-[38px] font-black leading-none">Training</h2>
      <p className="mt-4 text-[18px] font-bold text-[#55708b]">Practice your skills</p>
      <div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#197fe9] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Practice →</div>
    </div>
  </button>

  <Link href="/peer-challenge" className="order-4 group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#ffab8d] bg-[#fff0e9] shadow-lg transition hover:-translate-y-1 hover:shadow-2xl md:col-start-3 md:row-start-1 md:h-[500px] md:min-h-0">
    <div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#ff855f]"><img src="/dashboard-assets/dashboard-peer.svg" alt="Buddy Challenge" className="block h-full w-full object-cover" /></div>
    <div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#fff3ef] px-2 pt-7 sm:pt-8">
      <h2 className="text-[34px] font-black leading-none sm:text-[36px]">Buddy Challenge</h2>
      <p className="mt-4 text-[18px] font-bold text-[#55708b]">Challenge a friend</p>
      <div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#ff6035] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Play →</div>
    </div>
  </Link>
</div></div></section></div>}

      {!loggedOut && <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#cfe4f2] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 shadow-[0_-6px_20px_rgba(8,61,120,0.10)] backdrop-blur lg:hidden" aria-label="Student navigation"><div className="mx-auto grid max-w-lg grid-cols-6"><Link href="/dashboard" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#197fe9]"><Home size={22} strokeWidth={2.5} /><span className="text-[11px] font-black">Home</span></Link><Link href="/brain-games" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Gamepad2 size={22} strokeWidth={2.5} /><span className="text-[11px] font-black">Games</span></Link><Link href="/leaderboard" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Trophy size={22} strokeWidth={2.5} /><span className="text-[11px] font-black">Leaderboard</span></Link><Link href="/rewards" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Gift size={22} strokeWidth={2.5} /><span className="text-[11px] font-black">Rewards</span></Link><Link href="/progress" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><BarChart3 size={22} strokeWidth={2.5} /><span className="text-[11px] font-black">Progress</span></Link><Link href="/profile" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><GraduationCap size={22} strokeWidth={2.5} /><span className="text-[11px] font-black">Profile</span></Link></div></nav>}


      {showVisualPremium && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="visual-premium-title"><div className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-2xl"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#f0edff] text-5xl">👑</div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#735fe6]">Premium Feature</p><h2 id="visual-premium-title" className="mt-2 text-3xl font-black text-[#083d78]">Visual Questions need Premium ✨</h2><p className="mt-4 text-sm font-semibold leading-6 text-[#6685a4]">Unlock Visual Questions and explore maths through interactive visual activities with a Premium subscription.</p><div className="mt-7 grid gap-3"><Link href="/subscription" onClick={() => setShowVisualPremium(false)} className="w-full rounded-2xl bg-[#735fe6] px-6 py-3.5 font-black text-white shadow-md transition hover:bg-[#634ed5]">Upgrade to Premium → 👑</Link><button type="button" onClick={() => setShowVisualPremium(false)} className="rounded-2xl bg-[#eef6fc] px-6 py-3 font-black text-[#083d78]">Maybe later</button></div></div></div>}

      {showDailyChallengeLimit && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-2xl"><div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-[#fff3cc] text-5xl">🏆</div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#e39a00]">Daily Challenge complete</p><h2 className="mt-2 text-3xl font-black text-[#083d78]">Great work today! 🎉</h2><p className="mt-4 text-sm font-semibold leading-6 text-[#6685a4]">You have completed your 10 Daily Challenge questions for today.</p><p className="mt-2 text-sm font-semibold leading-6 text-[#6685a4]">Your Daily Challenge will be available again tomorrow when the daily limit resets.</p><button type="button" onClick={() => setShowDailyChallengeLimit(false)} className="mt-7 w-full rounded-2xl bg-[#ffad16] px-6 py-3.5 font-black text-white shadow-md">Got it! 🎉</button></div></div>}

      {showPracticeLimit && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="practice-limit-title"><div className="w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-2xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#e8f4ff] text-4xl">🎯</div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#197fe9]">Daily practice complete</p><h2 id="practice-limit-title" className="mt-2 text-2xl font-black text-[#083d78]">Great work today! 🎉</h2><p className="mt-3 text-sm font-semibold leading-6 text-[#6685a4]">You have completed your {mathPracticeLimit} Math Practice questions for today. You can start practising again tomorrow when your daily limit resets.</p><div className="mt-6 grid gap-3"><button type="button" onClick={() => setShowPracticeLimit(false)} className="rounded-2xl bg-[#197fe9] px-6 py-3.5 font-black text-white shadow-md">Got it</button><button type="button" onClick={() => setShowPracticeLimit(false)} className="rounded-2xl bg-[#eef6fc] px-6 py-3 font-black text-[#083d78]">Close</button></div></div></div>}

      <LearnerLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {!loggedOut && <LearnerAccessNotice />}
    </main>
  );

}
