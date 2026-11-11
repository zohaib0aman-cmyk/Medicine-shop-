import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { PageHeader } from "@/components/admin/ui";
import { CustomersClient } from "./CustomersClient";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  await requirePage("customers");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const sort = sp.sort === "spend" ? sql`spend desc` : sp.sort === "orders" ? sql`orders desc` : sql`last_order desc nulls last`;
  const rows = await sql<{ id: string; name: string; phone: string; email: string | null; orders: number; spend: number; last_order: Date | null; created_at: Date }[]>`
    select c.id, c.name, c.phone, c.email, c.created_at,
      (select count(*) from orders o where o.customer_id = c.id)::int as orders,
      (select coalesce(sum(total), 0) from orders o where o.customer_id = c.id and o.status <> 'cancelled')::float as spend,
      (select max(created_at) from orders o where o.customer_id = c.id) as last_order
    from customers c
    ${q ? sql`where c.name ilike ${like} or c.phone ilike ${like} or c.email ilike ${like}` : sql``}
    order by ${sort} limit 300`;
  return (
    <>
      <PageHeader eyebrow="People" title="Customers" subtitle="Customers are created automatically from website orders and prescription uploads." />
      <CustomersClient rows={JSON.parse(JSON.stringify(rows))} q={q} sort={sp.sort ?? "recent"} />
    </>
  );
}
