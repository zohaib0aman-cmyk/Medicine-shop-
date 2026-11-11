import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { canAccess, modulesFor } from "@/lib/permissions";
import { AdminShell } from "@/components/admin/Shell";
import { getSetting, DEFAULT_SHOP } from "@/lib/server/storefront";
import type { Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requirePage();
  const status = me.role === "delivery" ? "packed" : "new";
  const [c] = await sql<{ new_orders: number; pending_rx: number }[]>`
    select (select count(*) from orders where status = ${status})::int as new_orders,
           (select count(*) from prescriptions where status = 'pending')::int as pending_rx`;
  const shop = await getSetting<Shop>("shop", DEFAULT_SHOP);
  return (
    <AdminShell
      me={{ name: me.name, email: me.email, role: me.role }}
      modules={[...modulesFor(me.role)]}
      counts={{ newOrders: c.new_orders, pendingRx: canAccess(me.role, "prescriptions") ? c.pending_rx : 0 }}
      shopName={shop.name}
    >
      {children}
    </AdminShell>
  );
}
