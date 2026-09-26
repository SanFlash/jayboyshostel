export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, BedDouble, Building2, ClipboardList, FileCheck2, IndianRupee, LogOut, MessageSquareWarning, Users, Megaphone, WalletCards, Settings2, ShieldCheck, Activity } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";

const links=[
  ["Website Control","/admin/website",Megaphone,"Edit homepage content, CTA and public messaging"],
  ["Residents","/admin/members",Users,"Resident profiles, status and contact details"],
  ["Admissions","/admin/applications",ClipboardList,"Applications and admission review queue"],
  ["Stay & Allocations","/admin/tenancies",Building2,"Check-in, room, bed, rent and checkout"],
  ["Rooms & Beds","/admin/rooms",BedDouble,"Inventory and occupancy structure"],
  ["Billing","/admin/billing",WalletCards,"Invoices and billing records"],
  ["Payments","/admin/payments",IndianRupee,"Payment collection and reconciliation records"],
  ["Documents","/admin/documents",FileCheck2,"Resident document verification"],
  ["Complaints","/admin/complaints",AlertTriangle,"Support, assignment and resolution"],
  ["Communication","/admin/announcements",MessageSquareWarning,"Announcements and resident notifications"],
  ["Hostel Setup","/admin/hostels",Building2,"Hostel, buildings, floors and pricing"],
  ["Security & Roles","/admin/roles",ShieldCheck,"Access roles and permissions"],
  ["System Settings","/admin/settings",Settings2,"Platform configuration and feature flags"],
  ["Audit Log","/admin/audit",Activity,"Administrative activity history"]
] as const;

export default async function AdminPage(){
 const {db:supabase}=await requireAdmin();
 const [members,apps,rooms,beds,complaints,invoices,payments,pending]=await Promise.all([
  supabase.from("members").select("id",{count:"exact",head:true}),
  supabase.from("applications").select("id",{count:"exact",head:true}).in("status",["submitted","under_review","documents_required"]),
  supabase.from("rooms").select("id",{count:"exact",head:true}),
  supabase.from("beds").select("id",{count:"exact",head:true}).eq("status","available"),
  supabase.from("complaints").select("id",{count:"exact",head:true}).in("status",["submitted","acknowledged","assigned","in_progress","reopened"]),
  supabase.from("invoices").select("id",{count:"exact",head:true}).in("status",["issued","partially_paid","overdue"]),
  supabase.from("payments").select("id",{count:"exact",head:true}),
  supabase.from("applications").select("id,application_code,status,created_at").in("status",["submitted","under_review","documents_required"]).order("created_at",{ascending:false}).limit(8)
 ]);
 const metrics=[["Residents",members.count||0,Users],["Rooms",rooms.count||0,Building2],["Free beds",beds.count||0,BedDouble],["Admissions",apps.count||0,ClipboardList],["Open complaints",complaints.count||0,AlertTriangle],["Open invoices",invoices.count||0,WalletCards],["Payments",payments.count||0,IndianRupee]] as const;
 return <main className="admin-app">
  <aside className="admin-sidebar">
   <Link href="/admin" className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>ADMIN COMMAND</small></span></Link>
   <div className="admin-nav"><div className="admin-nav-group"><span>CONTROL CENTER</span><Link className="active" href="/admin"><Activity size={15}/><span>Overview</span></Link><Link href="/admin/website"><Megaphone size={15}/><span>Website Control</span></Link><Link href="/admin/members"><Users size={15}/><span>Residents</span></Link><Link href="/admin/applications"><ClipboardList size={15}/><span>Admissions</span></Link><Link href="/admin/tenancies"><Building2 size={15}/><span>Stay & Allocations</span></Link></div><div className="admin-nav-group"><span>OPERATIONS</span><Link href="/admin/rooms"><BedDouble size={15}/><span>Rooms & Beds</span></Link><Link href="/admin/billing"><WalletCards size={15}/><span>Billing</span></Link><Link href="/admin/payments"><IndianRupee size={15}/><span>Payments</span></Link><Link href="/admin/documents"><FileCheck2 size={15}/><span>Documents</span></Link><Link href="/admin/complaints"><AlertTriangle size={15}/><span>Complaints</span></Link><Link href="/admin/announcements"><MessageSquareWarning size={15}/><span>Communication</span></Link></div><div className="admin-nav-group"><span>CONFIGURATION</span><Link href="/admin/hostels"><Building2 size={15}/><span>Hostel Setup</span></Link><Link href="/admin/roles"><ShieldCheck size={15}/><span>Security & Roles</span></Link><Link href="/admin/settings"><Settings2 size={15}/><span>System Settings</span></Link><Link href="/admin/audit"><Activity size={15}/><span>Audit Log</span></Link></div></div>
   <div className="admin-sidebar-foot"><Link href="/api/auth/signout"><LogOut size={14}/> Sign out</Link><Link href="/">View website</Link></div>
  </aside>
  <section className="admin-main"><header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>ADMIN</small></span></Link><Link href="/api/auth/signout" className="icon-button"><LogOut size={15}/></Link></header>
   <div className="admin-content">
    <div className="admin-page-head"><div><div className="eyebrow"><Activity size={14}/> LIVE OPERATIONS / SUPER ADMIN</div><h1>Command center.</h1><p>Control the public website, resident lifecycle, hostel operations, finance, communication and platform security from one place.</p></div><Link href="/admin/website" className="button primary"><Megaphone size={15}/> Edit website</Link></div>
    <section className="admin-metric-grid">{metrics.map(([label,value,Icon])=><article className="admin-stat" key={label}><div><span>{label.toUpperCase()}</span><b>{value}</b></div><Icon/></article>)}</section>
    <section className="admin-dashboard-grid"><div className="admin-card"><div className="admin-card-head"><div><span>WORK QUEUE</span><h2>Admissions requiring attention</h2></div><ClipboardList/></div>{pending.data?.length?<div className="admin-table">{pending.data.map(a=><div key={a.id}><span><b>{a.application_code}</b><small>{a.status.replaceAll("_"," ")}</small></span><time>{new Date(a.created_at).toLocaleDateString("en-IN")}</time><Link href="/admin/applications">Open</Link></div>)}</div>:<div className="empty-state">No pending applications.</div>}</div>
    <div className="admin-card"><div className="admin-card-head"><div><span>CONTROL AREAS</span><h2>Everything in one panel</h2></div><Settings2/></div><div className="admin-control-grid">{links.map(([title,href,Icon,desc])=><Link href={href} key={title}><Icon/><span><b>{title}</b><small>{desc}</small></span></Link>)}</div></div></section>
   </div>
  </section>
 </main>
}
