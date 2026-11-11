import { NextResponse } from "next/server";
import { AuthError, logActivity, requireStaff } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { toCsv, toXlsx } from "@/lib/server/sheets";

export const dynamic = "force-dynamic";

/** Product + batch export. Same columns as the import template, so it round-trips. */
const COLS = ["sku", "name", "brand", "salt", "category", "pack", "mrp", "price", "rx", "low_stock_threshold", "active", "featured", "description", "batch_no", "expiry_date", "quantity"];

export async function GET(req: Request) {
  try {
    await requireStaff("products");
  } catch (e) {
    return new NextResponse(e instanceof AuthError ? e.message : "Forbidden", { status: e instanceof AuthError && e.code === "unauthenticated" ? 401 : 403 });
  }
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const template = url.searchParams.get("template") === "1";
  const rows = template
    ? [{ sku: "PCM-650", name: "Paracetamol 650 mg Tablets", brand: "Generic", salt: "Paracetamol 650 mg", category: "otc", pack: "Strip of 15", mrp: 33, price: 29, rx: "no", low_stock_threshold: 30, active: "yes", featured: "no", description: "", batch_no: "PCM2501", expiry_date: "2027-06-30", quantity: 100 }]
    : await sql<Record<string, unknown>[]>`
        select p.sku, p.name, p.brand, p.salt, p.category_id as category, p.pack, p.mrp, p.price,
               case when p.rx then 'yes' else 'no' end as rx, p.low_stock_threshold,
               case when p.active then 'yes' else 'no' end as active, case when p.featured then 'yes' else 'no' end as featured,
               p.description, b.batch_no, to_char(b.expiry_date, 'YYYY-MM-DD') as expiry_date, b.quantity
        from products p left join batches b on b.product_id = p.id
        order by p.name, b.expiry_date`;
  if (!template) await logActivity({ action: "product.export", entity: "product", summary: `Exported products (${format.toUpperCase()}, ${rows.length} rows)` });
  const stamp = new Date().toISOString().slice(0, 10);
  const name = template ? "product-import-template" : `products-${stamp}`;
  if (format === "xlsx") {
    const buf = await toXlsx("Products", COLS.map((c) => ({ key: c, header: c, width: c === "name" || c === "description" ? 34 : c === "salt" ? 28 : 14 })), rows);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}.xlsx"`, "Cache-Control": "no-store" },
    });
  }
  return new NextResponse(toCsv(COLS, rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" } });
}
