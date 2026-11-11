import "server-only";
import { sql } from "../db";
import { publicImageUrl } from "../storage";

export type ProductRow = {
  id: string; sku: string; name: string; brand: string; salt: string; category_id: string; category: string; pack: string;
  mrp: number; price: number; rx: boolean; active: boolean; featured: boolean; low_stock_threshold: number; art: string;
  images: string[]; stock: number; next_expiry: string | null; expiring_qty: number; expired_qty: number; batches: number; thumb: string | null;
};

export async function listProducts(opts: { filter?: string; q?: string; category?: string; window?: number }) {
  const win = [30, 60, 90].includes(opts.window ?? 0) ? opts.window! : 60;
  const q = (opts.q ?? "").trim().slice(0, 60);
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const rows = await sql<ProductRow[]>`
    with s as (
      select p.*, c.name as category,
        coalesce((select sum(quantity) from batches b where b.product_id = p.id and b.expiry_date > current_date), 0)::int as stock,
        (select to_char(min(expiry_date), 'YYYY-MM-DD') from batches b where b.product_id = p.id and b.quantity > 0 and b.expiry_date > current_date) as next_expiry,
        coalesce((select sum(quantity) from batches b where b.product_id = p.id and b.expiry_date > current_date and b.expiry_date <= current_date + ${win}::int), 0)::int as expiring_qty,
        coalesce((select sum(quantity) from batches b where b.product_id = p.id and b.expiry_date <= current_date), 0)::int as expired_qty,
        (select count(*) from batches b where b.product_id = p.id)::int as batches
      from products p join categories c on c.id = p.category_id
    )
    select * from s where true
    ${q ? sql`and (name ilike ${like} or sku ilike ${like} or brand ilike ${like} or salt ilike ${like})` : sql``}
    ${opts.category ? sql`and category_id = ${opts.category}` : sql``}
    ${opts.filter === "low" ? sql`and active and stock <= low_stock_threshold` : sql``}
    ${opts.filter === "expiring" ? sql`and (expiring_qty > 0 or expired_qty > 0)` : sql``}
    ${opts.filter === "rx" ? sql`and rx` : sql``}
    ${opts.filter === "inactive" ? sql`and not active` : sql``}
    order by ${opts.filter === "expiring" ? sql`next_expiry nulls last,` : opts.filter === "low" ? sql`stock,` : sql``} name
    limit 500`;
  const [counts] = await sql<{ all: number; low: number; expiring: number; rx: number; inactive: number }[]>`
    select count(*)::int as all,
      count(*) filter (where p.active and coalesce((select sum(quantity) from batches b where b.product_id = p.id and b.expiry_date > current_date), 0) <= p.low_stock_threshold)::int as low,
      count(*) filter (where exists (select 1 from batches b where b.product_id = p.id and b.quantity > 0 and b.expiry_date <= current_date + ${win}::int))::int as expiring,
      count(*) filter (where p.rx)::int as rx,
      count(*) filter (where not p.active)::int as inactive
    from products p`;
  return { rows: rows.map((r) => ({ ...r, thumb: r.images[0] ? publicImageUrl(r.images[0]) : null })), counts, window: win };
}

export async function getProduct(id: string) {
  const [p] = await sql<(ProductRow & { description: string })[]>`select * from products where id = ${id}`;
  if (!p) return null;
  const batches = await sql<{ id: string; batch_no: string; expiry_date: string; quantity: number; days_left: number }[]>`
    select id, batch_no, to_char(expiry_date, 'YYYY-MM-DD') as expiry_date, quantity, (expiry_date - current_date)::int as days_left
    from batches where product_id = ${id} order by expiry_date`;
  return { product: { ...p, imageUrls: p.images.map((k) => ({ key: k, url: publicImageUrl(k) })) }, batches };
}

export async function categoryOptions() {
  return sql<{ id: string; name: string }[]>`select id, name from categories order by sort_order, name`;
}

/** Batches expiring within N days (and already expired with stock), for the alerts panel and reports. */
export async function expiringBatches(days: number) {
  return sql<{ id: string; product_id: string; name: string; sku: string; batch_no: string; expiry_date: string; quantity: number; days_left: number; value: number }[]>`
    select b.id, p.id as product_id, p.name, p.sku, b.batch_no, to_char(b.expiry_date, 'YYYY-MM-DD') as expiry_date, b.quantity,
           (b.expiry_date - current_date)::int as days_left, (b.quantity * p.price)::float as value
    from batches b join products p on p.id = b.product_id
    where b.quantity > 0 and b.expiry_date <= current_date + ${days}::int
    order by b.expiry_date`;
}
