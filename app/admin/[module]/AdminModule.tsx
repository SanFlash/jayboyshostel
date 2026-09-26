"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowLeft, Bell, Building2, ClipboardList, Database, Edit3, FileCheck2,
  FileText, IndianRupee, LayoutDashboard, LifeBuoy, Megaphone, Plus, RefreshCw,
  Save, Settings2, ShieldCheck, Trash2, UserRound, Users, WalletCards
} from "lucide-react";

type Row = Record<string, unknown>;
type ModuleConfig = { title: string; table: string; description: string; icon: typeof Users; group: string };

const MODULES: Record<string, ModuleConfig> = {
  website: { title:"Website content", table:"site_content", description:"Control the public homepage copy, calls-to-action and editable sections.", icon:Megaphone, group:"Website" },
  applications: { title:"Admissions", table:"applications", description:"Review, approve, reject and edit admission records.", icon:ClipboardList, group:"Residents" },
  members: { title:"Residents", table:"members", description:"Create, update and manage resident profiles.", icon:Users, group:"Residents" },
  guardians: { title:"Guardians", table:"member_guardians", description:"Manage resident guardian and emergency-contact records.", icon:UserRound, group:"Residents" },
  documents: { title:"Resident documents", table:"documents", description:"Review document metadata and verification state.", icon:FileText, group:"Residents" },
  tenancies: { title:"Stay & allocations", table:"tenancies", description:"Manage check-in, room, bed, rent and checkout information.", icon:Building2, group:"Residents" },
  notifications: { title:"Resident notifications", table:"notifications", description:"Create and manage resident notification records.", icon:Bell, group:"Communication" },
  announcements: { title:"Announcements", table:"announcements", description:"Publish messages to residents.", icon:Megaphone, group:"Communication" },
  complaints: { title:"Complaints & support", table:"complaints", description:"Assign, update and resolve resident complaints.", icon:LifeBuoy, group:"Communication" },
  complaint_comments: { title:"Complaint comments", table:"complaint_comments", description:"Manage complaint conversation and internal notes.", icon:LifeBuoy, group:"Communication" },
  rooms: { title:"Rooms", table:"rooms", description:"Create and update rooms, rates, capacity and status.", icon:Building2, group:"Hostel" },
  beds: { title:"Beds", table:"beds", description:"Manage bed inventory and availability.", icon:Building2, group:"Hostel" },
  hostels: { title:"Hostel profile", table:"hostels", description:"Manage hostel identity, contact and address.", icon:Building2, group:"Hostel" },
  buildings: { title:"Buildings", table:"buildings", description:"Manage hostel buildings.", icon:Building2, group:"Hostel" },
  floors: { title:"Floors", table:"floors", description:"Manage floors and ordering.", icon:Building2, group:"Hostel" },
  document_types: { title:"Document types", table:"document_types", description:"Configure required resident documents.", icon:FileCheck2, group:"Hostel" },
  pricing: { title:"Pricing plans", table:"pricing_plans", description:"Manage room pricing and billing methods.", icon:IndianRupee, group:"Hostel" },
  billing: { title:"Invoices", table:"invoices", description:"Manage invoices, totals, due dates and payment status.", icon:WalletCards, group:"Finance" },
  invoice_items: { title:"Invoice items", table:"invoice_items", description:"Manage individual invoice line items.", icon:WalletCards, group:"Finance" },
  payments: { title:"Payments", table:"payments", description:"Record and correct resident payments.", icon:IndianRupee, group:"Finance" },
  settings: { title:"System settings", table:"settings", description:"Control application settings.", icon:Settings2, group:"System" },
  feature_flags: { title:"Feature flags", table:"feature_flags", description:"Enable or disable platform modules.", icon:Activity, group:"System" },
  roles: { title:"Roles & permissions", table:"user_roles", description:"Grant or revoke application roles.", icon:ShieldCheck, group:"System" },
  profiles: { title:"User profiles", table:"profiles", description:"Manage authenticated user profiles and status.", icon:UserRound, group:"System" },
  audit: { title:"Audit log", table:"audit_logs", description:"Inspect administrative changes and history.", icon:Database, group:"System" },
};

const NAV: Array<[string,string,string]> = [
  ["Overview","/admin","dashboard"],["Website","/admin/website","website"],
  ["Residents","/admin/members","members"],["Admissions","/admin/applications","applications"],
  ["Guardians","/admin/guardians","guardians"],["Documents","/admin/documents","documents"],
  ["Stay & Allocations","/admin/tenancies","tenancies"],["Rooms","/admin/rooms","rooms"],["Beds","/admin/beds","beds"],
  ["Invoices","/admin/billing","billing"],["Payments","/admin/payments","payments"],
  ["Complaints","/admin/complaints","complaints"],["Announcements","/admin/announcements","announcements"],
  ["Notifications","/admin/notifications","notifications"],["Hostel Profile","/admin/hostels","hostels"],
  ["Buildings","/admin/buildings","buildings"],["Floors","/admin/floors","floors"],["Pricing","/admin/pricing","pricing"],
  ["Document Types","/admin/document_types","document_types"],["Settings","/admin/settings","settings"],
  ["Feature Flags","/admin/feature_flags","feature_flags"],["Roles","/admin/roles","roles"],["Audit Log","/admin/audit","audit"]
];

const NEW_RECORDS: Record<string, Row> = {
  site_content:{key:"new_section",section:"home",title:"",subtitle:"",body:"",cta_label:"",cta_href:"",value:{},active:true},
  members:{full_name:"",phone:"",email:"",father_name:"",mother_name:"",institution:"",course:"",academic_year:"",address:"",city:"Indore",state:"Madhya Pradesh",postal_code:"",status:"active"},
  member_guardians:{member_id:"",name:"",relationship:"Father",phone:"",alternate_phone:"",address:""},
  hostels:{name:"Jay Boys Hostel",address:"",city:"Indore",state:"Madhya Pradesh",postal_code:"",phone:"",email:""},
  buildings:{hostel_id:"",name:"",sort_order:0}, floors:{building_id:"",name:"",sort_order:0},
  rooms:{floor_id:"",room_number:"",room_type:"4 Sharing",capacity:4,monthly_rate:0,daily_rate:0,security_deposit:0,status:"available",notes:""},
  beds:{room_id:"",bed_label:"",status:"available"},
  applications:{application_code:"JBS-",member_id:"",status:"submitted",admin_note:""},
  documents:{member_id:"",document_type_id:"",storage_path:"",original_filename:"",mime_type:"",status:"uploaded",verification_note:""},
  tenancies:{member_id:"",room_id:"",bed_id:"",check_in_date:"",billing_start_date:"",expected_checkout_date:"",rent_amount:0,security_deposit:0,status:"active",notes:""},
  pricing_plans:{hostel_id:"",name:"",room_type:"",monthly_rate:0,daily_rate:0,billing_method:"fixed_30_days",active:true},
  invoices:{invoice_number:"JBS-INV-",member_id:"",period_start:"",period_end:"",due_date:"",subtotal:0,discount:0,late_fee:0,total:0,paid_amount:0,status:"draft"},
  invoice_items:{invoice_id:"",description:"",quantity:1,unit_price:0,total:0},
  payments:{payment_number:"JBS-PAY-",member_id:"",invoice_id:"",amount:0,method:"cash",transaction_id:"",notes:""},
  complaints:{member_id:"",room_id:"",title:"",description:"",category:"Other",priority:"normal",status:"submitted"},
  complaint_comments:{complaint_id:"",author_id:"",body:"",internal:false},
  announcements:{hostel_id:"",title:"",message:"",priority:"normal",audience:"all_members"},
  notifications:{user_id:"",title:"",body:"",type:"general"},
  document_types:{hostel_id:"",name:"",required_for_application:true,active:true},
  settings:{key:"",value:{},updated_by:""}, feature_flags:{key:"",enabled:true},
  user_roles:{user_id:"",role:"staff"}, profiles:{full_name:"",email:"",phone:"",is_active:true}
};

function parseValue(value: unknown) {
  if (typeof value === "object" && value !== null) return JSON.stringify(value, null, 2);
  return String(value ?? "");
}

export default function AdminModule({ module }: { module: string }) {
  const config = MODULES[module] ?? MODULES.website;
  const Icon = config.icon;
  const [rows,setRows]=useState<Row[]>([]);
  const [selected,setSelected]=useState<Row|null>(null);
  const [json,setJson]=useState("{}");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const parsed = useMemo<Row>(()=>{try{return JSON.parse(json)}catch{return {}}},[json]);

  async function load(){
    setBusy(true); setMessage("");
    try{
      const response=await fetch(`/api/admin/data?table=${encodeURIComponent(config.table)}&limit=200`,{cache:"no-store",credentials:"same-origin"});
      const payload=await response.json();
      if(!response.ok) throw new Error(payload.error||"Unable to load records.");
      setRows(payload.data||[]);
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to load records.");}
    finally{setBusy(false);}
  }

  useEffect(()=>{void load()},[config.table]);

  function edit(row:Row){
    setSelected(row);
    setJson(JSON.stringify(Object.fromEntries(Object.entries(row).filter(([key])=>!["id","created_at","updated_at"].includes(key))),null,2));
    setMessage("");
  }
  function newRecord(){setSelected(null);setJson(JSON.stringify(NEW_RECORDS[config.table]??{},null,2));setMessage("");}
  function selectorFor(row:Row|null){
    if(!row)return undefined;
    if(["settings","feature_flags","site_content"].includes(config.table))return {key:String(row.key)};
    if(config.table==="user_roles")return {user_id:String(row.user_id),role:String(row.role)};
    return undefined;
  }
  async function save(){
    setBusy(true);setMessage("");
    try{
      const data=JSON.parse(json) as Row;
      const response=await fetch("/api/admin/data",{method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({table:config.table,id:selected?.id,selector:selected&&!selected.id?selectorFor(selected):undefined,data})});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||"Save failed.");
      setMessage("Saved successfully.");await load();if(payload.data)edit(payload.data);
    }catch(error){setMessage(error instanceof Error?error.message:"Invalid record data.");}
    finally{setBusy(false);}
  }
  async function remove(row:Row){
    const selector=selectorFor(row);
    if((!row.id&&!selector)||!window.confirm("Delete this record permanently?"))return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/data",{method:"DELETE",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({table:config.table,id:row.id,selector:row.id?undefined:selector})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Delete failed.");
      setSelected(null);newRecord();setMessage("Record deleted.");await load();
    }catch(error){setMessage(error instanceof Error?error.message:"Delete failed.");}
    finally{setBusy(false);}
  }

  const groups = ["Website","Residents","Hostel","Finance","Communication","System"];
  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>ADMIN COMMAND</small></span></Link>
      <div className="admin-nav">{groups.map(group=><div className="admin-nav-group" key={group}><span>{group}</span>{NAV.filter(n=>MODULES[n[2]]?.group===group || (group==="Website"&&n[2]==="website")).map(([label,href,key])=><Link className={module===key?"active":""} href={href} key={key}>{key==="website"?<Megaphone size={15}/>:key==="members"?<Users size={15}/>:key==="billing"?<WalletCards size={15}/>:key==="complaints"?<LifeBuoy size={15}/>:<Icon size={15}/>}<span>{label}</span></Link>)}</div>)}</div>
      <div className="admin-sidebar-foot"><Link href="/api/auth/signout">Sign out</Link><Link href="/">View website</Link></div>
    </aside>
    <section className="admin-main">
      <header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>ADMIN</small></span></Link><Link href="/api/auth/signout" className="icon-button"><ArrowLeft size={15}/></Link></header>
      <div className="admin-content">
        <div className="admin-breadcrumb"><Link href="/admin"><LayoutDashboard size={14}/> Dashboard</Link><span>/</span><b>{config.title}</b></div>
        <div className="admin-page-head"><div><div className="eyebrow"><Icon size={14}/> {config.group.toUpperCase()} / CONTROL</div><h1>{config.title}</h1><p>{config.description}</p></div><div className="admin-head-actions"><button className="button ghost" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Refresh</button><button className="button primary" onClick={newRecord}><Plus size={15}/> New</button></div></div>
        {message&&<div className={message.includes("success")||message.includes("Saved")?"admin-success":"admin-error"}>{message}</div>}
        <div className="admin-editor-grid">
          <div className="admin-card">
            <div className="admin-card-head"><div><span>LIVE RECORDS</span><h2>{rows.length} records</h2></div><Database size={18}/></div>
            <div className="admin-record-list">{rows.length?rows.map(row=><article key={String(row.id??row.key??JSON.stringify(row))} className={selected&&selected.id===row.id?"admin-record active":"admin-record"}><div className="admin-record-main"><b>{String(row.application_code??row.member_code??row.room_number??row.invoice_number??row.payment_number??row.title??row.name??row.key??row.id??"Record")}</b><small>{String(row.status??row.priority??row.email??row.role??row.body??"")}</small></div><div className="admin-record-actions"><button className="icon-button" onClick={()=>edit(row)}><Edit3 size={14}/></button><button className="icon-button danger" onClick={()=>void remove(row)}><Trash2 size={14}/></button></div></article>):<div className="empty-state">No records yet. Create the first record.</div>}</div>
          </div>
          <div className="admin-card admin-form-card">
            <div className="admin-card-head"><div><span>{selected?"EDIT":"CREATE"}</span><h2>{selected?"Update record":"New record"}</h2></div><Save size={18}/></div>
            <p className="editor-help">Use the structured JSON editor for advanced fields. IDs must reference existing records.</p>
            <textarea className="admin-json-editor" value={json} onChange={e=>setJson(e.target.value)} spellCheck={false}/>
            <div className="admin-form-preview">{Object.entries(parsed).slice(0,6).map(([key,value])=><span key={key}><b>{key.replaceAll("_"," ")}</b>{parseValue(value).slice(0,55)}</span>)}</div>
            <button className="button primary full" onClick={()=>void save()} disabled={busy}><Save size={15}/>{busy?"Saving…":selected?"Update record":"Create record"}</button>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
