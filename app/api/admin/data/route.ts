import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

const TABLES = new Set([
  "profiles","user_roles","hostels","buildings","floors","rooms","beds","members",
  "member_guardians","applications","application_status_history","document_types",
  "documents","tenancies","pricing_plans","invoices","invoice_items","payments",
  "announcements","notifications","complaints","complaint_comments","audit_logs",
  "settings","feature_flags",
]);
const SUPER_ADMIN_TABLES = new Set(["user_roles","profiles","audit_logs","settings","feature_flags"]);

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server Supabase configuration is incomplete.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authorize() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const staff = roles?.find((r) => ["super_admin","admin","manager","staff","accountant"].includes(r.role));
  return staff ? { user, role: staff.role } : null;
}

export async function GET(request: Request) {
  const auth = await authorize();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const table = params.get("table") || "";
  const limit = Math.min(Math.max(Number(params.get("limit") || 100), 1), 250);
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  const db = serviceClient();
  const { data, error } = await db.from(table).select("*").limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) { return mutate(request, "insert"); }
export async function PATCH(request: Request) { return mutate(request, "update"); }
export async function DELETE(request: Request) { return mutate(request, "delete"); }

async function mutate(request: Request, action: "insert" | "update" | "delete") {
  const auth = await authorize();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { table?: string; id?: string; selector?: Record<string, string | number | boolean>; data?: Record<string, unknown> };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const table = body.table || "";
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  if (action !== "insert" && !body.id && !body.selector) return NextResponse.json({ error: "A record id or selector is required." }, { status: 400 });
  if (SUPER_ADMIN_TABLES.has(table) && auth.role !== "super_admin") return NextResponse.json({ error: "Only super admins can modify this resource." }, { status: 403 });

  const db = serviceClient();
  try {
    if (action === "insert") {
      const { data, error } = await db.from(table).insert(body.data ?? {}).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await writeAudit(db, auth.user.id, "insert", table, data?.id ?? null, data);
      return NextResponse.json({ ok: true, data });
    }

    // The table name is intentionally validated against the allow-list above.
    // Supabase cannot infer a typed table union from a runtime string, so keep
    // the mutation builder dynamic while preserving the runtime query behavior.
    const query: any = db.from(table);
    if (body.id) query.eq("id", body.id);
    else for (const [key, value] of Object.entries(body.selector ?? {})) query.eq(key, value);

    if (action === "update") {
      const { data, error } = await query.update(body.data ?? {}).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await writeAudit(db, auth.user.id, "update", table, data?.id ?? body.id ?? null, data);
      return NextResponse.json({ ok: true, data });
    }

    const { data, error } = await query.delete().select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await writeAudit(db, auth.user.id, "delete", table, data?.id ?? body.id ?? null, null);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mutation failed." }, { status: 500 });
  }
}

async function writeAudit(db: ReturnType<typeof serviceClient>, actorId: string, action: string, entityType: string, entityId: string | null, newData: unknown) {
  if (entityType === "audit_logs") return;
  await db.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: newData,
    reason: "Admin console mutation",
  });
}
