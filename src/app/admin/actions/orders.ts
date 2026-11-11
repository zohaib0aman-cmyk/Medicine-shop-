"use server";

import { z } from "zod";
import { requireStaff, logActivity } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { changeStatus } from "@/lib/server/admin/orders";
import { text, uuid } from "@/lib/server/validate";
import { ORDER_STATUSES, PAYMENT_STATUSES, STATUS_LABEL } from "@/lib/types";

export async function setOrderStatus(id: string, status: string) {
  return run(async () => {
    const me = await requireStaff("orders");
    const input = z.object({ id: uuid, status: z.enum(ORDER_STATUSES) }).parse({ id, status });
    const { order, from } = await changeStatus(me, input.id, input.status);
    if (from !== input.status) {
      await logActivity({ action: "order.status", entity: "order", entityId: input.id, summary: `${order.number}: ${STATUS_LABEL[from]} → ${STATUS_LABEL[input.status]}` });
    }
    return { message: `${order.number} marked ${STATUS_LABEL[input.status]}`, revalidate: ["/admin/orders", `/admin/orders/${input.id}`, "/admin"], storefront: true };
  });
}

export async function setPayment(id: string, payment: string, method: string) {
  return run(async () => {
    const me = await requireStaff("orders");
    const input = z
      .object({ id: uuid, payment: z.enum(PAYMENT_STATUSES), method: z.enum(["cod", "upi", "card", "other"]) })
      .parse({ id, payment, method });
    if (me.role === "delivery" && input.payment === "refunded") throw new UserError("Delivery staff can't record refunds.");
    const [o] = await sql<{ number: string }[]>`
      update orders set payment_status = ${input.payment}, payment_method = ${input.method}
      where id = ${input.id} ${me.role === "delivery" ? sql`and status in ('packed','out_for_delivery','delivered')` : sql``}
      returning number`;
    if (!o) throw new UserError("Order not found.");
    await logActivity({ action: "order.payment", entity: "order", entityId: input.id, summary: `${o.number}: payment ${input.payment} (${input.method})` });
    return { message: "Payment updated", revalidate: [`/admin/orders/${input.id}`, "/admin/orders"] };
  });
}

export async function saveOrderNotes(id: string, notes: string) {
  return run(async () => {
    const me = await requireStaff("orders");
    if (me.role === "delivery") throw new UserError("Your role can't edit order notes.");
    const input = z.object({ id: uuid, notes: text(2000) }).parse({ id, notes });
    const [o] = await sql<{ number: string }[]>`update orders set notes = ${input.notes} where id = ${input.id} returning number`;
    if (!o) throw new UserError("Order not found.");
    await logActivity({ action: "order.notes", entity: "order", entityId: input.id, summary: `${o.number}: notes updated` });
    return { message: "Notes saved", revalidate: [`/admin/orders/${input.id}`] };
  });
}
