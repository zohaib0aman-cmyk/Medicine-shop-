"use client";

import { KeepForm } from "@/components/ui/Form";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { submitReview } from "@/app/(site)/actions";
import { ChevronIcon, QuoteIcon, StarIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { Button, LinkButton } from "../ui/Button";

const MIN_SLOTS = 4;

function ReviewForm({ onDone }: { onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const field = "h-11 w-full rounded-xl border border-cream-300 bg-cream-50 px-3 text-[14px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
  return (
    <KeepForm
      action={(fd) => {
        fd.set("rating", String(rating));
        start(async () => {
          const r = await submitReview(fd);
          setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Thank you!") : r.error });
          if (r.ok) setTimeout(onDone, 2200);
        });
      }}
      className="card mx-auto mt-6 grid max-w-xl gap-3 p-5 text-left sm:p-6"
    >
      <p className="font-serif text-xl text-emerald-900">Share your experience</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={`transition-transform hover:scale-110 ${n <= rating ? "text-gold" : "text-cream-300"}`}>
            <StarIcon size={28} eager />
          </button>
        ))}
      </div>
      <input name="name" required maxLength={60} placeholder="Your name" className={field} autoComplete="name" />
      <textarea name="text" required minLength={5} maxLength={1000} rows={4} placeholder="How was your experience with us?" className={field + " h-auto py-2.5"} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {msg && <p className={`text-[13px] ${msg.ok ? "text-emerald-800" : "text-[#8b2525]"}`}>{msg.text}</p>}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Sending…" : "Submit review"}
      </Button>
      <p className="text-[11.5px] text-charcoal-50">Reviews appear after a quick check by our team.</p>
    </KeepForm>
  );
}

export function Reviews() {
  const { reviews, shop, live } = useStore();
  const [writing, setWriting] = useState(false);
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
            {reviews.map((r) => (
              <li key={r.id} className="w-[86%] shrink-0 snap-start sm:w-[48%] lg:w-[32%]">
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
                    {r.reply ? (
                      <p className="mt-3 rounded-xl border-l-2 border-gold bg-cream-100 px-3 py-2 text-[13px] text-charcoal-70">
                        <span className="font-semibold text-emerald-900">Reply from {shop.name}: </span>
                        {r.reply}
                      </p>
                    ) : null}
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
                    Reserved for a real customer review. {live ? "Approve reviews in Admin › Reviews." : "Add real reviews in src/data/content.ts."}
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
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {live && (
            <Button variant="primary" onClick={() => setWriting((w) => !w)} aria-expanded={writing}>
              <StarIcon size={18} className="text-gold-300" /> Write a review
            </Button>
          )}
          {shop.google ? (
            <LinkButton variant="outline" href={shop.google}>
              <StarIcon size={18} className="text-gold" /> Review us on Google
            </LinkButton>
          ) : null}
        </div>
        <AnimatePresence>
          {writing && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
              <ReviewForm onDone={() => setWriting(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
