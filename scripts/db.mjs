#!/usr/bin/env node
/**
 * Database helper.
 *   node scripts/db.mjs migrate        → apply supabase/migrations/*.sql
 *   node scripts/db.mjs seed           → apply supabase/seed.sql (catalogue, content, coupons)
 *   node scripts/db.mjs demo           → add DEMO customers, orders, prescriptions & pending reviews (for trying the admin)
 *   node scripts/db.mjs create-owner   → create the first Owner login (prompts, or ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME)
 * Reads DATABASE_URL (and optional SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) from .env.local or the environment.
 */
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes, randomUUID, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import postgres from "postgres";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
for (const f of [".env.local", ".env"]) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: local || process.env.DATABASE_SSL === "disable" ? false : "require", onnotice: () => {} });

const scrypt = promisify(_scrypt);
async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scrypt(pw.normalize("NFKC"), salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function runFile(file) {
  await sql.unsafe(readFileSync(file, "utf8"));
  console.log("✓", path.relative(root, file));
}

async function migrate() {
  const dir = path.join(root, "supabase", "migrations");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await runFile(path.join(dir, f));
}

async function createOwner() {
  let { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name } = process.env;
  if (!email || !password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    name ||= (await rl.question("Owner name: ")).trim() || "Owner";
    email ||= (await rl.question("Owner email: ")).trim();
    password ||= await rl.question("Password (min 10 chars, letters + a number): ");
    rl.close();
  }
  email = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
  if (password.length < 10 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) throw new Error("Password must be 10+ characters with letters and a number");
  await sql`
    insert into staff (name, email, password_hash, role) values (${name || "Owner"}, ${email}, ${await hashPassword(password)}, 'owner')
    on conflict (email) do update set password_hash = excluded.password_hash, role = 'owner', active = true`;
  console.log(`✓ Owner account ready: ${email}`);
}

async function putDemoFile(key, buf) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import("@supabase/supabase-js");
    const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await s.storage.from("prescriptions").upload(key, buf, { contentType: "image/png", upsert: true });
    if (error) throw error;
  } else {
    const p = path.join(root, ".data", "storage", "prescriptions", key);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, buf);
  }
}

/** Demo data so every admin screen has something to show. Clearly marked; safe to delete. */
async function demo() {
  const [{ n }] = await sql`select count(*)::int as n from orders`;
  if (n > 0 && !process.argv.includes("--force")) {
    console.log(`• ${n} orders already exist — skipping demo data (use --force to add more).`);
    return;
  }
  const products = await sql`select id, name, pack, mrp, price, rx from products where active`;
  if (!products.length) throw new Error("Run `seed` first.");
  const first = ["Aarav", "Priya", "Rohan", "Neha", "Vikram", "Ananya", "Kabir", "Isha", "Arjun", "Meera", "Siddharth", "Kavya", "Rahul", "Pooja", "Aditya", "Sneha", "Karan", "Divya", "Manish", "Ritu"];
  const last = ["Sharma", "Verma", "Gupta", "Singh", "Patel", "Iyer", "Khan", "Das", "Nair", "Joshi"];
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const customers = [];
  for (let i = 0; i < 28; i++) {
    const name = `${rnd(first)} ${rnd(last)} (demo)`;
    const phone = "+919" + String(100000000 + Math.floor(Math.random() * 899999999)).slice(0, 9);
    const [c] = await sql`insert into customers (name, phone, notes) values (${name}, ${phone}, 'Demo customer — safe to delete') on conflict (phone) do update set name = excluded.name returning id, name, phone`;
    const line = `${10 + i}, Demo Street ${1 + (i % 7)}, Sector ${3 + (i % 9)}`;
    await sql`insert into addresses (customer_id, label, line) values (${c.id}, 'Home', ${line}) on conflict do nothing`;
    customers.push({ ...c, line });
  }
  const statuses = ["delivered", "delivered", "delivered", "delivered", "delivered", "cancelled", "out_for_delivery", "packed", "confirmed"];
  let made = 0;
  for (let day = 365; day >= 0; day--) {
    const perDay = day < 30 ? 1 + Math.floor(Math.random() * 4) : Math.random() < 0.55 ? 1 + Math.floor(Math.random() * 2) : 0;
    for (let k = 0; k < perDay; k++) {
      const c = rnd(customers);
      const items = [...new Set(Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => rnd(products.filter((p) => !p.rx))))];
      const lines = items.map((p) => ({ p, qty: 1 + Math.floor(Math.random() * 3) }));
      const subtotal = lines.reduce((s, l) => s + Number(l.p.price) * l.qty, 0);
      const delivery = subtotal >= 499 ? 0 : 30;
      const status = day === 0 ? "new" : day < 3 ? rnd(["new", "confirmed", "packed", "out_for_delivery", "delivered"]) : rnd(statuses);
      const created = new Date(Date.now() - day * 86400000 - Math.floor(Math.random() * 10) * 3600000);
      const [o] = await sql`
        insert into orders (customer_id, customer_name, customer_phone, address, status, payment_status, subtotal, delivery_charge, total, created_at, updated_at, source, stock_deducted)
        values (${c.id}, ${c.name}, ${c.phone}, ${c.line}, ${status}, ${status === "delivered" ? "paid" : "unpaid"}, ${subtotal}, ${delivery}, ${subtotal + delivery}, ${created}, ${created}, 'demo', false)
        returning id`;
      for (const l of lines) await sql`insert into order_items (order_id, product_id, name, pack, rx, mrp, price, qty) values (${o.id}, ${l.p.id}, ${l.p.name}, ${l.p.pack}, false, ${l.p.mrp}, ${l.p.price}, ${l.qty})`;
      await sql`insert into order_events (order_id, status, created_at) values (${o.id}, ${status}, ${created})`;
      made++;
    }
  }
  // two new orders that contain Rx items, each with an uploaded (demo) prescription awaiting review
  const img = readFileSync(path.join(root, "scripts", "assets", "demo-prescription.png"));
  const rxProducts = products.filter((p) => p.rx);
  for (let i = 0; i < 2 && rxProducts.length; i++) {
    const c = customers[i];
    const p = rxProducts[i % rxProducts.length];
    const [o] = await sql`
      insert into orders (customer_id, customer_name, customer_phone, address, subtotal, delivery_charge, total, source)
      values (${c.id}, ${c.name}, ${c.phone}, ${c.line}, ${p.price * 2}, 30, ${p.price * 2 + 30}, 'demo') returning id`;
    await sql`insert into order_items (order_id, product_id, name, pack, rx, mrp, price, qty) values (${o.id}, ${p.id}, ${p.name}, ${p.pack}, true, ${p.mrp}, ${p.price}, 2)`;
    await sql`insert into order_events (order_id, status) values (${o.id}, 'new')`;
    const key = `demo/${randomUUID()}.png`;
    await putDemoFile(key, img);
    await sql`insert into prescriptions (order_id, customer_id, customer_name, customer_phone, file_path, file_type, file_size)
              values (${o.id}, ${c.id}, ${c.name}, ${c.phone}, ${key}, 'image/png', ${img.length})`;
    made++;
  }
  // one call-back prescription (no order yet)
  const key = `demo/${randomUUID()}.png`;
  await putDemoFile(key, img);
  await sql`insert into prescriptions (customer_id, customer_name, customer_phone, file_path, file_type, file_size)
            values (${customers[3].id}, ${customers[3].name}, ${customers[3].phone}, ${key}, 'image/png', ${img.length})`;
  // pending reviews — clearly demo, never auto-approved
  await sql`insert into reviews (name, rating, text, source) values
    ('Demo Reviewer', 5, '(Demo review for testing moderation — delete before launch.) Quick delivery and helpful advice.', 'Website'),
    ('Demo Reviewer 2', 4, '(Demo review for testing moderation — delete before launch.) Good stock, friendly staff.', 'Website')`;
  console.log(`✓ Demo data: ${customers.length} customers, ${made} orders, 3 prescriptions, 2 pending reviews`);
}

const cmd = process.argv[2];
try {
  if (cmd === "migrate") await migrate();
  else if (cmd === "seed") await runFile(path.join(root, "supabase", "seed.sql"));
  else if (cmd === "setup") {
    await migrate();
    await runFile(path.join(root, "supabase", "seed.sql"));
  } else if (cmd === "demo") await demo();
  else if (cmd === "create-owner") await createOwner();
  else {
    console.log("Usage: node scripts/db.mjs <migrate|seed|setup|demo|create-owner>");
    process.exitCode = 1;
  }
} catch (e) {
  console.error("✗", e.message ?? e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
