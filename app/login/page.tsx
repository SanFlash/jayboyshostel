"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, LockKeyhole, ShieldCheck } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const ADMIN_EMAIL = "jayboys@gmail.com";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"member" | "staff">("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // A valid configured admin credential automatically provisions the
      // Supabase Auth user + profile + super_admin role before sign-in.
      if (mode === "staff" && normalizedEmail === ADMIN_EMAIL) {
        const provision = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        if (!provision.ok) {
          const payload = await provision.json().catch(() => null);
          throw new Error(payload?.error || "Admin account is not configured on the server.");
        }
      }

      const { error: signInError } = await createSupabaseBrowser().auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) throw signInError;

      router.push(mode === "staff" ? "/admin" : "/member");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-grid">
        <section className="auth-visual">
          <Link href="/" className="back-link"><ArrowLeft size={15} /> Back</Link>
          <div>
            <span className="eyebrow"><Building2 size={14} /> JAY BOYS HOSTEL</span>
            <h1>One login.<br /><em>One place.</em></h1>
            <p>Resident access and staff operations share the same secure identity layer.</p>
          </div>
          <div className="auth-points">
            <span><ShieldCheck /> Supabase Auth</span>
            <span><LockKeyhole /> Role-aware access</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-form">
            <div className="mode-switch">
              {(["member", "staff"] as const).map((x) => (
                <button key={x} type="button" onClick={() => setMode(x)} className={mode === x ? "active" : ""}>
                  {x === "member" ? "Resident" : "Staff"}
                </button>
              ))}
            </div>

            <span className="eyebrow"><LockKeyhole size={14} /> SECURE SIGN IN</span>
            <h2>{mode === "member" ? "Resident portal" : "Staff console"}</h2>
            <p>{mode === "staff" ? "Use the Jay Boys Hostel administrator credentials." : "Use credentials registered in Supabase Auth."}</p>

            <form onSubmit={submit}>
              <label>Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder={mode === "staff" ? ADMIN_EMAIL : "you@example.com"}
                />
              </label>
              <label>Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>

              {error && <div className="form-error">{error}</div>}

              <button className="button primary full" disabled={busy}>
                {busy ? "Signing in…" : "Continue"}
              </button>
            </form>

            <div className="auth-foot">New applicant? <Link href="/apply">Start an application</Link></div>
          </div>
        </section>
      </div>
    </main>
  );
}
