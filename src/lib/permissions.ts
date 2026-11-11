/**
 * Role-based access. This file is shared by the UI (to hide what a role can't
 * use) and the server (which ENFORCES it in every action and data loader).
 */
export const ROLES = ["owner", "pharmacist", "staff", "delivery"] as const;
export type Role = (typeof ROLES)[number];

export const MODULES = [
  "dashboard", "orders", "prescriptions", "products", "categories", "customers",
  "coupons", "content", "reviews", "reports", "staff", "settings",
] as const;
export type Module = (typeof MODULES)[number];

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", pharmacist: "Pharmacist", staff: "Staff", delivery: "Delivery" };

const ACCESS: Record<Role, readonly Module[]> = {
  owner: MODULES,
  pharmacist: ["dashboard", "orders", "prescriptions", "products", "categories", "customers", "reviews", "reports"],
  staff: ["dashboard", "orders", "products", "categories", "customers", "coupons", "content", "reviews"],
  delivery: ["orders"],
};

/** Finer-grained capabilities inside a module. */
export type Capability =
  | "rx.review"          // approve / reject prescriptions — registered pharmacist or owner only
  | "orders.all-status"  // move an order to any status (delivery staff only move packed → out → delivered)
  | "orders.cancel"
  | "products.delete"
  | "categories.delete"
  | "customers.delete"
  | "activity.view";

const CAPS: Record<Role, readonly Capability[]> = {
  owner: ["rx.review", "orders.all-status", "orders.cancel", "products.delete", "categories.delete", "customers.delete", "activity.view"],
  pharmacist: ["rx.review", "orders.all-status", "orders.cancel", "products.delete", "categories.delete"],
  staff: ["orders.all-status", "orders.cancel"],
  delivery: [],
};

export const canAccess = (role: Role, m: Module) => ACCESS[role].includes(m);
export const can = (role: Role, c: Capability) => CAPS[role].includes(c);
export const modulesFor = (role: Role) => ACCESS[role];

/** Statuses visible to / settable by delivery staff. */
export const DELIVERY_STATUSES = ["packed", "out_for_delivery", "delivered"] as const;
