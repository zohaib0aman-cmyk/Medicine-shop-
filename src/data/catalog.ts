/**
 * SAMPLE CATALOGUE — replace names, prices and images with your shop's real stock.
 * `rx: true` marks a Schedule H / prescription-only medicine: it shows an
 * "Rx required" badge and can't be added to an order until a prescription is uploaded.
 * Add `image: "/products/xyz.webp"` (put files in /public/products) to show a photo
 * instead of the animated illustration.
 */
export type CategoryId =
  | "prescription"
  | "otc"
  | "baby"
  | "diabetes"
  | "skin"
  | "ayurvedic"
  | "devices"
  | "firstaid";

export type ArtKind = "blister" | "capsule" | "syrup" | "lotion" | "baby" | "glucose" | "thermometer" | "stethoscope" | "firstaid" | "mortar";

export type Category = { id: CategoryId; name: string; blurb: string };

export const categories: Category[] = [
  { id: "prescription", name: "Prescription Medicines", blurb: "Dispensed against a valid Rx" },
  { id: "otc", name: "OTC & Wellness", blurb: "Vitamins, pain relief, daily care" },
  { id: "baby", name: "Baby Care", blurb: "Gentle essentials for little ones" },
  { id: "diabetes", name: "Diabetes Care", blurb: "Strips, meters & monthly refills" },
  { id: "skin", name: "Skin & Personal Care", blurb: "Derma-trusted skin & hygiene" },
  { id: "ayurvedic", name: "Ayurvedic", blurb: "Classical formulations & herbs" },
  { id: "devices", name: "Medical Devices", blurb: "BP monitors, nebulisers & more" },
  { id: "firstaid", name: "First Aid", blurb: "Dressings, antiseptics, kits" },
];

export type Product = {
  id: string;
  name: string;
  pack: string;
  category: CategoryId;
  price: number;
  mrp: number;
  rx?: boolean;
  art: ArtKind;
  image?: string;
};

export const products: Product[] = [
  { id: "p-amox", name: "Amoxicillin 500 mg Capsules", pack: "Strip of 10", category: "prescription", price: 92, mrp: 108, rx: true, art: "capsule" },
  { id: "p-metf", name: "Metformin 500 mg Tablets", pack: "Strip of 20", category: "diabetes", price: 38, mrp: 45, rx: true, art: "blister" },
  { id: "p-para", name: "Paracetamol 650 mg Tablets", pack: "Strip of 15", category: "otc", price: 29, mrp: 33, art: "blister" },
  { id: "p-vitc", name: "Vitamin C + Zinc Chewables", pack: "Bottle of 60", category: "otc", price: 245, mrp: 299, art: "capsule" },
  { id: "p-cough", name: "Herbal Cough Syrup", pack: "100 ml", category: "ayurvedic", price: 99, mrp: 115, art: "syrup" },
  { id: "p-ashw", name: "Ashwagandha Root Tablets", pack: "60 tablets", category: "ayurvedic", price: 199, mrp: 250, art: "mortar" },
  { id: "p-strip", name: "Glucometer Test Strips", pack: "Box of 50", category: "diabetes", price: 799, mrp: 950, art: "glucose" },
  { id: "p-moist", name: "Ceramide Moisturising Lotion", pack: "200 ml", category: "skin", price: 345, mrp: 399, art: "lotion" },
  { id: "p-baby", name: "Anti-Colic Feeding Bottle", pack: "250 ml", category: "baby", price: 279, mrp: 349, art: "baby" },
  { id: "p-thermo", name: "Digital Thermometer", pack: "1 unit", category: "devices", price: 189, mrp: 250, art: "thermometer" },
  { id: "p-steth", name: "Dual-Head Stethoscope", pack: "1 unit", category: "devices", price: 899, mrp: 1150, art: "stethoscope" },
  { id: "p-kit", name: "Home First-Aid Kit", pack: "32 pieces", category: "firstaid", price: 499, mrp: 650, art: "firstaid" },
];

export const productById = (id: string) => products.find((p) => p.id === id);
export const discountPct = (p: Product) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
