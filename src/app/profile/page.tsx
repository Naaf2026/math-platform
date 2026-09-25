"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Flame,
  Gamepad2,
  Home,
  LogOut,
  Map,
  Medal,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Gift,
  GraduationCap,
  Info,
  LifeBuoy,
  ShieldCheck,
  Zap,
  Camera,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/learner-notification-bell";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  avatar_emoji: string | null;
  xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
  grade: string | null;
};

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  earned_at: string | null;
};

type Attempt = { is_correct: boolean; xp_awarded: number | null };

type JourneyLevel = {
  level: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
};

const journey: JourneyLevel[] = [
  { level: 1, title: "Math Explorer", subtitle: "Start your adventure", icon: "🌱", color: "from-violet-500 to-indigo-500" },
  { level: 2, title: "Number Ninja", subtitle: "Build strong basics", icon: "🥷", color: "from-cyan-400 to-blue-500" },
  { level: 3, title: "Math Hero", subtitle: "Master new skills", icon: "🦸", color: "from-amber-400 to-orange-500" },
  { level: 4, title: "Problem Solver", subtitle: "Take on challenges", icon: "🧠", color: "from-pink-400 to-rose-500" },
  { level: 5, title: "Math Champion", subtitle: "Reach the summit", icon: "🏆", color: "from-emerald-400 to-teal-500" },
];

const nav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/challenge", label: "Daily Challenge", icon: Gamepad2 },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/rewards", label: "Rewards", icon: Trophy },
  { href: "/profile", label: "My Profile", icon: UserRound },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [status, setStatus] = useState("Loading your learning world…");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      return;
    }

    let mounted = true;

    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }

      const [{ data: profileRow }, { data: earned }, { data: attemptRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,avatar_url,avatar_emoji,xp,current_streak,best_streak,grade")
          .eq("id", auth.user.id)
          .maybeSingle(),
        supabase
          .from("student_achievements")
          .select("achievement_id,earned_at")
          .eq("user_id", auth.user.id)
          .order("earned_at", { ascending: false }),
        supabase
          .from("question_attempts")
          .select("is_correct,xp_awarded")
          .eq("user_id", auth.user.id),
      ]);

      const earnedRows = (earned ?? []) as { achievement_id: string; earned_at: string | null }[];
      let achievementRows: Achievement[] = [];

      if (earnedRows.length) {
        const ids = earnedRows.map((row) => row.achievement_id);
        const { data } = await supabase
          .from("learning_achievements")
          .select("id,title,description,icon")
          .in("id", ids);
        achievementRows = (data ?? []).map((item: { id: string; title: string; description: string | null; icon: string | null }) => ({
          ...item,
          earned_at: earnedRows.find((row) => row.achievement_id === item.id)?.earned_at ?? null,
        }));
      }

      if (mounted) {
        setProfile(
          (profileRow as Profile | null) ?? {
            full_name: auth.user.user_metadata?.full_name ?? "Student",
            avatar_url: null,
            avatar_emoji: "🧑‍🎓",
            xp: 0,
            current_streak: 0,
            best_streak: 0,
            grade: null,
          },
        );
        setAchievements(achievementRows);
        setAttempts((attemptRows ?? []) as Attempt[]);
        setStatus("");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function chooseAvatar(emoji: string) {
    const supabase = createClient();
    if (!supabase) return;
    setAvatarSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("profiles").update({ avatar_emoji: emoji, avatar_url: null }).eq("id", auth.user.id);
    if (!error) setProfile((current) => current ? { ...current, avatar_emoji: emoji, avatar_url: null } : current);
    setAvatarSaving(false);
  }

  async function uploadAvatar(file: File) {
    const supabase = createClient();
    if (!supabase) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      alert("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB.");
      return;
    }
    setAvatarUploading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setAvatarUploading(false); return; }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = auth.user.id + "/profile-" + Date.now() + "." + ext;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      alert(uploadError.message);
      setAvatarUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", auth.user.id);
    if (updateError) {
      await supabase.storage.from("avatars").remove([path]);
      alert(updateError.message);
    } else {
      setProfile((current) => current ? { ...current, avatar_url: data.publicUrl } : current);
    }
    setAvatarUploading(false);
  }

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }

  const xp = profile?.xp ?? 0;
  const level = Math.floor(Math.max(0, xp) / 100) + 1;
  const levelProgress = xp % 100;
  const xpToNext = levelProgress === 0 ? 100 : 100 - levelProgress;
  const firstName = (profile?.full_name || "Student").trim().split(/\s+/)[0] || "Student";
  const initial = firstName.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url ?? null;
  const avatarEmoji = profile?.avatar_emoji || "🧑‍🎓";
  const avatarChoices = ["🧑‍🎓","👩‍🎓","🧒","👦","👧","🧑‍🚀","🧙","🦸","🥷","🧑‍💻","🐼","🦊"];
  const currentStreak = profile?.current_streak ?? 0;
  const bestStreak = profile?.best_streak ?? 0;
  const answered = attempts.length;
  const correct = attempts.filter((attempt) => attempt.is_correct).length;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const totalXpFromAnswers = attempts.reduce((sum, attempt) => sum + (attempt.xp_awarded ?? 0), 0);
  const activeJourneyLevel = Math.min(level, 5);

  const recentAchievements = useMemo(() => achievements.slice(0, 4), [achievements]);

  if (status) {
    const isLoading = status === "Loading your learning world…";
    return (
      <main className="min-h-screen bg-[#eef4ff] text-[#12204a]">
        {isLoading ? (
          <>
            <header className="hidden h-[76px] bg-[#073b73] shadow-sm lg:block lg:h-[90px]">
              <div className="mx-auto flex h-full max-w-[1680px] items-center px-4 sm:px-6 lg:px-12">
                <img src="/fahi-hisaabu-logo-optimized.webp" alt="Fahi Hisaabu" className="h-[44px] w-auto max-w-[220px] rounded-xl bg-white p-1 lg:h-[57px]"/>
              </div>
            </header>
            <div className="mx-auto max-w-[1340px] px-4 py-8 sm:px-6 lg:px-12">
              <div className="h-10 w-56 animate-pulse rounded-2xl bg-white/80"/>
              <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
                <div className="h-72 animate-pulse rounded-[2rem] bg-white shadow-sm"/>
                <div className="space-y-5">
                  <div className="h-40 animate-pulse rounded-[2rem] bg-white shadow-sm"/>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="h-36 animate-pulse rounded-[2rem] bg-white shadow-sm"/>
                    <div className="h-36 animate-pulse rounded-[2rem] bg-white shadow-sm"/>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-screen items-center justify-center p-6">
            <div className="rounded-[2rem] bg-white p-9 text-center shadow-2xl ring-1 ring-violet-100">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-lg"><Sparkles /></div>
              <p className="mt-5 font-black text-[#10204a]">{status}</p>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef4ff] text-[#12204a]">
      <header className="sticky top-0 z-40 hidden h-[76px] lg:block border-b border-white/10 bg-[#073b73] text-white shadow-sm lg:h-[90px]">
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-12">
          <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center rounded-2xl bg-white px-3 py-1.5 shadow-md ring-1 ring-white/40 transition hover:shadow-lg"><img src="/fahi-hisaabu-logo-optimized.webp" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[44px] w-auto max-w-[200px] object-contain lg:h-[57px] lg:max-w-[220px]" /></Link>
          <nav className="hidden items-center gap-8 lg:flex">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Home size={25}/>Home</Link>
            <Link href="/brain-games" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gamepad2 size={25}/>Games</Link>
            <Link href="/leaderboard" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Trophy size={25}/>Leaderboard</Link>
            <Link href="/rewards" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><Gift size={25}/>Rewards</Link>
            <Link href="/progress" className="flex items-center gap-3 px-4 py-7 text-lg font-bold"><BarChart3 size={25}/>Progress</Link>
            <Link href="/profile" className="relative flex items-center gap-3 px-4 py-7 text-lg font-black"><GraduationCap size={25}/>Profile<span className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-yellow-400"/></Link>
          </nav>
          <NotificationBell/>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1680px]">
        
        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-[1340px]">
            <div className="mb-7"><p className="text-sm font-black uppercase tracking-[.18em] text-[#735fe6]">Learner Profile</p><h1 className="mt-1 text-[38px] font-black tracking-tight text-[#083d78] sm:text-[48px] lg:text-[54px]">My Profile 👤</h1><p className="mt-2 text-[18px] font-semibold text-[#6685a4] sm:text-[21px]">Your learning identity, achievements and journey.</p></div>

        <section className="mb-6 rounded-[2rem] bg-white p-6 shadow-xl shadow-indigo-100/40 ring-1 ring-slate-100 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-500 via-cyan-400 to-blue-500 p-1 shadow-xl">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[29px] bg-[#eef7ff] text-6xl">
                  {avatarUrl ? <img src={avatarUrl} alt="Your profile photo" className="h-full w-full object-cover" /> : avatarEmoji}
                </div>
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-4 border-white bg-violet-600 text-white shadow-lg hover:bg-violet-700" title="Change avatar or upload profile photo">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={avatarUploading} onChange={(e)=>{ const file=e.target.files?.[0]; if(file) void uploadAvatar(file); e.currentTarget.value=""; }} />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Your Avatar</p>
              <h2 className="mt-1 text-2xl font-black text-[#12204a]">Make your profile yours ✨</h2>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">Choose a fun avatar or upload your own profile photo. Your photo will also appear when classmates see you in Buddy Challenge.</p>
              <div id="avatar-options" className="mt-4 flex flex-wrap items-center gap-2">
                {avatarChoices.map((emoji)=><button key={emoji} type="button" onClick={()=>void chooseAvatar(emoji)} disabled={avatarSaving||avatarUploading} className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition hover:-translate-y-0.5 ${!avatarUrl&&avatarEmoji===emoji ? "bg-violet-100 ring-2 ring-violet-500" : "bg-slate-50 hover:bg-violet-50"} disabled:opacity-50`}>{emoji}</button>)}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#12204a] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#1b2f64]">
                  <Pencil className="h-3.5 w-3.5" /> {avatarUploading ? "Uploading…" : "Upload photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={avatarUploading} onChange={(e)=>{ const file=e.target.files?.[0]; if(file) void uploadAvatar(file); e.currentTarget.value=""; }} />
                </label>
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400">JPG, PNG or WebP · maximum 2 MB</p>
              <a href="#avatar-options" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-100">
                <Pencil className="h-3.5 w-3.5" /> Change Avatar
              </a>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#35b7d9] via-[#5d7fe8] to-[#7b55d9] px-5 py-7 text-white shadow-2xl shadow-indigo-200 sm:px-8 sm:py-9">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute right-6 top-6 hidden text-7xl drop-shadow-lg sm:block">🚀</div>
          <div className="relative grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] ring-1 ring-white/20"><Sparkles className="h-3.5 w-3.5" /> My Learning World</div>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">Hi {firstName}!<br /><span className="text-yellow-300">Your adventure is growing.</span> 🌴</h1>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/80 sm:text-base">Welcome back to your maths world. Keep learning, collect rewards and climb your learning journey one win at a time.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/challenge" className="inline-flex items-center gap-2 rounded-2xl bg-yellow-300 px-5 py-3 text-sm font-black text-[#172047] shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-200">Daily Challenge <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/challenge" className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white ring-1 ring-white/25 hover:bg-white/20">Daily Challenge <Gamepad2 className="h-4 w-4" /></Link>
              </div>
            </div>
            <div className="relative rounded-[1.8rem] bg-white/15 p-5 shadow-xl ring-1 ring-white/20 backdrop-blur-sm">
              <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-white/70">CURRENT LEVEL</p><p className="mt-1 text-5xl font-black">{level}</p></div><div className="text-right"><p className="text-xs font-bold text-white/70">TOTAL XP</p><p className="mt-1 text-3xl font-black">{xp.toLocaleString()}</p></div></div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-yellow-300 transition-all" style={{ width: `${Math.max(3, levelProgress)}%` }} /></div>
              <p className="mt-2 text-xs font-bold text-white/70">{xpToNext} XP until Level {level + 1}</p>
              <div className="mt-5 grid grid-cols-3 gap-2"><MiniStat icon={<Flame />} value={currentStreak} label="Streak" /><MiniStat icon={<Trophy />} value={achievements.length} label="Badges" /><MiniStat icon={<Star />} value={accuracy} label="Accuracy" suffix="%" /></div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard href="/challenge" icon={<Target />} title="Daily Challenge" text="Complete today’s maths challenge." className="from-violet-600 to-indigo-500" />
          <ActionCard href="/challenge" icon={<Gamepad2 />} title="Daily Challenge" text="Take today's maths sprint." className="from-pink-500 to-rose-500" />
          <ActionCard href="/progress" icon={<BarChart3 />} title="My Progress" text="See how far you have come." className="from-cyan-400 to-blue-500" />
          <ActionCard href="/rewards" icon={<Trophy />} title="My Rewards" text="Collect badges and milestones." className="from-amber-400 to-orange-500" dark />
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-indigo-100/50 ring-1 ring-slate-100 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Learning Journey</p><h2 className="mt-1 text-2xl font-black text-[#12204a]">Climb your maths mountain 🏔️</h2><p className="mt-2 text-sm font-medium text-slate-500">Reach new levels by learning, practising and collecting XP.</p></div>
              <div className="hidden rounded-2xl bg-yellow-50 p-3 text-yellow-500 sm:block"><Rocket className="h-6 w-6" /></div>
            </div>
            <div className="relative mt-7">
              <div className="absolute left-[8%] right-[8%] top-10 hidden h-1 rounded-full bg-slate-100 sm:block" />
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
                {journey.map((item) => {
                  const unlocked = item.level <= activeJourneyLevel;
                  return <div key={item.level} className="relative text-center"><div className={`relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br ${item.color} text-3xl shadow-lg ${unlocked ? "ring-4 ring-white" : "grayscale opacity-40"}`}>{item.icon}<span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-[#12204a] px-1 text-[10px] font-black text-white">{item.level}</span></div><p className="mt-3 text-xs font-black text-[#12204a]">{item.title}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{item.subtitle}</p>{item.level === activeJourneyLevel && <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-violet-700">You are here</span>}</div>;
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 p-6 text-white shadow-xl shadow-rose-100">
            <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Flame className="h-6 w-6" /></div><span className="text-4xl">🔥</span></div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-white/70">Streak Power</p>
            <p className="mt-1 text-4xl font-black">{currentStreak} days</p>
            <p className="mt-1 text-sm font-bold text-white/75">Best: {bestStreak} days</p>
            <p className="mt-5 text-sm font-bold leading-6 text-white/80">You are building a brilliant learning habit. Keep today's chain alive!</p>
            <Link href="/challenge" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-600 shadow-lg">Keep it going <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-slate-100">
            <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Recent Achievements</p><h2 className="mt-1 text-2xl font-black">Your trophy shelf 🏆</h2></div><Link href="/rewards" className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">View all</Link></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {recentAchievements.length ? recentAchievements.map((achievement) => <div key={achievement.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 text-xl shadow-sm">{achievement.icon || "🏅"}</div><div className="min-w-0"><p className="truncate text-sm font-black text-[#12204a]">{achievement.title}</p><p className="mt-0.5 line-clamp-2 text-[11px] font-bold text-slate-400">{achievement.description || "Achievement unlocked!"}</p></div></div>) : <EmptyAchievement />}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-slate-100">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">My Stats</p><h2 className="mt-1 text-2xl font-black">Look how far you've come 📈</h2></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatCard icon={<Zap />} value={answered.toLocaleString()} label="Questions answered" className="bg-violet-50 text-violet-700" />
              <StatCard icon={<CheckCircle2 />} value={`${accuracy}%`} label="Accuracy" className="bg-cyan-50 text-cyan-700" />
              <StatCard icon={<Medal />} value={achievements.length.toLocaleString()} label="Achievements" className="bg-amber-50 text-amber-700" />
              <StatCard icon={<Star />} value={totalXpFromAnswers.toLocaleString()} label="XP from answers" className="bg-pink-50 text-pink-700" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-slate-100 sm:p-7">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Settings & Support</p><h2 className="mt-1 text-2xl font-black text-[#12204a]">Help & information</h2></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/about" className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-violet-50">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Info className="h-6 w-6"/></span>
              <span className="min-w-0"><span className="block font-black text-[#12204a]">About FAHI VISSNUN</span><span className="mt-1 block text-xs font-bold text-slate-400">Learn about your maths learning platform.</span></span><ArrowRight className="ml-auto h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500"/>
            </Link>
            <Link href="/privacy" className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-cyan-50">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><ShieldCheck className="h-6 w-6"/></span>
              <span className="min-w-0"><span className="block font-black text-[#12204a]">Privacy Policy</span><span className="mt-1 block text-xs font-bold text-slate-400">How learner information and activity data are handled.</span></span><ArrowRight className="ml-auto h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-500"/>
            </Link>
            <Link href="/payment-policy" className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-emerald-50">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CreditCard className="h-6 w-6"/></span>
              <span className="min-w-0"><span className="block font-black text-[#12204a]">Payment Policy</span><span className="mt-1 block text-xs font-bold text-slate-400">Payments, subscription access, refunds and cancellations.</span></span><ArrowRight className="ml-auto h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500"/>
            </Link>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-200 text-slate-600"><LifeBuoy className="h-6 w-6"/></span>
              <span><span className="block font-black text-[#12204a]">Help & Support</span><span className="mt-1 block text-xs font-bold text-slate-400">Support options are coming soon.</span></span>
            </div>
          </div>
        </section>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#101d46] via-[#172b63] to-[#253f86] p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-12 -top-16 text-[9rem] opacity-10">🌴</div>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-3 w-3" /> Keep going</div><h2 className="mt-3 text-2xl font-black sm:text-3xl">Every question makes you stronger. 💪</h2><p className="mt-2 text-sm font-medium leading-6 text-indigo-200">You don't have to be perfect. Just keep learning, keep trying and celebrate every small win.</p></div>
            <Link href="/challenge" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-6 py-3.5 text-sm font-black text-[#172047] shadow-lg transition hover:-translate-y-0.5">Daily Challenge <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
          </div>
        </section>
      </div>
      <footer className="px-4 pb-28 pt-7 text-center text-[10px] font-medium text-slate-400 sm:text-[11px] lg:pb-8">
        <p>© Copyright 2026 FAHI VISSNUN LEARNING INSTITUTE. All rights reserved.</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/about" className="hover:text-[#073b73]">About</Link>
          <Link href="/privacy" className="hover:text-[#073b73]">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#073b73]">Terms of Service</Link>
          <Link href="/payment-policy" className="hover:text-[#073b73]">Payment Policy</Link>
        </div>
      </footer>
    </main>
  );
}

function MiniStat({ icon, value, label, suffix = "" }: { icon: React.ReactNode; value: number; label: string; suffix?: string }) {
  return <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/10"><div className="mx-auto flex h-7 w-7 items-center justify-center text-yellow-300">{icon}</div><p className="mt-1 text-xl font-black">{value}{suffix}</p><p className="text-[10px] font-bold text-white/60">{label}</p></div>;
}

function ActionCard({ href, icon, title, text, className, dark = false }: { href: string; icon: React.ReactNode; title: string; text: string; className: string; dark?: boolean }) {
  return <Link href={href} className={`group relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${className} p-5 ${dark ? "text-[#3b2500]" : "text-white"} shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15" /><div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">{icon}</div><h3 className="relative mt-5 text-lg font-black">{title}</h3><p className={`relative mt-1 text-sm font-bold ${dark ? "text-orange-950/60" : "text-white/75"}`}>{text}</p><span className={`relative mt-4 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider ${dark ? "text-orange-950/70" : "text-white/70 group-hover:text-white"}`}>Open <ArrowRight className="h-3.5 w-3.5" /></span></Link>;
}

function StatCard({ icon, value, label, className }: { icon: React.ReactNode; value: string; label: string; className: string }) {
  return <div className={`rounded-2xl p-4 ${className}`}><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">{icon}</div><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-0.5 text-[11px] font-black uppercase tracking-wide opacity-60">{label}</p></div>;
}

function EmptyAchievement() {
  return <div className="col-span-full rounded-2xl bg-gradient-to-r from-violet-50 to-cyan-50 p-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-yellow-500 shadow-sm"><Trophy className="h-6 w-6" /></div><p className="mt-3 text-sm font-black text-[#12204a]">Your trophy shelf is waiting!</p><p className="mt-1 text-xs font-bold text-slate-400">Complete missions and challenges to unlock your first achievement.</p></div>;
}
