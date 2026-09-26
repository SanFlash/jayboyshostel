"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, Database, RefreshCw, ServerCrash, ShieldCheck } from "lucide-react";

type Health = {
  ok:boolean;
  framework:string;
  checkedAt:string;
  environment:Record<string,boolean>;
  tables:{table:string;ok:boolean;error:string|null}[];
  missingTables:string[];
};

export default function AdminHealthPage(){
  const [health,setHealth]=useState<Health|null>(null);
  const [loading,setLoading]=useState(true);

  async function load(){
    setLoading(true);
    try{
      const response=await fetch("/api/admin/health",{cache:"no-store"});
      const data=await response.json();
      setHealth(data);
    }catch{
      setHealth(null);
    }finally{setLoading(false);}
  }

  useEffect(()=>{void load()},[]);

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand"><span className="brand-mark"><Activity size={18}/></span><span><b>JAY BOYS</b><small>HEALTH CENTER</small></span></Link>
      <div className="admin-nav">
        <div className="admin-nav-group"><span>COMMAND</span><Link href="/admin"><Activity size={15}/><span>Overview</span></Link><Link className="active" href="/admin/health"><ShieldCheck size={15}/><span>System health</span></Link><Link href="/admin/analytics"><Database size={15}/><span>Analytics</span></Link></div>
      </div>
      <div className="admin-sidebar-foot"><Link href="/admin">Back to admin</Link><Link href="/">View website</Link></div>
    </aside>
    <section className="admin-main">
      <header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Activity size={17}/></span><span><b>JAY BOYS</b><small>HEALTH</small></span></Link></header>
      <div className="admin-content">
        <div className="admin-page-head">
          <div><div className="eyebrow"><ShieldCheck size={14}/> PLATFORM DIAGNOSTICS</div><h1>System health.</h1><p>Run the same checks the production console depends on. Missing database migrations are reported instead of appearing as mysterious blank screens.</p></div>
          <button className="button primary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading?"spin":""}/> Recheck</button>
        </div>

        {!health ? <div className="admin-error"><ServerCrash size={15}/> Health endpoint could not be reached. Check the deployment logs and server environment variables.</div> :
        <>
          <div className={health.ok?"admin-success":"admin-error"}>{health.ok?<CheckCircle2 size={15}/>:<ServerCrash size={15}/>} {health.ok?"All required framework checks are passing.":"Setup is incomplete. Use the failing items below to finish the deployment."}</div>
          <section className="admin-card" style={{marginTop:12}}>
            <div className="admin-card-head"><div><span>ENVIRONMENT</span><h2>Server configuration</h2></div><ShieldCheck/></div>
            <div className="admin-form-preview">{Object.entries(health.environment).map(([key,value])=><span key={key}><b>{key}</b>{value?"Configured":"Missing"}</span>)}</div>
          </section>
          <section className="admin-card" style={{marginTop:12}}>
            <div className="admin-card-head"><div><span>DATABASE</span><h2>Required tables</h2></div><Database/></div>
            <div className="admin-record-list">{health.tables.map(item=><div className="admin-record" key={item.table}><div className="admin-record-main"><b>{item.table}</b><small>{item.ok?"Available":item.error||"Unavailable"}</small></div>{item.ok?<CheckCircle2 size={17} className="icon-ok"/>:<ServerCrash size={17}/>}</div>)}</div>
          </section>
          <div className="admin-card" style={{marginTop:12}}>
            <div className="admin-card-head"><div><span>RELEASE</span><h2>{health.framework}</h2></div><Activity/></div>
            <p className="editor-help" style={{marginTop:10}}>Checked {new Date(health.checkedAt).toLocaleString("en-IN")}. If tables are missing, apply Supabase migrations 001 → 002 → 003 from the repository, then recheck.</p>
          </div>
        </>}
      </div>
    </section>
  </main>
}
