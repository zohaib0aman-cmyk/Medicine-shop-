"use client";

import type { ReactNode } from "react";
import { LinkButton } from "./ui/Button";
import { useOrder } from "@/lib/order";
import { useStore } from "@/lib/store";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";

/**
 * “Order on WhatsApp”. With items in the order it opens the checkout drawer (which records the
 * order and then hands over to WhatsApp); with an empty order it opens a plain WhatsApp chat.
 * Blocks Rx items without a prescription.
 */
export function WaOrderLink({ children, className = "", variant = "wa" }: { children: ReactNode; className?: string; variant?: "wa" | "gold" | "primary" | "outline" }) {
  const { lines, prescription, rxBlocked, notify, setDrawerOpen } = useOrder();
  const { shop, live } = useStore();
  const msg = buildOrderMessage(
    shop.name,
    lines.map((l) => ({ name: l.p.name, pack: l.p.pack, qty: l.qty, price: l.p.price, rx: l.p.rx })),
    { hasPrescription: !!prescription },
  );
  return (
    <LinkButton
      variant={variant}
      className={className}
      href={waLink(shop.whatsapp, msg)}
      onClick={(e) => {
        if (rxBlocked) {
          e.preventDefault();
          notify("Your order has Rx items — upload a prescription first.", "warn");
          document.getElementById("prescription")?.scrollIntoView({ behavior: "smooth" });
        } else if (live && lines.length > 0) {
          e.preventDefault();
          setDrawerOpen(true);
        }
      }}
    >
      {children}
    </LinkButton>
  );
}
