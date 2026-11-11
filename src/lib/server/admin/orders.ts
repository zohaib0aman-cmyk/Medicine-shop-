import "server-only";
import { sql } from "../db";
import { UserError } from "../action";
import type { Staff } from "../auth";
import { can } from "@/lib/permissions";
import { STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const FLOW: OrderStatus[] = ["new", "confirmed", "packed", "out_for_delivery", "delivered"];
const DELIVERY_MOVES: Partial<Record<OrderStatus, OrderStatus>> = { packed: "out_for_delivery", out_for_delivery: "delivered" };

export type OrderRow = {
  id: string; number: string; customer_name: string; customer_phone: string; status: OrderStatus; payment_status: string;
  total: number; created_at: Date; items: number; has_rx: boolean; rx_ok: boolean;
};

const deliveryScope = (me: Staff) => (me.role === "delivery" ? sql`and o.status in ('packed','out_for_delivery','delivered')` : sql``);

export async function listOrders(me: Staff, opts: { status?: string; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const per = 40;
  const status = FLOW.includes(opts.status as OrderStatus) || opts.status === "cancelled" ? (opts.status as OrderStatus) : null;
  const q = (opts.q ?? "").trim().slice(0, 60);
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const where = sql`
    where true ${deliveryScope(me)}
    ${status ? sql`and o.status = ${status}` : sql``}
    ${q ? sql`and (o.number ilike ${like} or o.customer_name ilike ${like} or o.customer_phone ilike ${like})` : sql``}`;
  const rows = await sql<OrderRow[]>`
    select o.id, o.number, o.customer_name, o.customer_phone, o.status, o.payment_status, o.total, o.created_at,
           (select count(*) from order_items i where i.order_id = o.id)::int as items,
           exists (select 1 from order_items i where i.order_id = o.id and i.rx) as has_rx,
           exists (select 1 from prescriptions p where p.order_id = o.id and p.status = 'approved') as rx_ok
    from orders o ${where}
    order by o.created_at desc limit ${per} offset ${(page - 1) * per}`;
  const counts = await sql<{ status: OrderStatus; n: number }[]>`
    select o.status, count(*)::int as n from orders o where true ${deliveryScope(me)} group by o.status`;
  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from orders o ${where}`;
  return { rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) as Record<OrderStatus, number>, total, page, pages: Math.max(1, Math.ceil(total / per)) };
}

export async function getOrder(me: Staff, id: string) {
  const [order] = await sql<(OrderRow & { address: string; subtotal: number; discount: number; delivery_charge: number; coupon_code: string | null; notes: string; payment_method: string; customer_id: string | null; source: string; stock_deducted: boolean; updated_at: Date })[]>`
    select o.*, exists (select 1 from order_items i where i.order_id = o.id and i.rx) as has_rx,
           exists (select 1 from prescriptions p where p.order_id = o.id and p.status = 'approved') as rx_ok
    from orders o where o.id = ${id} ${deliveryScope(me)}`;
  if (!order) return null;
  const items = await sql<{ id: string; product_id: string | null; name: string; pack: string; rx: boolean; mrp: number; price: number; qty: number; allocations: { batch_id: string; batch_no: string; expiry: string; qty: number }[] }[]>`
    select id, product_id, name, pack, rx, mrp, price, qty, allocations from order_items where order_id = ${id} order by name`;
  const events = await sql<{ status: OrderStatus; staff_name: string | null; created_at: Date }[]>`
    select status, staff_name, created_at from order_events where order_id = ${id} order by created_at`;
  const prescriptions =
    me.role === "delivery"
      ? []
      : await sql<{ id: string; status: string; file_type: string; reject_reason: string | null; created_at: Date; reviewed_at: Date | null; reviewer: string | null }[]>`
          select p.id, p.status, p.file_type, p.reject_reason, p.created_at, p.reviewed_at, s.name as reviewer
          from prescriptions p left join staff s on s.id = p.reviewed_by where p.order_id = ${id} order by p.created_at`;
  return { order, items, events, prescriptions };
}

/**
 * Change an order's status. Enforced here (server-side), not in the UI:
 *  • delivery staff: packed → out for delivery → delivered only
 *  • only forward moves (or cancel); delivered / cancelled are final
 *  • Rx items: can't leave "new" until a prescription linked to the order is APPROVED
 *  • stock is deducted (first-expiry-first-out) when the order is confirmed, and restored on cancel
 */
export async function changeStatus(me: Staff, id: string, next: OrderStatus) {
  return sql.begin(async (tx) => {
    const t = tx as unknown as typeof sql;
    const [o] = await t<{ id: string; number: string; status: OrderStatus; stock_deducted: boolean }[]>`
      select id, number, status, stock_deducted from orders where id = ${id} for update`;
    if (!o) throw new UserError("Order not found.");
    if (o.status === next) return { order: o, from: o.status };
    if (o.status === "delivered" || o.status === "cancelled") throw new UserError(`This order is already ${STATUS_LABEL[o.status].toLowerCase()} and can't be changed.`);

    if (me.role === "delivery") {
      if (DELIVERY_MOVES[o.status] !== next) throw new UserError("Delivery staff can only mark packed orders as out for delivery, then delivered.");
    } else if (next === "cancelled") {
      if (!can(me.role, "orders.cancel")) throw new UserError("Your role can't cancel orders.");
    } else {
      if (!can(me.role, "orders.all-status")) throw new UserError("Your role can't change this status.");
      if (FLOW.indexOf(next) < FLOW.indexOf(o.status)) throw new UserError("Orders can only move forward. Cancel it instead if needed.");
    }

    if (next !== "cancelled") {
      const [rx] = await t<{ needs: boolean; ok: boolean }[]>`
        select exists (select 1 from order_items where order_id = ${id} and rx) as needs,
               exists (select 1 from prescriptions where order_id = ${id} and status = 'approved') as ok`;
      if (rx.needs && !rx.ok) throw new UserError("This order has Rx items. A pharmacist must approve a prescription linked to it before it can be confirmed.");
    }

    let stockDeducted = o.stock_deducted;
    if (next !== "cancelled" && !o.stock_deducted) {
      const items = await t<{ id: string; product_id: string | null; name: string; qty: number }[]>`
        select id, product_id, name, qty from order_items where order_id = ${id}`;
      for (const it of items) {
        if (!it.product_id) continue;
        let need = it.qty;
        const alloc: { batch_id: string; batch_no: string; expiry: string; qty: number }[] = [];
        const batches = await t<{ id: string; batch_no: string; expiry_date: Date; quantity: number }[]>`
          select id, batch_no, expiry_date, quantity from batches
          where product_id = ${it.product_id} and quantity > 0 and expiry_date > current_date
          order by expiry_date, created_at for update`;
        for (const b of batches) {
          if (need <= 0) break;
          const take = Math.min(need, b.quantity);
          await t`update batches set quantity = quantity - ${take} where id = ${b.id}`;
          alloc.push({ batch_id: b.id, batch_no: b.batch_no, expiry: new Date(b.expiry_date).toISOString().slice(0, 10), qty: take });
          need -= take;
        }
        if (need > 0) throw new UserError(`Not enough unexpired stock for ${it.name} (short by ${need}). Add a batch in Products first.`);
        await t`update order_items set allocations = ${t.json(alloc as never)} where id = ${it.id}`;
      }
      stockDeducted = true;
    }
    if (next === "cancelled" && o.stock_deducted) {
      const items = await t<{ id: string; allocations: { batch_id: string; qty: number }[] }[]>`select id, allocations from order_items where order_id = ${id}`;
      for (const it of items) {
        for (const a of it.allocations ?? []) await t`update batches set quantity = quantity + ${a.qty} where id = ${a.batch_id}`;
      }
      stockDeducted = false;
    }

    await t`update orders set status = ${next}, stock_deducted = ${stockDeducted} where id = ${id}`;
    await t`insert into order_events (order_id, status, staff_id, staff_name) values (${id}, ${next}, ${me.id}, ${me.name})`;
    return { order: o, from: o.status };
  });
}

