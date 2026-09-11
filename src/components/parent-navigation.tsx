"use client";

import Link from "next/link";
import { BarChart3, GraduationCap, Home, ShieldCheck, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/parent", label: "Overview", icon: Home },
  { href: "/parent", label: "Progress", icon: BarChart3 },
  { href: "/parent", label: "Child", icon: Users },
];

function isActive(pathname: string, href: string, label: string) {
  if (href === "/parent") return pathname === "/parent" && label === "Overview";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ParentNavigation() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-slate-50/95 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden" aria-label="Parent and guardian navigation">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, label);
            return (
              <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-black transition ${active ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-white hover:text-violet-600"}`}>
                <Icon size={20} strokeWidth={active ? 2.7 : 2.2} />
                <span className="mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="fixed inset-y-0 left-0 z-50 hidden w-20 flex-col items-center border-r border-slate-200/80 bg-white/90 py-5 shadow-[8px_0_30px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:flex" aria-label="Parent and guardian navigation">
        <Link href="/parent" title="Parent dashboard" className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-lg font-black text-white shadow-lg shadow-violet-200">F</Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700" title="Parent and guardian"><GraduationCap size={21} /></div>
        <div className="mt-5 flex flex-1 flex-col gap-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, label);
            return (
              <Link key={label} href={href} aria-current={active ? "page" : undefined} title={label} className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${active ? "bg-violet-100 text-violet-700 shadow-sm" : "text-slate-400 hover:bg-slate-100 hover:text-violet-600"}`}>
                <Icon size={21} strokeWidth={active ? 2.7 : 2.1} />
                <span className="pointer-events-none absolute left-14 rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300" aria-hidden="true"><ShieldCheck size={17} /></div>
      </nav>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
