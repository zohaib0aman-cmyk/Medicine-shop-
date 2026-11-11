import { CrossIcon } from "./icons";
import { site } from "@/lib/site";

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <a href="#top" className="group flex min-w-0 items-center gap-2.5" aria-label={`${site.name} — home`}>
      <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border ${light ? "border-gold/50 bg-emerald-900 text-gold" : "border-gold/50 bg-cream-50 text-emerald-800"} shadow-soft`}>
        <CrossIcon size={24} eager delay={0.15} />
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block truncate font-serif text-[1.3rem] font-semibold tracking-tight ${light ? "text-cream-50" : "text-emerald-900"}`}>{site.name}</span>
        {!compact && (
          <span className={`mt-1 hidden truncate text-[9.5px] min-[440px]:block font-semibold uppercase tracking-[0.24em] ${light ? "text-gold-300" : "text-gold-600"}`}>{site.tagline}</span>
        )}
      </span>
    </a>
  );
}
