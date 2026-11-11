import "server-only";
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";
import { clientIp, userAgent } from "./request";
import { can, canAccess, type Capability, type Module, type Role } from "@/lib/permissions";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

export const SESSION_COOKIE = "adp_session";
const SESSION_HOURS = 12; // absolute lifetime
const IDLE_MINUTES = 120; // signed out after 2h of inactivity
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/* ───────────── Password hashing (scrypt, per-user salt) ───────────── */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, N, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Used when the email doesn't exist so response time doesn't reveal valid accounts. */
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  if (pw.length > 128) return "Password is too long.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Use letters and at least one number.";
  return null;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/* ───────────── Login with rate limiting ───────────── */
export type LoginResult = { ok: true } | { ok: false; error: string; locked?: boolean };

const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 20;
const LOCK_MINUTES = 15;

export async function login(emailRaw: string, password: string): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase().slice(0, 120);
  const ip = await clientIp();

  const [{ by_email, by_ip }] = await sql<{ by_email: number; by_ip: number }[]>`
    select
      count(*) filter (where email = ${email})::int as by_email,
      count(*) filter (where ip = ${ip})::int as by_ip
    from login_attempts
    where success = false and created_at > now() - make_interval(mins => ${LOCK_MINUTES})`;
  if (by_email >= MAX_FAILS_PER_EMAIL || by_ip >= MAX_FAILS_PER_IP) {
    return { ok: false, locked: true, error: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` };
  }

  const [user] = await sql<{ id: string; password_hash: string; active: boolean }[]>`
    select id, password_hash, active from staff where email = ${email}`;
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

  await sql`insert into login_attempts (email, ip, success) values (${email}, ${ip}, ${valid && !!user?.active})`;
  // keep the attempts table small
  await sql`delete from login_attempts where created_at < now() - interval '7 days'`;

  if (!user || !valid || !user.active) {
    const left = MAX_FAILS_PER_EMAIL - by_email - 1;
    return { ok: false, error: left > 0 ? `Incorrect email or password. ${left} attempt${left === 1 ? "" : "s"} left.` : "Incorrect email or password." };
  }

  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into sessions (token_hash, staff_id, expires_at, ip, user_agent)
    values (${sha256(token)}, ${user.id}, now() + make_interval(hours => ${SESSION_HOURS}), ${ip}, ${await userAgent()})`;
  await sql`update staff set last_login_at = now() where id = ${user.id}`;
  await sql`delete from sessions where expires_at < now()`;

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  await logActivity({ action: "login", entity: "staff", entityId: user.id, summary: "Signed in" }, user.id);
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql`delete from sessions where token_hash = ${sha256(token)}`;
  jar.delete(SESSION_COOKIE);
}

/* ───────────── Session lookup ───────────── */
export type Staff = { id: string; name: string; email: string; role: Role; sessionId: string };

export const getStaff = cache(async (): Promise<Staff | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const [row] = await sql<(Omit<Staff, "sessionId"> & { session_id: string; last_seen_at: Date })[]>`
    select s.id as session_id, s.last_seen_at, u.id, u.name, u.email, u.role
    from sessions s join staff u on u.id = s.staff_id
    where s.token_hash = ${sha256(token)}
      and s.expires_at > now()
      and s.last_seen_at > now() - make_interval(mins => ${IDLE_MINUTES})
      and u.active`;
  if (!row) return null;
  // sliding idle window, written at most every 5 minutes
  if (Date.now() - new Date(row.last_seen_at).getTime() > 5 * 60_000) {
    await sql`update sessions set last_seen_at = now() where id = ${row.session_id}`;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role, sessionId: row.session_id };
});

export class AuthError extends Error {
  constructor(message: string, public code: "unauthenticated" | "forbidden") {
    super(message);
  }
}

/** For server actions / route handlers: throws if not signed in or not permitted. */
export async function requireStaff(module?: Module, capability?: Capability): Promise<Staff> {
  const s = await getStaff();
  if (!s) throw new AuthError("Your session has expired. Please sign in again.", "unauthenticated");
  if (module && !canAccess(s.role, module)) throw new AuthError("Your role doesn't have access to this.", "forbidden");
  if (capability && !can(s.role, capability)) throw new AuthError("Your role isn't allowed to do this.", "forbidden");
  return s;
}

/** For pages: redirects instead of throwing. */
export async function requirePage(module?: Module): Promise<Staff> {
  const s = await getStaff();
  if (!s) redirect("/admin/login");
  if (module && !canAccess(s.role, module)) redirect("/admin?denied=" + module);
  return s;
}

/* ───────────── Activity log ───────────── */
export async function logActivity(
  e: { action: string; entity: string; entityId?: string | null; summary: string; details?: unknown },
  staffId?: string,
) {
  const s = staffId ? null : await getStaff();
  const id = staffId ?? s?.id ?? null;
  const [nameRow] = id ? await sql<{ name: string }[]>`select name from staff where id = ${id}` : [];
  await sql`
    insert into activity_log (staff_id, staff_name, action, entity, entity_id, summary, details, ip)
    values (${id}, ${nameRow?.name ?? null}, ${e.action}, ${e.entity}, ${e.entityId ?? null}, ${e.summary.slice(0, 300)},
            ${e.details === undefined ? null : sql.json(e.details as never)}, ${await clientIp()})`;
}
