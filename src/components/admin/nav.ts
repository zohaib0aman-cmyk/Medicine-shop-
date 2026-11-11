import type { ComponentType } from "react";
import type { IconProps } from "../icons/IconBase";
import type { Module } from "@/lib/permissions";
import { PrescriptionIcon, StarIcon } from "../icons";
import { BoxIcon, ChartIcon, GearIcon, GridIcon, LayersIcon, PenIcon, ReceiptIcon, StaffIcon, TicketIcon, UsersIcon } from "../icons/admin";

export const NAV: { module: Module; label: string; href: string; Icon: ComponentType<IconProps> }[] = [
  { module: "dashboard", label: "Dashboard", href: "/admin", Icon: GridIcon },
  { module: "orders", label: "Orders", href: "/admin/orders", Icon: ReceiptIcon },
  { module: "prescriptions", label: "Prescriptions", href: "/admin/prescriptions", Icon: PrescriptionIcon },
  { module: "products", label: "Products", href: "/admin/products", Icon: BoxIcon },
  { module: "categories", label: "Categories", href: "/admin/categories", Icon: LayersIcon },
  { module: "customers", label: "Customers", href: "/admin/customers", Icon: UsersIcon },
  { module: "coupons", label: "Offers & Coupons", href: "/admin/coupons", Icon: TicketIcon },
  { module: "content", label: "Website Content", href: "/admin/content", Icon: PenIcon },
  { module: "reviews", label: "Reviews", href: "/admin/reviews", Icon: StarIcon },
  { module: "reports", label: "Reports", href: "/admin/reports", Icon: ChartIcon },
  { module: "staff", label: "Staff & Roles", href: "/admin/staff", Icon: StaffIcon },
  { module: "settings", label: "Settings", href: "/admin/settings", Icon: GearIcon },
];

export const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));
