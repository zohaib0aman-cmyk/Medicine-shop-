import { notFound } from "next/navigation";
import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { can } from "@/lib/permissions";
import { CustomerDetail } from "./CustomerDetail";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("customers");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [c] = await sql<{ id: string; name: string; phone: string; email: string | null; notes: string; created_at: Date }[]>`select id, name, phone, email, notes, created_at from customers where id = ${id}`;
  if (!c) notFound();
  const [orders, addresses, [stats], rx] = await Promise.all([
    sql<{ id: string; number: string; status: string; total: number; created_at: Date; items: number }[]>`
      select o.id, o.number, o.status, o.total, o.created_at, (select count(*) from order_items i where i.order_id = o.id)::int as items
      from orders o where o.customer_id = ${id} order by o.created_at desc limit 100`,
    sql<{ id: string; label: string; line: string }[]>`select id, label, line from addresses where customer_id = ${id} order by created_at`,
    sql<{ orders: number; spend: number; avg: number; first: Date | null }[]>`
      select count(*)::int as orders, coalesce(sum(total) filter (where status <> 'cancelled'), 0)::float as spend,
             coalesce(avg(total) filter (where status <> 'cancelled'), 0)::float as avg, min(created_at) as first
      from orders where customer_id = ${id}`,
    sql<{ n: number }[]>`select count(*)::int as n from prescriptions where customer_id = ${id}`,
  ]);
  return <CustomerDetail data={JSON.parse(JSON.stringify({ c, orders, addresses, stats, rxCount: rx[0].n }))} canDelete={can(me.role, "customers.delete")} />;
}
