"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, BookOpen, CalendarDays, ChartNoAxesCombined, CheckCircle2, ChevronDown, ClipboardList, Flame, GraduationCap, House, Plus, Settings2, ShieldCheck, Sparkles, Target, UserRound, Users, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMyLearners, type LearnerAccount } from "@/lib/parent-learners";

type Tab = "home" | "progress" | "tasks" | "profile";
type Summary = { questions_answered: number; accuracy: number; practice_days: number; xp_earned: number };
type Insight = { insight_type: string; title: string; message: string; priority: number };
type ActivityDay = { activity_date: string; questions_answered: number };
type Assignment = { id: string; title: string; question_count: number; status: string; due_date: string; answered: number };

const nav = [
  { id: "home", label: "Home", Icon: House },
  { id: "progress", label: "Progress", Icon: ChartNoAxesCombined },
  { id: "tasks", label: "Tasks", Icon: ClipboardList },
  { id: "profile", label: "Profile", Icon: UserRound },
] as const;

function selectedLink(path: string, learnerId: string) {
  return learnerId ? path + (path.includes("?") ? "&" : "?") + "learner=" + encodeURIComponent(learnerId) : path;
}
function isPremium(learner: LearnerAccount) {
  return learner.subscription_status === "active" || learner.subscription_status === "trialing";
}
function Tile({ label, value, Icon, tint }: { label: string; value: string; Icon: typeof Zap; tint: string }) {
  return <div className="rounded-2xl border border-[#e2edf2] bg-white p-4 shadow-sm">
    <span className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tint}`}><Icon size={21} /></span>
    <p className="text-2xl font-black text-[#153d58]">{value}</p>
    <p className="mt-1 text-xs font-bold text-[#718793]">{label}</p>
  </div>;
}

export default function ParentAppPage() {
  const router = useRouter();
  const query = useSearchParams();
  const requested = query.get("learner");
  const [tab, setTab] = useState<Tab>("home");
  const [learners, setLearners] = useState<LearnerAccount[]>([]);
  const [parentName, setParentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [days, setDays] = useState<ActivityDay[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showLearners, setShowLearners] = useState(false);

  const learner = learners.find((row) => row.learner_id === requested) ?? learners[0] ?? null;
  const learnerId = learner?.learner_id ?? "";

  useEffect(() => {
    let alive = true;
    async function initialise() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("The learning service is unavailable.");
        const [{ data: { user } }, linked] = await Promise.all([supabase.auth.getUser(), getMyLearners()]);
        if (!alive) return;
        if (!user) { router.replace("/login?next=%2Fparent%2Fapp"); return; }
        setLearners(linked);
        const { data: profile } = await supabase.from("profiles").select("display_name,full_name").eq("id", user.id).maybeSingle();
        if (alive) setParentName((profile?.display_name || profile?.full_name || "").trim());
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load your account.");
      } finally { if (alive) setLoading(false); }
    }
    void initialise();
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      if (!learnerId) { setSummary(null); setInsights([]); setDays([]); setAssignments([]); return; }
      const supabase = createClient();
      if (!supabase) return;
      setBusy(true); setError("");
      const [a, b, c, d] = await Promise.all([
        supabase.rpc("get_parent_learning_summary", { p_student_id: learnerId }),
        supabase.rpc("get_parent_learning_insights", { p_student_id: learnerId }),
        supabase.rpc("get_parent_weekly_activity", { p_student_id: learnerId }),
        supabase.rpc("get_parent_revision_assignments", { p_student_id: learnerId }),
      ]);
      if (!alive) return;
      if (a.error) setError("Some progress information is temporarily unavailable.");
      setSummary(a.error ? null : (a.data?.[0] ?? null) as Summary | null);
      setInsights(b.error ? [] : (b.data ?? []) as Insight[]);
      setDays(c.error ? [] : (c.data ?? []) as ActivityDay[]);
      setAssignments(d.error ? [] : (d.data ?? []) as Assignment[]);
      setBusy(false);
    }
    void refresh();
    return () => { alive = false; };
  }, [learnerId]);

  const current = (tab === "home" || tab === "progress") && !!learner;
  const strongInsights = insights.filter((item) => item.priority <= 2);
  const activeAssignments = assignments.filter((item) => item.status === "assigned");
  const maximum = Math.max(1, ...days.map((day) => Number(day.questions_answered) || 0));

  return <div className="min-h-dvh bg-[#f1f8fb] pb-[calc(96px+env(safe-area-inset-bottom))] font-['Nunito',Arial,sans-serif] text-[#173d55]">
    <div className="mx-auto max-w-5xl">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#e1edf2] bg-white/95 px-4 py-3 backdrop-blur-lg sm:px-8">
        <Link href="/parent/app" onClick={() => setTab("home")} aria-label="Fahi Hisaabu Parent home">
          <img src="/fahi-hisaabu-logo-optimized.webp" alt="Fahi Hisaabu" className="h-12 w-28 object-contain object-left sm:h-14 sm:w-36" />
        </Link>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#178e97]">Parent app</p><p className="truncate text-sm font-black">My learning family</p></div>
        <Link href="/parent/notifications" aria-label="Notifications" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf5f8] text-[#18778f]"><Bell size={21} /></Link>
      </header>

      <main className="space-y-6 px-4 pt-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-[#6c8795]">Fahi Hisaabu Parent</p><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{tab === "home" ? `Hello${parentName ? `, ${parentName}` : ""}!` : nav.find((item) => item.id === tab)?.label}</h1></div>
          {tab === "home" && <span className="rounded-full bg-[#e2f6f1] px-3 py-2 text-xs font-black text-[#17856e]">Learning together</span>}
        </div>
        {error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}
        {loading ? <div className="space-y-4" aria-label="Loading parent app">{[1,2,3].map((item) => <div key={item} className="h-32 animate-pulse rounded-3xl bg-[#e2edf2]" />)}</div> : learners.length === 0 ? <section className="rounded-3xl bg-white p-6 shadow-sm">
          <GraduationCap size={36} className="text-[#178e97]" /><h2 className="mt-3 text-xl font-black">Let's add your first learner</h2><p className="mt-2 text-sm text-[#728994]">Link a learner to start tracking their maths progress.</p><Link href="/parent/learners" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1689a3] px-5 py-3 font-black text-white"><Plus size={18} /> Add learner</Link>
        </section> : <>
          {current && <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0a5580] via-[#127f9c] to-[#28ada5] p-5 text-white shadow-lg sm:p-7">
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-wider text-cyan-100">Your learner</p>{isPremium(learner!) && <span className="rounded-full bg-[#ffca68] px-3 py-1 text-xs font-black text-[#654217]"><Sparkles size={13} className="mr-1 inline" />Premium</span>}</div>
            <button type="button" aria-expanded={showLearners} onClick={() => setShowLearners((value) => !value)} className="mt-3 flex w-full items-center gap-3 text-left">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl">{learner!.avatar_emoji || "🎓"}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xl font-black">{learner!.display_name}</span><span className="text-sm font-semibold text-cyan-100">{learner!.grade || "Grade not set"} · {learner!.current_streak} day streak</span></span><ChevronDown className={showLearners ? "rotate-180" : ""} size={22} />
            </button>
            {showLearners && <div className="mt-4 space-y-2 rounded-2xl bg-white/15 p-2">{learners.map((item) => <button type="button" key={item.learner_id} onClick={() => { setShowLearners(false); router.push(selectedLink("/parent/app", item.learner_id)); }} className="flex w-full items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-left text-sm font-bold hover:bg-white/20"><span>{item.avatar_emoji || "🎓"}</span>{item.display_name}<span className="ml-auto text-xs">{item.grade}</span></button>)}<Link href="/parent/learners" className="block px-3 py-2 text-sm font-extrabold underline">Manage learners</Link></div>}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/25 pt-4 text-center">
              <div><p className="text-xl font-black">{summary ? `${Math.round(Number(summary.accuracy) || 0)}%` : "—"}</p><p className="text-[11px] font-bold text-cyan-100">Accuracy</p></div>
              <div><p className="text-xl font-black">{summary ? Number(summary.questions_answered) || 0 : "—"}</p><p className="text-[11px] font-bold text-cyan-100">Questions</p></div>
              <div><p className="text-xl font-black">{learner!.current_streak}</p><p className="text-[11px] font-bold text-cyan-100">Day streak</p></div>
            </div>
          </section>}

          {tab === "home" && <>
            <section><h2 className="mb-3 text-lg font-black">Quick actions</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { href: selectedLink("/parent/revision", learnerId), label: "Assign revision", hint: "Create homework", Icon: ClipboardList, tone: "bg-[#e8f4ff] text-[#2084ca]" },
                { href: selectedLink("/parent/history", learnerId), label: "Progress", hint: "Learning insights", Icon: ChartNoAxesCombined, tone: "bg-[#e8f8ee] text-[#259773]" },
                { href: selectedLink("/parent/goals", learnerId), label: "Learning goals", hint: "Build good habits", Icon: Target, tone: "bg-[#fff0e3] text-[#dc8735]" },
                { href: selectedLink("/parent/history", learnerId), label: "Weekly report", hint: "Last 7 days", Icon: CalendarDays, tone: "bg-[#f0ebfb] text-[#8766bd]" },
              ].map(({ href, label, hint, Icon, tone }) => <Link key={label} href={href} className="rounded-2xl border border-[#e2edf2] bg-white p-4 shadow-sm transition active:scale-[.98]"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={22}/></span><strong className="mt-3 block text-sm">{label}</strong><span className="mt-1 block text-xs text-[#81939e]">{hint}</span></Link>)}
            </div></section>
            <section className="rounded-3xl border border-[#f6dfbd] bg-[#fff4e7] p-5">
              <span className="rounded-full bg-[#ffe4c3] px-3 py-1 text-xs font-black text-[#9d632c]">Recommended</span>
              <h2 className="mt-3 text-lg font-black">{strongInsights[0]?.title || "Make maths a daily habit"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#806f5e]">{strongInsights[0]?.message || "A little practice every day makes a difference. Create a short revision assignment."}</p>
              <Link href={selectedLink("/parent/revision", learnerId)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f39b3e] p-3 font-black text-white">Create revision <Plus size={18} /></Link>
            </section>
          </>}

          {tab === "progress" && <>
            <p className="text-sm text-[#6f8594]">Your learner's activity over the last seven days. <span className="font-bold">{busy ? "Refreshing…" : ""}</span></p>
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Questions answered" value={summary ? String(summary.questions_answered) : "—"} Icon={BookOpen} tint="bg-blue-50 text-blue-600" />
              <Tile label="Accuracy" value={summary ? `${Math.round(Number(summary.accuracy) || 0)}%` : "—"} Icon={CheckCircle2} tint="bg-emerald-50 text-emerald-600" />
              <Tile label="Practice days" value={summary ? `${summary.practice_days}/7` : "—"} Icon={Flame} tint="bg-orange-50 text-orange-600" />
              <Tile label="XP earned" value={summary ? String(summary.xp_earned) : "—"} Icon={Zap} tint="bg-purple-50 text-purple-600" />
            </div>
            <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-black">Daily questions</h2><div className="mt-5 flex h-36 items-end justify-between gap-2">{days.length ? days.map((day) => <div key={day.activity_date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-[#6b8190]">{Number(day.questions_answered) || 0}</span><div className="w-full max-w-10 rounded-t-lg bg-[#29a9b5]" style={{ height: `${Math.max(6, (Number(day.questions_answered) || 0) / maximum * 100)}%` }} /><span className="text-[10px] font-bold text-[#6b8190]">{new Date(day.activity_date + "T12:00:00").toLocaleDateString("en", { weekday: "short" })}</span></div>) : <p className="m-auto text-sm text-[#748a98]">No activity recorded yet.</p>}</div></section>
            <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-black">Learning insights</h2>{insights.length ? insights.slice(0, 4).map((item, index) => <div key={index} className="mt-3 rounded-2xl bg-[#f3f8fb] p-4"><p className="font-extrabold">{item.title}</p><p className="mt-1 text-sm text-[#67818e]">{item.message}</p></div>) : <p className="mt-2 text-sm text-[#748a98]">Insights will appear after your learner practises.</p>}<Link href={selectedLink("/parent/history", learnerId)} className="mt-4 inline-block font-extrabold text-[#167e9d]">View full history →</Link></section>
          </>}

          {tab === "tasks" && <section className="space-y-4">
            <Link href={selectedLink("/parent/revision", learnerId)} className="flex items-center justify-between gap-3 rounded-3xl bg-[#158da1] p-5 text-white shadow-md"><div><span className="text-sm text-cyan-100">Parent-assigned revision</span><h2 className="mt-1 text-xl font-black">Create an assignment</h2><p className="mt-2 text-sm text-cyan-50">Choose weak skills, difficulty and deadline.</p></div><Plus size={32}/></Link>
            <div className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-black">Active assignments</h2><span className="rounded-full bg-[#e8f7f3] px-3 py-1 text-xs font-black text-[#128972]">{activeAssignments.length}</span></div>
              {activeAssignments.length ? activeAssignments.map((item) => <div key={item.id} className="mt-3 border-t border-[#e5edf1] pt-3"><p className="font-extrabold">{item.title}</p><p className="mt-1 text-xs text-[#78909a]">{item.answered || 0}/{item.question_count} answered · Due {item.due_date || "not set"}</p></div>) : <p className="mt-4 text-sm text-[#78909a]">No active assignments right now.</p>}
              <Link href={selectedLink("/parent/revision", learnerId)} className="mt-5 inline-block font-extrabold text-[#1587a1]">Manage all assignments →</Link>
            </div>
          </section>}

          {tab === "profile" && <section className="space-y-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f6f9] text-[#1587a1]"><UserRound size={28}/></span><h2 className="mt-3 text-xl font-black">{parentName || "Parent account"}</h2><p className="text-sm text-[#78909a]">{learners.length} linked learner{learners.length === 1 ? "" : "s"}</p></div>
            {[
              { href: "/parent/profile", label: "My profile & email", Icon: Settings2 },
              { href: "/parent/learners", label: "Manage learners", Icon: Users },
              { href: "/parent/upgrade", label: "Premium & subscriptions", Icon: ShieldCheck },
              { href: "/parent/notifications", label: "Notifications", Icon: Bell },
            ].map(({href,label,Icon}) => <Link href={href} key={href} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf6f8] text-[#21839a]"><Icon size={20}/></span>{label}<span className="ml-auto text-[#93a7af]">→</span></Link>)}
          </section>}
        </>}
      </main>
    </div>
    <nav aria-label="Parent app tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5eef3] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_#0e4b6912] backdrop-blur-lg">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">{nav.map(({id,label,Icon}) => <button type="button" key={id} aria-current={tab === id ? "page" : undefined} onClick={() => {setTab(id);window.scrollTo({ top: 0, behavior: "smooth" });}} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition ${tab === id ? "bg-[#eaf8f9] text-[#11879b]" : "text-[#8a9da8] hover:text-[#11879b]"}`}><Icon size={22} strokeWidth={tab === id ? 2.6 : 2} />{label}</button>)}</div>
    </nav>
  </div>;
}
