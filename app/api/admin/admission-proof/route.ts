import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
const BUCKET = "resident-government-id";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const applicationId = String(form.get("application_id") || "pending");
  if (!(file instanceof File)) return NextResponse.json({ error: "Government ID proof image is required." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Only JPG, PNG or WEBP images are allowed." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Government ID proof must be between 1 byte and 10 MB." }, { status: 400 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  const path = "applications/" + applicationId + "/" + randomUUID() + "-" + safeName;
  const db = adminServiceClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (error) {
    console.error("Admission proof upload failed", error);
    return NextResponse.json({ error: "Unable to upload the government ID proof. Apply migration 004 and verify Supabase Storage is available." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, path, filename: file.name, mimeType: file.type, size: file.size });
}