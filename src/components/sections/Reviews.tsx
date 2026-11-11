"use client";

import { useEffect, useRef, useState } from "react";
import { reviews } from "@/data/content";
import { ChevronIcon, QuoteIcon, StarIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { Button, LinkButton } from "../ui/Button";
import { site } from "@/lib/site";

const MIN_SLOTS = 4;

export function Reviews() {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const slots = Math.max(MIN_SLOTS - reviews.length, 0);
  const total = reviews.length + slots;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.firstElementChild?.clientWidth ?? 1;
      setActive(Math.round(el.scrollLeft / (w + 16)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const w = el.firstElementChild?.clientWidth ?? 300;
    el.scrollTo({ left: Math.max(0, Math.min(i, total - 1)) * (w + 16), behavior: "smooth" });
  };

  return (
    <section id="reviews" className="section overflow-hidden">
      <div className="container-site">
        <SectionHeading eyebrow="Kind words" title="What our customers say" sub="Real reviews from real customers only — we never publish invented testimonials." />

        <Reveal>
          <ul ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2">
            {reviews.map((r, i) => (
              <li key={i} className="w-[86%] shrink-0 snap-start sm:w-[48%] lg:w-[32%]">
                <HoverCard as="article" className="h-full p-6">
                  <figure>
                    <IconBadge size={52}>
                      <QuoteIcon size={28} />
                    </IconBadge>
                    <div className="mt-4 flex gap-0.5 text-gold" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: r.rating }).map((_, s) => (
                        <StarIcon key={s} size={16} delay={s * 0.08} />
                      ))}
                    </div>
                    <blockquote className="mt-3 font-serif text-[1.1rem] leading-relaxed text-emerald-900">“{r.text}”</blockquote>
                    <figcaption className="mt-4 text-[13px] font-semibold text-charcoal-70">
                      {r.name}
                      {r.source ? <span className="font-normal text-charcoal-50"> · {r.source}</span> : null}
                    </figcaption>
                  </figure>
                </HoverCard>
              </li>
            ))}
            {Array.from({ length: slots }).map((_, i) => (
              <li key={`slot-${i}`} className="w-[86%] shrink-0 snap-start sm:w-[48%] lg:w-[32%]">
                <HoverCard className="flex h-full flex-col !border-2 !border-dashed !border-gold/50 !bg-cream-100/60 p-6">
                  <IconBadge size={52}>
                    <QuoteIcon size={28} delay={i * 0.08} />
                  </IconBadge>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">Review slot {reviews.length + i + 1}</p>
                  <p className="mt-2 font-serif text-[1.1rem] leading-relaxed text-charcoal-50">
                    Reserved for a real customer review. Add it in <code className="rounded bg-cream-200 px-1 font-sans text-[12px]">src/data/content.ts</code>.
                  </p>
                  <p className="mt-auto pt-4 text-[12.5px] text-charcoal-50">Name · Rating · Source</p>
                </HoverCard>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" role="tablist" aria-label="Review slides">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={active === i}
                aria-label={`Go to review ${i + 1}`}
                onClick={() => go(i)}
                className="grid h-6 w-6 place-items-center"
              >
                <span className={`block h-1.5 w-5 rounded-full bg-gold transition-[transform,opacity] duration-300 ${active === i ? "scale-x-100 opacity-100" : "scale-x-[0.3] opacity-40"}`} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon aria-label="Previous review" onClick={() => go(active - 1)}>
              <ChevronIcon dir="left" size={18} />
            </Button>
            <Button variant="outline" icon aria-label="Next review" onClick={() => go(active + 1)}>
              <ChevronIcon size={18} />
            </Button>
          </div>
        </div>
        <div className="mt-8 text-center">
          <LinkButton variant="outline" href={site.social.google}>
            <StarIcon size={18} className="text-gold" /> Review us on Google
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
