"use client";

import { KeepForm } from "@/components/ui/Form";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Btn, BtnLink, Card, Field, PageHeader, SaveButton, Shake, TextArea, useConfirm } from "@/components/admin/ui";
import { CountUp } from "@/components/admin/Stat";
import { StatusPill, fmtDate } from "@/components/admin/status";
import { useAction } from "@/components/admin/useAction";
import { MapPinIcon, PlusIcon, TrashIcon, WhatsAppIcon } from "@/components/icons";
import { addAddress, deleteAddress, deleteCustomer, saveCustomer } from "@/app/admin/actions/customers";
import { inr } from "@/lib/types";

type D = {
  c: { id: string; name: string; phone: string; email: string | null; notes: string; created_at: string };
  orders: { id: string; number: string; status: string; total: number; created_at: string; items: number }[];
  addresses: { id: string; label: string; line: string }[];
  stats: { orders: number; spend: number; avg: number; first: string | null };
  rxCount: number;
};

export function CustomerDetail({ data, canDelete }: { data: D; canDelete: boolean }) {
  const { c, orders, addresses, stats } = data;
  const save = useAction(saveCustomer);
  const add = useAction(addAddress);
  const delAddr = useAction(deleteAddress);
  const del = useAction(deleteCustomer, { refresh: false });
  const confirm = useConfirm();
  const router = useRouter();
  const money = (n: number) => inr(Math.round(n));
  return (
    <>
      <PageHeader
        eyebrow={<Link href="/admin/customers" className="hover:underline">← Customers</Link>}
        title={c.name}
        subtitle={`Customer since ${fmtDate(c.created_at, false)} · ${data.rxCount} prescription${data.rxCount === 1 ? "" : "s"} on file`}
        actions={
          <>
            <BtnLink variant="wa" href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={18} eager strokeWidth={2.4} /> WhatsApp
            </BtnLink>
            {canDelete && (
              <Btn
                className="text-a-danger"
                onClick={async () => {
                  if (await confirm({ title: `Delete ${c.name}?`, body: "Their orders stay in your records (with the name and address on each order), but the customer profile, notes and saved addresses are removed.", requireText: "DELETE" })) {
                    const r = await del.run(c.id);
                    if (r.ok) router.push("/admin/customers");
                  }
                }}
              >
                <TrashIcon size={16} eager /> Delete
              </Btn>
            )}
          </>
        }
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { l: "Orders", v: stats.orders, f: undefined },
          { l: "Total spend", v: stats.spend, f: money },
          { l: "Average order", v: stats.avg, f: money },
        ].map((s) => (
          <div key={s.l} className="a-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-a-muted">{s.l}</p>
            <p className="mt-2 font-serif text-2xl sm:text-3xl"><CountUp value={s.v} format={s.f} /></p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Order history" className="xl:col-span-2" pad={false}>
          {orders.length === 0 ? (
            <p className="p-5 text-[13.5px] text-a-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-a-border/60">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-a-raised/60">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{o.number}</span>
                      <span className="text-[12px] text-a-muted">{fmtDate(o.created_at)} · {o.items} items</span>
                    </span>
                    <StatusPill status={o.status} />
                    <span className="w-20 text-right font-semibold tabular-nums">{inr(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="grid content-start gap-5">
          <Card title="Profile & notes">
            <Shake trigger={save.shakeKey}>
              <KeepForm className="grid gap-3" action={async (fd) => { await save.run(fd); }}>
                <input type="hidden" name="id" value={c.id} />
                <Field label="Name" name="name" defaultValue={c.name} required maxLength={80} error={save.fieldErrors.name} />
                <Field label="Phone" name="phone" defaultValue={c.phone} required error={save.fieldErrors.phone} />
                <Field label="Email" name="email" type="email" defaultValue={c.email ?? ""} error={save.fieldErrors.email} />
                <TextArea label="Notes (staff only)" name="notes" defaultValue={c.notes} rows={4} maxLength={2000} hint="Allergies, preferred brands, delivery instructions…" />
                <SaveButton pending={save.pending} status={save.status} />
              </KeepForm>
            </Shake>
          </Card>
          <Card title="Saved addresses">
            <ul className="grid gap-2">
              <AnimatePresence initial={false}>
                {addresses.map((a) => (
                  <motion.li key={a.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-start gap-2 rounded-xl border border-a-border/70 p-3 text-[13px]">
                    <span className="text-a-primary"><MapPinIcon size={20} /></span>
                    <span className="min-w-0 flex-1"><strong className="block">{a.label}</strong><span className="text-a-muted">{a.line}</span></span>
                    <Btn size="sm" icon aria-label="Remove address" className="text-a-danger" onClick={async () => (await confirm({ title: "Remove this address?", body: a.line })) && delAddr.run(a.id)}>
                      <TrashIcon size={14} eager />
                    </Btn>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <Shake trigger={add.shakeKey}>
              <KeepForm
                className="mt-3 grid gap-2"
                action={async (fd) => {
                  const r = await add.run(fd);
                  if (r.ok) (document.getElementById("addr-line") as HTMLInputElement | null)?.form?.reset();
                }}
              >
                <input type="hidden" name="customer_id" value={c.id} />
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <input name="label" defaultValue="Home" maxLength={30} className="a-input" aria-label="Label" />
                  <input id="addr-line" name="line" placeholder="Full address" maxLength={300} required className="a-input" aria-label="Address" />
                </div>
                <Btn type="submit" size="sm" disabled={add.pending} className="justify-self-end">
                  <PlusIcon size={14} eager /> Add address
                </Btn>
              </KeepForm>
            </Shake>
          </Card>
        </div>
      </div>
    </>
  );
}
