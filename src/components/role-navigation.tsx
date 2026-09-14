"use client";

import { usePathname } from "next/navigation";
import StudentNavigation from "@/components/student-navigation";
import TeacherNavigation from "@/components/teacher-navigation";
import ParentNavigation from "@/components/parent-navigation";
import AdminNavigation from "@/components/admin-navigation";

export default function RoleNavigation() {
  const pathname = usePathname();

  // Dashboard, Daily Challenge, and Number Town provide their own navigation.
  // Number Town must be completely unobstructed while Number Catcher is in fullscreen.
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/challenge") ||
    pathname.startsWith("/number-town")
  ) return null;

  if (pathname.startsWith("/teacher")) return <TeacherNavigation />;
  if (pathname.startsWith("/parent")) return <ParentNavigation />;
  if (pathname.startsWith("/admin")) return <AdminNavigation />;

  return <StudentNavigation />;
}
