import { requirePage } from "@/lib/server/auth";
import { categoryOptions, listProducts } from "@/lib/server/admin/products";
import { PageHeader } from "@/components/admin/ui";
import { ProductsClient } from "./ProductsClient";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string; category?: string; window?: string }> }) {
  await requirePage("products");
  const sp = await searchParams;
  const [data, cats] = await Promise.all([listProducts({ filter: sp.filter, q: sp.q, category: sp.category, window: Number(sp.window) || 60 }), categoryOptions()]);
  return (
    <>
      <PageHeader eyebrow="Inventory" title="Products & stock" subtitle="Stock is the sum of unexpired batches. Low stock is highlighted in gold, expiring batches in red." />
      <ProductsClient data={JSON.parse(JSON.stringify(data))} categories={cats} filter={sp.filter ?? "all"} q={sp.q ?? ""} category={sp.category ?? ""} />
    </>
  );
}
