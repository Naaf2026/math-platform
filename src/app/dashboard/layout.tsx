import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/app/auth/role-router";

export default async function LearnerDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: accountStatus, error: statusError } = await supabase.rpc(
    "get_my_account_status",
  );

  if (statusError || accountStatus !== "active") {
    redirect("/login?error=account_not_active");
  }

  const role = await getUserRole(supabase, user.id);

  if (role !== "student") {
    redirect(
      role === "parent" || role === "guardian"
        ? "/parent"
        : role === "teacher"
          ? "/teacher"
          : role === "admin"
            ? "/admin"
            : "/login",
    );
  }

  return children;
}
