"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Trophy, Gift, BarChart3, GraduationCap } from "lucide-react";
const items=[{href:"/dashboard",label:"Home",icon:Home},{href:"/brain-games",label:"Games",icon:Gamepad2},{href:"/leaderboard",label:"Leaderboard",icon:Trophy},{href:"/rewards",label:"Rewards",icon:Gift},{href:"/progress",label:"Progress",icon:BarChart3},{href:"/profile",label:"Profile",icon:GraduationCap}];
export default function CompactStudentNav(){
 const pathname=usePathname();
 return <nav aria-label="Student mobile navigation" className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#d8e7f4] bg-white/95 px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+7px)] shadow-[0_-5px_22px_rgba(8,61,120,.12)] backdrop-blur lg:hidden"><div className="mx-auto grid max-w-[760px] grid-cols-6 gap-0.5">{items.map(({href,label,icon:Icon})=>{const active=pathname===href||(href!=="/dashboard"&&pathname.startsWith(href+"/"));return <Link key={href} href={href} aria-current={active?"page":undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 text-[10px] font-extrabold sm:text-xs ${active?"text-[#197fe9]":"text-[#526f89] hover:bg-[#eef8ff]"}`}><Icon size={24} strokeWidth={active?2.8:2.2} aria-hidden="true"/><span className="truncate">{label}</span></Link>})}</div></nav>;
}
