import { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "student" | "teacher" | "parent" | "guardian" | "admin";

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return data.role as AppRole;
}

export function roleHome(role: AppRole | null) {
  switch (role) {
    case "admin": return "/admin/classes";
    case "teacher": return "/teacher";
    case "parent":
    case "guardian": return "/parent";
    default: return "/dashboard";
  }
}
