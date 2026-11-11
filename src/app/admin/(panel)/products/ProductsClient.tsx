"use client";

import { KeepForm } from "@/components/ui/Form";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DataList } from "@/components/admin/DataList";
import { Btn, BtnLink, Card, EmptyState, Modal, Pill, SaveButton, Select, Shake, Tabs } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { BoxIcon, DownloadIcon, EditIcon, UploadArrowIcon } from "@/components/icons/admin";
import { PlusIcon } from "@/components/icons";
import { iconFor } from "@/components/icons/map";
import { importProducts } from "@/app/admin/actions/products";
import { inr } from "@/lib/types";

type Row = { id: string; sku: string; name: string; brand: string; category: string; category_id: string; pack: string; mrp: number; price: number; rx: boolean; active: boolean; featured: boolean; low_stock_threshold: number; art: string; stock: number; next_expiry: string | null; expiring_qty: number; expired_qty: number; thumb: string | null };
type Data = { rows: Row[]; counts: { all: number; low: number; expiring: number; rx: number; inactive: number }; window: number };

const daysUntil = (d: string) => Math.round((new Date(d + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);

export function ExpiryPill({ date, expired }: { date: string | null; expired?: number }) {
  if (expired) return <Pill tone="red">{expired} expired</Pill>;
  if (!date) return <span className="text-a-muted">—</span>;
  const d = daysUntil(date);
  return (
    <Pill tone={d <= 30 ? "red" : d <= 90 ? "gold" : "neutral"}>
      {d <= 90 ? `${d}d · ` : ""}
      {new Date(date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
    </Pill>
  );
}

export function StockCell({ stock, threshold }: { stock: number; threshold: number }) {
  const low = stock <= threshold;
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${stock === 0 ? "text-a-danger" : low ? "text-a-warn" : ""}`}>
      {stock}
      {stock === 0 ? <Pill tone="red">Out</Pill> : low ? <Pill tone="gold">Low</Pill> : null}
    </span>
  );
}

function Thumb({ r }: { r: Row }) {
  const Art = iconFor(r.art);
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-a-border bg-a-raised text-a-primary">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {r.thumb ? <img src={r.thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Art size={28} />}
    </span>
  );
}

export function ProductsClient({ data, categories, filter, q, category }: { data: Data; categories: { id: string; name: string }[]; filter: string; q: string; category: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(q);
  const [importing, setImporting] = useState(false);
  const imp = useAction(importProducts);
  const fileRef = useRef<HTMLInputElement>(null);
  const go = (p: Record<string, string>) => {
    const sp = new URLSearchParams({ filter, q: query, category, window: String(data.window), ...p });
    for (const [k, v] of [...sp.entries()]) if (!v || (k === "filter" && v === "all") || (k === "window" && v === "60")) sp.delete(k);
    router.push(`${pathname}?${sp}`);
  };
  useEffect(() => {
    if (query === q) return;
    const t = setTimeout(() => go({ q: query }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <BtnLink variant="primary" href="/admin/products/new">
          <PlusIcon size={16} eager /> Add product
        </BtnLink>
        <Btn onClick={() => setImporting(true)}>
          <UploadArrowIcon size={18} eager /> Import
        </Btn>
        <BtnLink href="/admin/api/products/export?format=xlsx">
          <DownloadIcon size={18} eager /> Excel
        </BtnLink>
        <BtnLink href="/admin/api/products/export?format=csv">
          <DownloadIcon size={18} eager /> CSV
        </BtnLink>
      </div>
      <Card pad={false}>
        <div className="flex flex-col gap-3 border-b border-a-border/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs
            id="prod-filter"
            value={filter}
            onChange={(v) => go({ filter: v })}
            tabs={[
              { value: "all", label: "All", count: data.counts.all },
              { value: "low", label: "Low stock", count: data.counts.low },
              { value: "expiring", label: "Expiring", count: data.counts.expiring },
              { value: "rx", label: "Rx only", count: data.counts.rx },
              { value: "inactive", label: "Hidden", count: data.counts.inactive },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            {filter === "expiring" && (
              <select aria-label="Expiry window" value={data.window} onChange={(e) => go({ window: e.target.value })} className="a-input !h-10 !w-auto">
                <option value="30">Within 30 days</option>
                <option value="60">Within 60 days</option>
                <option value="90">Within 90 days</option>
              </select>
            )}
            <select aria-label="Category" value={category} onChange={(e) => go({ category: e.target.value })} className="a-input !h-10 !w-auto">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Name, SKU, brand or salt" aria-label="Search products" className="a-input !h-10 sm:!w-64" />
          </div>
        </div>
        <DataList
          rows={data.rows}
          rowKey={(r) => r.id}
          href={(r) => `/admin/products/${r.id}`}
          rowClassName={(r) => (r.expired_qty > 0 || (r.next_expiry && daysUntil(r.next_expiry) <= 30) ? "bg-a-danger-bg/40" : r.active && r.stock <= r.low_stock_threshold ? "bg-a-warn-bg/40" : "")}
          empty={<EmptyState icon={<BoxIcon size={30} />} title="No products match" body={filter === "low" ? "Nothing is running low. Nice." : filter === "expiring" ? "No batches expire in this window." : "Try another search or filter."} />}
          columns={[
            {
              key: "n",
              label: "Product",
              render: (r) => (
                <span className="flex items-center gap-3">
                  <Thumb r={r} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                      {r.name} {r.rx ? <Pill tone="red">Rx</Pill> : null} {r.featured ? <Pill tone="gold">★</Pill> : null} {!r.active ? <Pill>Hidden</Pill> : null}
                    </span>
                    <span className="block text-[12px] text-a-muted">{r.sku} · {r.brand || "—"} · {r.pack}</span>
                  </span>
                </span>
              ),
            },
            { key: "c", label: "Category", render: (r) => <span className="text-a-muted">{r.category}</span> },
            { key: "p", label: "Price", align: "right", render: (r) => <span><span className="font-semibold">{inr(r.price)}</span>{r.mrp > r.price ? <span className="block text-[11.5px] text-a-muted line-through">{inr(r.mrp)}</span> : null}</span> },
            { key: "s", label: "Stock", align: "right", render: (r) => <StockCell stock={r.stock} threshold={r.low_stock_threshold} /> },
            { key: "e", label: "Next expiry", render: (r) => <ExpiryPill date={r.next_expiry} expired={r.expired_qty} /> },
          ]}
          actions={(r) => (
            <BtnLink size="sm" href={`/admin/products/${r.id}`} aria-label={`Edit ${r.name}`}>
              <EditIcon size={16} eager /> Edit
            </BtnLink>
          )}
          card={(r) => (
            <div className="flex gap-3">
              <Thumb r={r} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                  {r.name} {r.rx ? <Pill tone="red">Rx</Pill> : null}
                </p>
                <p className="text-[12px] text-a-muted">{r.sku} · {r.pack}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="font-semibold">{inr(r.price)}</span>
                  <span className="text-a-muted">Stock</span> <StockCell stock={r.stock} threshold={r.low_stock_threshold} />
                  <ExpiryPill date={r.next_expiry} expired={r.expired_qty} />
                </div>
              </div>
            </div>
          )}
        />
      </Card>

      <Modal open={importing} onClose={() => setImporting(false)} title="Import products">
        <Shake trigger={imp.shakeKey}>
          <KeepForm
            className="grid gap-4"
            action={async (fd) => {
              const r = await imp.run(fd);
              if (r.ok) setImporting(false);
            }}
          >
            <p className="text-[13.5px] text-a-muted">
              Upload a CSV or Excel (.xlsx) file. Rows are matched by <strong>SKU</strong>: existing products are updated, new ones are added. Include <em>batch_no, expiry_date, quantity</em> to add stock batches. If any row has a problem, nothing is imported and you&apos;ll see which rows to fix.
            </p>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Link className="font-semibold text-a-gold hover:underline" href="/admin/api/products/export?format=xlsx&template=1">Download Excel template</Link>
              <span className="text-a-muted">·</span>
              <Link className="font-semibold text-a-gold hover:underline" href="/admin/api/products/export?format=csv&template=1">CSV template</Link>
            </div>
            <label className="grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed border-a-gold/50 bg-a-raised/50 px-4 py-8 text-center text-[13.5px] text-a-muted hover:border-a-gold">
              <UploadArrowIcon size={32} eager className="text-a-primary" />
              <span>Choose a .csv or .xlsx file</span>
              <input ref={fileRef} type="file" name="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="text-[12.5px]" />
            </label>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setImporting(false)}>Cancel</Btn>
              <SaveButton pending={imp.pending} status={imp.status}>Import</SaveButton>
            </div>
          </KeepForm>
        </Shake>
      </Modal>
    </>
  );
}
