import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { CategoriesClient } from "./CategoriesClient";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const me = await requirePage("categories");
  const rows = await sql<{ id: string; name: string; blurb: string; icon: string; products: number }[]>`
    select c.id, c.name, c.blurb, c.icon, (select count(*) from products p where p.category_id = c.id)::int as products
    from categories c order by c.sort_order, c.name`;
  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Categories" subtitle="Drag to change the order they appear on the website. Changes go live instantly." />
      <CategoriesClient rows={[...rows]} canDelete={can(me.role, "categories.delete")} />
    </>
  );
}
