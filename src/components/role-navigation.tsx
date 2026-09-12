"use client";

import { usePathname } from "next/navigation";
import StudentNavigation from "@/components/student-navigation";
import TeacherNavigation from "@/components/teacher-navigation";
import ParentNavigation from "@/components/parent-navigation";
import AdminNavigation from "@/components/admin-navigation";

export default function RoleNavigation() {
  const pathname = usePathname();

  // Daily Challenge has its own full-screen KooBits-style navigation and
  // question list. Do not render the persistent app rail on top of it.
  if (pathname.startsWith("/challenge")) return null;

  if (pathname.startsWith("/teacher")) return <TeacherNavigation />;
  if (pathname.startsWith("/parent")) return <ParentNavigation />;
  if (pathname.startsWith("/admin")) return <AdminNavigation />;

  return <StudentNavigation />;
}
