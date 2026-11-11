import "server-only";
import { sql } from "./db";
import { UserError } from "./action";

export type CouponRow = {
  id: string; code: string; type: "percent" | "flat"; value: number; min_order: number; max_discount: number | null;
  starts_at: Date; ends_at: Date | null; usage_limit: number | null; used_count: number; active: boolean;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function discountFor(c: Pick<CouponRow, "type" | "value" | "max_discount">, subtotal: number) {
  const raw = c.type === "percent" ? (subtotal * c.value) / 100 : c.value;
  return round2(Math.min(raw, c.max_discount ?? Infinity, subtotal));
}

/** Validates a coupon for a subtotal. Throws a customer-friendly UserError when it can't be used. */
export async function evaluateCoupon(codeRaw: string, subtotal: number) {
  const code = codeRaw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20);
  if (!code) throw new UserError("Enter a coupon code.");
  const [c] = await sql<CouponRow[]>`select * from coupons where code = ${code}`;
  if (!c || !c.active) throw new UserError("This coupon code isn't valid.");
  if (new Date(c.starts_at) > new Date()) throw new UserError("This coupon isn't active yet.");
  if (c.ends_at && new Date(c.ends_at) < new Date()) throw new UserError("This coupon has expired.");
  if (c.usage_limit != null && c.used_count >= c.usage_limit) throw new UserError("This coupon has been fully used.");
  if (subtotal < c.min_order) throw new UserError(`Add ₹${Math.ceil(c.min_order - subtotal)} more to use this coupon (minimum ₹${c.min_order}).`);
  return { coupon: c, discount: discountFor(c, subtotal) };
}
