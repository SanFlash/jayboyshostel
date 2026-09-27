import Link from "next/link";
import { Activity, AlertTriangle, BedDouble, Building2, ClipboardList, IndianRupee, LogOut, Megaphone, Settings2, Users, WalletCards } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import AdminSetupButton from "./AdminSetupButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { db } = await requireAdmin();
  const [members, rooms, beds, applications, complaints, invoices, payments] = await Promise.all([
    db.from("members").select("id",{count:"exact",head:true}).in("status",["active","notice_period","checkout_pending"]),
    db.from("rooms").select("id",{count:"exact",head:true}),
    db.from("beds").select("id",{count:"exact",head:true}).eq("status","available"),
    db.from("applications").select("id",{count:"exact",head:true}).in("status",["submitted","under_review","documents_required"]),
    db.from("complaints").select("id",{count:"exact",head:true}).in("status",["submitted","acknowledged","assigned","in_progress","reopened"]),
    db.from("invoices").select("id",{count:"exact",head:true}).in("status",["issued","partially_paid","overdue"]),
    db.from("payments").select("id",{count:"exact",head:true}),
  ]);

  const metrics = [
    ["Residents", members.count || 0, Users],
    ["Rooms", rooms.count || 0, Building2],
    ["Available beds", beds.count || 0, BedDouble],
    ["Pending admissions", applications.count || 0, ClipboardList],
    ["Open complaints", complaints.count || 0, AlertTriangle],
    ["Outstanding invoices", invoices.count || 0, WalletCards],
    ["Payments recorded", payments.count || 0, IndianRupee],
  ] as const;

  const pending = await db.from("applications")
    .select("id,application_code,status,created_at")
    .in("status",["submitted","under_review","documents_required"])
    .order("created_at",{ascending:false})
    .limit(6);

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" prefetch={false} className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>HOSTEL ADMIN</small></span></Link>
      <div className="admin-nav">
        <div className="admin-nav-group"><span>CORE WORKSPACE</span>
          <Link className="active" href="/admin" prefetch={false}><Activity size={15}/><span>Overview</span></Link>
          <Link href="/admin/floor-map" prefetch={false}><Building2 size={15}/><span>Floor Occupancy</span></Link>
          <Link href="/admin/members" prefetch={false}><Users size={15}/><span>Residents</span></Link>
          <Link href="/admin/applications" prefetch={false}><ClipboardList size={15}/><span>Admissions</span></Link>
          <Link href="/admin/finance" prefetch={false}><WalletCards size={15}/><span>Finance</span></Link>
          <Link href="/admin/operations" prefetch={false}><Building2 size={15}/><span>Operations</span></Link><Link href="/admin/complaints" prefetch={false}><AlertTriangle size={15}/><span>Complaints</span></Link>
        </div>
        <div className="admin-nav-group"><span>CONTROL</span>
          <Link href="/admin/website" prefetch={false}><Megaphone size={15}/><span>Website</span></Link>
          <Link href="/admin/settings" prefetch={false}><Settings2 size={15}/><span>Settings</span></Link>
        </div>
      </div>
      <div className="admin-sidebar-foot"><Link href="/api/auth/signout" prefetch={false}><LogOut size={14}/> Sign out</Link><Link href="/" prefetch={false}>View website</Link></div>
    </aside>

    <section className="admin-main">
      <header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>ADMIN</small></span></Link><Link href="/api/auth/signout" className="icon-button"><LogOut size={15}/></Link></header>
      <div className="admin-content">
        <div className="admin-page-head">
          <div><div className="eyebrow"><Activity size={14}/> JAY BOYS HOSTEL · SINGLE BUILDING</div><h1>Command center.</h1><p>Manage residents, admissions, room occupancy, billing and complaints from one focused workspace.</p></div>
          <div className="admin-head-actions"><AdminSetupButton/><Link href="/admin/website" className="button primary"><Megaphone size={15}/> Edit website</Link></div>
        </div>

        <section className="admin-metric-grid">{metrics.map(([label,value,Icon])=><article className="admin-stat" key={label}><div><span>{label.toUpperCase()}</span><b>{value}</b></div><Icon/></article>)}</section>

        <section className="admin-dashboard-grid">
          <div className="admin-card" style={{gridColumn:"1/-1"}}>
            <div className="admin-card-head"><div><span>HOSTEL OPERATIONS</span><h2>Fast access to daily work</h2></div><Building2/></div>
            <div className="admin-control-grid">
              <Link href="/admin/floor-map" prefetch={false}><Building2/><span><b>Floor Occupancy</b><small>Floor 0–4, every room, bed, resident and allocation.</small></span></Link>
              <Link href="/admin/members" prefetch={false}><Users/><span><b>Residents</b><small>Profile, photo, contact and current room allocation.</small></span></Link>
              <Link href="/admin/applications" prefetch={false}><ClipboardList/><span><b>Admissions</b><small>Review applications and verify resident records.</small></span></Link>
              <Link href="/admin/finance" prefetch={false}><WalletCards/><span><b>Finance</b><small>Invoices, payments and hostel expenses.</small></span></Link>
              <Link href="/admin/complaints" prefetch={false}><AlertTriangle/><span><b>Complaints</b><small>Track issues through resolution.</small></span></Link>
              <Link href="/admin/settings" prefetch={false}><Settings2/><span><b>Settings</b><small>Maintain hostel configuration and controls.</small></span></Link>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-head"><div><span>ADMISSIONS</span><h2>Needs attention</h2></div><ClipboardList/></div>
            {pending.data?.length ? <div className="admin-table">{pending.data.map(a=><div key={a.id}><span><b>{a.application_code}</b><small>{a.status.replaceAll("_"," ")}</small></span><time>{new Date(a.created_at).toLocaleDateString("en-IN")}</time><Link href="/admin/applications" prefetch={false}>Open</Link></div>)}</div> : <div className="empty-state">No pending admissions.</div>}
          </div>

          <div className="admin-card">
            <div className="admin-card-head"><div><span>ROOM INVENTORY</span><h2>Single-building layout</h2></div><BedDouble/></div>
            <div className="admin-control-grid">
              <Link href="/admin/floor-map" prefetch={false}><BedDouble/><span><b>14 rooms · 31 beds</b><small>Floor 0 has 1 room; Floors 1–3 have 4 rooms each; Floor 4 has 1 room.</small></span></Link>
              <Link href="/admin/floor-map" prefetch={false}><IndianRupee/><span><b>Rates from ₹5,000–₹8,500</b><small>Rates are loaded from the owner-provided room sheet.</small></span></Link>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>;
}
