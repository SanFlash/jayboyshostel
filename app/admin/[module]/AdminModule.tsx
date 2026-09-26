"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Edit3, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

const MODULES: Record<string, { title: string; table: string; description: string }> = {
  applications: { title: "Applications", table: "applications", description: "Review, approve, reject and edit admission records." },
  members: { title: "Members", table: "members", description: "Manage resident profiles and account status." },
  rooms: { title: "Rooms", table: "rooms", description: "Create and update rooms, rates, capacity and status." },
  beds: { title: "Beds", table: "beds", description: "Manage bed inventory and availability." },
  billing: { title: "Invoices", table: "invoices", description: "Manage invoices, totals, due dates and payment status." },
  payments: { title: "Payments", table: "payments", description: "Record and correct resident payments." },
  complaints: { title: "Complaints", table: "complaints", description: "Update complaints, priority, assignment and resolution." },
  announcements: { title: "Announcements", table: "announcements", description: "Publish and modify resident announcements." },
  documents: { title: "Documents", table: "documents", description: "Review document metadata and verification state." },
  tenancies: { title: "Tenancies", table: "tenancies", description: "Manage allocations, check-in/out and rent." },
  pricing: { title: "Pricing plans", table: "pricing_plans", description: "Manage room pricing and billing methods." },
  buildings: { title: "Buildings", table: "buildings", description: "Manage hostel buildings and ordering." },
  floors: { title: "Floors", table: "floors", description: "Manage floors and ordering." },
  hostels: { title: "Hostel settings", table: "hostels", description: "Manage hostel identity, contact and address data." },
  document_types: { title: "Document types", table: "document_types", description: "Configure required resident documents." },
  notifications: { title: "Notifications", table: "notifications", description: "Manage notification records and delivery state." },
  settings: { title: "System settings", table: "settings", description: "Modify application settings. Super admin only." },
  feature_flags: { title: "Feature flags", table: "feature_flags", description: "Enable or disable platform modules. Super admin only." },
  roles: { title: "User roles", table: "user_roles", description: "Grant or revoke application roles. Super admin only." },
  audit: { title: "Audit log", table: "audit_logs", description: "Inspect administrative mutations and history." },
};

type Row = Record<string, unknown>;

export default function AdminModule({ module }: { module: string }) {
  const config = MODULES[module] ?? MODULES.applications;
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [json, setJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/data?table=${encodeURIComponent(config.table)}&limit=150`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load records.");
      setRows(payload.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load records.");
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, [config.table]);

  function edit(row: Row) {
    setSelected(row);
    setJson(JSON.stringify(row, null, 2));
    setMessage("");
  }

  function newRecord() {
    setSelected(null);
    setJson("{}");
    setMessage("");
  }

  async function save() {
    setBusy(true); setMessage("");
    try {
      const data = JSON.parse(json) as Row;
      const response = await fetch("/api/admin/data", {
        method: selected?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: config.table, id: selected?.id, data }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Save failed.");
      setMessage("Saved successfully.");
      await load();
      if (payload.data) edit(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid record data.");
    } finally { setBusy(false); }
  }

  async function remove(row: Row) {
    if ((!row.id && !selectorFor(row)) || !window.confirm("Delete this record permanently? This action cannot be undone.")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: config.table, id: row.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Delete failed.");
      if (selected?.id === row.id) newRecord();
      setMessage("Record deleted.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally { setBusy(false); }
  }

  return <main className="dashboard-page">
    <header className="dash-top">
      <Link href="/admin" className="brand"><span className="brand-mark"><Database size={18}/></span><span><b>JAY BOYS</b><small>ADMIN CONTROL</small></span></Link>
      <Link href="/admin" className="icon-button"><ArrowLeft size={16}/></Link>
    </header>
    <div className="dash-wrap">
      <div className="dash-heading">
        <span className="eyebrow"><Database size={14}/> ADMIN MANAGEMENT</span>
        <h1>{config.title}</h1>
        <p>{config.description} Changes are performed server-side and recorded in the audit log.</p>
      </div>

      <div className="admin-toolbar">
        <button className="button primary" onClick={newRecord}><Plus size={16}/> New record</button>
        <button className="button ghost" onClick={() => void load()} disabled={busy}><RefreshCw size={16}/> Refresh</button>
        {message && <span className="admin-message">{message}</span>}
      </div>

      <section className="admin-editor-grid">
        <div className="panel">
          <div className="panel-head"><div><span>RECORDS</span><h2>{rows.length} loaded</h2></div><Database/></div>
          {rows.length ? <div className="admin-record-list">{rows.map((row) => <article key={String(row.id)} className={selected?.id === row.id ? "admin-record active" : "admin-record"}>
            <div className="admin-record-main">
              <b>{String(row.application_code ?? row.member_code ?? row.room_number ?? row.invoice_number ?? row.payment_number ?? row.title ?? row.name ?? row.key ?? row.id ?? "Record")}</b>
              <small>{String(row.status ?? row.priority ?? row.email ?? row.role ?? row.message ?? "")}</small>
            </div>
            <div className="admin-record-actions">
              <button className="icon-button" title="Edit" onClick={() => edit(row)}><Edit3 size={15}/></button>
              <button className="icon-button danger" title="Delete" onClick={() => void remove(row)}><Trash2 size={15}/></button>
            </div>
          </article>)}</div> : <div className="empty-state">No records found. Use “New record” to create one.</div>}
        </div>

        <div className="panel admin-editor">
          <div className="panel-head"><div><span>{selected?.id ? "EDIT RECORD" : "CREATE RECORD"}</span><h2>Data editor</h2></div><Save/></div>
          <p className="editor-help">Advanced admin editor. Use valid database column names and JSON values. The API enforces authentication and role permissions.</p>
          <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} aria-label="Record JSON"/>
          <button className="button primary full" onClick={() => void save()} disabled={busy}><Save size={16}/> {busy ? "Saving…" : selected?.id ? "Update record" : "Create record"}</button>
        </div>
      </section>
    </div>
  </main>;
}
