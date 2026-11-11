import { notFound } from "next/navigation";
import { requirePage } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/admin/orders";
import { getSetting, DEFAULT_SHOP } from "@/lib/server/storefront";
import { can } from "@/lib/permissions";
import type { Shop } from "@/lib/types";
import { OrderDetail } from "./OrderDetail";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("orders");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getOrder(me, id);
  if (!data) notFound();
  const shop = await getSetting<Shop>("shop", DEFAULT_SHOP);
  return (
    <OrderDetail
      data={JSON.parse(JSON.stringify(data))}
      role={me.role}
      shopName={shop.name}
      canCancel={can(me.role, "orders.cancel")}
      canReview={can(me.role, "rx.review")}
    />
  );
}
