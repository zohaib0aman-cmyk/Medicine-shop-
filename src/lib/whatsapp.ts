import { site } from "./site";
import { inr, productById } from "@/data/catalog";

export const waLink = (text: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
export const telLink = `tel:${site.phoneE164}`;

export function buildOrderMessage(items: Record<string, number>, hasPrescription: boolean) {
  const lines = Object.entries(items)
    .map(([id, qty]) => ({ p: productById(id), qty }))
    .filter((x) => x.p && x.qty > 0);

  if (lines.length === 0) {
    return `Hello ${site.name}! I'd like to place an order. ${hasPrescription ? "I'm sharing my prescription photo in this chat." : ""}\n\nName:\nDelivery address:`;
  }

  const total = lines.reduce((s, { p, qty }) => s + p!.price * qty, 0);
  const anyRx = lines.some(({ p }) => p!.rx);
  const body = lines
    .map(({ p, qty }, i) => `${i + 1}. ${p!.name} (${p!.pack}) × ${qty} — ${inr(p!.price * qty)}${p!.rx ? " [Rx]" : ""}`)
    .join("\n");

  return [
    `Hello ${site.name}! I'd like to order:`,
    "",
    body,
    "",
    `Estimated total: ${inr(total)} (final price confirmed by the pharmacy)`,
    anyRx || hasPrescription ? "Prescription: I'm attaching the photo in this chat." : "",
    "",
    "Name:",
    "Delivery address:",
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
}

export const prescriptionMessage = `Hello ${site.name}! I'm sending my prescription photo for an order. Please confirm availability and price.\n\nName:\nDelivery address:`;
