export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, BedDouble, Building2, ClipboardList, FileCheck2, IndianRupee, LogOut, MessageSquareWarning, Users, Megaphone, WalletCards, Settings2, ShieldCheck, Activity, Wrench, Package, UserCheck, CalendarDays } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import AdminSetupButton from "./AdminSetupButton";

const links=[
  ["Website Control","/admin/website",Megaphone,"Edit homepage content, CTA and public messaging"],
  ["Residents","/admin/members",Users,"Profiles, lifecycle and contact details"],
  ["Admissions","/admin/applications",ClipboardList,"Application review and admission workflow"],
  ["Stay & Allocations","/admin/tenancies",Building2,"Check-in, room, bed, rent and checkout"],
  ["Rooms & Beds","/admin/rooms",BedDouble,"Inventory, capacity and occupancy structure"],
  ["Visitors","/admin/visitors",UserCheck,"Visitor register and entry/exit tracking"],
  ["Maintenance","/admin/maintenance",Wrench,"Repairs, assignments and resolutions"],
  ["Billing","/admin/billing",WalletCards,"Invoices and billing records"],
  ["Payments","/admin/payments",IndianRupee,"Payment collection and reconciliation"],
  ["Expenses","/admin/expenses",IndianRupee,"Operating expenses and vendor records"],
  ["Documents","/admin/documents",FileCheck2,"Resident document verification"],
  ["Complaints","/admin/complaints",AlertTriangle,"Support, assignment and resolution"],
  ["Communication","/admin/announcements",MessageSquareWarning,"Announcements and resident notifications"],
  ["Attendance","/admin/attendance",CalendarDays,"Daily resident attendance"],
  ["Inventory","/admin/inventory",Package,"Hostel stock and reorder levels"],
  ["Staff Tasks","/admin/staff_tasks",ClipboardList,"Internal operational work queue"],
  ["Leave Requests","/admin/leave_requests",CalendarDays,"Resident leave approvals"],
  ["Hostel Setup","/admin/hostels",Building2,"Hostel, buildings, floors and pricing"],
  ["Security & Roles","/admin/roles",ShieldCheck,"Access roles and permissions"],
  ["System Settings","/admin/settings",Settings2,"Platform configuration and feature flags"],
  ["Audit Log","/admin/audit",Activity,"Administrative activity history"]
] as const;

export default async function AdminPage(){
 const {db:supabase}=await requireAdmin();
 const results=await Promise.all([
  supabase.from("members").select("id",{count:"exact",head:true}),
  supabase.from("applications").select("id",{count:"exact",head:true}).in("status",["submitted","under_review","documents_required"]),
  supabase.from("rooms").select("id",{count:"exact",head:true}),
  supabase.from("beds").select("id",{count:"exact",head:true}).eq("status","available"),
  supabase.from("complaints").select("id",{count:"exact",head:true}).in("status",["submitted","acknowledged","assigned","in_progress","reopened"]),
  supabase.from("invoices").select("id",{count:"exact",head:true}).in("status",["issued","partially_paid","overdue"]),
  supabase.from("payments").select("id",{count:"exact",head:true}),
  supabase.from("visitors").select("id",{count:"exact",head:true}).in("status",["expected","checked_in"]),
  supabase.from("maintenance_requests").select("id",{count:"exact",head:true}).in("status",["open","assigned","in_progress"]),
  supabase.from("inventory_items").select("id",{count:"exact",head:true}).in("status",["low_stock","out_of_stock"]),
  supabase.from("staff_tasks").select("id",{count:"exact",head:true}).in("status",["open","in_progress","blocked"]),
  supabase.from("applications").select("id,application_code,status,created_at").in("status",["submitted","under_review","documents_required"]).order("created_at",{ascending:false}).limit(8)
 ]);
 const [members,apps,rooms,beds,complaints,invoices,payments,visitors,maintenance,lowStock,tasks,pending]=results;
 const metrics=[
  ["Residents",members.count||0,Users],["Rooms",rooms.count||0,Building2],["Free beds",beds.count||0,BedDouble],
  ["Admissions",apps.count||0,ClipboardList],["Open complaints",complaints.count||0,AlertTriangle],["Open invoices",invoices.count||0,WalletCards],
  ["Payments",payments.count||0,IndianRupee],["Visitors today",visitors.count||0,UserCheck],["Maintenance",maintenance.count||0,Wrench],
  ["Low stock",lowStock.count||0,Package],["Staff tasks",tasks.count||0,Activity]
 ] as const;

 return <main className="admin-app">
  <aside className="admin-sidebar">
   <Link href="/admin" className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>OPERATIONS OS</small></span></Link>
   <div className="admin-nav">
    <div className="admin-nav-group"><span>COMMAND</span><Link className="active" href="/admin"><Activity size={15}/><span>Overview</span></Link><Link href="/admin/website"><Megaphone size={15}/><span>Website</span></Link><Link href="/admin/members"><Users size={15}/><span>Residents</span></Link><Link href="/admin/applications"><ClipboardList size={15}/><span>Admissions</span></Link></div>
    <div className="admin-nav-group"><span>OPERATIONS</span>{[["Stay & Allocations","/admin/tenancies",Building2],["Rooms & Beds","/admin/rooms",BedDouble],["Visitors","/admin/visitors",UserCheck],["Maintenance","/admin/maintenance",Wrench],["Billing","/admin/billing",WalletCards],["Payments","/admin/payments",IndianRupee],["Documents","/admin/documents",FileCheck2],["Complaints","/admin/complaints",AlertTriangle],["Communication","/admin/announcements",MessageSquareWarning],["Attendance","/admin/attendance",CalendarDays],["Inventory","/admin/inventory",Package],["Staff Tasks","/admin/staff_tasks",ClipboardList]].map(([label,href,Icon])=><Link href={String(href)} key={String(label)}><Icon size={15}/><span>{String(label)}</span></Link>)}</div>
    <div className="admin-nav-group"><span>CONFIGURATION</span><Link href="/admin/hostels"><Building2 size={15}/><span>Hostel Setup</span></Link><Link href="/admin/roles"><ShieldCheck size={15}/><span>Security & Roles</span></Link><Link href="/admin/settings"><Settings2 size={15}/><span>System Settings</span></Link><Link href="/admin/audit"><Activity size={15}/><span>Audit Log</span></Link></div>
   </div>
   <div className="admin-sidebar-foot"><Link href="/api/auth/signout"><LogOut size={14}/> Sign out</Link><Link href="/">View website</Link></div>
  </aside>
  <section className="admin-main"><header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>ADMIN</small></span></Link><Link href="/api/auth/signout" className="icon-button"><LogOut size={15}/></Link></header>
   <div className="admin-content">
    <div className="admin-page-head"><div><div className="eyebrow"><Activity size={14}/> LIVE OPERATIONS / SUPER ADMIN</div><h1>Command center.</h1><p>One operational workspace for admissions, residents, rooms, finance, support, communication, staff work and the public website.</p></div><div className="admin-head-actions"><AdminSetupButton/><Link href="/admin/website" className="button primary"><Megaphone size={15}/> Edit website</Link></div></div>
    <section className="admin-metric-grid">{metrics.map(([label,value,Icon])=><article className="admin-stat" key={label}><div><span>{label.toUpperCase()}</span><b>{value}</b></div><Icon/></article>)}</section>
    <section className="admin-dashboard-grid">
      <div className="admin-card"><div className="admin-card-head"><div><span>ADMISSIONS QUEUE</span><h2>Requiring attention</h2></div><ClipboardList/></div>{pending.data?.length?<div className="admin-table">{pending.data.map(a=><div key={a.id}><span><b>{a.application_code}</b><small>{a.status.replaceAll("_"," ")}</small></span><time>{new Date(a.created_at).toLocaleDateString("en-IN")}</time><Link href="/admin/applications">Open</Link></div>)}</div>:<div className="empty-state">No pending applications. New admissions will appear here.</div>}</div>
      <div className="admin-card"><div className="admin-card-head"><div><span>OPERATIONS MAP</span><h2>Run the hostel from here</h2></div><Settings2/></div><div className="admin-control-grid">{links.map(([title,href,Icon,desc])=><Link href={href} key={title}><Icon/><span><b>{title}</b><small>{desc}</small></span></Link>)}</div></div>
    </section>
   </div>
  </section>
 </main>
}
