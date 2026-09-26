import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await getAdminContext();
  if (!auth || auth.role !== "super_admin") {
    return NextResponse.json({ error: "Only the super administrator can initialize the workspace." }, { status: 403 });
  }

  const db = adminServiceClient();
  const created: string[] = [];

  try {
    let hostel = (await db.from("hostels").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle()).data;
    if (!hostel) {
      const result = await db.from("hostels").insert({
        name: "Jay Boys Hostel",
        address: "Vinoba Nagar",
        city: "Indore",
        state: "Madhya Pradesh",
        postal_code: "452001",
        phone: "",
        email: "",
      }).select().single();
      if (result.error) throw result.error;
      hostel = result.data;
      created.push("hostel");
    }

    let building = (await db.from("buildings").select("*").eq("hostel_id", hostel.id).order("sort_order").limit(1).maybeSingle()).data;
    if (!building) {
      const result = await db.from("buildings").insert({ hostel_id: hostel.id, name: "Main Building", sort_order: 1 }).select().single();
      if (result.error) throw result.error;
      building = result.data;
      created.push("building");
    }

    let floor = (await db.from("floors").select("*").eq("building_id", building.id).order("sort_order").limit(1).maybeSingle()).data;
    if (!floor) {
      const result = await db.from("floors").insert({ building_id: building.id, name: "Ground Floor", sort_order: 1 }).select().single();
      if (result.error) throw result.error;
      floor = result.data;
      created.push("floor");
    }

    const roomSeeds = [
      { room_number: "101", room_type: "4 Sharing", capacity: 4, monthly_rate: 6500 },
      { room_number: "102", room_type: "4 Sharing", capacity: 4, monthly_rate: 6500 },
      { room_number: "103", room_type: "3 Sharing", capacity: 3, monthly_rate: 7000 },
      { room_number: "104", room_type: "2 Sharing", capacity: 2, monthly_rate: 8000 },
    ];

    for (const seed of roomSeeds) {
      let room = (await db.from("rooms").select("*").eq("floor_id", floor.id).eq("room_number", seed.room_number).maybeSingle()).data;
      if (!room) {
        const result = await db.from("rooms").insert({
          floor_id: floor.id,
          ...seed,
          daily_rate: Math.round(seed.monthly_rate / 30),
          security_deposit: seed.monthly_rate,
          status: "available",
        }).select().single();
        if (result.error) throw result.error;
        room = result.data;
        created.push(`room ${seed.room_number}`);
      }

      const { count } = await db.from("beds").select("id", { count: "exact", head: true }).eq("room_id", room.id);
      if (!count) {
        for (let i = 1; i <= seed.capacity; i++) {
          const result = await db.from("beds").insert({ room_id: room.id, bed_label: `B${i}`, status: "available" });
          if (result.error) throw result.error;
        }
        created.push(`beds for ${seed.room_number}`);
      }
    }

    const pricing = await db.from("pricing_plans").select("id").eq("hostel_id", hostel.id).limit(1).maybeSingle();
    if (!pricing.data) {
      const result = await db.from("pricing_plans").insert({
        hostel_id: hostel.id,
        name: "Standard Monthly",
        room_type: "4 Sharing",
        monthly_rate: 6500,
        daily_rate: 217,
        billing_method: "fixed_30_days",
        active: true,
      });
      if (result.error) throw result.error;
      created.push("pricing plan");
    }

    const docTypes = [
      ["Aadhaar / ID Proof", true],
      ["Passport Photo", true],
      ["College / Institute ID", true],
      ["Address Proof", false],
    ] as const;
    for (const [name, required] of docTypes) {
      const existing = await db.from("document_types").select("id").eq("hostel_id", hostel.id).eq("name", name).maybeSingle();
      if (!existing.data) {
        const result = await db.from("document_types").insert({ hostel_id: hostel.id, name, required_for_application: required, active: true });
        if (result.error) throw result.error;
        created.push(`document type: ${name}`);
      }
    }

    const siteRows = [
      { key: "hero", section: "home", title: "Stay simple. Live connected.", subtitle: "JAY BOYS HOSTEL · VINOBA NAGAR", body: "A modern resident-first hostel experience with transparent admissions, connected operations and responsive support.", cta_label: "Start admission", cta_href: "/apply" },
      { key: "experience", section: "home", title: "Everything around the stay.", subtitle: "ONE CONNECTED WORKFLOW", body: "Admissions, rooms, beds, resident records, billing, documents and support are managed from one operational system." },
      { key: "facilities", section: "home", title: "Built for everyday living.", subtitle: "RESIDENT EXPERIENCE", body: "Keep residents informed, manage requests quickly and maintain a reliable record of every stay." },
      { key: "admission", section: "home", title: "From application to check-in.", subtitle: "ADMISSIONS", body: "Collect an application, verify documents, allocate a room and start the tenancy without disconnected spreadsheets." },
      { key: "cta", section: "home", title: "Ready to make hostel operations simpler?", subtitle: "JAY BOYS HOSTEL · INDORE", body: "Start an application or contact the hostel team.", cta_label: "Apply now", cta_href: "/apply" },
    ];
    const site = await db.from("site_content").upsert(siteRows.map(row => ({ ...row, value: {}, active: true })), { onConflict: "key" });
    if (site.error && !/site_content/i.test(site.error.message)) throw site.error;

    return NextResponse.json({ ok: true, created, message: created.length ? "Workspace initialized successfully." : "Workspace was already initialized." });
  } catch (error) {
    console.error("Admin workspace setup failed", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Workspace initialization failed.",
      created,
    }, { status: 500 });
  }
}
