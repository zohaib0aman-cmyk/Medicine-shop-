"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { ArrowUpIcon, BagIcon, CheckIcon, CloseIcon, MinusIcon, PlusIcon, PrescriptionIcon, TrashIcon, WhatsAppIcon } from "./icons";
import { artIcon } from "./icons/map";
import { Button } from "./ui/Button";
import { WaOrderLink } from "./WaOrderLink";
import { useOrder } from "@/lib/order";
import { inr, productById } from "@/data/catalog";
import { rxNotice } from "@/lib/site";

export function FloatingButtons() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 600));

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-cream-50 text-emerald-800 shadow-lift"
          >
            <ArrowUpIcon size={20} eager />
          </motion.button>
        )}
      </AnimatePresence>
      <div className="relative">
        <span aria-hidden className="pulse-ring absolute inset-0 rounded-full bg-[#1f7a4f]" />
        <span aria-hidden className="pulse-ring absolute inset-0 rounded-full bg-[#1f7a4f]" style={{ animationDelay: "1.1s" }} />
        <WaOrderLink className="relative !h-14 !w-14 !p-0 shadow-lift">
          <span className="sr-only">Order on WhatsApp</span>
          <WhatsAppIcon size={30} eager strokeWidth={2.2} />
        </WaOrderLink>
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useOrder();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex justify-center px-4 lg:top-24">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`flex max-w-sm items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] font-medium shadow-lift ${
              toast.tone === "warn" ? "border-[#9b2c2c]/30 bg-[#fbeeee] text-[#7a1f1f]" : "border-gold/50 bg-emerald-900 text-cream-50"
            }`}
          >
            {toast.tone === "warn" ? <PrescriptionIcon size={20} eager strokeWidth={2.2} /> : <CheckIcon size={18} eager className="text-gold-300" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OrderDrawer() {
  const { drawerOpen, setDrawerOpen, items, setQty, clear, prescription, rxBlocked } = useOrder();
  const lines = Object.entries(items)
    .map(([id, qty]) => ({ p: productById(id), qty }))
    .filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p!.price * l.qty, 0);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Your order">
          <motion.div className="absolute inset-0 bg-emerald-950/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
          <motion.aside
            className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-gold/40 bg-cream shadow-lift"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-gold/30 px-5 py-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <BagIcon size={28} eager />
                <h2 className="font-serif text-2xl text-emerald-900">Your order</h2>
              </div>
              <Button variant="outline" icon aria-label="Close order" onClick={() => setDrawerOpen(false)}>
                <CloseIcon size={18} eager />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-serif text-xl text-emerald-900">No items yet</p>
                  <p className="mt-2 text-[14px] text-charcoal-70">Add products, or simply message us your list on WhatsApp.</p>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {lines.map(({ p, qty }) => {
                    const Art = artIcon[p!.art];
                    return (
                      <motion.li layout key={p!.id} className="card flex items-center gap-3 p-3">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-cream-200 text-emerald-800">
                          <Art size={36} eager />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-emerald-900">{p!.name}</p>
                          <p className="text-[12px] text-charcoal-50">
                            {p!.pack} · {inr(p!.price)} {p!.rx && <span className="badge-rx ml-1">Rx</span>}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button aria-label="Decrease quantity" onClick={() => setQty(p!.id, qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-cream-300 text-emerald-800 hover:border-gold">
                              {qty === 1 ? <TrashIcon size={14} eager /> : <MinusIcon size={14} eager />}
                            </button>
                            <span className="w-6 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
                            <button aria-label="Increase quantity" onClick={() => setQty(p!.id, qty + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-cream-300 text-emerald-800 hover:border-gold">
                              <PlusIcon size={14} eager />
                            </button>
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-emerald-900">{inr(p!.price * qty)}</span>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-gold/30 bg-cream-50 px-5 py-4">
              {lines.length > 0 && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] text-charcoal-70">Estimated total</span>
                  <span className="font-serif text-2xl text-emerald-900">{inr(total)}</span>
                </div>
              )}
              {rxBlocked ? (
                <a
                  href="#prescription"
                  onClick={() => setDrawerOpen(false)}
                  className="mb-3 flex items-center gap-2 rounded-xl border border-[#9b2c2c]/25 bg-[#fbeeee] p-3 text-[13px] text-[#7a1f1f]"
                >
                  <PrescriptionIcon size={22} eager /> Your order has Rx items. Upload a prescription to continue →
                </a>
              ) : prescription ? (
                <p className="mb-3 flex items-center gap-2 text-[12.5px] text-emerald-800">
                  <CheckIcon size={16} eager /> Prescription ready — attach it in the WhatsApp chat.
                </p>
              ) : null}
              <WaOrderLink className="w-full !py-3.5 text-[15px]">
                <WhatsAppIcon size={22} eager strokeWidth={2.4} /> Order on WhatsApp
              </WaOrderLink>
              {lines.length > 0 && (
                <button onClick={clear} className="mx-auto mt-3 block text-[12px] font-medium text-charcoal-50 underline-offset-2 hover:underline">
                  Clear order
                </button>
              )}
              <p className="mt-3 text-center text-[11px] text-charcoal-50">{rxNotice}</p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
