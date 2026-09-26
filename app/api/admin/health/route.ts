import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const REQUIRED = [
  "profiles","user_roles","hostels","buildings","floors","rooms","beds","members",
  "member_guardians","applications","documents","tenancies","pricing_plans","invoices",
  "invoice_items","payments","announcements","notifications","complaints","complaint_comments",
  "audit_logs","settings","feature_flags","site_content","visitors","maintenance_requests",
  "inventory_items","expenses","attendance","staff_tasks","leave_requests"
];

export async function GET() {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const db = adminServiceClient();
  const checks = await Promise.all(REQUIRED.map(async table => {
    const { error } = await db.from(table).select("*", { count:"exact", head:true });
    return { table, ok: !error, error: error?.message || null };
  }));

  const missing = checks.filter(item => !item.ok);
  const env = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    adminEmail: Boolean(process.env.ADMIN_EMAIL),
    adminPassword: Boolean(process.env.ADMIN_PASSWORD),
  };

  return NextResponse.json({
    ok: missing.length === 0 && Object.values(env).every(Boolean),
    framework: "Jay Boys Hostel Admin Framework v4",
    checkedAt: new Date().toISOString(),
    environment: env,
    tables: checks,
    missingTables: missing.map(item => item.table),
  });
}
