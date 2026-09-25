"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Crown, History, Home, Menu, Target, UserRound, Users, X } from "lucide-react";
import LogoutButton from "@/components/logout-button";

const links = [
  { href: "/parent", label: "Home", icon: Home },
  { href: "/parent/learners", label: "Learners", icon: Users },
  { href: "/parent/history", label: "Learning History", icon: History },
  { href: "/parent/goals", label: "Goals", icon: Target },
  { href: "/parent/notifications", label: "Alerts", icon: Bell },
  { href: "/parent/profile", label: "Profile", icon: UserRound },
  { href: "/parent/upgrade", label: "Upgrade", icon: Crown },
];

export default function ParentNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return <div className="relative z-[90] lg:hidden">
    <header className="flex h-[96px] items-center justify-between gap-3 border-b border-[#dcecf8] bg-white px-4 text-[#073b73] shadow-sm sm:h-[112px]">
      <Link href="/parent" aria-label="Fahi Hisaabu parent dashboard" className="min-w-0">
        <img src="/fahi-hisaabu-logo-optimized.webp" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/fahi-hisaabu-logo.png"; }} alt="Fahi Hisaabu" className="h-[72px] w-auto max-w-[min(76vw,310px)] object-contain object-left sm:h-[88px] sm:max-w-[430px]" />
      </Link>
      <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="parent-mobile-menu" onClick={() => setOpen(value => !value)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-[#eaf5ff]">
        {open ? <X size={30} /> : <Menu size={30} />}
      </button>
    </header>
    {open && <>
      <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-[91] bg-[#072d54]/40" />
      <nav id="parent-mobile-menu" aria-label="Parent navigation" className="absolute inset-x-0 top-full z-[92] max-h-[calc(100dvh-96px)] overflow-y-auto rounded-b-3xl border-t border-[#dcecf8] bg-white p-3 shadow-xl">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-16 items-center gap-3 rounded-2xl px-4 text-base font-bold text-[#073b73] ${pathname === href ? "bg-[#dff1ff] text-[#0875dc]" : "bg-[#f5faff] hover:bg-[#eaf5ff]"}`}><Icon size={23} />{label}</Link>)}</div>
        <div className="mt-3 border-t border-slate-100 pt-3"><LogoutButton /></div>
      </nav>
    </>}
  </div>;
}
