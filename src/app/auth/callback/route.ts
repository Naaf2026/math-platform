import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, roleHome } from "@/app/auth/role-router";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

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

  const { data: accountStatus, error: statusError } = await supabase.rpc("get_my_account_status");
  if (statusError || accountStatus !== "active") {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=account_not_active", url.origin));
  }

  let role = await getUserRole(supabase, user.id);

  // Public Google registration is parent-only. Existing roles are never overwritten.
  if (!role) {
    const { error: roleError } = await supabase.rpc("register_user_role", { p_role: "parent" });
    if (!roleError) role = await getUserRole(supabase, user.id);
  }

  if (!role) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=account_role_missing", url.origin));
  }

  return NextResponse.redirect(new URL(roleHome(role), url.origin));
}
