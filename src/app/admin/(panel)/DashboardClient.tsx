"use client";

import { useState } from "react";
import { BarChart, type Point } from "@/components/admin/Chart";
import { StatCard } from "@/components/admin/Stat";
import { Card, Tabs } from "@/components/admin/ui";
import { AlertIcon, CalendarIcon, ReceiptIcon, RupeeIcon } from "@/components/icons/admin";
import { PrescriptionIcon } from "@/components/icons";
import { inr } from "@/lib/types";

const money = (n: number) => inr(Math.round(n));

export function DashboardStats({ stats }: { stats: { orders_today: number; sales_today: number; pending_rx: number; low_stock: number; expiring: number; new_orders: number } }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      <StatCard index={0} label="Today's orders" value={stats.orders_today} icon={<ReceiptIcon size={20} eager />} href="/admin/orders" note={`${stats.new_orders} awaiting confirmation`} />
      <StatCard index={1} label="Today's sales" value={stats.sales_today} format={money} icon={<RupeeIcon size={20} eager />} href="/admin/reports" />
      <StatCard index={2} label="Pending Rx" value={stats.pending_rx} tone="gold" icon={<PrescriptionIcon size={22} eager />} href="/admin/prescriptions" note="Need pharmacist review" />
      <StatCard index={3} label="Low stock" value={stats.low_stock} tone="gold" icon={<AlertIcon size={20} eager />} href="/admin/products?filter=low" note="At or below threshold" />
      <StatCard index={4} label="Expiring ≤ 60 days" value={stats.expiring} tone="red" icon={<CalendarIcon size={20} eager />} href="/admin/products?filter=expiring" note="Batches with stock" />
    </div>
  );
}

export function SalesCard({ series, className = "" }: { series: Record<"7d" | "30d" | "12m", Point[]>; className?: string }) {
  const [range, setRange] = useState<"7d" | "30d" | "12m">("7d");
  const data = series[range];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card className={className} title="Sales" action={<Tabs id="sales-range" value={range} onChange={setRange} tabs={[{ value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "12m", label: "12 months" }]} />}>
      <p className="mb-4 text-[13px] text-a-muted">
        <span className="font-serif text-2xl text-a-text">{money(total)}</span> excluding cancelled orders
      </p>
      <BarChart key={range} data={data} format={money} label={`Sales, ${range === "12m" ? "last 12 months" : range === "30d" ? "last 30 days" : "last 7 days"}`} />
    </Card>
  );
}
