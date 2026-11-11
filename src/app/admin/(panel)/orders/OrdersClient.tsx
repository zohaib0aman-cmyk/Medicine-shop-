"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DataList } from "@/components/admin/DataList";
import { NextStatusButton } from "@/components/admin/OrderActions";
import { StatusPill, fmtDate } from "@/components/admin/status";
import { BtnLink, Card, EmptyState, Pill, Tabs } from "@/components/admin/ui";
import { ReceiptIcon } from "@/components/icons/admin";
import { WhatsAppIcon } from "@/components/icons";
import { STATUS_LABEL, inr, type OrderStatus } from "@/lib/types";
import type { Role } from "@/lib/permissions";

type Row = { id: string; number: string; customer_name: string; customer_phone: string; status: OrderStatus; payment_status: string; total: number; created_at: string; items: number; has_rx: boolean; rx_ok: boolean };
type Data = { rows: Row[]; counts: Partial<Record<OrderStatus, number>>; total: number; page: number; pages: number };

const ALL: OrderStatus[] = ["new", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"];

export function OrdersClient({ data, role, status, q }: { data: Data; role: Role; status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  const visible = role === "delivery" ? (["packed", "out_for_delivery", "delivered"] as OrderStatus[]) : ALL;
  const go = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(query ? { q: query } : {}), ...params });
    for (const [k, v] of [...sp.entries()]) if (!v || v === "all") sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  };
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => go({ q: query, page: "" }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const total = Object.values(data.counts).reduce((a, b) => a + (b ?? 0), 0);
  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-a-border/70 p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs
          id="order-status"
          value={status}
          onChange={(v) => go({ status: v, page: "" })}
          tabs={[{ value: "all", label: "All", count: total }, ...visible.map((s) => ({ value: s, label: STATUS_LABEL[s], count: data.counts[s] ?? 0 }))]}
        />
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Search number, name or phone" className="a-input !h-10 2xl:max-w-xs" aria-label="Search orders" />
      </div>
      <DataList
        rows={data.rows}
        rowKey={(r) => r.id}
        href={(r) => `/admin/orders/${r.id}`}
        rowClassName={(r) => (r.status === "new" ? "bg-a-warn-bg/30" : "")}
        empty={<EmptyState icon={<ReceiptIcon size={30} />} title="No orders here" body={q ? "Try a different search." : "New website orders will appear here instantly."} />}
        columns={[
          { key: "n", label: "Order", render: (r) => <div><p className="font-semibold">{r.number}</p><p className="text-[12px] text-a-muted">{fmtDate(r.created_at)}</p></div> },
          { key: "c", label: "Customer", render: (r) => <div><p>{r.customer_name}</p><p className="text-[12px] text-a-muted">{r.customer_phone}</p></div> },
          { key: "i", label: "Items", render: (r) => <span className="flex items-center gap-1.5">{r.items}{r.has_rx ? <Pill tone={r.rx_ok ? "green" : "red"}>{r.rx_ok ? "Rx ✓" : "Rx"}</Pill> : null}</span> },
          { key: "p", label: "Payment", render: (r) => <Pill tone={r.payment_status === "paid" ? "green" : r.payment_status === "refunded" ? "red" : "neutral"}>{r.payment_status}</Pill> },
          { key: "s", label: "Status", render: (r) => <StatusPill status={r.status} /> },
          { key: "t", label: "Total", align: "right", render: (r) => <span className="font-semibold">{inr(r.total)}</span> },
        ]}
        actions={(r) => (
          <>
            <NextStatusButton id={r.id} status={r.status} role={role} rxBlocked={r.has_rx && !r.rx_ok} />
            <BtnLink size="sm" variant="wa" href={`https://wa.me/${r.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${r.customer_name}`}>
              <WhatsAppIcon size={16} eager strokeWidth={2.4} />
            </BtnLink>
          </>
        )}
        card={(r) => (
          <div className="grid gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.number}</p>
                <p className="text-[12px] text-a-muted">{fmtDate(r.created_at)}</p>
              </div>
              <StatusPill status={r.status} />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px]">{r.customer_name}</p>
                <p className="flex items-center gap-1.5 text-[12px] text-a-muted">
                  {r.items} item{r.items === 1 ? "" : "s"} {r.has_rx ? <Pill tone={r.rx_ok ? "green" : "red"}>{r.rx_ok ? "Rx ✓" : "Rx"}</Pill> : null}
                </p>
              </div>
              <p className="font-serif text-xl">{inr(r.total)}</p>
            </div>
          </div>
        )}
      />
      {data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-a-border/70 px-4 py-3 text-[13px] text-a-muted">
          <span>
            Page {data.page} of {data.pages} · {data.total} orders
          </span>
          <span className="flex gap-2">
            {data.page > 1 && <Link className="a-btn a-btn-ghost a-btn-sm" href={`?${new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(q ? { q } : {}), page: String(data.page - 1) })}`}>← Newer</Link>}
            {data.page < data.pages && <Link className="a-btn a-btn-ghost a-btn-sm" href={`?${new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(q ? { q } : {}), page: String(data.page + 1) })}`}>Older →</Link>}
          </span>
        </div>
      )}
    </Card>
  );
}
