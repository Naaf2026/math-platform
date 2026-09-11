"use client";

import Link from "next/link";
import { BarChart3, FileCheck2, Home, Sparkles, Users, LibraryBig } from "lucide-react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logout-button";

const items = [
  { href: "/admin", label: "Admin Home", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/classes", label: "Classes", icon: BarChart3 },
  { href: "/admin/books", label: "Book Library", icon: LibraryBig },
  { href: "/admin/ai-question-builder", label: "AI Question Builder", icon: Sparkles },
  { href: "/admin/ai-question-validation", label: "AI Question Validation", icon: FileCheck2 },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNavigation() {
  const pathname = usePathname();
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-slate-50/95 px-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:hidden" aria-label="Admin navigation">
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[10px] font-black transition sm:text-[11px] ${active ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-white hover:text-violet-600"}`}><Icon size={19} strokeWidth={active ? 2.7 : 2.2}/><span className="mt-1 text-center leading-tight">{label}</span></Link>;
            })}
          </div>
          <div className="mt-1 flex justify-center"><LogoutButton compact /></div>
        </div>
      </nav>
      <nav className="fixed inset-y-0 left-0 z-50 hidden w-20 flex-col items-center border-r border-slate-200/80 bg-white/90 py-5 shadow-[8px_0_30px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:flex" aria-label="Admin navigation">
        <Link href="/admin" title="Admin dashboard" className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 text-lg font-black text-white shadow-lg shadow-violet-200">F</Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700" title="Administrator"><span className="text-sm font-black">A</span></div>
        <div className="mt-5 flex flex-1 flex-col gap-3">{items.map(({ href, label, icon: Icon }) => { const active = isActive(pathname, href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} title={label} className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${active ? "bg-violet-100 text-violet-700 shadow-sm" : "text-slate-400 hover:bg-slate-100 hover:text-violet-600"}`}><Icon size={21} strokeWidth={active ? 2.7 : 2.1}/><span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">{label}</span></Link>; })}</div>
        <LogoutButton />
      </nav>
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </>
  );
}
