"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { bool, dateStr, formObject, money, text, uuid } from "@/lib/server/validate";

const optMoney = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().finite().positive("Must be more than 0").max(1_000_000).nullable());
const optInt = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive("Must be 1 or more").max(1_000_000).nullable());

export async function saveCoupon(fd: FormData) {
  return run(async () => {
    await requireStaff("coupons");
    const v = z
      .object({
        id: z.string().optional().default(""),
        code: z.preprocess((x) => String(x ?? "").trim().toUpperCase(), z.string().regex(/^[A-Z0-9_-]{3,20}$/, "3–20 letters, numbers, - or _")),
        description: text(160),
        type: z.enum(["percent", "flat"]),
        value: money.refine((n) => n > 0, "Must be more than 0"),
        min_order: money,
        max_discount: optMoney,
        starts_at: dateStr,
        ends_at: z.preprocess((x) => (x === "" ? null : x), dateStr.nullable()),
        usage_limit: optInt,
        active: bool,
      })
      .refine((c) => c.type !== "percent" || c.value <= 100, { path: ["value"], message: "A percentage can't exceed 100" })
      .refine((c) => !c.ends_at || c.ends_at >= c.starts_at, { path: ["ends_at"], message: "End date must be after the start date" })
      .parse(formObject(fd));
    // dates are whole days in shop time: valid from the start of starts_at until the end of ends_at
    const starts = sql`(${v.starts_at}::date)::timestamp at time zone 'Asia/Kolkata'`;
    const ends = v.ends_at ? sql`((${v.ends_at}::date + 1)::timestamp at time zone 'Asia/Kolkata')` : sql`null`;
    if (v.id) {
      uuid.parse(v.id);
      const r = await sql`
        update coupons set code = ${v.code}, description = ${v.description}, type = ${v.type}, value = ${v.value}, min_order = ${v.min_order},
          max_discount = ${v.max_discount}, starts_at = ${starts}, ends_at = ${ends}, usage_limit = ${v.usage_limit}, active = ${v.active}
        where id = ${v.id}`;
      if (!r.count) throw new UserError("Coupon not found.");
    } else {
      await sql`
        insert into coupons (code, description, type, value, min_order, max_discount, starts_at, ends_at, usage_limit, active)
        values (${v.code}, ${v.description}, ${v.type}, ${v.value}, ${v.min_order}, ${v.max_discount}, ${starts}, ${ends}, ${v.usage_limit}, ${v.active})`;
    }
    await logActivity({ action: v.id ? "coupon.update" : "coupon.create", entity: "coupon", entityId: v.code, summary: `${v.id ? "Updated" : "Created"} coupon ${v.code}: ${v.type === "percent" ? `${v.value}%` : `₹${v.value}`} off, min ₹${v.min_order}` });
    return { message: v.id ? "Coupon saved" : `Coupon ${v.code} created`, revalidate: ["/admin/coupons"] };
  });
}

export async function toggleCoupon(id: string, active: boolean) {
  return run(async () => {
    await requireStaff("coupons");
    const input = z.object({ id: uuid, active: z.boolean() }).parse({ id, active });
    const [c] = await sql<{ code: string }[]>`update coupons set active = ${input.active} where id = ${input.id} returning code`;
    if (!c) throw new UserError("Coupon not found.");
    await logActivity({ action: "coupon.toggle", entity: "coupon", entityId: c.code, summary: `${c.code} ${input.active ? "activated" : "paused"}` });
    return { message: `${c.code} ${input.active ? "activated" : "paused"}`, revalidate: ["/admin/coupons"] };
  });
}

export async function deleteCoupon(id: string) {
  return run(async () => {
    await requireStaff("coupons");
    uuid.parse(id);
    const [c] = await sql<{ code: string }[]>`delete from coupons where id = ${id} returning code`;
    if (!c) throw new UserError("Coupon not found.");
    await logActivity({ action: "coupon.delete", entity: "coupon", entityId: c.code, summary: `Deleted coupon ${c.code}` });
    return { message: `Deleted ${c.code}`, revalidate: ["/admin/coupons"] };
  });
}
