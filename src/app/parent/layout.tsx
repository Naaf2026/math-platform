import { redirect } from "next/navigation";
import ParentLearningAlerts from "@/components/parent-learning-alerts";
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
      {children}
      <div className="mx-auto max-w-6xl px-5 pt-5 sm:px-8"><ParentLearningAlerts /></div>
    </>
  );
}
