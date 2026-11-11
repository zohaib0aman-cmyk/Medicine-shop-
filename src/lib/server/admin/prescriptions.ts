import "server-only";
import { sql } from "../db";

export type RxRow = {
  id: string; status: "pending" | "approved" | "rejected"; file_type: string; file_size: number; customer_name: string; customer_phone: string;
  customer_id: string | null; order_id: string | null; order_number: string | null; order_status: string | null; reject_reason: string | null;
  reviewer: string | null; reviewed_at: Date | null; created_at: Date; rx_items: string[];
};

export async function listPrescriptions(status: string) {
  const s = ["pending", "approved", "rejected"].includes(status) ? status : null;
  const rows = await sql<RxRow[]>`
    select p.id, p.status, p.file_type, p.file_size, p.customer_name, p.customer_phone, p.customer_id, p.order_id, p.reject_reason,
           p.reviewed_at, p.created_at, o.number as order_number, o.status as order_status, s.name as reviewer,
           coalesce((select array_agg(i.name || ' ×' || i.qty) from order_items i where i.order_id = p.order_id and i.rx), '{}') as rx_items
    from prescriptions p
    left join orders o on o.id = p.order_id
    left join staff s on s.id = p.reviewed_by
    ${s ? sql`where p.status = ${s}` : sql``}
    order by case when p.status = 'pending' then 0 else 1 end, p.created_at ${s === "pending" ? sql`asc` : sql`desc`}
    limit 100`;
  const counts = await sql<{ status: string; n: number }[]>`select status, count(*)::int as n from prescriptions group by status`;
  // open orders that a prescription could be linked to
  const openOrders = await sql<{ id: string; number: string; customer_name: string; customer_phone: string; has_rx: boolean }[]>`
    select o.id, o.number, o.customer_name, o.customer_phone,
           exists (select 1 from order_items i where i.order_id = o.id and i.rx) as has_rx
    from orders o where o.status in ('new','confirmed') order by o.created_at desc limit 200`;
  return { rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<string, number>, openOrders };
}
