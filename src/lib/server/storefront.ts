import "server-only";
import { unstable_cache } from "next/cache";
import { hasDb, sql } from "./db";
import { publicImageUrl } from "./storage";
import type { Faq, Hero, InvoiceSettings, Offer, Shop, Stat, Storefront } from "@/lib/types";
import { site } from "@/lib/site";
import { categories as staticCats, products as staticProducts } from "@/data/catalog";
import { faqs as staticFaqs, reviews as staticReviews } from "@/data/content";

export const DEFAULT_SHOP: Shop = {
  name: site.name, tagline: site.tagline, city: site.city, street: site.address.street, region: site.address.region,
  postalCode: site.address.postalCode, phoneDisplay: site.phoneDisplay, phoneE164: site.phoneE164, whatsapp: site.whatsapp,
  email: site.email, timings: site.timings, openingHours: site.openingHoursSchema.join(", "), drugLicence: site.drugLicence,
  gstin: site.gstin, pharmacist: site.pharmacist, deliveryArea: site.deliveryArea, deliveryCharge: 30, freeDeliveryAbove: 499,
  lat: site.geo.lat, lng: site.geo.lng, instagram: "", facebook: "", google: "",
};
export const DEFAULT_HERO: Hero = {
  eyebrow: "Est. family chemist",
  title: "Your Trusted *Family Chemist* in {city}",
  subtitle: "Genuine medicines, honest advice from a qualified pharmacist, and quick home delivery. Send your prescription — we'll take care of the rest.",
};
export const DEFAULT_OFFER: Offer = { active: true, eyebrow: "This month", title: "Free home delivery across your area", details: "", cta: "Claim on WhatsApp" };
export const DEFAULT_INVOICE: InvoiceSettings = { prefix: "INV", footer: "", showBatch: true, showMrp: true, gstRate: 12 };

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await sql<{ value: T }[]>`select value from site_settings where key = ${key}`;
  if (!row) return fallback;
  return Array.isArray(fallback) ? (row.value as T) : { ...fallback, ...(row.value as object) };
}

function staticStorefront(): Storefront {
  return {
    live: false,
    shop: DEFAULT_SHOP,
    hero: DEFAULT_HERO,
    offer: DEFAULT_OFFER,
    stats: site.stats.map((s) => ({ ...s })),
    faqs: staticFaqs,
    categories: staticCats.map((c) => ({ ...c, icon: { prescription: "prescription", otc: "capsule", baby: "baby", diabetes: "glucose", skin: "lotion", ayurvedic: "mortar", devices: "stethoscope", firstaid: "firstaid" }[c.id] ?? "capsule" })),
    products: staticProducts.map((p) => ({ id: p.id, name: p.name, brand: "", pack: p.pack, category: p.category, price: p.price, mrp: p.mrp, rx: !!p.rx, art: p.art, image: p.image, inStock: true, featured: true })),
    reviews: staticReviews.map((r, i) => ({ id: String(i), ...r, source: r.source ?? "" })),
  };
}

async function loadStorefront(): Promise<Storefront> {
  const [shop, hero, offer, stats, faqs] = await Promise.all([
    getSetting<Shop>("shop", DEFAULT_SHOP),
    getSetting<Hero>("hero", DEFAULT_HERO),
    getSetting<Offer>("offer", DEFAULT_OFFER),
    getSetting<Stat[]>("stats", []),
    getSetting<Faq[]>("faqs", []),
  ]);
  const categories = await sql<{ id: string; name: string; blurb: string; icon: string }[]>`
    select id, name, blurb, icon from categories order by sort_order, name`;
  const products = await sql<{ id: string; name: string; brand: string; pack: string; category_id: string; price: number; mrp: number; rx: boolean; art: string; images: string[]; stock: number; featured: boolean }[]>`
    select p.id, p.name, p.brand, p.pack, p.category_id, p.price, p.mrp, p.rx, p.art, p.images, p.featured,
           coalesce((select sum(quantity) from batches b where b.product_id = p.id and b.expiry_date > current_date), 0)::int as stock
    from products p join categories c on c.id = p.category_id
    where p.active
    order by p.featured desc, c.sort_order, p.name`;
  const reviews = await sql<{ id: string; name: string; text: string; rating: number; source: string; reply: string | null }[]>`
    select id, name, text, rating, source, reply from reviews where status = 'approved' order by created_at desc limit 20`;
  return {
    live: true, shop, hero, offer, stats, faqs, categories,
    products: products.map((p) => ({
      id: p.id, name: p.name, brand: p.brand, pack: p.pack, category: p.category_id, price: p.price, mrp: p.mrp, rx: p.rx,
      art: p.art, image: p.images[0] ? publicImageUrl(p.images[0]) : undefined, inStock: p.stock > 0, featured: p.featured,
    })),
    reviews,
  };
}

const cached = unstable_cache(loadStorefront, ["storefront-v1"], { tags: ["storefront"], revalidate: 600 });

/** Public storefront data. Cached, and invalidated instantly whenever the admin saves (revalidateTag("storefront")). */
export async function getStorefront(): Promise<Storefront> {
  if (!hasDb()) return staticStorefront();
  try {
    return await cached();
  } catch (e) {
    console.error("[storefront] database unavailable, serving static data", e);
    return staticStorefront();
  }
}
