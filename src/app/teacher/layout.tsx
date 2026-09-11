"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, GraduationCap, History, LayoutDashboard, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/teacher", label: "Overview", icon: LayoutDashboard },
  { href: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/teacher/interventions", label: "Interventions", icon: ClipboardList },
  { href: "/teacher/interventions/history", label: "Action History", icon: History },
  { href: "/teacher/students/profile", label: "Student Support", icon: UsersRound },
  { href: "/teacher/question-bank", label: "Question Bank", icon: GraduationCap },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          <div className="mr-2 hidden shrink-0 items-center gap-2 text-sm font-black text-[#071b3a] sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><GraduationCap size={19}/></span>
            Teacher
          </div>
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/teacher" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-black transition ${active ? "bg-violet-600 text-white shadow-md" : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`}
              >
                <Icon size={17}/>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
