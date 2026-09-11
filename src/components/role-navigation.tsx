"use client";

import { usePathname } from "next/navigation";
import StudentNavigation from "@/components/student-navigation";
import TeacherNavigation from "@/components/teacher-navigation";

export default function RoleNavigation() {
  const pathname = usePathname();

  if (pathname.startsWith("/teacher")) return <TeacherNavigation />;
  if (pathname.startsWith("/admin")) return null;

  return <StudentNavigation />;
}
