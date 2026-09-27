import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { Activity, ArrowLeft, BedDouble, Building2, IndianRupee, Users, WalletCards, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

async function count(db:any, table:string, filter?:[string,string[]]){
  let query=db.from(table).select("id",{count:"exact",head:true});
  if(filter) query=query.in(filter[0],filter[1]);
  const result=await query;
  return result.count||0;
}

export default async function AnalyticsPage(){
  const {db}=await requireAdmin();
  const [residents,rooms,beds,openComplaints,maintenance,invoices,payments]=await Promise.all([
    count(db,"members"),count(db,"rooms"),count(db,"beds",["status",["available"]]),
    count(db,"complaints",["status",["submitted","acknowledged","assigned","in_progress","reopened"]]),
    count(db,"maintenance_requests",["status",["open","assigned","in_progress"]]),
    count(db,"invoices",["status",["issued","partially_paid","overdue"]]),
    count(db,"payments")
  ]);

  const cards=[
    ["Residents",residents,Users],["Rooms",rooms,Building2],["Free beds",beds,BedDouble],
    ["Open complaints",openComplaints,Activity],["Maintenance queue",maintenance,Wrench],
    ["Open invoices",invoices,WalletCards],["Payments recorded",payments,IndianRupee]
  ] as const;

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" prefetch={false} className="admin-brand"><span className="brand-mark"><Activity size={18}/></span><span><b>JAY BOYS</b><small>ANALYTICS</small></span></Link>
      <div className="admin-nav"><div className="admin-nav-group"><span>COMMAND</span><Link href="/admin" prefetch={false}><Activity size={15}/><span>Overview</span></Link><Link className="active" href="/admin/analytics" prefetch={false}><Activity size={15}/><span>Analytics</span></Link><Link href="/admin/health" prefetch={false}><Wrench size={15}/><span>System health</span></Link></div></div>
      <div className="admin-sidebar-foot"><Link href="/admin" prefetch={false}>Back to admin</Link></div>
    </aside>
    <section className="admin-main"><header className="admin-mobile-head"><Link href="/admin" prefetch={false} className="brand"><span className="brand-mark"><Activity size={17}/></span><span><b>JAY BOYS</b><small>ANALYTICS</small></span></Link></header>
      <div className="admin-content">
        <div className="admin-page-head"><div><div className="eyebrow"><Activity size={14}/> OPERATIONS INTELLIGENCE</div><h1>Analytics.</h1><p>Live operational counts sourced directly from the admin database. Use the module workspaces for record-level actions.</p></div><Link className="button" href="/admin"><ArrowLeft size={15}/> Command center</Link></div>
        <section className="admin-metric-grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))"}}>{cards.map(([label,value,Icon])=><article className="admin-stat" key={label}><div><span>{label.toUpperCase()}</span><b>{value}</b></div><Icon/></article>)}</section>
        <section className="admin-dashboard-grid">
          <div className="admin-card"><div className="admin-card-head"><div><span>OPERATING MODEL</span><h2>Core workflows</h2></div><Activity/></div>
            <div className="admin-control-grid">
              <Link href="/admin/applications" prefetch={false}><Activity/><span><b>Admissions</b><small>Application → review → approval → resident.</small></span></Link>
              <Link href="/admin/tenancies" prefetch={false}><Building2/><span><b>Allocation</b><small>Resident → room → bed → billing.</small></span></Link>
              <Link href="/admin/billing" prefetch={false}><WalletCards/><span><b>Billing</b><small>Invoice → payment → reconciliation.</small></span></Link>
              <Link href="/admin/maintenance" prefetch={false}><Wrench/><span><b>Maintenance</b><small>Issue → assignment → resolution.</small></span></Link>
            </div>
          </div>
          <div className="admin-card"><div className="admin-card-head"><div><span>QUALITY GATE</span><h2>Deployment checks</h2></div><Wrench/></div><p className="editor-help">Open System Health after every production deployment. It checks the required tables and environment configuration without exposing secrets.</p><Link className="button primary" style={{marginTop:16}} href="/admin/health">Run system health</Link></div>
        </section>
      </div>
    </section>
  </main>
}
