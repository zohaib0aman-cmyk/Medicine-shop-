import "server-only";
import { z } from "zod";

/** Strip control characters / zero-width chars and trim. All text input passes through this. */
export const clean = (s: string) =>
  s.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\uFEFF]/g, "").trim();

export const text = (max: number, min = 0) =>
  z.preprocess((v) => (typeof v === "string" ? clean(v) : v ?? ""), z.string().min(min, min ? `Required (min ${min} characters)` : undefined).max(max, `Max ${max} characters`));

export const optionalText = (max: number) => text(max).optional().default("");

export const money = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number({ error: "Enter an amount" }).finite().min(0, "Must be 0 or more").max(1_000_000, "Too large"),
);
export const int = (min = 0, max = 1_000_000) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number({ error: "Enter a number" }).int("Whole numbers only").min(min).max(max));

export const bool = z.preprocess((v) => v === true || v === "true" || v === "on" || v === "1", z.boolean());

export const phone = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[\s()-]/g, "") : v),
  z.string().regex(/^\+?[0-9]{8,15}$/, "Enter a valid phone number"),
);

export const email = z.preprocess((v) => (typeof v === "string" ? clean(v).toLowerCase() : v), z.string().email("Enter a valid email").max(120));

export const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

export const uuid = z.string().uuid("Invalid id");

/** FormData → plain object (repeated keys become arrays). */
export function formObject(fd: FormData) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    if (k in o) o[k] = ([] as unknown[]).concat(o[k], v);
    else o[k] = v;
  }
  return o;
}
