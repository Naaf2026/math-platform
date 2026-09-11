import { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "student" | "teacher" | "parent" | "guardian" | "admin";

const publicRoles: AppRole[] = ["student", "teacher", "parent", "guardian"];

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<AppRole | null> {
  const { data: isAdmin, error: adminError } = await supabase.rpc("has_role", {
    p_role: "admin",
  });

  if (!adminError && isAdmin === true) return "admin";

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return publicRoles.includes(data.role as AppRole) ? (data.role as AppRole) : null;
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
