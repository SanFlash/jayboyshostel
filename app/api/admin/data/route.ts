import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

const TABLES = new Set([
  "profiles","user_roles","hostels","buildings","floors","rooms","beds","members",
  "member_guardians","applications","application_status_history","document_types",
  "documents","tenancies","pricing_plans","invoices","invoice_items","payments",
  "announcements","notifications","complaints","complaint_comments","audit_logs",
  "settings","feature_flags",
]);
const SUPER_ADMIN_TABLES = new Set(["user_roles","profiles","audit_logs","settings","feature_flags"]);

export async function GET(request: Request) {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const table = params.get("table") || "";
  const limit = Math.min(Math.max(Number(params.get("limit") || 100), 1), 250);
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  const db = adminServiceClient();
  const { data, error } = await db.from(table).select("*").limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) { return mutate(request, "insert"); }
export async function PATCH(request: Request) { return mutate(request, "update"); }
export async function DELETE(request: Request) { return mutate(request, "delete"); }

async function mutate(request: Request, action: "insert" | "update" | "delete") {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { table?: string; id?: string; selector?: Record<string, string | number | boolean>; data?: Record<string, unknown> };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const table = body.table || "";
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  if (action !== "insert" && !body.id && !body.selector) return NextResponse.json({ error: "A record id or selector is required." }, { status: 400 });
  if (SUPER_ADMIN_TABLES.has(table) && auth.role !== "super_admin") return NextResponse.json({ error: "Only super admins can modify this resource." }, { status: 403 });

  const db = adminServiceClient();
  try {
    if (action === "insert") {
      const { data, error } = await db.from(table).insert(body.data ?? {}).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await writeAudit(db, auth.user.id, "insert", table, data?.id ?? null, data);
      return NextResponse.json({ ok: true, data });
    }

    // Build the mutation first, then attach filters. Filtering a bare
    // PostgrestQueryBuilder does not work and can cause runtime failures.
    const filters = (query: any) => {
      if (body.id) return query.eq("id", body.id);
      const entries = Object.entries(body.selector ?? {});
      if (!entries.length) throw new Error("At least one selector field is required.");
      for (const [key, value] of entries) {
        if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new Error("Invalid selector field.");
        query = query.eq(key, value);
      }
      return query;
    };

    if (action === "update") {
      const { data, error } = await filters(db.from(table).update(body.data ?? {})).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await writeAudit(db, auth.user.id, "update", table, data?.id ?? body.id ?? null, data);
      return NextResponse.json({ ok: true, data });
    }

    const { data, error } = await filters(db.from(table).delete()).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await writeAudit(db, auth.user.id, "delete", table, data?.id ?? body.id ?? null, null);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mutation failed." }, { status: 500 });
  }
}

async function writeAudit(db: ReturnType<typeof adminServiceClient>, actorId: string, action: string, entityType: string, entityId: string | null, newData: unknown) {
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
