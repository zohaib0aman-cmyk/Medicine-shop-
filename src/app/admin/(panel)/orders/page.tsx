import { requirePage } from "@/lib/server/auth";
import { listOrders } from "@/lib/server/admin/orders";
import { PageHeader } from "@/components/admin/ui";
import { OrdersClient } from "./OrdersClient";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const me = await requirePage("orders");
  const sp = await searchParams;
  const data = await listOrders(me, { status: sp.status, q: sp.q, page: Number(sp.page) || 1 });
  return (
    <>
      <PageHeader eyebrow="Dispensary" title="Orders" subtitle={me.role === "delivery" ? "Orders ready for delivery and on the road." : "Every order from the website, newest first. Tap a status to move it along."} />
      <OrdersClient data={JSON.parse(JSON.stringify(data))} role={me.role} status={sp.status ?? "all"} q={sp.q ?? ""} />
    </>
  );
}
