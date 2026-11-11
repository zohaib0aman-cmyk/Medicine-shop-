"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { bool, dateStr, formObject, int, money, text, uuid } from "@/lib/server/validate";
import { readUpload } from "@/lib/server/files";
import { deleteFile, putFile } from "@/lib/server/storage";
import { parseCsv, parseXlsx } from "@/lib/server/sheets";
import { ICON_KEYS } from "@/components/icons/keys";
import { canAccess } from "@/lib/permissions";

const productSchema = z
  .object({
    id: z.string().optional().default(""),
    sku: z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.string().regex(/^[A-Z0-9._-]{2,40}$/, "2–40 letters, numbers, dot, dash or underscore")),
    name: text(120, 2),
    brand: text(80),
    salt: text(200),
    category_id: z.string().regex(/^[a-z0-9-]{2,40}$/, "Choose a category"),
    pack: text(60),
    mrp: money,
    price: money,
    rx: bool,
    active: bool,
    featured: bool,
    low_stock_threshold: int(0, 100000),
    art: z.enum(ICON_KEYS).catch("blister"),
    description: text(2000),
    keepImages: z.array(z.string().max(200)).optional().default([]),
  })
  .refine((v) => v.price <= v.mrp, { path: ["price"], message: "Selling price can't be more than MRP" });

const revalidate = (id?: string) => ["/admin/products", ...(id ? [`/admin/products/${id}`] : []), "/admin"];

export async function saveProduct(fd: FormData) {
  return run(async () => {
    const me = await requireStaff("products");
    const raw = formObject(fd);
    raw.keepImages = ([] as unknown[]).concat(raw.keepImages ?? []).filter((x) => typeof x === "string");
    const v = productSchema.parse(raw);
    const isNew = !v.id;
    if (!isNew) uuid.parse(v.id);

    let existing: string[] = [];
    if (!isNew) {
      const [p] = await sql<{ images: string[] }[]>`select images from products where id = ${v.id}`;
      if (!p) throw new UserError("Product not found.");
      existing = p.images;
    }
    const keep = existing.filter((k) => v.keepImages.includes(k));
    const removed = existing.filter((k) => !keep.includes(k));

    const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    if (keep.length + files.length > 6) throw new UserError("A product can have up to 6 images.");
    const uploaded: string[] = [];
    for (const f of files) {
      const up = await readUpload(f, { maxBytes: 3 * 1024 * 1024, allowPdf: false });
      if ("error" in up) throw new UserError(`${f.name}: ${up.error}`);
      await putFile("product-images", up.key, up.buf, up.mime);
      uploaded.push(up.key);
    }
    const images = [...keep, ...uploaded];

    try {
      let id = v.id;
      if (isNew) {
        const [row] = await sql<{ id: string }[]>`
          insert into products (sku, name, brand, salt, category_id, pack, mrp, price, rx, active, featured, low_stock_threshold, art, description, images)
          values (${v.sku}, ${v.name}, ${v.brand}, ${v.salt}, ${v.category_id}, ${v.pack}, ${v.mrp}, ${v.price}, ${v.rx}, ${v.active}, ${v.featured},
                  ${v.low_stock_threshold}, ${v.art}, ${v.description}, ${images})
          returning id`;
        id = row.id;
      } else {
        await sql`
          update products set sku = ${v.sku}, name = ${v.name}, brand = ${v.brand}, salt = ${v.salt}, category_id = ${v.category_id}, pack = ${v.pack},
                 mrp = ${v.mrp}, price = ${v.price}, rx = ${v.rx}, active = ${v.active}, featured = ${v.featured},
                 low_stock_threshold = ${v.low_stock_threshold}, art = ${v.art}, description = ${v.description}, images = ${images}
          where id = ${v.id}`;
      }
      for (const k of removed) await deleteFile("product-images", k);
      await logActivity({
        action: isNew ? "product.create" : "product.update",
        entity: "product",
        entityId: id,
        summary: `${isNew ? "Added" : "Updated"} product ${v.name} (${v.sku}) — ₹${v.price} / MRP ₹${v.mrp}${v.rx ? ", Rx" : ""}`,
      });
      return { message: isNew ? "Product added" : "Product saved", data: { id }, revalidate: revalidate(id), storefront: true };
    } catch (e) {
      for (const k of uploaded) await deleteFile("product-images", k);
      throw e;
    }
  });
}

export async function deleteProduct(id: string) {
  return run(async () => {
    await requireStaff("products", "products.delete");
    uuid.parse(id);
    const [p] = await sql<{ name: string; sku: string; images: string[] }[]>`delete from products where id = ${id} returning name, sku, images`;
    if (!p) throw new UserError("Product not found.");
    for (const k of p.images) await deleteFile("product-images", k);
    await logActivity({ action: "product.delete", entity: "product", entityId: id, summary: `Deleted product ${p.name} (${p.sku})` });
    return { message: `Deleted ${p.name}`, revalidate: revalidate(), storefront: true };
  });
}

export async function toggleProduct(id: string, field: "active" | "featured", value: boolean) {
  return run(async () => {
    const me = await requireStaff();
    // "featured" is also managed from Website Content; "active" only from Products
    if (!canAccess(me.role, "products") && !(field === "featured" && canAccess(me.role, "content"))) throw new UserError("Your role can't change this.");
    const input = z.object({ id: uuid, field: z.enum(["active", "featured"]), value: z.boolean() }).parse({ id, field, value });
    const [p] = await sql<{ name: string }[]>`update products set ${sql(input.field)} = ${input.value} where id = ${input.id} returning name`;
    if (!p) throw new UserError("Product not found.");
    await logActivity({ action: `product.${input.field}`, entity: "product", entityId: input.id, summary: `${p.name}: ${input.field} ${input.value ? "on" : "off"}` });
    return { message: `${p.name} ${input.field === "featured" ? (input.value ? "featured" : "unfeatured") : input.value ? "activated" : "hidden"}`, revalidate: [...revalidate(input.id), "/admin/content"], storefront: true };
  });
}

/* ───────────── Batches ───────────── */
const batchSchema = z.object({
  id: z.string().optional().default(""),
  product_id: uuid,
  batch_no: z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.string().regex(/^[A-Z0-9./_-]{1,40}$/, "Use letters, numbers, / . - _")),
  expiry_date: dateStr,
  quantity: int(0, 1_000_000),
});

export async function saveBatch(fd: FormData) {
  return run(async () => {
    await requireStaff("products");
    const v = batchSchema.parse(formObject(fd));
    const [p] = await sql<{ name: string }[]>`select name from products where id = ${v.product_id}`;
    if (!p) throw new UserError("Product not found.");
    if (v.id) {
      uuid.parse(v.id);
      const [b] = await sql<{ quantity: number }[]>`select quantity from batches where id = ${v.id} and product_id = ${v.product_id}`;
      if (!b) throw new UserError("Batch not found.");
      await sql`update batches set batch_no = ${v.batch_no}, expiry_date = ${v.expiry_date}, quantity = ${v.quantity} where id = ${v.id}`;
      await logActivity({ action: "batch.update", entity: "product", entityId: v.product_id, summary: `${p.name}: batch ${v.batch_no} → qty ${v.quantity} (was ${b.quantity}), exp ${v.expiry_date}` });
    } else {
      await sql`insert into batches (product_id, batch_no, expiry_date, quantity) values (${v.product_id}, ${v.batch_no}, ${v.expiry_date}, ${v.quantity})`;
      await logActivity({ action: "batch.create", entity: "product", entityId: v.product_id, summary: `${p.name}: added batch ${v.batch_no}, qty ${v.quantity}, exp ${v.expiry_date}` });
    }
    return { message: v.id ? "Batch updated" : "Batch added", revalidate: revalidate(v.product_id), storefront: true };
  });
}

export async function deleteBatch(id: string) {
  return run(async () => {
    await requireStaff("products", "products.delete");
    uuid.parse(id);
    const [b] = await sql<{ product_id: string; batch_no: string; quantity: number }[]>`delete from batches where id = ${id} returning product_id, batch_no, quantity`;
    if (!b) throw new UserError("Batch not found.");
    await logActivity({ action: "batch.delete", entity: "product", entityId: b.product_id, summary: `Deleted batch ${b.batch_no} (qty ${b.quantity})` });
    return { message: "Batch removed", revalidate: revalidate(b.product_id), storefront: true };
  });
}

/* ───────────── Bulk import (CSV / XLSX) ───────────── */

const yes = (s: string) => /^(1|y|yes|true)$/i.test(s.trim());

export async function importProducts(fd: FormData) {
  return run(async () => {
    await requireStaff("products");
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) throw new UserError("Choose a CSV or Excel file.");
    if (file.size > 5 * 1024 * 1024) throw new UserError("File is too large (max 5 MB).");
    const buf = Buffer.from(await file.arrayBuffer());
    const isXlsx = buf.subarray(0, 2).toString("ascii") === "PK";
    const table = isXlsx ? await parseXlsx(buf) : parseCsv(buf.toString("utf8"));
    if (table.length < 2) throw new UserError("The file has no data rows.");
    if (table.length > 5001) throw new UserError("Import up to 5,000 rows at a time.");
    const header = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    for (const req of ["sku", "name", "category", "mrp", "price"]) if (!header.includes(req)) throw new UserError(`Missing required column “${req}”.`);
    const cats = new Map((await sql<{ id: string; name: string }[]>`select id, name from categories`).flatMap((c) => [[c.id, c.id], [c.name.toLowerCase(), c.id]]));

    const errors: string[] = [];
    const rows: { p: z.infer<typeof productSchema>; batch?: { batch_no: string; expiry_date: string; quantity: number } }[] = [];
    table.slice(1).forEach((cells, i) => {
      const r = Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? "").trim()]));
      const line = i + 2;
      const category_id = cats.get((r.category ?? "").toLowerCase()) ?? "";
      const parsed = productSchema.safeParse({
        sku: r.sku, name: r.name, brand: r.brand, salt: r.salt, category_id, pack: r.pack, mrp: r.mrp, price: r.price,
        rx: yes(r.rx ?? ""), active: r.active ? yes(r.active) : true, featured: yes(r.featured ?? ""),
        low_stock_threshold: r.low_stock_threshold || 10, art: "blister", description: r.description,
      });
      if (!parsed.success) {
        errors.push(`Row ${line}: ${parsed.error.issues.map((x) => `${x.path.join(".") === "category_id" ? `category “${r.category}”` : x.path.join(".")} — ${x.message}`).join("; ")}`);
        return;
      }
      let batch;
      if (r.batch_no) {
        const b = batchSchema.omit({ id: true, product_id: true }).safeParse({ batch_no: r.batch_no, expiry_date: r.expiry_date, quantity: r.quantity || 0 });
        if (!b.success) {
          errors.push(`Row ${line}: batch — ${b.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
          return;
        }
        batch = b.data;
      }
      rows.push({ p: parsed.data, batch });
    });
    if (errors.length) throw new UserError(`Nothing imported. Fix ${errors.length} row${errors.length > 1 ? "s" : ""}: ${errors.slice(0, 6).join(" · ")}${errors.length > 6 ? " …" : ""}`);

    let created = 0, updated = 0, batches = 0;
    await sql.begin(async (tx) => {
      const t = tx as unknown as typeof sql;
      for (const { p, batch } of rows) {
        const [r] = await t<{ id: string; inserted: boolean }[]>`
          insert into products (sku, name, brand, salt, category_id, pack, mrp, price, rx, active, featured, low_stock_threshold, description)
          values (${p.sku}, ${p.name}, ${p.brand}, ${p.salt}, ${p.category_id}, ${p.pack}, ${p.mrp}, ${p.price}, ${p.rx}, ${p.active}, ${p.featured}, ${p.low_stock_threshold}, ${p.description})
          on conflict (sku) do update set name = excluded.name, brand = excluded.brand, salt = excluded.salt, category_id = excluded.category_id,
            pack = excluded.pack, mrp = excluded.mrp, price = excluded.price, rx = excluded.rx, active = excluded.active, featured = excluded.featured,
            low_stock_threshold = excluded.low_stock_threshold, description = excluded.description
          returning id, (xmax = 0) as inserted`;
        r.inserted ? created++ : updated++;
        if (batch) {
          await t`insert into batches (product_id, batch_no, expiry_date, quantity) values (${r.id}, ${batch.batch_no}, ${batch.expiry_date}, ${batch.quantity})
                  on conflict (product_id, batch_no) do update set expiry_date = excluded.expiry_date, quantity = excluded.quantity`;
          batches++;
        }
      }
    });
    await logActivity({ action: "product.import", entity: "product", summary: `Imported ${file.name}: ${created} new, ${updated} updated, ${batches} batches` });
    return { message: `Imported: ${created} new, ${updated} updated, ${batches} batch rows`, revalidate: revalidate(), storefront: true };
  });
}
