"use client";

import { KeepForm } from "@/components/ui/Form";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Btn, Card, EmptyState, Modal, Pill, SaveButton, Select, Shake, Tabs, TextArea } from "@/components/admin/ui";
import { RxViewer } from "@/components/admin/RxViewer";
import { useAction } from "@/components/admin/useAction";
import { fmtDate } from "@/components/admin/status";
import { CheckIcon, CloseIcon, PrescriptionIcon } from "@/components/icons";
import { EyeIcon, LinkIcon } from "@/components/icons/admin";
import { linkPrescription, reviewPrescription } from "@/app/admin/actions/prescriptions";

type Row = { id: string; status: "pending" | "approved" | "rejected"; file_type: string; customer_name: string; customer_phone: string; order_id: string | null; order_number: string | null; order_status: string | null; reject_reason: string | null; reviewer: string | null; reviewed_at: string | null; created_at: string; rx_items: string[] };
type Data = { rows: Row[]; counts: Record<string, number>; openOrders: { id: string; number: string; customer_name: string; customer_phone: string; has_rx: boolean }[] };

const REASONS = ["Prescription is unclear / unreadable", "Prescription has expired", "Doctor's details or signature missing", "Medicine not on the prescription", "Not a valid prescription"];

function RxCard({ r, canReview, openOrders, onView, onReject, index }: { r: Row; canReview: boolean; openOrders: Data["openOrders"]; onView: () => void; onReject: () => void; index: number }) {
  const approve = useAction(reviewPrescription);
  const link = useAction(linkPrescription);
  const [linking, setLinking] = useState(false);
  const sameCustomer = openOrders.filter((o) => o.customer_phone === r.customer_phone);
  const others = openOrders.filter((o) => o.customer_phone !== r.customer_phone);
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(index, 8) * 0.05 }} className="a-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <button onClick={onView} className="group relative grid h-48 shrink-0 place-items-center overflow-hidden bg-a-raised sm:h-auto sm:w-48" aria-label={`View prescription from ${r.customer_name}`}>
          {r.file_type === "application/pdf" ? (
            <span className="font-serif text-2xl text-a-muted">PDF</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/admin/api/rx/${r.id}`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent py-2 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            <EyeIcon size={16} eager /> Zoom
          </span>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-serif text-xl">{r.customer_name || "Unknown customer"}</p>
              <p className="text-[12.5px] text-a-muted">
                <a href={`tel:${r.customer_phone}`} className="hover:underline">{r.customer_phone}</a> · uploaded {fmtDate(r.created_at)}
              </p>
            </div>
            <Pill tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "gold"}>{r.status}</Pill>
          </div>
          <div className="text-[13px]">
            {r.order_id ? (
              <p>
                For order{" "}
                <Link href={`/admin/orders/${r.order_id}`} className="font-semibold text-a-gold hover:underline">
                  {r.order_number}
                </Link>{" "}
                <span className="text-a-muted">({r.order_status?.replaceAll("_", " ")})</span>
              </p>
            ) : (
              <p className="text-a-muted">Not linked to an order (call-back request).</p>
            )}
            {r.rx_items.length ? <p className="mt-1 text-a-muted">Rx items: {r.rx_items.join(", ")}</p> : null}
            {r.reject_reason ? <p className="mt-1 text-a-danger">Rejected: {r.reject_reason}</p> : null}
            {r.reviewer ? <p className="mt-1 text-[12px] text-a-muted">Reviewed by {r.reviewer} · {fmtDate(r.reviewed_at!)}</p> : null}
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            {canReview && r.status !== "approved" && (
              <Btn variant="primary" size="sm" disabled={approve.pending} onClick={() => approve.run(r.id, "approved")}>
                <CheckIcon size={16} eager /> Approve
              </Btn>
            )}
            {canReview && r.status !== "rejected" && (
              <Btn size="sm" className="text-a-danger" onClick={onReject}>
                <CloseIcon size={14} eager /> Reject
              </Btn>
            )}
            <Btn size="sm" onClick={() => setLinking((l) => !l)} aria-expanded={linking}>
              <LinkIcon size={16} eager /> {r.order_id ? "Change order" : "Link to order"}
            </Btn>
            {!canReview && r.status === "pending" && <span className="text-[12px] text-a-muted">Only a pharmacist can approve.</span>}
          </div>
          <AnimatePresence>
            {linking && (
              <KeepForm
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-wrap items-end gap-2"
                action={async (fd) => {
                  const r2 = await link.run(r.id, String(fd.get("order") || ""));
                  if (r2.ok) setLinking(false);
                }}
              >
                <Select label="Order" name="order" defaultValue={r.order_id ?? ""} className="min-w-[220px] flex-1">
                  <option value="">— Not linked —</option>
                  {sameCustomer.length > 0 && (
                    <optgroup label="Same customer">
                      {sameCustomer.map((o) => (
                        <option key={o.id} value={o.id}>{o.number} · {o.customer_name}{o.has_rx ? " · Rx" : ""}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Other open orders">
                    {others.map((o) => (
                      <option key={o.id} value={o.id}>{o.number} · {o.customer_name}{o.has_rx ? " · Rx" : ""}</option>
                    ))}
                  </optgroup>
                </Select>
                <SaveButton pending={link.pending} status={link.status} className="!min-w-0">Save link</SaveButton>
              </KeepForm>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

export function RxQueue({ data, status, canReview, openId }: { data: Data; status: string; canReview: boolean; openId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [viewer, setViewer] = useState<Row | null>(() => data.rows.find((r) => r.id === openId) ?? null);
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState("");
  const reject = useAction(reviewPrescription);
  const total = Object.values(data.counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="mb-4">
        <Tabs
          id="rx"
          value={status}
          onChange={(v) => router.push(`${pathname}?status=${v}`)}
          tabs={[
            { value: "pending", label: "Pending", count: data.counts.pending ?? 0 },
            { value: "approved", label: "Approved", count: data.counts.approved ?? 0 },
            { value: "rejected", label: "Rejected", count: data.counts.rejected ?? 0 },
            { value: "all", label: "All", count: total },
          ]}
        />
      </div>
      {data.rows.length === 0 ? (
        <Card>
          <EmptyState icon={<PrescriptionIcon size={32} />} title={status === "pending" ? "All caught up" : "Nothing here"} body={status === "pending" ? "New uploads from the website will appear here for review." : undefined} />
        </Card>
      ) : (
        <ul className="grid gap-4 2xl:grid-cols-2">
          <AnimatePresence>
            {data.rows.map((r, i) => (
              <RxCard key={r.id} r={r} index={i} canReview={canReview} openOrders={data.openOrders} onView={() => setViewer(r)} onReject={() => (setRejecting(r), setReason(REASONS[0]), setOther(""))} />
            ))}
          </AnimatePresence>
        </ul>
      )}
      {viewer && <RxViewer open onClose={() => setViewer(null)} id={viewer.id} type={viewer.file_type} title={`Prescription · ${viewer.customer_name}`} />}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject prescription">
        <Shake trigger={reject.shakeKey}>
          <KeepForm
            className="grid gap-4"
            action={async () => {
              if (!rejecting) return;
              const r = await reject.run(rejecting.id, "rejected", reason === "other" ? other : reason);
              if (r.ok) setRejecting(null);
            }}
          >
            <p className="text-[13.5px] text-a-muted">The reason is saved with the prescription and shown on the order, so the team can explain it to {rejecting?.customer_name}.</p>
            <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
              <option value="other">Other…</option>
            </Select>
            {reason === "other" && <TextArea label="Describe the reason" value={other} onChange={(e) => setOther(e.target.value)} maxLength={300} required error={reject.fieldErrors.reason} />}
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setRejecting(null)}>Cancel</Btn>
              <SaveButton variant="danger" pending={reject.pending} status={reject.status}>Reject</SaveButton>
            </div>
          </KeepForm>
        </Shake>
      </Modal>
    </>
  );
}
