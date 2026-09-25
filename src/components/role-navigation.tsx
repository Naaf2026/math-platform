"use client";
import { usePathname } from "next/navigation";
import StudentMobileHeader from "@/components/student-mobile-header";
import StudentNavigation from "@/components/student-navigation";
import TeacherNavigation from "@/components/teacher-navigation";
import ParentNavigation from "@/components/parent-navigation";
import AdminNavigation from "@/components/admin-navigation";
export default function RoleNavigation(){
 const pathname=usePathname();
 if(pathname==="/"||pathname==="/parents"||pathname.startsWith("/parents/")||pathname==="/login"||pathname.startsWith("/login/")||pathname.startsWith("/subscription")||pathname.startsWith("/pricing")||pathname.startsWith("/about")||pathname.startsWith("/privacy")||pathname.startsWith("/terms")||pathname.startsWith("/payment-policy"))return null;
 if(pathname.startsWith("/teacher"))return <TeacherNavigation/>;
 if(pathname.startsWith("/parent"))return <ParentNavigation/>;
 if(pathname.startsWith("/admin"))return <AdminNavigation/>;
 return <><StudentMobileHeader/>{!["/dashboard","/homework","/brain-games","/leaderboard","/rewards","/progress","/profile"].includes(pathname)&&<div className="hidden lg:block"><StudentNavigation/></div>}</>;
}
