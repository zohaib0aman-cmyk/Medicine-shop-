import { requirePage } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { DEFAULT_HERO, DEFAULT_OFFER, DEFAULT_SHOP, getSetting } from "@/lib/server/storefront";
import { PageHeader } from "@/components/admin/ui";
import type { Faq, Hero, Offer, Shop, Stat } from "@/lib/types";
import { ContentClient } from "./ContentClient";

export const metadata = { title: "Website Content" };

export default async function ContentPage() {
  await requirePage("content");
  const [hero, offer, faqs, stats, shop] = await Promise.all([
    getSetting<Hero>("hero", DEFAULT_HERO),
    getSetting<Offer>("offer", DEFAULT_OFFER),
    getSetting<Faq[]>("faqs", []),
    getSetting<Stat[]>("stats", []),
    getSetting<Shop>("shop", DEFAULT_SHOP),
  ]);
  const products = await sql<{ id: string; name: string; pack: string; featured: boolean; active: boolean }[]>`
    select id, name, pack, featured, active from products order by featured desc, name`;
  return (
    <>
      <PageHeader eyebrow="Storefront" title="Website content" subtitle="Everything here updates the public website the moment you save — no code changes needed." />
      <ContentClient hero={hero} offer={offer} faqs={faqs} stats={stats} shop={shop} products={[...products]} />
    </>
  );
}
