"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { discountPct, inr, type StoreProduct as Product } from "@/lib/types";
import { iconFor } from "../icons/map";
import { useStore } from "@/lib/store";
import { BagIcon, CheckIcon, ChevronIcon, PrescriptionIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { Button } from "../ui/Button";
import { useOrder } from "@/lib/order";

function AddButton({ p }: { p: Product }) {
  const { add, prescription } = useOrder();
  const [done, setDone] = useState(false);
  const locked = p.rx && !prescription;
  if (!p.inStock)
    return (
      <Button variant="outline" disabled className="w-full !py-2.5 text-[13px]">
        Out of stock
      </Button>
    );
  return (
    <Button
      variant={locked ? "outline" : "primary"}
      className="w-full !py-2.5 text-[13px]"
      aria-label={locked ? `Upload prescription to order ${p.name}` : `Add ${p.name} to order`}
      onClick={() => {
        if (add(p.id)) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="ok" className="inline-flex items-center gap-1.5" initial={{ y: 12, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
            <CheckIcon size={16} eager className="text-gold-300" /> Added
          </motion.span>
        ) : locked ? (
          <motion.span key="rx" className="inline-flex items-center gap-1.5" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
            <PrescriptionIcon size={18} strokeWidth={2.4} /> Upload Rx to order
          </motion.span>
        ) : (
          <motion.span key="add" className="inline-flex items-center gap-1.5" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
            <BagIcon size={18} strokeWidth={2.6} className="text-gold-300" /> Add to Order
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

function ProductCard({ p, i, categoryName }: { p: Product; i: number; categoryName?: string }) {
  const Art = iconFor(p.art);
  const off = discountPct(p);
  return (
    <HoverCard as="article" className="flex h-full flex-col">
      <div className="relative m-2 grid aspect-[4/3] place-items-center overflow-hidden rounded-[12px] bg-gradient-to-br from-cream-200 to-emerald-50">
        {p.image ? (
          <Image src={p.image} alt={`${p.name}, ${p.pack}`} fill sizes="(max-width: 640px) 70vw, 260px" className="object-contain p-4" loading="lazy" />
        ) : (
          <IconBadge size={92} className="text-emerald-800">
            <Art size={60} delay={(i % 4) * 0.08} title={p.name} />
          </IconBadge>
        )}
        {off > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-emerald-950 shadow-gold">{off}% OFF</span>
        )}
        {p.rx && <span className="badge-rx absolute right-2 top-2">Rx required</span>}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-600">{categoryName}</p>
        <h3 className="mt-1 font-serif text-[1.12rem] leading-snug text-emerald-900">{p.name}</h3>
        <p className="text-[12.5px] text-charcoal-50">
          {p.brand ? `${p.brand} · ` : ""}
          {p.pack}
        </p>
        <div className="mb-4 mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-emerald-900">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-[13px] text-charcoal-50 line-through">MRP {inr(p.mrp)}</span>}
        </div>
        <div className="mt-auto">
          <AddButton p={p} />
        </div>
      </div>
    </HoverCard>
  );
}

export function Products() {
  const { query, category, setCategory, setQuery } = useOrder();
  const { products, categories } = useStore();
  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const track = useRef<HTMLUListElement>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (q ? true : category === "all" ? p.featured : p.category === category) &&
        (!q || `${p.name} ${p.brand} ${p.pack} ${catName[p.category] ?? ""}`.toLowerCase().includes(q)),
    );
  }, [query, category, products, catName]);

  const scrollBy = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 260) + 16), behavior: "smooth" });
  };

  return (
    <section id="products" className="section overflow-hidden">
      <div className="container-site">
        <SectionHeading eyebrow="Featured" title="Popular in our shop" sub="Prices shown are indicative — your final bill is confirmed by our pharmacist." />

        <Reveal className="mb-6 flex items-center gap-3">
          <div className="no-scrollbar -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter by category">
            {[{ id: "all", name: "Featured" }, ...categories].map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(c.id)}
                  className={`relative shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${active ? "border-emerald-800 text-cream-50" : "border-cream-300 bg-cream-50 text-emerald-900 hover:border-gold"}`}
                >
                  {active && <motion.span layoutId="cat-pill" className="absolute inset-0 -z-0 rounded-full bg-emerald-800" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{c.name}</span>
                </button>
              );
            })}
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <Button variant="outline" icon aria-label="Previous products" onClick={() => scrollBy(-1)}>
              <ChevronIcon dir="left" size={18} />
            </Button>
            <Button variant="outline" icon aria-label="Next products" onClick={() => scrollBy(1)}>
              <ChevronIcon size={18} />
            </Button>
          </div>
        </Reveal>

        {query && (
          <p className="mb-4 text-[13.5px] text-charcoal-70">
            Showing results for “<strong>{query}</strong>” ·{" "}
            <button className="font-semibold text-gold-600 underline-offset-2 hover:underline" onClick={() => setQuery("")}>
              clear
            </button>
          </p>
        )}

        {list.length ? (
          <ul ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 pt-2" aria-label="Featured products">
            {list.map((p, i) => (
              <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23.5%]">
                <ProductCard p={p} i={i} categoryName={catName[p.category]} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card mx-auto max-w-md p-8 text-center">
            <p className="font-serif text-xl text-emerald-900">Not listed here?</p>
            <p className="mt-2 text-[14px] text-charcoal-70">We stock far more than we can show. Message us on WhatsApp and we&apos;ll check availability for you.</p>
          </div>
        )}
      </div>
    </section>
  );
}
