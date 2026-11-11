import { requirePage } from "@/lib/server/auth";
import { DEFAULT_INVOICE, DEFAULT_SHOP, getSetting } from "@/lib/server/storefront";
import { PageHeader } from "@/components/admin/ui";
import type { InvoiceSettings, Shop } from "@/lib/types";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePage("settings");
  const [shop, invoice] = await Promise.all([getSetting<Shop>("shop", DEFAULT_SHOP), getSetting<InvoiceSettings>("invoice", DEFAULT_INVOICE)]);
  return (
    <>
      <PageHeader eyebrow="Owner" title="Settings" subtitle="Shop details, licences, delivery and invoices. Changes apply to the website and new invoices immediately." />
      <SettingsClient shop={shop} invoice={invoice} />
    </>
  );
}
