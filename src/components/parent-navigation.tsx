"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Crown, History, Home, Menu, Target, UserRound, Users, X } from "lucide-react";
import LogoutButton from "@/components/logout-button";
import ParentLearnerSwitcher from "@/components/parent-learner-switcher";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/parent", label: "Home", icon: Home },
  { href: "/parent/learners", label: "Learners", icon: Users },
  { href: "/parent/history", label: "Learning History", icon: History },
  { href: "/parent/goals", label: "Goals", icon: Target },
  { href: "/parent/profile", label: "Profile", icon: UserRound },
  { href: "/parent/upgrade", label: "Upgrade", icon: Crown },
];

export default function ParentNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    let cancelled = false;
    async function refreshUnread() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: links, error } = await supabase.from("student_relationships").select("student_id").eq("related_user_id", user.id).in("relationship", ["parent", "guardian"]).eq("status", "active");
      if (error || !links?.length) { if (!cancelled) setUnread(0); return; }
      const studentIds = [...new Set(links.map(link => link.student_id))];
      const counts = await Promise.all(studentIds.map(async student_id => {
        const { data, error: alertsError } = await supabase.rpc("get_parent_learning_alerts", { p_student_id: student_id, p_limit: 50 });
        return alertsError ? 0 : (data ?? []).filter((alert: { read_at: string | null }) => !alert.read_at).length;
      }));
      if (!cancelled) setUnread(counts.reduce((sum, count) => sum + count, 0));
    }
    void refreshUnread();
    window.addEventListener("focus", refreshUnread);
    window.addEventListener("parent-alerts-updated", refreshUnread);
    return () => { cancelled = true; window.removeEventListener("focus", refreshUnread); window.removeEventListener("parent-alerts-updated", refreshUnread); };
  }, [pathname]);

  return <>
    <header className="sticky top-0 z-[90] hidden border-b-[3px] border-transparent bg-white shadow-sm lg:block" style={{ borderImage: "linear-gradient(90deg, #167ddb, #13a8ca, #19aa93, #61be54, #ffb523, #ec5572) 1" }}>
      <div className="mx-auto flex min-h-[88px] max-w-7xl items-center gap-3 px-5 xl:gap-5 xl:px-8">
        <Link href="/parent" aria-label="Fahi Hisaabu parent dashboard" className="shrink-0"><img src="/fahi-hisaabu-logo-optimized.webp" alt="Fahi Hisaabu" className="h-[76px] w-[154px] object-contain" /></Link>
        <nav aria-label="Parent pages" className="flex min-w-0 flex-1 items-center gap-0.5 text-xs font-extrabold text-slate-600 xl:gap-1 xl:text-sm">
          {links.slice(0, 4).map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-2.5 py-3 transition xl:px-3 ${pathname === href ? "bg-[#e7f6f9] text-[#087b92]" : "hover:bg-[#f1f9fc] hover:text-[#073b73]"}`}>{href === "/parent" ? "Dashboard" : label === "Learning History" ? "History" : label}</Link>)}
        </nav>
        <ParentLearnerSwitcher />
        <Link href="/parent/notifications" aria-label={unread ? `Parent alerts, ${unread} unread` : "Parent alerts"} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#dce9f5] text-[#174a79] hover:bg-[#eaf5ff]"><Bell size={21} aria-hidden="true" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}</Link>
        <Link href="/parent/profile" aria-label="Parent profile" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eaf5ff] font-black text-[#0875ce]"><UserRound size={22} /></Link>
      </div>
    </header>
    <div className="relative z-[90] lg:hidden">
    <header className="flex h-[96px] items-center justify-between gap-3 border-b border-[#dcecf8] bg-white px-4 text-[#073b73] shadow-sm sm:h-[112px]">
      <Link href="/parent" aria-label="Fahi Hisaabu parent dashboard" className="min-w-0 flex-1">
        <img src="/fahi-hisaabu-logo-optimized.webp" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[72px] w-auto max-w-full object-contain object-left sm:h-[88px]" />
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link href="/parent/notifications" aria-label={unread ? `Parent alerts, ${unread} unread` : "Parent alerts"} aria-current={pathname === "/parent/notifications" ? "page" : undefined} className={`relative grid h-11 w-11 place-items-center rounded-xl ${pathname === "/parent/notifications" ? "bg-[#dff1ff] text-[#0875dc]" : "hover:bg-[#eaf5ff]"}`}><Bell size={25} aria-hidden="true" />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}</Link>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="parent-mobile-menu" onClick={() => setOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-[#eaf5ff]">
          {open ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>
    </header>
    {open && <>
      <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-[91] bg-[#072d54]/40" />
      <nav id="parent-mobile-menu" aria-label="Parent navigation" className="absolute inset-x-0 top-full z-[92] max-h-[calc(100dvh-96px)] overflow-y-auto rounded-b-3xl border-t border-[#dcecf8] bg-white p-3 shadow-xl">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-16 items-center gap-3 rounded-2xl px-4 text-base font-bold text-[#073b73] ${pathname === href ? "bg-[#dff1ff] text-[#0875dc]" : "bg-[#f5faff] hover:bg-[#eaf5ff]"}`}><Icon size={23} />{label}</Link>)}</div>
        <div className="mt-3 border-t border-slate-100 pt-3"><LogoutButton /></div>
      </nav>
    </>}
    </div>
  </>;
}
