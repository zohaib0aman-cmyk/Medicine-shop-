"use client";

import { Btn } from "./ui";
import { useAction } from "./useAction";
import { setOrderStatus } from "@/app/admin/actions/orders";
import { CheckIcon, ScooterIcon } from "../icons";
import { BoxIcon } from "../icons/admin";
import type { OrderStatus } from "@/lib/types";
import type { Role } from "@/lib/permissions";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: "confirmed", label: "Confirm" },
  confirmed: { to: "packed", label: "Mark packed" },
  packed: { to: "out_for_delivery", label: "Out for delivery" },
  out_for_delivery: { to: "delivered", label: "Mark delivered" },
};

export function nextStep(status: OrderStatus, role: Role) {
  const n = NEXT[status];
  if (!n) return null;
  if (role === "delivery" && !["packed", "out_for_delivery"].includes(status)) return null;
  return n;
}

/** One-tap “move to next status” button. The server re-checks role, Rx approval and stock. */
export function NextStatusButton({ id, status, role, rxBlocked, size = "sm" }: { id: string; status: OrderStatus; role: Role; rxBlocked?: boolean; size?: "sm" | "md" }) {
  const act = useAction(setOrderStatus);
  const n = nextStep(status, role);
  if (!n) return null;
  if (rxBlocked && status === "new") {
    return (
      <Btn size={size} disabled title="Approve the prescription first">
        Rx pending
      </Btn>
    );
  }
  const Icon = n.to === "out_for_delivery" ? ScooterIcon : n.to === "packed" ? BoxIcon : CheckIcon;
  return (
    <Btn size={size} variant="primary" disabled={act.pending} onClick={() => act.run(id, n.to)}>
      {act.pending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Icon size={16} eager strokeWidth={2.2} />}
      {n.label}
    </Btn>
  );
}
