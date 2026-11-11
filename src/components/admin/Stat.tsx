"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-IN") }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return;
    if (reduced) {
      ref.current.textContent = format(value);
      return;
    }
    const c = animate(0, value, { duration: 1.4, ease: [0.2, 0.7, 0.2, 1], onUpdate: (v) => ref.current && (ref.current.textContent = format(v)) });
    return () => c.stop();
  }, [value, reduced, format]);
  return <span ref={ref} className="tabular-nums">{format(0)}</span>;
}

export function StatCard({ label, value, format, icon, tone = "default", href, note, index = 0 }: { label: string; value: number; format?: (n: number) => string; icon: ReactNode; tone?: "default" | "gold" | "red"; href?: string; note?: string; index?: number }) {
  const ring = tone === "red" && value > 0 ? "border-a-danger/40 bg-a-danger-bg/60" : tone === "gold" && value > 0 ? "border-a-gold/50 bg-a-warn-bg/60" : "border-a-border/80 bg-a-surface";
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative h-full overflow-hidden rounded-card border p-4 shadow-[0_8px_24px_-14px_rgba(15,76,58,.25)] sm:p-5 ${ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-a-muted">{label}</p>
        <motion.span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone === "red" && value > 0 ? "bg-a-danger text-white" : tone === "gold" && value > 0 ? "bg-gold text-emerald-950" : "bg-a-raised text-a-primary"}`} whileHover={{ scale: 1.12 }} transition={{ type: "spring", stiffness: 500, damping: 10 }}>
          {icon}
        </motion.span>
      </div>
      <p className="mt-3 font-serif text-[1.9rem] leading-none text-a-text sm:text-[2.2rem]">
        <CountUp value={value} format={format} />
      </p>
      {note ? <p className="mt-2 text-[12px] text-a-muted">{note}</p> : null}
    </motion.div>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-card outline-none focus-visible:ring-2 focus-visible:ring-a-gold">
      {body}
    </Link>
  ) : (
    body
  );
}
