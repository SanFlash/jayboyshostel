import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
const BUCKET = "resident-government-id";

export async function GET(request: Request) {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const path = new URL(request.url).searchParams.get("path")?.trim();
  if (!path || path.includes("..") || !path.startsWith("applications/")) return NextResponse.json({ error: "Invalid proof path." }, { status: 400 });
  const db = adminServiceClient();
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Government ID proof is unavailable." }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl, expiresIn: 300 });
}