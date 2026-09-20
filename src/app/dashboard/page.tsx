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
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ status?: string; plan_name?: string; trial_ends_at?: string | null; current_period_end?: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: auth } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!auth.user) { setProfile(null); setLoading(false); return; }
      const [{ data }, { data: mindData }, { data: entitlements }, { data: usage }, { data: dailyChallengeAccess }, { data: visualState }, { data: subRow }] = await Promise.all([
        supabase.from("profiles").select("full_name,grade,xp,current_streak,avatar_url,avatar_emoji").eq("id", auth.user.id).maybeSingle(),
        supabase.rpc("get_mind_spark_status"),
        supabase.rpc("get_my_entitlements"),
        supabase.from("subscription_usage").select("usage_count").eq("user_id", auth.user.id).eq("usage_date", new Date().toISOString().slice(0, 10)).eq("feature_key", "math_practice").maybeSingle(),
        supabase.rpc("get_daily_challenge_access_state").maybeSingle(),
        supabase.rpc("get_visual_question_access").maybeSingle(),
        supabase.from("user_subscriptions").select("status,trial_ends_at,current_period_end,plan_id").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
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
      if (subRow?.plan_id) {
        const { data: planRow } = await supabase.from("subscription_plans").select("name,slug").eq("id", subRow.plan_id).maybeSingle();
        setSubscriptionInfo({ ...subRow, plan_name: planRow?.name ?? undefined });
      } else {
        setSubscriptionInfo(null);
      }
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

  const normalizeStatus = (value?: string | null) => (value ?? "").trim().toLowerCase();
  const normalizePlan = (value?: string | null) => (value ?? "").trim().toLowerCase();

  const subscriptionStatus = normalizeStatus(subscriptionInfo?.status);
  const visualStatus = normalizeStatus(visualAccess?.subscription_status);
  const subscriptionPlan = normalizePlan(subscriptionInfo?.plan_name);
  const visualPlan = normalizePlan(visualAccess?.plan_name);

  // Premium is authoritative. Only classify the learner as Trial when there is
  // no active Premium subscription/access record.
  const hasActivePremium =
    (subscriptionStatus === "active" && subscriptionPlan === "premium") ||
    // Visual Math Lab access is Premium-only. Do not let missing/stale plan
    // metadata downgrade an account that already has active Premium access.
    (visualStatus === "active" && visualAccess?.enabled === true);

  const trialEndsAt =
    subscriptionInfo?.trial_ends_at ??
    visualAccess?.trial_ends_at ??
    null;

  const trialDaysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialEndsAt).getTime() - Date.now()) / 86400000
        )
      )
    : 0;

  const isPremium = hasActivePremium;

  const isTrial =
    !hasActivePremium &&
    (subscriptionStatus === "trialing" || visualStatus === "trialing") &&
    trialDaysLeft > 0;

  const Avatar = ({ className }: { className: string }) => avatarSrc
    ? <img src={avatarSrc} alt="Learner avatar" className={`${className} object-cover`} />
    : <div className={`${className} grid place-items-center text-5xl bg-[#dff7ff]`} role="img" aria-label="Learner avatar">{avatarEmoji}</div>;

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#eef9ff]"><div className="rounded-3xl bg-white px-8 py-6 font-black text-[#083d78] shadow-xl">Loading…</div></main>;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef9ff] text-[#083d78]">
      <header className="sticky top-0 z-40 h-[76px] border-b border-white/10 bg-[#073b73] text-white shadow-sm lg:h-[90px]">
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3 lg:gap-4"><img src="/dashboard-assets/dashboard-logo.svg" alt="FAHI VISSNUN Math Learning Platform" className="h-[44px] w-auto shrink-0 object-contain sm:h-[52px]" /><div className="hidden min-w-0 items-center gap-2 text-left md:flex"><div className="min-w-0"><div className="truncate text-lg font-black leading-none">{firstName}</div><div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#cfe7ff]">{grade}</div></div></div></Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            {loggedOut ? <button type="button" onClick={() => setLoginOpen(true)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#073b73] shadow-md transition hover:scale-[1.01]"> <LogIn size={16} /> Log in </button> : <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/15" disabled={loggingOut}> <LogOut size={16} /> {loggingOut ? "Logging out..." : "Log out"} </button>}
          </div>
        </div>
      </header>

      {loggedOut ? (
        <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1680px] items-center justify-center px-5 py-12 lg:min-h-[calc(100vh-90px)] lg:px-12">
          <div className="w-full max-w-xl rounded-[32px] border border-[#dfeeff] bg-white p-8 shadow-[0_25px_70px_rgba(7,59,115,0.10)]">
            <div className="mx-auto grid h-18 w-18 place-items-center rounded-[24px] bg-[#e9f8ff] text-4xl shadow-inner">🧑‍🎓</div>
            <h1 className="mt-6 text-center text-4xl font-black text-[#083d78]">Welcome back!</h1>
            <p className="mt-3 text-center text-base font-semibold text-slate-600">Log in to continue learning, tracking progress, and earning rewards.</p>
            <button type="button" onClick={() => setLoginOpen(true)} className="mt-8 w-full rounded-2xl bg-[#073b73] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:translate-y-[-1px]">Log in to dashboard</button>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-[1680px] px-4 pb-24 pt-6 sm:px-6 lg:px-12 lg:pt-8">
          <div className="mb-6 flex flex-col gap-4 rounded-[32px] border border-[#dfeeff] bg-white/80 p-4 shadow-[0_10px_30px_rgba(8,61,120,0.06)] backdrop-blur-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[22px] bg-[#eaf4ff] shadow-inner">
                <Avatar className="h-full w-full" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6d87a5]">Learner dashboard</p>
                <h1 className="mt-1 text-3xl font-black text-[#083d78]">Hi, {firstName}!</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef9ff] px-3 py-2 text-sm font-black text-[#0d5aa6]">
                <Trophy size={15} /> {profile.xp ?? 0} XP
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff8e5] px-3 py-2 text-sm font-black text-[#a66400]">
                <Gift size={15} /> Streak {profile.current_streak ?? 0}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="grid gap-6 md:grid-cols-2">
              <button type="button" onClick={() => { if (dailyChallengeLimit !== null && dailyChallengeUsed >= dailyChallengeLimit) setShowDailyChallengeLimit(true); else window.location.href = "/challenge"; }} className="group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#ffce79] bg-[#fff7dc] shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#ffd45c]"><img src="/dashboard-assets/dashboard-daily.svg" alt="Daily Challenge" className="block h-full w-full object-cover" /></div>
                <div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#fffaf0] px-2 pt-7 sm:pt-8">
                  <h2 className="text-[34px] font-black leading-[0.95] sm:text-[38px]">Daily<br />Challenge</h2>
                  <p className="mt-4 text-[17px] font-bold text-[#55708b]">📋 &nbsp;10 Questions • Earn XP</p>
                  <div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#ffad16] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Start →</div>
                </div>
              </button>

              <button type="button" onClick={() => { if (isPremium) window.location.href = "/visual-questions"; else setShowVisualPremium(true); }} className="order-2 group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#bacaef] bg-[#eef3ff] shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
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

              <button type="button" onClick={() => { if (mathPracticeLimit !== null && mathPracticeUsed >= mathPracticeLimit) setShowPracticeLimit(true); else window.location.href = "/training"; }} className="order-3 group relative h-auto min-h-[500px] overflow-hidden rounded-[32px] border-2 border-[#9ed8ff] bg-[#eaf9ff] shadow-lg transition hover:-translate-y-1 hover:shadow-xl md:col-span-2">
                <div className="absolute inset-x-0 top-0 h-[250px] overflow-hidden rounded-t-[30px] bg-[#219eea]"><img src="/dashboard-assets/dashboard-training.svg" alt="Math Training" className="block h-full w-full object-cover" /></div>
                <div className="absolute left-8 right-8 top-[232px] bottom-0 rounded-t-[70px] bg-[#e8f7ff] px-2 pt-7 sm:pt-8">
                  <h2 className="text-[38px] font-black leading-none">Training</h2>
                  <p className="mt-4 text-[18px] font-bold text-[#55708b]">Practice your skills</p>
                  <div className="absolute bottom-5 left-2 right-2 rounded-full bg-[#197fe9] px-6 py-3.5 text-center text-[21px] font-black text-white shadow-md">Practice →</div>
                </div>
              </button>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[32px] border border-[#dfeeff] bg-white p-5 shadow-[0_10px_30px_rgba(8,61,120,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6d87a5]">Plan</p>
                    <h2 className="mt-2 text-2xl font-black text-[#083d78]">
                      {isPremium ? "Premium" : isTrial ? "Trial" : "Student"}
                    </h2>
                  </div>
                  <div className={`rounded-full px-3 py-2 text-xs font-black ${isPremium ? "bg-[#fff1c7] text-[#9b6a00]" : isTrial ? "bg-[#eaf4ff] text-[#0d5aa6]" : "bg-[#edf5ff] text-[#386ad8]"}`}>
                    {isPremium ? "Active" : isTrial ? `Trial • ${trialDaysLeft}d left` : "Included"}
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                  {isPremium
                    ? "You have full Premium access to the Visual Math Lab and premium learning tools."
                    : isTrial
                      ? "Your trial is active. Upgrade before it ends to keep premium access."
                      : "You’re on the standard student plan with core learning access."}
                </p>
              </div>

              <Link href="/progress" className="block rounded-[32px] border border-[#dfeeff] bg-[#f5faff] p-5 shadow-[0_10px_30px_rgba(8,61,120,0.06)] transition hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6d87a5]">Progress</p>
                    <h3 className="mt-2 text-2xl font-black text-[#083d78]">{profile.xp ?? 0} XP</h3>
                  </div>
                  <BarChart3 className="h-10 w-10 text-[#197fe9]" />
                </div>
              </Link>

              <Link href="/mission" className="block rounded-[32px] border border-[#dfeeff] bg-white p-5 shadow-[0_10px_30px_rgba(8,61,120,0.06)] transition hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6d87a5]">Achievements</p>
                    <h3 className="mt-2 text-2xl font-black text-[#083d78]">Mission</h3>
                  </div>
                  <Gamepad2 className="h-10 w-10 text-[#ff8d24]" />
                </div>
              </Link>
            </aside>
          </div>
        </section>
      )}

      {showVisualPremium && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="visual-premium-title"><div className="w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#6d87a5]">Premium feature</p><h2 id="visual-premium-title" className="mt-3 text-3xl font-black text-[#083d78]">Visual Math Lab</h2><p className="mt-3 text-base font-semibold leading-7 text-slate-600">Premium access is required to use the visual practice lab.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => setShowVisualPremium(false)} className="flex-1 rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700">Close</button><Link href="/parent/upgrade" className="flex-1 rounded-2xl bg-[#735fe6] px-5 py-3 font-black text-white">Upgrade</Link></div></div></div>}

      {showDailyChallengeLimit && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#6d87a5]">Daily limit reached</p><h2 className="mt-3 text-3xl font-black text-[#083d78]">Come back tomorrow</h2><p className="mt-3 text-base font-semibold leading-7 text-slate-600">You used today’s daily challenge attempts. Try again when the next challenge unlocks.</p><button type="button" onClick={() => setShowDailyChallengeLimit(false)} className="mt-6 w-full rounded-2xl bg-[#073b73] px-5 py-3 font-black text-white">Close</button></div></div>}

      {showPracticeLimit && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#062b52]/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="practice-limit-title"><div className="w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-2xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#6d87a5]">Training limit reached</p><h2 id="practice-limit-title" className="mt-3 text-3xl font-black text-[#083d78]">Daily limit reached</h2><p className="mt-3 text-base font-semibold leading-7 text-slate-600">You’ve already used today’s training attempts. Come back tomorrow for more practice.</p><button type="button" onClick={() => setShowPracticeLimit(false)} className="mt-6 w-full rounded-2xl bg-[#073b73] px-5 py-3 font-black text-white">Close</button></div></div>}

      <LearnerLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {!loggedOut && <LearnerAccessNotice />}
    </main>
  );
}
