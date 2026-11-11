"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { bool, formObject, int, money, text } from "@/lib/server/validate";
import { DEFAULT_INVOICE, DEFAULT_SHOP, getSetting } from "@/lib/server/storefront";
import type { Shop } from "@/lib/types";

const urlOrEmpty = z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.union([z.literal(""), z.string().url("Enter a full link starting with https://").max(300).refine((u) => /^https?:\/\//.test(u), "Must start with http(s)://")]));
const digits = (min: number, max: number, msg: string) => z.preprocess((v) => String(v ?? "").replace(/\D/g, ""), z.string().regex(new RegExp(`^\\d{${min},${max}}$`), msg));
const coord = (lim: number) => z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(-lim).max(lim));

const contactSchema = z.object({
  timings: text(120, 2),
  openingHours: text(200),
  phoneDisplay: text(30, 5),
  phoneE164: z.preprocess((v) => "+" + String(v ?? "").replace(/\D/g, ""), z.string().regex(/^\+\d{8,15}$/, "Use the full number with country code, e.g. +919876543210")),
  whatsapp: digits(8, 15, "Digits only, with country code, e.g. 919876543210"),
  email: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.union([z.literal(""), z.string().email("Enter a valid email").max(120)])),
  street: text(200, 2),
  city: text(60, 2),
  region: text(60),
  postalCode: text(12),
});

const shopSchema = contactSchema.extend({
  name: text(60, 2),
  tagline: text(80),
  drugLicence: text(120, 2),
  gstin: z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.string().max(20)),
  pharmacist: text(120),
  deliveryArea: text(160, 2),
  deliveryCharge: money,
  freeDeliveryAbove: money,
  lat: coord(90),
  lng: coord(180),
  instagram: urlOrEmpty,
  facebook: urlOrEmpty,
  google: urlOrEmpty,
});

const SCHEMAS = {
  hero: { module: "content", schema: z.object({ eyebrow: text(60), title: text(120, 5), subtitle: text(400, 10) }) },
  offer: { module: "content", schema: z.object({ active: bool, eyebrow: text(40), title: text(120, 3), details: text(240), cta: text(30, 2) }) },
  contact: { module: "content", schema: contactSchema },
  shop: { module: "settings", schema: shopSchema },
  invoice: { module: "settings", schema: z.object({ prefix: z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.string().regex(/^[A-Z0-9-]{1,10}$/, "1–10 letters/numbers")), footer: text(400), showBatch: bool, showMrp: bool, gstRate: z.preprocess((v) => Number(v), z.number().refine((n) => [0, 5, 12, 18, 28].includes(n), "Choose a GST slab")) }) },
} as const;

type Key = keyof typeof SCHEMAS;

async function upsert(key: string, value: unknown, staffId: string) {
  await sql`
    insert into site_settings (key, value, updated_by) values (${key}, ${sql.json(value as never)}, ${staffId})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
}

export async function saveSettings(key: Key, fd: FormData) {
  return run(async () => {
    const def = SCHEMAS[key];
    if (!def) throw new Error("Unknown settings key");
    const me = await requireStaff(def.module);
    const value = def.schema.parse(formObject(fd));
    if (key === "contact" || key === "shop") {
      // contact details live inside the shop record
      const current = await getSetting<Shop>("shop", DEFAULT_SHOP);
      await upsert("shop", { ...current, ...value }, me.id);
    } else if (key === "invoice") {
      await upsert("invoice", { ...DEFAULT_INVOICE, ...value }, me.id);
    } else {
      await upsert(key, value, me.id);
    }
    await logActivity({ action: `settings.${key}`, entity: "settings", entityId: key, summary: `Updated ${key === "shop" ? "shop details" : key === "contact" ? "timings & contact" : key === "hero" ? "hero text" : key === "offer" ? "offer banner" : "invoice format"}`, details: value });
    return { message: "Saved — live on the website", revalidate: ["/admin/content", "/admin/settings"], storefront: true };
  });
}

const faqSchema = z.array(z.object({ q: text(200, 3), a: text(1500, 3) })).max(30);
export async function saveFaqs(faqs: { q: string; a: string }[]) {
  return run(async () => {
    const me = await requireStaff("content");
    const v = faqSchema.parse(faqs);
    await upsert("faqs", v, me.id);
    await logActivity({ action: "settings.faqs", entity: "settings", entityId: "faqs", summary: `Updated FAQ (${v.length} questions)` });
    return { message: "FAQ saved — live on the website", revalidate: ["/admin/content"], storefront: true };
  });
}

const statsSchema = z.array(z.object({ value: int(0, 10_000_000), suffix: text(10), label: text(80, 2) })).max(6);
export async function saveStats(stats: { value: number; suffix: string; label: string }[]) {
  return run(async () => {
    const me = await requireStaff("content");
    const v = statsSchema.parse(stats);
    await upsert("stats", v, me.id);
    await logActivity({ action: "settings.stats", entity: "settings", entityId: "stats", summary: "Updated “Why choose us” figures" });
    return { message: "Figures saved", revalidate: ["/admin/content"], storefront: true };
  });
}
