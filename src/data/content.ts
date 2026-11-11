import { site } from "@/lib/site";

export const faqs = [
  {
    q: "Do you deliver medicines at home?",
    a: `Yes. We deliver across ${site.deliveryArea}. Send your list or prescription on WhatsApp and we will confirm availability, price and delivery time on a call.`,
  },
  {
    q: "Can I order prescription medicines online?",
    a: "Yes, but only with a valid prescription from a registered medical practitioner. Upload a clear photo of it, and our registered pharmacist will verify it before dispensing. Prescription-only items cannot be ordered without one.",
  },
  {
    q: "How does ordering on WhatsApp work?",
    a: "Add items to your order on this site and tap “Order on WhatsApp”. A message listing your items opens in WhatsApp — just add your address and send. For prescription items, attach the prescription photo in the same chat.",
  },
  {
    q: "Are your medicines genuine?",
    a: "We are a licensed pharmacy and source only from authorised distributors and manufacturers. Every bill carries our Drug Licence number and batch details.",
  },
  {
    q: "What are your shop timings?",
    a: `We are open ${site.timings}. WhatsApp messages received after hours are answered first thing when we open.`,
  },
  {
    q: "Which payment methods do you accept?",
    a: "[PAYMENT MODES — e.g. Cash, UPI and cards on delivery]",
  },
];

/**
 * REAL customer reviews only. Paste them exactly as given (with permission).
 * Until this list has entries, the site shows clearly-marked empty slots.
 */
export type Review = { name: string; text: string; rating: 1 | 2 | 3 | 4 | 5; source?: string };
export const reviews: Review[] = [];

