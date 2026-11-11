"use client";

import { KeepForm } from "@/components/ui/Form";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState, useTransition } from "react";
import { ArrowUpIcon, BagIcon, CheckIcon, ChevronIcon, CloseIcon, MinusIcon, PlusIcon, PrescriptionIcon, TrashIcon, WhatsAppIcon } from "./icons";
import { iconFor } from "./icons/map";
import { Button } from "./ui/Button";
import { WaOrderLink } from "./WaOrderLink";
import { useOrder } from "@/lib/order";
import { inr, rxNotice } from "@/lib/types";
import { useStore } from "@/lib/store";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";
import { checkCoupon, placeOrder } from "@/app/(site)/actions";
import { LinkButton } from "./ui/Button";

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

type Placed = { number: string; message: string; total: number };

function CheckoutForm({ onPlaced }: { onPlaced: (p: Placed) => void }) {
  const { lines, subtotal, prescription, clear } = useOrder();
  const { shop } = useStore();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();

  const discount = applied?.discount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const delivery = afterDiscount >= shop.freeDeliveryAbove ? 0 : shop.deliveryCharge;
  const field = "h-11 w-full rounded-xl border bg-cream-50 px-3 text-[14px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/30";
  const err = (k: string) => (fieldErrors[k] ? <span className="text-[12px] text-[#8b2525]">{fieldErrors[k]}</span> : null);

  return (
    <KeepForm
      className="grid gap-3"
      action={(fd) => {
        fd.set("items", JSON.stringify(lines.map((l) => ({ id: l.p.id, qty: l.qty }))));
        if (applied) fd.set("coupon", applied.code);
        if (prescription) fd.set("prescription", prescription.file);
        setError(null);
        start(async () => {
          const r = await placeOrder(fd);
          if (r.ok && r.data) {
            onPlaced(r.data);
            clear();
          } else if (!r.ok) {
            setError(r.error);
            setFieldErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <label className="grid gap-1 text-[12.5px] font-medium text-charcoal-70">
        Full name
        <input name="name" required maxLength={80} autoComplete="name" className={`${field} ${fieldErrors.name ? "border-[#9b2c2c]" : "border-cream-300"}`} />
        {err("name")}
      </label>
      <label className="grid gap-1 text-[12.5px] font-medium text-charcoal-70">
        Mobile number
        <input name="phone" required inputMode="tel" maxLength={16} autoComplete="tel" className={`${field} ${fieldErrors.phone ? "border-[#9b2c2c]" : "border-cream-300"}`} />
        {err("phone")}
      </label>
      <label className="grid gap-1 text-[12.5px] font-medium text-charcoal-70">
        Delivery address
        <textarea name="address" required minLength={8} maxLength={300} rows={2} autoComplete="street-address" className={`${field} h-auto py-2 ${fieldErrors.address ? "border-[#9b2c2c]" : "border-cream-300"}`} />
        {err("address")}
      </label>
      <div className="grid gap-1 text-[12.5px] font-medium text-charcoal-70">
        Coupon (optional)
        <div className="flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} maxLength={20} placeholder="e.g. WELCOME10" className={`${field} border-cream-300 uppercase`} aria-label="Coupon code" />
          <Button
            variant="outline"
            disabled={!coupon || checking}
            onClick={() =>
              startCheck(async () => {
                const r = await checkCoupon(coupon, subtotal);
                if (r.ok && r.data) {
                  setApplied(r.data);
                  setCouponMsg(r.message ?? "Applied");
                } else {
                  setApplied(null);
                  setCouponMsg(r.ok ? null : r.error);
                }
              })
            }
          >
            {checking ? "…" : "Apply"}
          </Button>
        </div>
        {couponMsg && <span className={`text-[12px] ${applied ? "text-emerald-800" : "text-[#8b2525]"}`}>{couponMsg}</span>}
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <dl className="mt-1 grid gap-1 rounded-xl bg-cream-100 p-3 text-[13px]">
        <div className="flex justify-between"><dt className="text-charcoal-70">Subtotal</dt><dd>{inr(subtotal)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Discount ({applied?.code})</dt><dd>−{inr(discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-charcoal-70">Delivery</dt><dd>{delivery ? inr(delivery) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-gold/30 pt-1 font-serif text-lg text-emerald-900"><dt>Total</dt><dd>{inr(afterDiscount + delivery)}</dd></div>
      </dl>
      {error && <p className="text-[13px] text-[#8b2525]" role="alert">{error}</p>}
      <Button type="submit" variant="wa" disabled={pending} className="w-full !py-3.5 text-[15px]">
        <WhatsAppIcon size={22} eager strokeWidth={2.4} /> {pending ? "Placing order…" : "Place order"}
      </Button>
      <p className="text-center text-[11px] text-charcoal-50">Pay on delivery. We confirm price & availability before dispatch.</p>
    </KeepForm>
  );
}

export function OrderDrawer() {
  const { drawerOpen, setDrawerOpen, lines, setQty, clear, prescription, rxBlocked, subtotal } = useOrder();
  const { shop, live } = useStore();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [placed, setPlaced] = useState<Placed | null>(null);

  const close = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setStep("cart");
      setPlaced(null);
    }, 400);
  };

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Your order">
          <motion.div className="absolute inset-0 bg-emerald-950/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
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
                <h2 className="font-serif text-2xl text-emerald-900">{placed ? "Order placed" : step === "checkout" ? "Checkout" : "Your order"}</h2>
              </div>
              <Button variant="outline" icon aria-label="Close order" onClick={close}>
                <CloseIcon size={18} eager />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {placed ? (
                <div className="py-8 text-center">
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-800 text-gold-300">
                    <CheckIcon size={40} eager />
                  </span>
                  <p className="mt-5 font-serif text-2xl text-emerald-900">Thank you!</p>
                  <p className="mt-1 text-[14px] text-charcoal-70">
                    Your order <strong>{placed.number}</strong> ({inr(placed.total)}) has been received. Our pharmacist will confirm it shortly.
                  </p>
                  <LinkButton variant="wa" href={waLink(shop.whatsapp, placed.message)} className="mt-6 w-full !py-3.5">
                    <WhatsAppIcon size={22} eager strokeWidth={2.4} /> Send details on WhatsApp
                  </LinkButton>
                  <p className="mt-3 text-[12px] text-charcoal-50">Optional — speeds up confirmation.</p>
                </div>
              ) : step === "checkout" ? (
                <>
                  <button onClick={() => setStep("cart")} className="mb-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-gold-600">
                    <ChevronLeft /> Back to items
                  </button>
                  <CheckoutForm onPlaced={setPlaced} />
                </>
              ) : lines.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-serif text-xl text-emerald-900">No items yet</p>
                  <p className="mt-2 text-[14px] text-charcoal-70">Add products, or simply message us your list on WhatsApp.</p>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {lines.map(({ p, qty }) => {
                    const Art = iconFor(p.art);
                    return (
                      <motion.li layout key={p.id} className="card flex items-center gap-3 p-3">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-cream-200 text-emerald-800">
                          <Art size={36} eager />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-emerald-900">{p.name}</p>
                          <p className="text-[12px] text-charcoal-50">
                            {p.pack} · {inr(p.price)} {p.rx && <span className="badge-rx ml-1">Rx</span>}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button aria-label="Decrease quantity" onClick={() => setQty(p.id, qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-cream-300 text-emerald-800 hover:border-gold">
                              {qty === 1 ? <TrashIcon size={14} eager /> : <MinusIcon size={14} eager />}
                            </button>
                            <span className="w-6 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
                            <button aria-label="Increase quantity" onClick={() => setQty(p.id, qty + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-cream-300 text-emerald-800 hover:border-gold">
                              <PlusIcon size={14} eager />
                            </button>
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-emerald-900">{inr(p.price * qty)}</span>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {!placed && step === "cart" && (
              <div className="border-t border-gold/30 bg-cream-50 px-5 py-4">
                {lines.length > 0 && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[13px] text-charcoal-70">Estimated total</span>
                    <span className="font-serif text-2xl text-emerald-900">{inr(subtotal)}</span>
                  </div>
                )}
                {rxBlocked ? (
                  <a href="#prescription" onClick={close} className="mb-3 flex items-center gap-2 rounded-xl border border-[#9b2c2c]/25 bg-[#fbeeee] p-3 text-[13px] text-[#7a1f1f]">
                    <PrescriptionIcon size={22} eager /> Your order has Rx items. Upload a prescription to continue →
                  </a>
                ) : prescription ? (
                  <p className="mb-3 flex items-center gap-2 text-[12.5px] text-emerald-800">
                    <CheckIcon size={16} eager /> Prescription ready — {live ? "it will be uploaded securely with your order." : "attach it in the WhatsApp chat."}
                  </p>
                ) : null}
                {live && lines.length > 0 ? (
                  <Button variant="wa" disabled={rxBlocked} onClick={() => setStep("checkout")} className="w-full !py-3.5 text-[15px]">
                    Continue to checkout
                  </Button>
                ) : (
                  <LinkButton
                    variant="wa"
                    className="w-full !py-3.5 text-[15px]"
                    href={waLink(shop.whatsapp, buildOrderMessage(shop.name, lines.map((l) => ({ name: l.p.name, pack: l.p.pack, qty: l.qty, price: l.p.price, rx: l.p.rx })), { hasPrescription: !!prescription }))}
                  >
                    <WhatsAppIcon size={22} eager strokeWidth={2.4} /> Order on WhatsApp
                  </LinkButton>
                )}
                {lines.length > 0 && (
                  <button onClick={clear} className="mx-auto mt-3 block text-[12px] font-medium text-charcoal-50 underline-offset-2 hover:underline">
                    Clear order
                  </button>
                )}
                <p className="mt-3 text-center text-[11px] text-charcoal-50">{rxNotice}</p>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function ChevronLeft() {
  return <ChevronIcon dir="left" size={14} eager />;
}
