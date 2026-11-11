"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DataList } from "@/components/admin/DataList";
import { BtnLink, Card, EmptyState, Tabs } from "@/components/admin/ui";
import { fmtDate } from "@/components/admin/status";
import { UsersIcon } from "@/components/icons/admin";
import { WhatsAppIcon } from "@/components/icons";
import { inr } from "@/lib/types";

type Row = { id: string; name: string; phone: string; email: string | null; orders: number; spend: number; last_order: string | null };

export function CustomersClient({ rows, q, sort }: { rows: Row[]; q: string; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => router.push(`${pathname}?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(sort !== "recent" ? { sort } : {}) })}`), 350);
    return () => clearTimeout(t);
  }, [query, q, sort, router, pathname]);
  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-a-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs id="cust-sort" value={sort} onChange={(v) => router.push(`${pathname}?${new URLSearchParams({ ...(q ? { q } : {}), sort: v })}`)} tabs={[{ value: "recent", label: "Recent" }, { value: "spend", label: "Top spend" }, { value: "orders", label: "Most orders" }]} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Name, phone or email" aria-label="Search customers" className="a-input !h-10 lg:max-w-xs" />
      </div>
      <DataList
        rows={rows}
        rowKey={(r) => r.id}
        href={(r) => `/admin/customers/${r.id}`}
        empty={<EmptyState icon={<UsersIcon size={30} />} title="No customers yet" body="They appear here after their first order." />}
        columns={[
          { key: "n", label: "Customer", render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-[12px] text-a-muted">{r.phone}{r.email ? ` · ${r.email}` : ""}</p></div> },
          { key: "o", label: "Orders", align: "right", render: (r) => r.orders },
          { key: "s", label: "Total spend", align: "right", render: (r) => <span className="font-semibold">{inr(r.spend)}</span> },
          { key: "l", label: "Last order", render: (r) => <span className="text-a-muted">{r.last_order ? fmtDate(r.last_order, false) : "—"}</span> },
        ]}
        actions={(r) => (
          <BtnLink size="sm" variant="wa" href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${r.name}`}>
            <WhatsAppIcon size={16} eager strokeWidth={2.4} />
          </BtnLink>
        )}
        card={(r) => (
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.name}</p>
              <p className="text-[12px] text-a-muted">{r.phone}</p>
              <p className="mt-1 text-[12px] text-a-muted">{r.orders} orders · last {r.last_order ? fmtDate(r.last_order, false) : "—"}</p>
            </div>
            <p className="font-serif text-xl">{inr(r.spend)}</p>
          </div>
        )}
      />
    </Card>
  );
}
