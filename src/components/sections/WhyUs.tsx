"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ClockIcon, PharmacistIcon, ShieldIcon, TagIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { site } from "@/lib/site";

const features = [
  { Icon: ShieldIcon, title: "100% Genuine", text: "Sourced only from authorised distributors, stored as per label conditions." },
  { Icon: PharmacistIcon, title: "Qualified Pharmacist", text: "Every prescription is checked by a registered pharmacist before dispensing." },
  { Icon: TagIcon, title: "Best Prices", text: "Fair, transparent pricing on every item — no hidden charges." },
  { Icon: ClockIcon, title: "24×7 Support", text: "Message us any time on WhatsApp; we reply as soon as we can." },
];

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduced) {
      ref.current.textContent = to.toLocaleString("en-IN");
      return;
    }
    const c = animate(0, to, {
      duration: 1.8,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-IN");
      },
    });
    return () => c.stop();
  }, [inView, to, reduced]);
  return (
    <span className="tabular-nums">
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
}

export function WhyUs() {
  return (
    <section id="why-us" className="section relative overflow-hidden bg-emerald-900 text-cream-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,75,.18),transparent_60%)]" />
      <div className="container-site relative">
        <Reveal as="header" className="mx-auto mb-12 max-w-2xl text-center">
          <span className="eyebrow !text-gold-300">Why choose us</span>
          <h2 className="h-section mt-3 !text-cream-50">
            The care of a family chemist, <em className="italic text-gold-300">the polish of today</em>
          </h2>
          <div className="gold-rule my-4" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 0 9 5l5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" /></svg>
          </div>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {features.map(({ Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.08}>
              <HoverCard className="h-full !border-gold/25 !bg-emerald-800/60 p-6 [--ic-fill:#1e7a5e] [--ic-soft:#16634c]">
                <IconBadge size={68} className="text-gold-300 [&>span:first-child]:!bg-emerald-950/40">
                  <Icon size={40} delay={i * 0.08} />
                </IconBadge>
                <h3 className="mt-4 font-serif text-xl text-cream-50">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-cream-200/80">{text}</p>
              </HoverCard>
            </Reveal>
          ))}
        </ul>

        <div className="hairline my-12" />
        <dl className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
          {site.stats.map((s) => (
            <Reveal key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-4xl text-gold-300 sm:text-5xl">
                <CountUp to={s.value} suffix={s.suffix} />
              </dd>
              <dd className="mx-auto mt-2 max-w-[180px] text-[12.5px] leading-snug text-cream-200/75">{s.label}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
