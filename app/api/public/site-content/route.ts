import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ data: [] }, { status: 200 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("site_content")
    .select("key,section,title,subtitle,body,cta_label,cta_href,value")
    .eq("active", true);

  if (error) return NextResponse.json({ data: [], error: error.message }, { status: 200 });
  return NextResponse.json({ data: data ?? [] });
}
