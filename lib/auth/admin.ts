import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

export const STAFF_ROLES = ["super_admin","admin","manager","staff","accountant"] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export function adminServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server Supabase configuration is incomplete.");
  return createClient(url, key, { auth: { autoRefreshToken:false, persistSession:false } });
}

export async function getAdminContext() {
  const supabase = await createSupabaseServer();
  const { data:{ user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = adminServiceClient();
  const { data: roles, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) throw roleError;
  const role = roles?.map(row => row.role).find((value): value is StaffRole =>
    (STAFF_ROLES as readonly string[]).includes(value)
  );
  return role ? { user, role, db: admin } : null;
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireSuperAdmin() {
  const context = await requireAdmin();
  if (context.role !== "super_admin") redirect("/admin");
  return context;
}
