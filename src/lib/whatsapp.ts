import { inr } from "./types";

export const waLink = (number: string, text: string) => `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
export const telHref = (e164: string) => `tel:${e164.replace(/[^\d+]/g, "")}`;

export type MsgLine = { name: string; pack: string; qty: number; price: number; rx: boolean };

export function buildOrderMessage(
  shopName: string,
  lines: MsgLine[],
  o: { hasPrescription?: boolean; orderNumber?: string; subtotal?: number; discount?: number; delivery?: number; total?: number; customer?: { name: string; address: string } } = {},
) {
  if (lines.length === 0) {
    return `Hello ${shopName}! I'd like to place an order.${o.hasPrescription ? " I'm sharing my prescription photo in this chat." : ""}\n\nName:\nDelivery address:`;
  }
  const body = lines.map((l, i) => `${i + 1}. ${l.name} (${l.pack}) × ${l.qty} — ${inr(l.price * l.qty)}${l.rx ? " [Rx]" : ""}`).join("\n");
  const sub = o.subtotal ?? lines.reduce((s, l) => s + l.price * l.qty, 0);
  const out = [
    o.orderNumber ? `Hello ${shopName}! I've placed order *${o.orderNumber}*:` : `Hello ${shopName}! I'd like to order:`,
    "",
    body,
    "",
    `Subtotal: ${inr(sub)}`,
  ];
  if (o.discount) out.push(`Discount: −${inr(o.discount)}`);
  if (o.delivery != null) out.push(`Delivery: ${o.delivery ? inr(o.delivery) : "Free"}`);
  out.push(`${o.orderNumber ? "Total" : "Estimated total"}: ${inr(o.total ?? sub)} (final price confirmed by the pharmacy)`);
  if (o.hasPrescription || lines.some((l) => l.rx)) out.push(o.orderNumber ? "Prescription: uploaded with the order." : "Prescription: I'm attaching the photo in this chat.");
  out.push("");
  out.push(`Name: ${o.customer?.name ?? ""}`);
  out.push(`Delivery address: ${o.customer?.address ?? ""}`);
  return out.join("\n");
}

export const prescriptionMessage = (shopName: string) =>
  `Hello ${shopName}! I'm sending my prescription photo for an order. Please confirm availability and price.\n\nName:\nDelivery address:`;
