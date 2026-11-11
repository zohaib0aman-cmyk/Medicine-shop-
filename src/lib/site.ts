/**
 * ─────────────────────────────────────────────────────────────
 *  BUSINESS DETAILS — edit this one file to brand the website.
 *  Every section, the SEO tags and the LocalBusiness schema
 *  read from here.
 * ─────────────────────────────────────────────────────────────
 */
export const site = {
  name: "A.D Pharma",
  tagline: "Family Chemist & Druggist",
  city: "[CITY]",
  address: {
    street: "[ADDRESS]",
    locality: "[CITY]",
    region: "[STATE]",
    postalCode: "[PIN]",
    country: "IN",
  },
  /** Displayed phone number */
  phoneDisplay: "[NUMBER]",
  /** Phone in international format, digits only, used for tel: links */
  phoneE164: "+910000000000",
  /** WhatsApp number, digits only with country code, no + (e.g. 919876543210) */
  whatsapp: "910000000000",
  email: "[EMAIL]",
  timings: "[TIMINGS]",
  /** Opening hours for Google (schema.org format) */
  openingHoursSchema: ["Mo-Su 08:00-23:00"],
  drugLicence: "[DL NUMBER]",
  gstin: "[GSTIN]",
  deliveryArea: "[AREA]",
  pharmacist: "[PHARMACIST NAME, Reg. No.]",
  /** Public site URL — used for canonical + schema */
  url: "https://example.com",
  /** Coordinates for the map + schema (optional) */
  geo: { lat: 0, lng: 0 },
  social: {
    instagram: "#",
    facebook: "#",
    google: "#",
  },
  /**
   * Figures shown in “Why Choose Us”.
   * Replace with your shop's REAL numbers before going live.
   */
  stats: [
    { value: 100, suffix: "%", label: "Genuine, sourced from authorised distributors" },
    { value: 24, suffix: "x7", label: "WhatsApp order support" },
    { value: 5000, suffix: "+", label: "Products in stock" },
    { value: 45, suffix: " min", label: "Typical local delivery time" },
  ],
} as const;

export const fullAddress = [site.address.street, site.address.locality, site.address.region, site.address.postalCode]
  .filter(Boolean)
  .join(", ");

export const rxNotice = "Medicines are dispensed only against a valid prescription by a registered pharmacist.";
