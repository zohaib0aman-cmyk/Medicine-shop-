import "server-only";
import { sql } from "../db";
import { TZ, stockExpr } from "./common";

export type Range = "7d" | "30d" | "12m";

export async function dashboardStats() {
  const [s] = await sql<{ orders_today: number; sales_today: number; pending_rx: number; low_stock: number; expiring: number; new_orders: number }[]>`
    select
      (select count(*) from orders where (created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date)::int as orders_today,
      (select coalesce(sum(total), 0) from orders where status <> 'cancelled' and (created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date) as sales_today,
      (select count(*) from prescriptions where status = 'pending')::int as pending_rx,
      (select count(*) from products p where p.active and ${stockExpr("p")} <= p.low_stock_threshold)::int as low_stock,
      (select count(*) from batches where quantity > 0 and expiry_date > current_date and expiry_date <= current_date + 60)::int as expiring,
      (select count(*) from orders where status = 'new')::int as new_orders`;
  return s;
}

export async function salesSeries(range: Range) {
  if (range === "12m") {
    return sql<{ label: string; sub: string; value: number }[]>`
      with m as (select generate_series(date_trunc('month', (now() at time zone ${TZ})) - interval '11 months', date_trunc('month', (now() at time zone ${TZ})), interval '1 month') as d)
      select to_char(m.d, 'Mon') as label, to_char(m.d, 'FMMonth YYYY') as sub,
             coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::float as value
      from m left join orders o on date_trunc('month', o.created_at at time zone ${TZ}) = m.d
      group by m.d order by m.d`;
  }
  const days = range === "7d" ? 6 : 29;
  return sql<{ label: string; sub: string; value: number }[]>`
    with d as (select generate_series((now() at time zone ${TZ})::date - ${days}::int, (now() at time zone ${TZ})::date, interval '1 day')::date as d)
    select ${range === "7d" ? sql`to_char(d.d, 'Dy')` : sql`to_char(d.d, 'DD')`} as label, to_char(d.d, 'Dy, DD Mon') as sub,
           coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::float as value
    from d left join orders o on (o.created_at at time zone ${TZ})::date = d.d
    group by d.d order by d.d`;
}

export async function latestOrders(limit = 8) {
  return sql<{ id: string; number: string; customer_name: string; status: string; total: number; created_at: Date; items: number; has_rx: boolean }[]>`
    select o.id, o.number, o.customer_name, o.status, o.total, o.created_at,
           (select count(*) from order_items i where i.order_id = o.id)::int as items,
           exists (select 1 from order_items i where i.order_id = o.id and i.rx) as has_rx
    from orders o order by o.created_at desc limit ${limit}`;
}

export async function topSellers(days = 30, limit = 6) {
  return sql<{ name: string; qty: number; revenue: number }[]>`
    select i.name, sum(i.qty)::int as qty, sum(i.qty * i.price)::float as revenue
    from order_items i join orders o on o.id = i.order_id
    where o.status <> 'cancelled' and o.created_at > now() - make_interval(days => ${days})
    group by i.name order by qty desc, revenue desc limit ${limit}`;
}
