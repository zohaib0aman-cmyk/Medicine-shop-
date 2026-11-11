"use server";

import { z } from "zod";
import { logActivity, requireStaff } from "@/lib/server/auth";
import { run, UserError } from "@/lib/server/action";
import { sql } from "@/lib/server/db";
import { formObject, text } from "@/lib/server/validate";
import { ICON_KEYS } from "@/components/icons/keys";

const slug = z.string().regex(/^[a-z0-9-]{2,40}$/, "2–40 lowercase letters, numbers or dashes");

export async function saveCategory(fd: FormData) {
  return run(async () => {
    await requireStaff("categories");
    const raw = formObject(fd);
    const isNew = !raw.original;
    const v = z
      .object({
        original: z.string().optional().default(""),
        id: z.preprocess((x) => String(x ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), slug),
        name: text(60, 2),
        blurb: text(120),
        icon: z.enum(ICON_KEYS),
      })
      .parse(raw);
    if (isNew) {
      const [{ n }] = await sql<{ n: number }[]>`select coalesce(max(sort_order), 0)::int + 1 as n from categories`;
      await sql`insert into categories (id, name, blurb, icon, sort_order) values (${v.id}, ${v.name}, ${v.blurb}, ${v.icon}, ${n})`;
    } else {
      slug.parse(v.original);
      const r = await sql`update categories set id = ${v.id}, name = ${v.name}, blurb = ${v.blurb}, icon = ${v.icon} where id = ${v.original}`;
      if (!r.count) throw new UserError("Category not found.");
    }
    await logActivity({ action: isNew ? "category.create" : "category.update", entity: "category", entityId: v.id, summary: `${isNew ? "Added" : "Updated"} category ${v.name}` });
    return { message: isNew ? "Category added" : "Category saved", revalidate: ["/admin/categories", "/admin/products"], storefront: true };
  });
}

export async function reorderCategories(ids: string[]) {
  return run(async () => {
    await requireStaff("categories");
    const list = z.array(slug).max(200).parse(ids);
    await sql.begin(async (tx) => {
      const t = tx as unknown as typeof sql;
      for (let i = 0; i < list.length; i++) await t`update categories set sort_order = ${i + 1} where id = ${list[i]}`;
    });
    await logActivity({ action: "category.reorder", entity: "category", summary: `Reordered categories: ${list.join(", ")}` });
    return { message: "Order saved", revalidate: ["/admin/categories"], storefront: true };
  });
}

export async function deleteCategory(id: string) {
  return run(async () => {
    await requireStaff("categories", "categories.delete");
    slug.parse(id);
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from products where category_id = ${id}`;
    if (n > 0) throw new UserError(`This category still has ${n} product${n > 1 ? "s" : ""}. Move them to another category first.`);
    const [c] = await sql<{ name: string }[]>`delete from categories where id = ${id} returning name`;
    if (!c) throw new UserError("Category not found.");
    await logActivity({ action: "category.delete", entity: "category", entityId: id, summary: `Deleted category ${c.name}` });
    return { message: `Deleted ${c.name}`, revalidate: ["/admin/categories"], storefront: true };
  });
}
