import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

const TABLES = new Set([
  "profiles","user_roles","hostels","buildings","floors","rooms","beds","members",
  "member_guardians","applications","application_status_history","document_types",
  "documents","tenancies","pricing_plans","invoices","invoice_items","payments",
  "announcements","notifications","complaints","complaint_comments","audit_logs",
  "settings","feature_flags","site_content","visitors","maintenance_requests",
  "inventory_items","expenses","attendance","staff_tasks","leave_requests",
]);
const SUPER_ADMIN_TABLES = new Set(["user_roles","profiles","audit_logs","settings","feature_flags","site_content"]);

function cleanData(input: Record<string, unknown> = {}) {
  const data = { ...input };
  for (const key of ["id","created_at","updated_at"]) delete data[key];
  return data;
}

function generatedValue(table: string, data: Record<string, unknown>, field: string, prefix: string) {
  if (data[field] && String(data[field]).trim()) return;
  data[field] = `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function GET(request: Request) {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const table = params.get("table") || "";
  const limit = Math.min(Math.max(Number(params.get("limit") || 250), 1), 500);
  const search = params.get("q")?.trim();
  const requestedOrder = params.get("order") || "";
  const ascending = params.get("ascending") === "true";
  const defaultOrder: Record<string,string> = {
    settings: "updated_at", feature_flags: "key", site_content: "updated_at",
  };
  const order = requestedOrder || defaultOrder[table] || "created_at";

  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  if (!/^[a-z][a-z0-9_]*$/.test(order)) return NextResponse.json({ error: "Invalid order field." }, { status: 400 });

  const db = adminServiceClient();
  let query = db.from(table).select("*").order(order, { ascending, nullsFirst: false }).limit(limit);

  if (search) {
    const searchable = ["full_name","member_code","phone","email","application_code","room_number","invoice_number","payment_number","title","name","key","status","category","sku","visitor_name"];
    const available = searchable.filter(field => {
      // PostgREST ignores unknown columns poorly, so only use fields commonly
      // present in the selected table. Table-specific sets are safer.
      const map: Record<string,string[]> = {
        members:["full_name","member_code","phone","email"], applications:["application_code","status"],
        rooms:["room_number","room_type","status"], invoices:["invoice_number","status"],
        payments:["payment_number","transaction_id"], complaints:["title","status","category"],
        announcements:["title","message"], notifications:["title","body"], hostels:["name","city"],
        buildings:["name"], floors:["name"], document_types:["name"], pricing_plans:["name","room_type"],
        site_content:["key","title","section"], profiles:["full_name","email","phone"], user_roles:["role"],
        visitors:["visitor_name","phone","status","purpose"], maintenance_requests:["title","status","description"],
        inventory_items:["name","category","sku","status"], expenses:["description","category","vendor","reference"],
        attendance:["status","note"], staff_tasks:["title","status","description"], leave_requests:["reason","status"],
      };
      return (map[table] || []).includes(field);
    });
    if (available.length) query = query.or(available.map(field => `${field}.ilike.%${search.replace(/[%_,]/g, " ")}%`).join(","));
  }

  const { data, error } = await query;
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
      const data = cleanData(body.data);
      if (table === "members") generatedValue(table, data, "member_code", "JBS-M");
      if (table === "applications") generatedValue(table, data, "application_code", "JBS-APP");
      if (table === "invoices") generatedValue(table, data, "invoice_number", "JBS-INV");
      if (table === "payments") generatedValue(table, data, "payment_number", "JBS-PAY");

      const { data: inserted, error } = await db.from(table).insert(data).select().single();
      if (error) return NextResponse.json({ error: friendlyError(error.message) }, { status: 400 });
      await writeAudit(db, auth.user.id, "insert", table, inserted?.id ?? null, inserted);
      return NextResponse.json({ ok: true, data: inserted });
    }

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
      const data = cleanData(body.data);
      const { data: updated, error } = await filters(db.from(table).update(data)).select().single();
      if (error) return NextResponse.json({ error: friendlyError(error.message) }, { status: 400 });
      await writeAudit(db, auth.user.id, "update", table, updated?.id ?? body.id ?? null, updated);
      return NextResponse.json({ ok: true, data: updated });
    }

    const { data: deleted, error } = await filters(db.from(table).delete()).select().single();
    if (error) return NextResponse.json({ error: friendlyError(error.message) }, { status: 400 });
    await writeAudit(db, auth.user.id, "delete", table, deleted?.id ?? body.id ?? null, null);
    return NextResponse.json({ ok: true, data: deleted });
  } catch (error) {
    return NextResponse.json({ error: friendlyError(error instanceof Error ? error.message : "Mutation failed.") }, { status: 500 });
  }
}

function friendlyError(message: string) {
  if (/foreign key/i.test(message)) return "This record references another record that does not exist. Select an existing related record first.";
  if (/duplicate key|unique constraint/i.test(message)) return "A record with the same unique value already exists.";
  if (/not-null|null value/i.test(message)) return "A required field is missing.";
  if (/check constraint/i.test(message)) return "One of the values is outside the allowed range.";
  return message;
}

async function writeAudit(db: ReturnType<typeof adminServiceClient>, actorId: string, action: string, entityType: string, entityId: string | null, newData: unknown) {
  if (entityType === "audit_logs") return;
  const result = await db.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: newData,
    reason: "Admin console mutation",
  });
  if (result.error) console.warn("Audit log write failed:", result.error.message);
}
