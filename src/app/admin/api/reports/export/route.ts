import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AuthError, logActivity, requireStaff } from "@/lib/server/auth";
import { REPORTS, buildReport, normaliseRange, type ReportType } from "@/lib/server/admin/reports";
import { toXlsx } from "@/lib/server/sheets";
import { DEFAULT_SHOP, getSetting } from "@/lib/server/storefront";
import type { Shop } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The built-in PDF fonts have no ₹ glyph, so PDFs use "Rs."
const money = (n: number) => "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function GET(req: Request) {
  try {
    await requireStaff("reports");
  } catch (e) {
    return new NextResponse(e instanceof AuthError ? e.message : "Forbidden", { status: e instanceof AuthError && e.code === "unauthenticated" ? 401 : 403 });
  }
  const url = new URL(req.url);
  const type = (Object.keys(REPORTS).includes(url.searchParams.get("type") ?? "") ? url.searchParams.get("type") : "sales") as ReportType;
  const { from, to } = normaliseRange(url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const report = await buildReport(type, from, to);
  const shop = await getSetting<Shop>("shop", DEFAULT_SHOP);
  const file = `${type}-report-${from}-to-${to}`;
  await logActivity({ action: "report.export", entity: "report", entityId: type, summary: `Exported ${report.title} (${format.toUpperCase()}, ${from} → ${to})` });

  if (format === "xlsx") {
    const rows = report.totals ? [...report.rows, { [report.columns[0].key]: "TOTAL", ...report.totals }] : report.rows;
    const buf = await toXlsx(
      report.title,
      report.columns.map((c) => ({ key: c.key, header: c.label, width: c.key === "name" ? 36 : 16, numFmt: c.kind === "money" ? '"₹"#,##0.00' : undefined })),
      rows,
      `${shop.name} — ${report.title} · ${report.subtitle}`,
    );
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${file}.xlsx"`, "Cache-Control": "no-store" },
    });
  }

  const doc = new jsPDF({ orientation: report.columns.length > 5 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 76, 58);
  doc.rect(0, 0, w, 64, "F");
  doc.setTextColor(250, 246, 238);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text(shop.name, 36, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(227, 201, 135);
  doc.text(`D.L. No. ${shop.drugLicence}   ·   GSTIN ${shop.gstin}`, 36, 48);
  doc.setTextColor(31, 36, 33);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(report.title, 36, 92);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 113, 109);
  doc.text(`${report.subtitle}   ·   generated ${new Date().toLocaleString("en-IN")}`, 36, 108);
  doc.text(report.summary.map((s) => `${s.label}: ${s.kind === "money" ? money(s.value) : s.value.toLocaleString("en-IN")}`).join("     "), 36, 124);

  const fmt = (v: unknown, kind?: string) => (v == null ? "" : kind === "money" ? money(Number(v)) : kind === "int" ? Number(v).toLocaleString("en-IN") : String(v));
  autoTable(doc, {
    startY: 138,
    head: [report.columns.map((c) => c.label)],
    body: report.rows.map((r) => report.columns.map((c) => fmt(r[c.key], c.kind))),
    foot: report.totals ? [report.columns.map((c, i) => (i === 0 ? "Total" : c.key in report.totals! ? fmt(report.totals![c.key], c.kind) : ""))] : undefined,
    styles: { fontSize: 8.5, cellPadding: 4, textColor: [31, 36, 33], lineColor: [233, 223, 201], lineWidth: 0.4 },
    headStyles: { fillColor: [15, 76, 58], textColor: [250, 246, 238], fontStyle: "bold" },
    footStyles: { fillColor: [243, 236, 221], textColor: [15, 76, 58], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 253, 248] },
    columnStyles: Object.fromEntries(report.columns.map((c, i) => [i, { halign: c.kind === "money" || c.kind === "int" ? "right" : "left" }])),
    margin: { left: 36, right: 36 },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`${shop.name} · ${report.title} · page ${doc.getNumberOfPages()}`, 36, h - 18);
    },
  });
  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${file}.pdf"`, "Cache-Control": "no-store" } });
}
