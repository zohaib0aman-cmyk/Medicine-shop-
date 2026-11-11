import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePage } from "@/lib/server/auth";
import { dashboardStats, latestOrders, salesSeries, topSellers } from "@/lib/server/admin/dashboard";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { StatusPill, fmtDate } from "@/components/admin/status";
import { RankBars } from "@/components/admin/Chart";
import { DashboardStats, SalesCard } from "./DashboardClient";
import { inr } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await requirePage();
  if (me.role === "delivery") redirect("/admin/orders");
  const { denied } = await searchParams;
  const [stats, d7, d30, m12, latest, top] = await Promise.all([dashboardStats(), salesSeries("7d"), salesSeries("30d"), salesSeries("12m"), latestOrders(), topSellers()]);
  const hour = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {denied ? <p className="mb-4 rounded-xl bg-a-warn-bg px-4 py-3 text-[13px] text-a-warn">Your role doesn&apos;t include access to {denied}.</p> : null}
      <PageHeader eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })} title={`${greet}, ${me.name.split(" ")[0]}`} subtitle="Here's how the dispensary is doing today." />
      <DashboardStats stats={stats} />
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SalesCard series={{ "7d": d7, "30d": d30, "12m": m12 }} className="xl:col-span-2" />
        <Card title="Top sellers" action={<span className="text-[12px] text-a-muted">Last 30 days</span>}>
          {top.length ? <RankBars rows={top.map((t) => ({ label: t.name, value: t.qty, sub: inr(t.revenue) }))} suffix=" sold" /> : <p className="text-[13px] text-a-muted">No sales yet.</p>}
        </Card>
      </div>
      <Card className="mt-5" title="Latest orders" action={<Link href="/admin/orders" className="text-[13px] font-semibold text-a-gold hover:underline">View all →</Link>} pad={false}>
        <ul className="divide-y divide-a-border/60">
          {latest.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-a-raised/60">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                    {o.number} <span className="font-normal text-a-muted">· {o.customer_name}</span>
                    {o.has_rx ? <Pill tone="red">Rx</Pill> : null}
                  </p>
                  <p className="text-[12px] text-a-muted">
                    {fmtDate(o.created_at)} · {o.items} item{o.items === 1 ? "" : "s"}
                  </p>
                </div>
                <StatusPill status={o.status} />
                <span className="w-20 text-right text-[14px] font-semibold tabular-nums">{inr(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
