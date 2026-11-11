"use client";

import { KeepForm } from "@/components/ui/Form";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Btn, BtnLink, Card, PageHeader, Pill, SaveButton, Select, Shake, TextArea, useConfirm } from "@/components/admin/ui";
import { StatusPill, fmtDate } from "@/components/admin/status";
import { NextStatusButton } from "@/components/admin/OrderActions";
import { RxViewer } from "@/components/admin/RxViewer";
import { useAction } from "@/components/admin/useAction";
import { PrinterIcon, EyeIcon, AlertIcon } from "@/components/icons/admin";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { saveOrderNotes, setOrderStatus, setPayment } from "@/app/admin/actions/orders";
import { waTemplates } from "@/lib/order-messages";
import { STATUS_LABEL, inr, type OrderStatus } from "@/lib/types";
import type { Role } from "@/lib/permissions";

const FLOW: OrderStatus[] = ["new", "confirmed", "packed", "out_for_delivery", "delivered"];

type Data = {
  order: { id: string; number: string; status: OrderStatus; customer_name: string; customer_phone: string; customer_id: string | null; address: string; payment_status: string; payment_method: string; subtotal: number; discount: number; delivery_charge: number; total: number; coupon_code: string | null; notes: string; created_at: string; has_rx: boolean; rx_ok: boolean; source: string };
  items: { id: string; name: string; pack: string; rx: boolean; mrp: number; price: number; qty: number; allocations: { batch_no: string; expiry: string; qty: number }[] }[];
  events: { status: OrderStatus; staff_name: string | null; created_at: string }[];
  prescriptions: { id: string; status: string; file_type: string; reject_reason: string | null; created_at: string; reviewer: string | null }[];
};

export function OrderDetail({ data, role, shopName, canCancel, canReview }: { data: Data; role: Role; shopName: string; canCancel: boolean; canReview: boolean }) {
  const { order: o, items, events, prescriptions } = data;
  const confirm = useConfirm();
  const statusAct = useAction(setOrderStatus);
  const pay = useAction(setPayment);
  const notes = useAction(saveOrderNotes);
  const [viewer, setViewer] = useState<Data["prescriptions"][number] | null>(null);
  const templates = waTemplates(o, shopName);
  const [tpl, setTpl] = useState<OrderStatus>(o.status);
  useEffect(() => setTpl(o.status), [o.status]); // suggest the message for the current status
  const closed = o.status === "delivered" || o.status === "cancelled";
  const rxBlocked = o.has_rx && !o.rx_ok;
  const idx = FLOW.indexOf(o.status);

  const moveTo = async (s: OrderStatus) => {
    if (s === "cancelled") {
      const ok = await confirm({ title: `Cancel ${o.number}?`, body: "Stock taken for this order will be returned to its batches. This can't be undone.", confirm: "Cancel order" });
      if (!ok) return;
    }
    const r = await statusAct.run(o.id, s);
    if (r.ok) setTpl(s);
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/admin/orders" className="hover:underline">← Orders</Link>}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {o.number} <StatusPill status={o.status} />
          </span>
        }
        subtitle={`Placed ${fmtDate(o.created_at)} · ${o.source === "website" ? "Website" : o.source}`}
        actions={
          <>
            <BtnLink href={`/admin/invoice/${o.id}`} target="_blank">
              <PrinterIcon size={18} eager /> Invoice
            </BtnLink>
            <NextStatusButton id={o.id} status={o.status} role={role} rxBlocked={rxBlocked} size="md" />
          </>
        }
      />

      {rxBlocked && o.status === "new" && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-a-danger/30 bg-a-danger-bg px-4 py-3 text-[13.5px] text-a-danger">
          <AlertIcon size={22} eager />
          <p>
            This order contains prescription-only medicines. It can&apos;t be confirmed until a pharmacist approves a prescription linked to it.
            {prescriptions.length === 0 ? " No prescription has been attached yet — ask the customer for one, or link one from the Prescriptions queue." : ""}
          </p>
        </div>
      )}

      {/* status stepper */}
      {role !== "delivery" || !closed ? (
        <Card className="mb-5">
          <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
            {FLOW.map((s, i) => {
              const done = o.status !== "cancelled" && i <= idx;
              const canClick = !closed && i > idx && (role !== "delivery" || (o.status === "packed" && s === "out_for_delivery") || (o.status === "out_for_delivery" && s === "delivered"));
              return (
                <li key={s} className="relative">
                  {i > 0 && <span className="absolute right-1/2 top-4 -z-0 h-0.5 w-full bg-a-border"><motion.span className="block h-full origin-left bg-a-gold" initial={{ scaleX: 0 }} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.5, delay: i * 0.08 }} /></span>}
                  <button
                    disabled={!canClick || statusAct.pending || (rxBlocked && s !== "new")}
                    onClick={() => moveTo(s)}
                    className="group relative z-10 mx-auto flex flex-col items-center gap-1.5 disabled:cursor-default"
                    aria-label={canClick ? `Move to ${STATUS_LABEL[s]}` : STATUS_LABEL[s]}
                  >
                    <motion.span
                      className={`grid h-8 w-8 place-items-center rounded-full border-2 text-[12px] font-bold ${done ? "border-a-gold bg-a-primary text-a-on-primary" : "border-a-border bg-a-surface text-a-muted"} ${canClick ? "group-hover:border-a-gold" : ""}`}
                      whileHover={canClick ? { scale: 1.12 } : undefined}
                      transition={{ type: "spring", stiffness: 500, damping: 12 }}
                    >
                      {done ? <CheckIcon size={14} eager /> : i + 1}
                    </motion.span>
                    <span className={`text-center text-[11px] font-semibold sm:text-[12px] ${done ? "text-a-text" : "text-a-muted"}`}>{STATUS_LABEL[s]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {o.status === "cancelled" && <p className="mt-4 text-center text-[13px] text-a-danger">This order was cancelled.</p>}
          {!closed && canCancel && (
            <div className="mt-4 flex justify-end">
              <Btn size="sm" variant="ghost" className="text-a-danger" onClick={() => moveTo("cancelled")}>
                Cancel order
              </Btn>
            </div>
          )}
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="grid content-start gap-5 xl:col-span-2">
          <Card title="Items" pad={false}>
            <ul className="divide-y divide-a-border/60">
              {items.map((it) => (
                <li key={it.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                      {it.name} {it.rx ? <Pill tone="red">Rx</Pill> : null}
                    </p>
                    <p className="text-[12px] text-a-muted">
                      {it.pack} · {inr(it.price)} {it.mrp > it.price ? <span className="line-through">MRP {inr(it.mrp)}</span> : null}
                    </p>
                    {it.allocations?.length ? (
                      <p className="mt-1 text-[11.5px] text-a-muted">
                        Batch {it.allocations.map((a) => `${a.batch_no} (exp ${a.expiry}) ×${a.qty}`).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-[13px] text-a-muted">×{it.qty}</span>
                  <span className="w-20 text-right font-semibold tabular-nums">{inr(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="grid gap-1.5 border-t border-a-border/70 px-5 py-4 text-[13.5px]">
              <div className="flex justify-between"><dt className="text-a-muted">Subtotal</dt><dd className="tabular-nums">{inr(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt className="text-a-muted">Discount {o.coupon_code ? `(${o.coupon_code})` : ""}</dt><dd className="tabular-nums">−{inr(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-a-muted">Delivery</dt><dd className="tabular-nums">{o.delivery_charge ? inr(o.delivery_charge) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-a-border/70 pt-2 font-serif text-xl"><dt>Total</dt><dd className="tabular-nums">{inr(o.total)}</dd></div>
            </dl>
          </Card>

          {role !== "delivery" && (
            <Card title="Prescriptions">
              {prescriptions.length === 0 ? (
                <p className="text-[13.5px] text-a-muted">{o.has_rx ? "No prescription attached yet." : "Not required for this order."}</p>
              ) : (
                <ul className="grid gap-2">
                  {prescriptions.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-a-border/70 p-3">
                      <button onClick={() => setViewer(p)} className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-a-border bg-a-raised" aria-label="View prescription">
                        {p.file_type === "application/pdf" ? (
                          <span className="text-[12px] font-bold text-a-muted">PDF</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/admin/api/rx/${p.id}`} alt="Prescription thumbnail" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1 text-[13px]">
                        <Pill tone={p.status === "approved" ? "green" : p.status === "rejected" ? "red" : "gold"}>{p.status}</Pill>
                        <p className="mt-1 text-a-muted">
                          Uploaded {fmtDate(p.created_at)}
                          {p.reviewer ? ` · reviewed by ${p.reviewer}` : ""}
                        </p>
                        {p.reject_reason ? <p className="text-a-danger">Reason: {p.reject_reason}</p> : null}
                      </div>
                      <Btn size="sm" onClick={() => setViewer(p)}>
                        <EyeIcon size={16} eager /> View
                      </Btn>
                      {canReview && p.status === "pending" && (
                        <BtnLink size="sm" variant="primary" href={`/admin/prescriptions?open=${p.id}`}>
                          Review
                        </BtnLink>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Timeline">
            <ol className="relative ml-2 grid gap-4 border-l border-a-gold/40 pl-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-a-gold bg-a-surface" />
                  <p className="text-[13.5px] font-semibold">{STATUS_LABEL[e.status]}</p>
                  <p className="text-[12px] text-a-muted">
                    {fmtDate(e.created_at)}
                    {e.staff_name ? ` · ${e.staff_name}` : " · customer"}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="grid content-start gap-5">
          <Card title="Customer">
            <p className="font-serif text-xl">{o.customer_name}</p>
            <a href={`tel:${o.customer_phone}`} className="mt-1 block text-[14px] text-a-gold hover:underline">{o.customer_phone}</a>
            <p className="mt-3 whitespace-pre-line text-[13.5px] text-a-muted">{o.address || "No address given"}</p>
            {o.address && (
              <BtnLink size="sm" className="mt-3" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`} target="_blank" rel="noopener noreferrer">
                Open in Maps ↗
              </BtnLink>
            )}
            {o.customer_id && role !== "delivery" && (
              <Link href={`/admin/customers/${o.customer_id}`} className="mt-3 block text-[13px] font-semibold text-a-gold hover:underline">
                Customer history →
              </Link>
            )}
          </Card>

          <Card title="Message customer">
            <Select label="Message" value={tpl} onChange={(e) => setTpl(e.target.value as OrderStatus)}>
              {(Object.keys(templates) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]} update</option>
              ))}
            </Select>
            <p className="mt-3 rounded-xl bg-a-raised p-3 text-[13px] leading-relaxed text-a-text">{templates[tpl]}</p>
            <BtnLink variant="wa" className="mt-3 w-full" href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(templates[tpl])}`} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={18} eager strokeWidth={2.4} /> Message on WhatsApp
            </BtnLink>
          </Card>

          <Card title="Payment">
            <Shake trigger={pay.shakeKey}>
              <KeepForm className="grid gap-3" action={async (fd) => {
                await pay.run(o.id, String(fd.get("payment")), String(fd.get("method")));
              }}>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Status" name="payment" defaultValue={o.payment_status}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    {role !== "delivery" && <option value="refunded">Refunded</option>}
                  </Select>
                  <Select label="Method" name="method" defaultValue={o.payment_method}>
                    <option value="cod">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <SaveButton pending={pay.pending} status={pay.status}>Update payment</SaveButton>
              </KeepForm>
            </Shake>
          </Card>

          {role !== "delivery" && (
            <Card title="Internal notes">
              <KeepForm className="grid gap-3" action={async (fd) => {
                await notes.run(o.id, String(fd.get("notes") ?? ""));
              }}>
                <TextArea label="Only staff can see this" name="notes" defaultValue={o.notes} maxLength={2000} rows={4} />
                <SaveButton pending={notes.pending} status={notes.status}>Save notes</SaveButton>
              </KeepForm>
            </Card>
          )}
        </div>
      </div>
      {viewer && <RxViewer open={!!viewer} onClose={() => setViewer(null)} id={viewer.id} type={viewer.file_type} title={`Prescription · ${o.number}`} />}
    </>
  );
}
