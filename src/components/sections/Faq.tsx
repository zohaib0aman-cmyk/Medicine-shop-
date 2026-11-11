"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import { useStore } from "@/lib/store";
import { PlusIcon } from "../icons";
import { Reveal, SectionHeading } from "../ui/Motion";

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className={`card overflow-hidden transition-colors ${open ? "!border-gold/60" : ""}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5">
          <span className="font-serif text-[1.08rem] leading-snug text-emerald-900 sm:text-[1.2rem]">{q}</span>
          <motion.span
            animate={{ rotate: open ? 135 : 0, scale: open ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${open ? "border-gold bg-gold text-emerald-950" : "border-gold/40 text-emerald-800"}`}
          >
            <PlusIcon size={16} />
          </motion.span>
        </button>
      </h3>
      <div id={id} role="region" className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <motion.p
            initial={false}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : -8 }}
            transition={{ duration: 0.35 }}
            className="px-5 pb-5 text-[14.5px] leading-relaxed text-charcoal-70 sm:px-6"
          >
            {a}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const { faqs } = useStore();
  if (faqs.length === 0) return null;
  return (
    <section id="faq" className="section bg-emerald-50/50">
      <div className="container-site max-w-3xl">
        <SectionHeading eyebrow="Questions" title="Frequently asked" />
        <div className="grid gap-3">
          {faqs.map((f, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <Item {...f} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

