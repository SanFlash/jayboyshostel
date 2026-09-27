import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const path = new URL(request.url).searchParams.get("path") || "";
  if (!path.startsWith("members/") || path.includes("..")) {
    return NextResponse.json({ ok:false, error:"Invalid photo path." }, { status:400 });
  }

  const db = adminServiceClient();
  const { data, error } = await db.storage.from("resident-photos").createSignedUrl(path, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ ok:false, error:error?.message || "Photo unavailable." }, { status:404 });
  return NextResponse.json({ ok:true, url:data.signedUrl, expiresIn:300 });
}
