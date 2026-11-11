import "server-only";
import ExcelJS from "exceljs";

/** Neutralise spreadsheet formula injection (=, +, -, @, tab, CR at the start of a cell). */
const safeCell = (v: unknown) => {
  if (v == null) return "";
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
};

export function toCsv(headers: string[], rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => {
    const s = String(safeCell(v));
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\r\n");
}

export async function toXlsx(sheetName: string, headers: { key: string; header: string; width?: number; numFmt?: string }[], rows: Record<string, unknown>[], title?: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "A.D Pharma Admin";
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  if (title) {
    ws.addRow([title]).font = { bold: true, size: 14, color: { argb: "FF0F4C3A" } };
    ws.addRow([]);
  }
  const head = ws.addRow(headers.map((h) => h.header));
  head.font = { bold: true, color: { argb: "FFFFFDF8" } };
  head.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F4C3A" } }));
  for (const r of rows) ws.addRow(headers.map((h) => safeCell(r[h.key])));
  headers.forEach((h, i) => {
    const col = ws.getColumn(i + 1);
    col.width = h.width ?? Math.max(12, h.header.length + 2);
    if (h.numFmt) col.numFmt = h.numFmt;
  });
  ws.views = [{ state: "frozen", ySplit: title ? 3 : 1 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** RFC-4180-ish CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"' && s[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") row.push(cell), (cell = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) row.push(cell), out.push(row);
  return out.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function parseXlsx(buf: Buffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const rows: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => {
    const vals: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      const v = r.getCell(c).value as unknown;
      if (v instanceof Date) vals.push(v.toISOString().slice(0, 10));
      else if (v && typeof v === "object" && "text" in (v as object)) vals.push(String((v as { text: string }).text));
      else if (v && typeof v === "object" && "result" in (v as object)) vals.push(String((v as { result: unknown }).result ?? ""));
      else vals.push(v == null ? "" : String(v));
    }
    rows.push(vals);
  });
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
