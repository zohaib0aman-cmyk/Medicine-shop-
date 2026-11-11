"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart } from "@/components/admin/Chart";
import { CountUp } from "@/components/admin/Stat";
import { Btn, BtnLink, Card, EmptyState, Tabs } from "@/components/admin/ui";
import { CalendarIcon, ChartIcon, DownloadIcon } from "@/components/icons/admin";
import { inr } from "@/lib/types";

type Col = { key: string; label: string; kind?: "money" | "int" | "text" | "date" };
type Report = { type: string; title: string; subtitle: string; columns: Col[]; rows: Record<string, string | number | null>[]; totals?: Record<string, number>; summary: { label: string; value: number; kind: "money" | "int" }[] };

const fmt = (v: unknown, kind?: string) => (v == null ? "—" : kind === "money" ? inr(Number(v)) : kind === "int" ? Number(v).toLocaleString("en-IN") : kind === "date" ? new Date(String(v)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : String(v));
const money = (n: number) => inr(Math.round(n));

export function ReportsClient({ report, type, from, to }: { report: Report; type: string; from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const go = (p: Record<string, string>) => router.push(`${pathname}?${new URLSearchParams({ type, from: f, to: t, ...p })}`);
  const preset = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    setF(iso(start));
    setT(iso(end));
    go({ from: iso(start), to: iso(end) });
  };
  const qs = new URLSearchParams({ type, from, to });
  const daysLeftTone = (n: number) => (n <= 0 ? "bg-a-danger-bg/70" : n <= 30 ? "bg-a-danger-bg/35" : n <= 90 ? "bg-a-warn-bg/40" : "");

  return (
    <>
      <Card className="mb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <Tabs id="report-type" value={type} onChange={(v) => go({ type: v })} tabs={[{ value: "sales", label: "Sales" }, { value: "bestsellers", label: "Best sellers" }, { value: "stock", label: "Stock value" }, { value: "expiry", label: "Expiry" }]} />
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              go({});
            }}
          >
            <label className="a-label">From<input type="date" value={f} onChange={(e) => setF(e.target.value)} className="a-input !h-10" /></label>
            <label className="a-label">To<input type="date" value={t} onChange={(e) => setT(e.target.value)} className="a-input !h-10" /></label>
            <Btn type="submit" variant="primary"><CalendarIcon size={16} eager /> Apply</Btn>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[7, 30, 90, 365].map((d) => (
            <button key={d} onClick={() => preset(d)} className="rounded-full border border-a-border px-3 py-1 text-[12px] text-a-muted hover:border-a-gold hover:text-a-text">
              Last {d === 365 ? "12 months" : `${d} days`}
            </button>
          ))}
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {report.summary.map((s) => (
          <div key={s.label} className="a-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-a-muted">{s.label}</p>
            <p className="mt-2 font-serif text-2xl sm:text-3xl"><CountUp value={s.value} format={s.kind === "money" ? money : undefined} /></p>
          </div>
        ))}
      </div>

      {type === "sales" && report.rows.length > 1 && (
        <Card title="Net sales by day" className="mb-5">
          <BarChart key={from + to} data={report.rows.map((r) => ({ label: new Date(String(r.day)).toLocaleDateString("en-IN", { day: "numeric", month: report.rows.length > 45 ? "short" : undefined }), sub: new Date(String(r.day)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }), value: Number(r.net) }))} format={money} label="Net sales by day" />
        </Card>
      )}

      <Card
        title={<span>{report.title} <span className="font-sans text-[12px] text-a-muted">· {report.subtitle}</span></span>}
        action={
          <div className="flex gap-2">
            <BtnLink size="sm" href={`/admin/api/reports/export?${qs}&format=xlsx`}><DownloadIcon size={16} eager /> Excel</BtnLink>
            <BtnLink size="sm" href={`/admin/api/reports/export?${qs}&format=pdf`}><DownloadIcon size={16} eager /> PDF</BtnLink>
          </div>
        }
        pad={false}
      >
        {report.rows.length === 0 ? (
          <EmptyState icon={<ChartIcon size={30} />} title="No data in this range" body="Try a wider date range." />
        ) : (
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead className="sticky top-0 bg-a-surface">
                <tr className="border-b border-a-border/70">
                  {report.columns.map((c) => (
                    <th key={c.key} className={`a-th ${c.kind === "money" || c.kind === "int" ? "text-right" : ""}`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={i} className={`border-b border-a-border/40 ${type === "expiry" ? daysLeftTone(Number(r.days_left)) : ""}`}>
                    {report.columns.map((c) => (
                      <td key={c.key} className={`a-td ${c.kind === "money" || c.kind === "int" ? "text-right tabular-nums" : ""}`}>{fmt(r[c.key], c.kind)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {report.totals && (
                <tfoot className="sticky bottom-0 bg-a-raised font-semibold">
                  <tr>
                    {report.columns.map((c, i) => (
                      <td key={c.key} className={`a-td ${c.kind === "money" || c.kind === "int" ? "text-right tabular-nums" : ""}`}>{i === 0 ? "Total" : c.key in report.totals! ? fmt(report.totals![c.key], c.kind) : ""}</td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
