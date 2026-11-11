"use client";

import { CrossIcon } from "./icons";
import { useStore } from "@/lib/store";

export function Logo({ light = false, href = "#top" }: { light?: boolean; href?: string }) {
  const { shop } = useStore();
  return (
    <a href={href} className="group flex min-w-0 items-center gap-2.5" aria-label={`${shop.name} — home`}>
      <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border ${light ? "border-gold/50 bg-emerald-900 text-gold" : "border-gold/50 bg-cream-50 text-emerald-800"} shadow-soft`}>
        <CrossIcon size={24} eager delay={0.15} />
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block truncate font-serif text-[1.3rem] font-semibold tracking-tight ${light ? "text-cream-50" : "text-emerald-900"}`}>{shop.name}</span>
        <span className={`mt-1 hidden truncate text-[9.5px] font-semibold uppercase tracking-[0.24em] min-[440px]:block ${light ? "text-gold-300" : "text-gold-600"}`}>{shop.tagline}</span>
      </span>
    </a>
  );
}
