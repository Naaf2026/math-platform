"use client";
import Link from "next/link";
import { Home, Gamepad2, Trophy, Gift, BarChart3, GraduationCap } from "lucide-react";

export default function LearnerBottomNav() {
  return <><nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#cfe4f2] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 shadow-[0_-6px_20px_rgba(8,61,120,0.10)] backdrop-blur md:hidden" aria-label="Student navigation">
    <div className="mx-auto grid max-w-lg grid-cols-6">
      <Link href="/dashboard" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Home size={22} strokeWidth={2.5}/><span className="text-[11px] font-black">Home</span></Link>
      <Link href="/brain-games" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Gamepad2 size={22} strokeWidth={2.5}/><span className="text-[11px] font-black">Games</span></Link>
      <Link href="/leaderboard" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Trophy size={22} strokeWidth={2.5}/><span className="text-[11px] font-black">Leaderboard</span></Link>
      <Link href="/rewards" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><Gift size={22} strokeWidth={2.5}/><span className="text-[11px] font-black">Rewards</span></Link>
      <Link href="/progress" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><BarChart3 size={22} strokeWidth={2.5}/><span className="text-[11px] font-black">Progress</span></Link>
      <Link href="/profile" className="flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[#526f89]"><GraduationCap size={22} strokeWidth={2.5}/><span className="text-[11px] font-black">Profile</span></Link>
    </div>
  </nav>
</>;
}