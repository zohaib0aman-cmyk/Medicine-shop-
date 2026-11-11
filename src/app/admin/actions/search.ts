"use server";

import { getStaff } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { canAccess } from "@/lib/permissions";
import { clean } from "@/lib/server/validate";

export type SearchHit = { kind: "order" | "product" | "customer"; title: string; sub: string; href: string };

export async function globalSearch(raw: string): Promise<SearchHit[]> {
  const me = await getStaff();
  if (!me) return [];
  const q = clean(String(raw ?? "")).slice(0, 60);
  if (q.length < 2) return [];
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const hits: SearchHit[] = [];
  if (canAccess(me.role, "orders")) {
    const rows = await sql<{ id: string; number: string; customer_name: string; status: string }[]>`
      select id, number, customer_name, status from orders
      where (number ilike ${like} or customer_name ilike ${like} or customer_phone ilike ${like})
        ${me.role === "delivery" ? sql`and status in ('packed','out_for_delivery','delivered')` : sql``}
      order by created_at desc limit 6`;
    hits.push(...rows.map((r) => ({ kind: "order" as const, title: `${r.number} · ${r.customer_name}`, sub: r.status.replaceAll("_", " "), href: `/admin/orders/${r.id}` })));
  }
  if (canAccess(me.role, "products")) {
    const rows = await sql<{ id: string; name: string; sku: string }[]>`
      select id, name, sku from products where name ilike ${like} or sku ilike ${like} or brand ilike ${like} or salt ilike ${like}
      order by name limit 6`;
    hits.push(...rows.map((r) => ({ kind: "product" as const, title: r.name, sub: r.sku, href: `/admin/products/${r.id}` })));
  }
  if (canAccess(me.role, "customers")) {
    const rows = await sql<{ id: string; name: string; phone: string }[]>`
      select id, name, phone from customers where name ilike ${like} or phone ilike ${like} or email ilike ${like}
      order by name limit 6`;
    hits.push(...rows.map((r) => ({ kind: "customer" as const, title: r.name, sub: r.phone, href: `/admin/customers/${r.id}` })));
  }
  return hits;
}
