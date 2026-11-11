"use client";

import type { ReactNode } from "react";
import { LinkButton } from "./ui/Button";
import { useOrder } from "@/lib/order";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";

/** “Order on WhatsApp” — pre-fills the message with the selected items. Blocks Rx items without a prescription. */
export function WaOrderLink({ children, className = "", variant = "wa" }: { children: ReactNode; className?: string; variant?: "wa" | "gold" | "primary" | "outline" }) {
  const { items, prescription, rxBlocked, notify } = useOrder();
  return (
    <LinkButton
      variant={variant}
      className={className}
      href={waLink(buildOrderMessage(items, !!prescription))}
      onClick={(e) => {
        if (rxBlocked) {
          e.preventDefault();
          notify("Your order has Rx items — upload a prescription first.", "warn");
          document.getElementById("prescription")?.scrollIntoView({ behavior: "smooth" });
        }
      }}
    >
      {children}
    </LinkButton>
  );
}
