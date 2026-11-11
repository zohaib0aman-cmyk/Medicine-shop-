import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { getStorefront } from "@/lib/server/storefront";
import { fullAddress } from "@/lib/types";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { shop } = await getStorefront();
  const title = `${shop.name} — Trusted Family Chemist in ${shop.city}`;
  const description = `${shop.name} is a licensed pharmacy in ${shop.city} offering genuine medicines, a qualified pharmacist and fast home delivery across ${shop.deliveryArea}. Upload your prescription or order online.`;
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    keywords: ["pharmacy", "chemist", "medical store", "medicine home delivery", shop.city, shop.name, "upload prescription", "order medicines on WhatsApp"],
    alternates: { canonical: "/" },
    openGraph: { type: "website", title, description, siteName: shop.name, locale: "en_IN", url: site.url },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.svg" },
  };
}

/** JSON-LD must never break out of its <script> tag. */
const jsonLd = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const store = await getStorefront();
  const { shop } = store;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: shop.name,
    url: site.url,
    telephone: shop.phoneE164,
    email: shop.email,
    image: `${site.url}/icon.svg`,
    priceRange: "₹",
    address: { "@type": "PostalAddress", streetAddress: shop.street, addressLocality: shop.city, addressRegion: shop.region, postalCode: shop.postalCode, addressCountry: "IN" },
    ...(shop.lat ? { geo: { "@type": "GeoCoordinates", latitude: shop.lat, longitude: shop.lng } } : {}),
    openingHours: shop.openingHours.split(",").map((s) => s.trim()).filter(Boolean),
    areaServed: shop.deliveryArea,
    hasMap: `https://www.google.com/maps?q=${encodeURIComponent(fullAddress(shop))}`,
    sameAs: [shop.instagram, shop.facebook, shop.google].filter((u) => /^https?:\/\//.test(u)),
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: store.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusiness) }} />
      {store.faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} />}
      <Providers store={store}>{children}</Providers>
    </>
  );
}
