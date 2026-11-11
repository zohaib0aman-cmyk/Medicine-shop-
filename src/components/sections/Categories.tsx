"use client";

import { iconFor } from "../icons/map";
import { useStore } from "@/lib/store";
import { ChevronIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { useOrder } from "@/lib/order";

export function Categories() {
  const { setCategory, setQuery } = useOrder();
  const { categories, products } = useStore();
  return (
    <section id="categories" className="section">
      <div className="container-site">
        <SectionHeading eyebrow="Shop by need" title="Everything your family needs" sub="From daily wellness to prescription refills — carefully stocked, properly stored, honestly priced." />
        <Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {categories.map((c, i) => {
              const Icon = iconFor(c.icon);
              const allRx = products.some((p) => p.category === c.id) && products.filter((p) => p.category === c.id).every((p) => p.rx);
              return (
                <li key={c.id}>
                  <HoverCard className="h-full">
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(c.id);
                        setQuery("");
                        document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex h-full w-full flex-col items-center gap-3 rounded-card p-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-gold sm:items-start sm:p-6 sm:text-left"
                    >
                      <IconBadge size={68}>
                        <Icon size={40} delay={i * 0.08} />
                      </IconBadge>
                      <span className="font-serif text-[1.08rem] leading-snug text-emerald-900 sm:text-xl">{c.name}</span>
                      <span className="text-[12.5px] leading-snug text-charcoal-50 sm:text-[13.5px]">{c.blurb}</span>
                      <span className="mt-auto hidden items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-gold-600 sm:inline-flex">
                        Browse <ChevronIcon size={14} />
                      </span>
                      {(c.id === "prescription" || allRx) && <span className="badge-rx">Rx required</span>}
                    </button>
                  </HoverCard>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
