"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** Section reveal: fade + 24px upward slide, once. */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "article" | "header" }) {
  const C = motion[as];
  return (
    <C
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay }}
    >
      {children}
    </C>
  );
}

const card: Variants = { rest: { y: 0 }, hover: { y: -6, transition: { type: "spring", stiffness: 320, damping: 20 } } };
const badge: Variants = {
  rest: { scale: 1, transition: { type: "spring", stiffness: 300, damping: 14 } },
  hover: { scale: 1.1, transition: { type: "spring", stiffness: 500, damping: 9 } },
};
const disc: Variants = {
  rest: { scale: 0.2, opacity: 0, transition: { duration: 0.25 } },
  hover: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 18 } },
};

/** Card that lifts 6px on hover / tap and drives its <IconBadge>. */
export function HoverCard({ children, className = "", as = "div" }: { children: ReactNode; className?: string; as?: "div" | "article" | "li" }) {
  const C = motion[as];
  return (
    <C className={`card card-lift ${className}`} variants={card} initial="rest" animate="rest" whileHover="hover" whileTap="hover" whileFocus="hover">
      {children}
    </C>
  );
}

/** Icon holder: springs to 1.1× with a gold disc filling behind it. */
export function IconBadge({ children, size = 64, className = "" }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <motion.span variants={badge} className={`relative inline-grid shrink-0 place-items-center text-emerald-800 ${className}`} style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full border border-gold/40 bg-cream-200/70" />
      <motion.span variants={disc} className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-300 to-gold" />
      <span className="relative">{children}</span>
    </motion.span>
  );
}

export function Ornament() {
  return (
    <div className="gold-rule my-4" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
        <path d="M7 0 9 5l5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, sub, center = true }: { eyebrow: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <Reveal as="header" className={`mb-10 sm:mb-14 ${center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="h-section mt-3">{title}</h2>
      {center ? <Ornament /> : <div className="hairline my-4 w-40" />}
      {sub ? <p className="lead">{sub}</p> : null}
    </Reveal>
  );
}
