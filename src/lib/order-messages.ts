import type { OrderStatus } from "./types";

/** Pre-filled WhatsApp status updates sent to customers from the admin. */
export const waTemplates = (o: { number: string; customer_name: string; total: number }, shopName: string): Record<OrderStatus, string> => {
  const first = o.customer_name.replace(/\s*\(demo\)$/, "").split(" ")[0];
  const amt = "₹" + Number(o.total).toLocaleString("en-IN");
  return {
    new: `Hello ${first}, we've received your order ${o.number} at ${shopName}. Our pharmacist will confirm it shortly.`,
    confirmed: `Hello ${first}, your order ${o.number} at ${shopName} is confirmed. Total: ${amt}. We'll let you know when it's packed.`,
    packed: `Hello ${first}, your order ${o.number} is packed and will be dispatched shortly.`,
    out_for_delivery: `Hello ${first}, your order ${o.number} is out for delivery. Amount payable: ${amt}.`,
    delivered: `Hello ${first}, your order ${o.number} has been delivered. Thank you for choosing ${shopName}! Wishing you good health.`,
    cancelled: `Hello ${first}, your order ${o.number} at ${shopName} has been cancelled. Please call us if you have any questions.`,
  };
};
