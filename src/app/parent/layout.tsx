import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, History, Target, Users } from "lucide-react";
import ParentLearningAlerts from "@/components/parent-learning-alerts";
import ParentIntelligenceDashboard from "@/components/parent-intelligence-dashboard";
import ParentIntelligenceActionCenter from "@/components/parent-intelligence-action-center";
import ParentLearnerSwitcher from "@/components/parent-learner-switcher";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/app/auth/role-router";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: accountStatus, error: statusError } = await supabase.rpc("get_my_account_status");
  if (statusError || accountStatus !== "active") redirect("/login?error=account_not_active");

  const role = await getUserRole(supabase, user.id);
  if (role !== "parent" && role !== "guardian") {
    redirect(role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/dashboard");
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link href="/parent" className="font-black tracking-tight text-[#071b3a]">Family Learning Centre</Link>
          <div className="flex flex-wrap items-center gap-2 text-sm font-black">
            <ParentLearnerSwitcher />
            <Link href="/parent" className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-violet-700 transition hover:bg-violet-100"><Users size={16} /> Your Learners</Link>
            <Link href="/parent/history" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#071b3a]"><History size={16} /> Learning History</Link>
            <Link href="/parent/goals" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#071b3a]"><Target size={16} /> Goals</Link>
            <Link href="/parent/notifications" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-[#071b3a]"><Bell size={16} /> Alerts</Link>
          </div>
        </div>
      </nav>
      {children}
      <div className="mx-auto max-w-6xl px-5 pt-5 sm:px-8"><ParentLearningAlerts /></div>
      <ParentIntelligenceDashboard />
      <ParentIntelligenceActionCenter />
    </>
  );
}
