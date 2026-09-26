import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "jay_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Server Supabase configuration is incomplete.");
  return value;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createAdminSession(userId: string, email: string) {
  const payload = JSON.stringify({
    sub: userId,
    email,
    role: "super_admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSession(value?: string | null) {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(decode(encoded)) as {
      sub?: string;
      email?: string;
      role?: string;
      exp?: number;
    };
    if (!payload.sub || !payload.email || payload.role !== "super_admin") return null;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.sub, email: payload.email, role: "super_admin" as const };
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_SECONDS;
