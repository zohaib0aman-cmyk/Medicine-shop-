import "server-only";
import { sql } from "../db";
import { TZ } from "./common";

export const REPORTS = {
  sales: "Sales",
  bestsellers: "Best sellers",
  stock: "Stock value",
  expiry: "Expiry",
} as const;
export type ReportType = keyof typeof REPORTS;

export type Col = { key: string; label: string; kind?: "money" | "int" | "text" | "date" };
export type Report = { type: ReportType; title: string; subtitle: string; columns: Col[]; rows: Record<string, string | number | null>[]; totals?: Record<string, number>; summary: { label: string; value: number; kind: "money" | "int" }[] };

const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export function normaliseRange(from?: string, to?: string) {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const t = isDate(to) ? to! : iso(today);
  const f = isDate(from) ? from! : iso(new Date(today.getTime() - 29 * 86400000));
  return f <= t ? { from: f, to: t } : { from: t, to: f };
}

export async function buildReport(type: ReportType, from: string, to: string): Promise<Report> {
  const range = `${new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  const inRange = sql`(o.created_at at time zone ${TZ})::date between ${from}::date and ${to}::date`;

  if (type === "sales") {
    const rows = await sql<{ day: string; orders: number; cancelled: number; gross: number; discount: number; delivery: number; net: number }[]>`
      with d as (select generate_series(${from}::date, ${to}::date, interval '1 day')::date as day)
      select to_char(d.day, 'YYYY-MM-DD') as day,
        count(o.id) filter (where o.status <> 'cancelled')::int as orders,
        count(o.id) filter (where o.status = 'cancelled')::int as cancelled,
        coalesce(sum(o.subtotal) filter (where o.status <> 'cancelled'), 0)::float as gross,
        coalesce(sum(o.discount) filter (where o.status <> 'cancelled'), 0)::float as discount,
        coalesce(sum(o.delivery_charge) filter (where o.status <> 'cancelled'), 0)::float as delivery,
        coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::float as net
      from d left join orders o on (o.created_at at time zone ${TZ})::date = d.day
      group by d.day order by d.day`;
    const sum = (k: keyof (typeof rows)[number]) => rows.reduce((s, r) => s + Number(r[k]), 0);
    const orders = sum("orders");
    return {
      type, title: "Sales report", subtitle: range,
      columns: [{ key: "day", label: "Date", kind: "date" }, { key: "orders", label: "Orders", kind: "int" }, { key: "cancelled", label: "Cancelled", kind: "int" }, { key: "gross", label: "Item value", kind: "money" }, { key: "discount", label: "Discounts", kind: "money" }, { key: "delivery", label: "Delivery", kind: "money" }, { key: "net", label: "Net sales", kind: "money" }],
      rows,
      totals: { orders, cancelled: sum("cancelled"), gross: sum("gross"), discount: sum("discount"), delivery: sum("delivery"), net: sum("net") },
      summary: [{ label: "Net sales", value: sum("net"), kind: "money" }, { label: "Orders", value: orders, kind: "int" }, { label: "Average order", value: orders ? sum("net") / orders : 0, kind: "money" }, { label: "Discounts given", value: sum("discount"), kind: "money" }],
    };
  }

  if (type === "bestsellers") {
    const rows = await sql<{ name: string; category: string | null; qty: number; orders: number; revenue: number }[]>`
      select i.name, c.name as category, sum(i.qty)::int as qty, count(distinct o.id)::int as orders, sum(i.qty * i.price)::float as revenue
      from order_items i join orders o on o.id = i.order_id
      left join products p on p.id = i.product_id left join categories c on c.id = p.category_id
      where o.status <> 'cancelled' and ${inRange}
      group by i.name, c.name order by qty desc, revenue desc limit 200`;
    return {
      type, title: "Best sellers", subtitle: range,
      columns: [{ key: "name", label: "Product" }, { key: "category", label: "Category" }, { key: "qty", label: "Units sold", kind: "int" }, { key: "orders", label: "Orders", kind: "int" }, { key: "revenue", label: "Revenue", kind: "money" }],
      rows,
      totals: { qty: rows.reduce((s, r) => s + r.qty, 0), revenue: rows.reduce((s, r) => s + r.revenue, 0) },
      summary: [{ label: "Products sold", value: rows.length, kind: "int" }, { label: "Units", value: rows.reduce((s, r) => s + r.qty, 0), kind: "int" }, { label: "Revenue", value: rows.reduce((s, r) => s + r.revenue, 0), kind: "money" }],
    };
  }

  if (type === "stock") {
    const rows = await sql<{ sku: string; name: string; category: string; stock: number; price: number; mrp: number; value: number; mrp_value: number }[]>`
      select p.sku, p.name, c.name as category,
        coalesce(sum(b.quantity) filter (where b.expiry_date > current_date), 0)::int as stock, p.price::float, p.mrp::float,
        (coalesce(sum(b.quantity) filter (where b.expiry_date > current_date), 0) * p.price)::float as value,
        (coalesce(sum(b.quantity) filter (where b.expiry_date > current_date), 0) * p.mrp)::float as mrp_value
      from products p join categories c on c.id = p.category_id left join batches b on b.product_id = p.id
      group by p.id, c.name, c.sort_order order by value desc`;
    const total = rows.reduce((s, r) => s + r.value, 0);
    return {
      type, title: "Stock value", subtitle: `As of today · unexpired stock only (date range not applied)`,
      columns: [{ key: "sku", label: "SKU" }, { key: "name", label: "Product" }, { key: "category", label: "Category" }, { key: "stock", label: "Units", kind: "int" }, { key: "price", label: "Price", kind: "money" }, { key: "value", label: "Value at price", kind: "money" }, { key: "mrp_value", label: "Value at MRP", kind: "money" }],
      rows,
      totals: { stock: rows.reduce((s, r) => s + r.stock, 0), value: total, mrp_value: rows.reduce((s, r) => s + r.mrp_value, 0) },
      summary: [{ label: "Stock value (price)", value: total, kind: "money" }, { label: "Stock value (MRP)", value: rows.reduce((s, r) => s + r.mrp_value, 0), kind: "money" }, { label: "Units in stock", value: rows.reduce((s, r) => s + r.stock, 0), kind: "int" }],
    };
  }

  // expiry: batches with stock expiring between the dates (and anything already expired)
  const rows = await sql<{ name: string; sku: string; batch_no: string; expiry_date: string; days_left: number; quantity: number; value: number }[]>`
    select p.name, p.sku, b.batch_no, to_char(b.expiry_date, 'YYYY-MM-DD') as expiry_date, (b.expiry_date - current_date)::int as days_left,
           b.quantity, (b.quantity * p.price)::float as value
    from batches b join products p on p.id = b.product_id
    where b.quantity > 0 and (b.expiry_date <= current_date or b.expiry_date between ${from}::date and ${to}::date)
    order by b.expiry_date`;
  return {
    type, title: "Expiry report", subtitle: `Batches expiring ${range}, plus any already expired`,
    columns: [{ key: "name", label: "Product" }, { key: "sku", label: "SKU" }, { key: "batch_no", label: "Batch" }, { key: "expiry_date", label: "Expiry", kind: "date" }, { key: "days_left", label: "Days left", kind: "int" }, { key: "quantity", label: "Qty", kind: "int" }, { key: "value", label: "Value", kind: "money" }],
    rows,
    totals: { quantity: rows.reduce((s, r) => s + r.quantity, 0), value: rows.reduce((s, r) => s + r.value, 0) },
    summary: [{ label: "Batches", value: rows.length, kind: "int" }, { label: "Already expired", value: rows.filter((r) => r.days_left <= 0).length, kind: "int" }, { label: "Value at risk", value: rows.reduce((s, r) => s + r.value, 0), kind: "money" }],
  };
}
