import { Pill, type Tone } from "./ui";
import { STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const STATUS_TONE: Record<OrderStatus, Tone> = {
  new: "gold",
  confirmed: "blue",
  packed: "neutral",
  out_for_delivery: "primary",
  delivered: "green",
  cancelled: "red",
};

export function StatusPill({ status }: { status: string }) {
  const s = status as OrderStatus;
  return (
    <Pill tone={STATUS_TONE[s] ?? "neutral"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[s] ?? status}
    </Pill>
  );
}

export const fmtDate = (d: Date | string, withTime = true) =>
  new Date(d).toLocaleString("en-IN", withTime ? { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: process.env.NEXT_PUBLIC_SHOP_TZ || "Asia/Kolkata" } : { day: "numeric", month: "short", year: "numeric", timeZone: process.env.NEXT_PUBLIC_SHOP_TZ || "Asia/Kolkata" });
