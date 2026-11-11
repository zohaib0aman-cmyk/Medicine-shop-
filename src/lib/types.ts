/** Types shared by the public site, the admin and the server. */
export type Shop = {
  name: string; tagline: string; city: string; street: string; region: string; postalCode: string;
  phoneDisplay: string; phoneE164: string; whatsapp: string; email: string;
  timings: string; openingHours: string; drugLicence: string; gstin: string; pharmacist: string;
  deliveryArea: string; deliveryCharge: number; freeDeliveryAbove: number;
  lat: number; lng: number; instagram: string; facebook: string; google: string;
};
export type Hero = { eyebrow: string; title: string; subtitle: string };
export type Offer = { active: boolean; eyebrow: string; title: string; details: string; cta: string };
export type Stat = { value: number; suffix: string; label: string };
export type Faq = { q: string; a: string };
export type InvoiceSettings = { prefix: string; footer: string; showBatch: boolean; showMrp: boolean; gstRate: number };

export type StoreCategory = { id: string; name: string; blurb: string; icon: string };
export type StoreProduct = {
  id: string; name: string; brand: string; pack: string; category: string;
  price: number; mrp: number; rx: boolean; art: string; image?: string; inStock: boolean; featured: boolean;
};
export type StoreReview = { id: string; name: string; text: string; rating: number; source: string; reply?: string | null };

export type Storefront = {
  live: boolean; // false = running without a database (static sample data)
  shop: Shop; hero: Hero; offer: Offer; stats: Stat[]; faqs: Faq[];
  categories: StoreCategory[]; products: StoreProduct[]; reviews: StoreReview[];
};

export const ORDER_STATUSES = ["new", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New", confirmed: "Confirmed", packed: "Packed", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
};
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const fullAddress = (s: Pick<Shop, "street" | "city" | "region" | "postalCode">) =>
  [s.street, s.city, s.region, s.postalCode].filter(Boolean).join(", ");
export const inr = (n: number) => {
  const v = Number(n || 0);
  const frac = Math.round(v * 100) % 100 !== 0;
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: 2 });
};
export const discountPct = (p: { mrp: number; price: number }) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
export const rxNotice = "Medicines are dispensed only against a valid prescription by a registered pharmacist.";
