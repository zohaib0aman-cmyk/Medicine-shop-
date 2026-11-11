import { NextResponse } from "next/server";
import { getStaff } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { canAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Polled every 15s by the admin bell. Only returns data the caller's role may see. */
export async function GET() {
  const me = await getStaff();
  if (!me) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const delivery = me.role === "delivery";
  // delivery staff are notified when an order is packed (ready to go); everyone else when a new order arrives
  const status = delivery ? "packed" : "new";
  const [c] = await sql<{ new_orders: number; pending_rx: number }[]>`
    select
      (select count(*) from orders where status = ${status})::int as new_orders,
      (select count(*) from prescriptions where status = 'pending')::int as pending_rx`;
  const latest = await sql<{ id: string; number: string; name: string; total: number; created_at: Date }[]>`
    select id, number, customer_name as name, total, ${delivery ? sql`updated_at` : sql`created_at`} as created_at from orders
    where status = ${status} order by 5 desc limit 6`;
  return NextResponse.json(
    {
      newOrders: c.new_orders,
      pendingRx: canAccess(me.role, "prescriptions") ? c.pending_rx : 0,
      latestAt: latest[0] ? new Date(latest[0].created_at).toISOString() : null,
      latest: latest.map((o) => ({ ...o, created_at: new Date(o.created_at).toISOString() })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
