import Link from "next/link";
import { IndianRupee, LogOut, ReceiptText, WalletCards } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
export const dynamic="force-dynamic";
export default async function FinancePage(){
 const {db}=await requireAdmin();
 const [invoices,payments,expenses]=await Promise.all([
  db.from("invoices").select("id",{count:"exact",head:true}).in("status",["issued","partially_paid","overdue"]),
  db.from("payments").select("id",{count:"exact",head:true}),
  db.from("expenses").select("id",{count:"exact",head:true}),
 ]);
 const cards=[["Outstanding invoices",invoices.count||0,"/admin/billing",WalletCards,"Review resident billing and invoice status."],["Payments recorded",payments.count||0,"/admin/payments",IndianRupee,"Record and reconcile resident payments."],["Operating expenses",expenses.count||0,"/admin/expenses",ReceiptText,"Track hostel operating costs."]] as const;
 return <main className="admin-app"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand" prefetch={false}>JAY BOYS</Link><div className="admin-nav"><div className="admin-nav-group"><span>CORE WORKSPACE</span><Link href="/admin" prefetch={false}>Overview</Link><Link href="/admin/floor-map" prefetch={false}>Floor Occupancy</Link><Link href="/admin/members" prefetch={false}>Residents</Link><Link href="/admin/applications" prefetch={false}>Admissions</Link><Link href="/admin/billing" prefetch={false} className="active">Finance</Link><Link href="/admin/operations" prefetch={false}>Operations</Link><Link href="/admin/complaints" prefetch={false}>Complaints</Link></div><div className="admin-nav-group"><span>CONTROL</span><Link href="/admin/website" prefetch={false}>Website</Link><Link href="/admin/settings" prefetch={false}>Settings</Link></div></div><div className="admin-sidebar-foot"><Link href="/api/auth/signout" prefetch={false}><LogOut size={13}/> Sign out</Link></div></aside>
 <section className="admin-main"><div className="admin-content"><div className="admin-page-head"><div><div className="eyebrow"><IndianRupee size={14}/> FINANCE</div><h1>Finance hub.</h1><p>Invoices, payments and operating expenses in one focused financial workspace.</p></div></div><section className="admin-metric-grid">{cards.map(([title,count])=><article className="admin-stat" key={title}><div><span>{title.toUpperCase()}</span><b>{count}</b></div><IndianRupee/></article>)}</section><div className="admin-dashboard-grid" style={{marginTop:12}}>{cards.map(([title,count,href,Icon,desc])=><Link className="admin-card admin-control-grid" href={href} prefetch={false} key={title}><Icon/><span><b>{title}</b><small>{desc}</small></span></Link>)}</div></div></section></main>
}
