import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { fullAddress, site } from "@/lib/site";
import { Providers } from "@/components/Providers";
import { faqSchema } from "@/data/content";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", axes: ["opsz", "SOFT"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const title = `${site.name} — Trusted Family Chemist in ${site.city}`;
const description = `${site.name} is a licensed pharmacy in ${site.city} offering genuine medicines, a qualified pharmacist and fast home delivery across ${site.deliveryArea}. Upload your prescription or order on WhatsApp.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  keywords: ["pharmacy", "chemist", "medical store", "medicine home delivery", site.city, site.name, "upload prescription", "order medicines on WhatsApp"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", title, description, siteName: site.name, locale: "en_IN", url: site.url },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0F4C3A",
  width: "device-width",
  initialScale: 1,
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "Pharmacy",
  name: site.name,
  description,
  url: site.url,
  telephone: site.phoneE164,
  email: site.email,
  image: `${site.url}/icon.svg`,
  priceRange: "₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  ...(site.geo.lat ? { geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng } } : {}),
  openingHours: site.openingHoursSchema,
  areaServed: site.deliveryArea,
  hasMap: `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}`,
  sameAs: Object.values(site.social).filter((u) => u.startsWith("http")),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
