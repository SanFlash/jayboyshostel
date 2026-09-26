import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth/admin-session";

export const STAFF_ROLES = ["super_admin","admin","manager","staff","accountant"] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export function adminServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server Supabase configuration is incomplete.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Admin authentication deliberately has two paths:
 * 1. The signed HTTP-only admin session created by /api/admin/bootstrap.
 *    Once its HMAC and expiry are valid, it is authoritative for the admin
 *    console. We do NOT query user_roles on every request.
 * 2. A legacy Supabase Auth fallback for existing staff sessions.
 *
 * Keeping the signed session self-contained prevents an RLS/schema problem
 * in user_roles from randomly sending an already-authenticated administrator
 * back to /login while navigating or mutating records.
 */
export async function getAdminContext() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (session) {
    return {
      user: { id: session.userId, email: session.email },
      role: session.role,
      db: adminServiceClient(),
    };
  }

  // Backward-compatible fallback for staff who already have a Supabase Auth session.
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

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
