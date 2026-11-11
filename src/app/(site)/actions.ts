"use server";

import { z } from "zod";
import { sql } from "@/lib/server/db";
import { run, UserError, type ActionResult } from "@/lib/server/action";
import { rateLimit } from "@/lib/server/ratelimit";
import { clientIp } from "@/lib/server/request";
import { formObject, int, phone, text, uuid } from "@/lib/server/validate";
import { readUpload } from "@/lib/server/files";
import { deleteFile, putFile } from "@/lib/server/storage";
import { evaluateCoupon, round2 } from "@/lib/server/coupons";
import { getSetting, DEFAULT_SHOP } from "@/lib/server/storefront";
import { normalizePhone } from "@/lib/phone";
import { buildOrderMessage } from "@/lib/whatsapp";
import type { Shop } from "@/lib/types";

const MAX_RX_BYTES = 5 * 1024 * 1024;
const honeypot = (fd: FormData) => {
  if (String(fd.get("website") ?? "")) throw new UserError("Unable to submit. Please call us instead.");
};

async function upsertCustomer(tx: typeof sql, name: string, phoneNo: string) {
  const [c] = await tx<{ id: string }[]>`
    insert into customers (name, phone) values (${name}, ${phoneNo})
    on conflict (phone) do update set phone = excluded.phone
    returning id`;
  return c.id;
}

/* ───────────── Place an order from the website ───────────── */
export async function placeOrder(fd: FormData): Promise<ActionResult<{ number: string; total: number; message: string }>> {
  return run(async () => {
    honeypot(fd);
    const ip = await clientIp();
    if (!(await rateLimit(`order:${ip}`, 8, 3600))) throw new UserError("Too many orders from this device. Please call us to order.");

    const input = z
      .object({ name: text(80, 2), phone, address: text(300, 8), coupon: text(20), items: z.string().max(5000) })
      .parse(formObject(fd));
    const items = z
      .array(z.object({ id: uuid, qty: int(1, 99) }))
      .min(1, "Your order is empty.")
      .max(40)
      .parse(JSON.parse(input.items || "[]"));
    const qtyById = new Map<string, number>();
    for (const i of items) qtyById.set(i.id, Math.min(99, (qtyById.get(i.id) ?? 0) + i.qty));

    const products = await sql<{ id: string; name: string; pack: string; mrp: number; price: number; rx: boolean; active: boolean; stock: number }[]>`
      select p.id, p.name, p.pack, p.mrp, p.price, p.rx, p.active,
             coalesce((select sum(quantity) from batches b where b.product_id = p.id and b.expiry_date > current_date), 0)::int as stock
      from products p where p.id in ${sql([...qtyById.keys()])}`;
    if (products.length !== qtyById.size || products.some((p) => !p.active)) throw new UserError("Some items are no longer available. Please refresh the page.");
    for (const p of products) {
      const q = qtyById.get(p.id)!;
      if (q > p.stock) throw new UserError(p.stock ? `Only ${p.stock} left of ${p.name}.` : `${p.name} is out of stock.`);
    }

    const needsRx = products.some((p) => p.rx);
    const file = fd.get("prescription");
    const hasFile = file instanceof File && file.size > 0;
    if (needsRx && !hasFile) throw new UserError("A prescription is required for Rx items. Please upload it.");

    // prices always come from the database, never from the browser
    const subtotal = round2(products.reduce((s, p) => s + p.price * qtyById.get(p.id)!, 0));
    let discount = 0;
    let couponCode: string | null = null;
    if (input.coupon) {
      const { coupon, discount: d } = await evaluateCoupon(input.coupon, subtotal);
      discount = d;
      couponCode = coupon.code;
    }
    const shop = await getSetting<Shop>("shop", DEFAULT_SHOP);
    const delivery = subtotal - discount >= shop.freeDeliveryAbove ? 0 : Number(shop.deliveryCharge) || 0;
    const total = round2(subtotal - discount + delivery);
    const custPhone = normalizePhone(input.phone);

    let upload: Awaited<ReturnType<typeof readUpload>> | null = null;
    if (hasFile) {
      upload = await readUpload(file, { maxBytes: MAX_RX_BYTES, allowPdf: true });
      if ("error" in upload) throw new UserError(upload.error!);
      await putFile("prescriptions", upload.key, upload.buf, upload.mime);
    }

    try {
      const number = await sql.begin(async (tx) => {
        const t = tx as unknown as typeof sql;
        if (couponCode) {
          const used = await t`
            update coupons set used_count = used_count + 1
            where code = ${couponCode} and active and (usage_limit is null or used_count < usage_limit)
            returning id`;
          if (!used.length) throw new UserError("This coupon has just been fully used.");
        }
        const customerId = await upsertCustomer(t, input.name, custPhone);
        await t`insert into addresses (customer_id, line) values (${customerId}, ${input.address}) on conflict do nothing`;
        const [o] = await t<{ id: string; number: string }[]>`
          insert into orders (customer_id, customer_name, customer_phone, address, subtotal, discount, delivery_charge, total, coupon_code, source)
          values (${customerId}, ${input.name}, ${custPhone}, ${input.address}, ${subtotal}, ${discount}, ${delivery}, ${total}, ${couponCode}, 'website')
          returning id, number`;
        for (const p of products) {
          await t`insert into order_items (order_id, product_id, name, pack, rx, mrp, price, qty)
                  values (${o.id}, ${p.id}, ${p.name}, ${p.pack}, ${p.rx}, ${p.mrp}, ${p.price}, ${qtyById.get(p.id)!})`;
        }
        await t`insert into order_events (order_id, status) values (${o.id}, 'new')`;
        if (upload && !("error" in upload)) {
          await t`insert into prescriptions (order_id, customer_id, customer_name, customer_phone, file_path, file_type, file_size)
                  values (${o.id}, ${customerId}, ${input.name}, ${custPhone}, ${upload.key}, ${upload.mime}, ${upload.size})`;
        }
        return o.number;
      });

      const message = buildOrderMessage(
        shop.name,
        products.map((p) => ({ name: p.name, pack: p.pack, qty: qtyById.get(p.id)!, price: p.price, rx: p.rx })),
        { orderNumber: number, subtotal, discount, delivery, total, hasPrescription: !!upload, customer: { name: input.name, address: input.address } },
      );
      return { data: { number, total, message } };
    } catch (e) {
      if (upload && !("error" in upload)) await deleteFile("prescriptions", upload.key);
      throw e;
    }
  });
}

/* ───────────── Send a prescription for a call-back ───────────── */
export async function submitPrescription(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    honeypot(fd);
    const ip = await clientIp();
    if (!(await rateLimit(`rx:${ip}`, 5, 3600))) throw new UserError("Too many uploads from this device. Please try again later.");
    const input = z.object({ name: text(80, 2), phone }).parse(formObject(fd));
    const upload = await readUpload(fd.get("file"), { maxBytes: MAX_RX_BYTES, allowPdf: true });
    if ("error" in upload) throw new UserError(upload.error!);
    const custPhone = normalizePhone(input.phone);
    await putFile("prescriptions", upload.key, upload.buf, upload.mime);
    try {
      await sql.begin(async (tx) => {
        const t = tx as unknown as typeof sql;
        const customerId = await upsertCustomer(t, input.name, custPhone);
        await t`insert into prescriptions (customer_id, customer_name, customer_phone, file_path, file_type, file_size)
                values (${customerId}, ${input.name}, ${custPhone}, ${upload.key}, ${upload.mime}, ${upload.size})`;
      });
    } catch (e) {
      await deleteFile("prescriptions", upload.key);
      throw e;
    }
    return { message: "Received! Our pharmacist will call you shortly." };
  });
}

/* ───────────── Customer review (held for approval) ───────────── */
export async function submitReview(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    honeypot(fd);
    const ip = await clientIp();
    if (!(await rateLimit(`review:${ip}`, 3, 3600))) throw new UserError("You've already sent a few reviews. Thank you!");
    const r = z.object({ name: text(60, 2), rating: int(1, 5), text: text(1000, 5) }).parse(formObject(fd));
    await sql`insert into reviews (name, rating, text, source) values (${r.name}, ${r.rating}, ${r.text}, 'Website')`;
    return { message: "Thank you! Your review will appear once our team has checked it." };
  });
}

/* ───────────── Coupon preview ───────────── */
export async function checkCoupon(code: string, subtotal: number): Promise<ActionResult<{ code: string; discount: number }>> {
  return run(async () => {
    const ip = await clientIp();
    if (!(await rateLimit(`coupon:${ip}`, 20, 600))) throw new UserError("Too many attempts. Please wait a few minutes.");
    const sub = z.number().finite().min(0).max(1_000_000).parse(subtotal);
    const { coupon, discount } = await evaluateCoupon(String(code ?? ""), sub);
    return { data: { code: coupon.code, discount }, message: `${coupon.code} applied — you save ₹${discount}.` };
  });
}
