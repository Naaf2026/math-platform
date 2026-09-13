"use client";

import { usePathname } from "next/navigation";
import StudentNavigation from "@/components/student-navigation";
import TeacherNavigation from "@/components/teacher-navigation";
import ParentNavigation from "@/components/parent-navigation";
import AdminNavigation from "@/components/admin-navigation";

export default function RoleNavigation() {
  const pathname = usePathname();

  // Dashboard and Daily Challenge provide their own full-screen navigation.
  if (pathname === "/dashboard" || pathname.startsWith("/challenge")) return null;

  if (pathname.startsWith("/teacher")) return <TeacherNavigation />;
  if (pathname.startsWith("/parent")) return <ParentNavigation />;
  if (pathname.startsWith("/admin")) return <AdminNavigation />;

  return <StudentNavigation />;
}
