import { notFound } from "next/navigation";
import { requirePage } from "@/lib/server/auth";
import { categoryOptions, getProduct } from "@/lib/server/admin/products";
import { can } from "@/lib/permissions";
import { ProductEditor } from "./ProductEditor";

export const metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("products");
  const { id } = await params;
  const cats = await categoryOptions();
  if (id === "new") return <ProductEditor categories={cats} canDelete={false} data={null} />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getProduct(id);
  if (!data) notFound();
  return <ProductEditor categories={cats} canDelete={can(me.role, "products.delete")} data={JSON.parse(JSON.stringify(data))} />;
}
