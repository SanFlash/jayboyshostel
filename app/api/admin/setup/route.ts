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

    const floorSeeds = [
      { name: "Floor 0", sort_order: 0 },
      { name: "Floor 1", sort_order: 1 },
      { name: "Floor 2", sort_order: 2 },
      { name: "Floor 3", sort_order: 3 },
      { name: "Floor 4", sort_order: 4 },
    ];

    const floorIds: Record<string,string> = {};
    for (const seed of floorSeeds) {
      let floor = (await db.from("floors").select("*").eq("building_id", building.id).eq("name", seed.name).maybeSingle()).data;
      if (!floor) {
        const result = await db.from("floors").insert({ building_id: building.id, name: seed.name, sort_order: seed.sort_order }).select().single();
        if (result.error) throw result.error;
        floor = result.data;
        created.push(seed.name);
      }
      floorIds[seed.name] = floor.id;
    }

    const roomSeeds = [
      ["Floor 0","0-1","4 Sharing",4,5000],
      ["Floor 1","F1-0","2 Sharing",2,7500],["Floor 1","F1-1","1 Sharing",1,8500],["Floor 1","F1-2","2 Sharing",2,7500],["Floor 1","F1-3","3 Sharing",3,7000],
      ["Floor 2","F2-4","2 Sharing",2,7500],["Floor 2","F2-5","1 Sharing",1,8500],["Floor 2","F2-6","2 Sharing",2,7500],["Floor 2","F2-7","3 Sharing",3,7000],
      ["Floor 3","F3-8","2 Sharing",2,7500],["Floor 3","F3-9","1 Sharing",1,8500],["Floor 3","F3-10","2 Sharing",2,7500],["Floor 3","F3-11","3 Sharing",3,7000],
      ["Floor 4","F4-12","3 Sharing",3,7000],
    ] as const;

    for (const [floorName,roomNumber,roomType,capacity,monthlyRate] of roomSeeds) {
      let room = (await db.from("rooms").select("*").eq("floor_id", floorIds[floorName]).eq("room_number", roomNumber).maybeSingle()).data;
      if (!room) {
        const result = await db.from("rooms").insert({
          floor_id: floorIds[floorName], room_number: roomNumber, room_type: roomType,
          capacity, monthly_rate: monthlyRate, daily_rate: null, security_deposit: 0,
          status: "available", notes: "Owner-provided room sheet",
        }).select().single();
        if (result.error) throw result.error;
        room = result.data;
        created.push(`room ${roomNumber}`);
      }

      const { count } = await db.from("beds").select("id", { count: "exact", head: true }).eq("room_id", room.id);
      if (!count) {
        for (let i = 1; i <= capacity; i++) {
          const result = await db.from("beds").insert({ room_id: room.id, bed_label: `B${i}`, status: "available" });
          if (result.error) throw result.error;
        }
        created.push(`beds for ${roomNumber}`);
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
