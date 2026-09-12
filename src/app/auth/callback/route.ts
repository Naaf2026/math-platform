import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, roleHome } from "@/app/auth/role-router";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const signup = url.searchParams.get("signup");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_auth_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_callback_failed", url.origin));
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=no_user_session", url.origin));
  }

  let role = await getUserRole(supabase, user.id);

  // Public registration is parent-only. A first-time Google account therefore
  // receives the parent role here; existing teacher/admin/learner roles are preserved.
  if (!role && signup === "parent") {
    const { error: roleError } = await supabase.rpc("register_user_role", { p_role: "parent" });
    if (!roleError) role = await getUserRole(supabase, user.id);
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login?error=account_role_missing", url.origin));
  }

  return NextResponse.redirect(new URL(roleHome(role), url.origin));
}
