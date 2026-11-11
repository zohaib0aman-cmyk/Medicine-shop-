"use client";

import { KeepForm } from "@/components/ui/Form";

import { useState } from "react";
import { DataList } from "@/components/admin/DataList";
import { Btn, Card, EmptyState, Field, Modal, Pill, SaveButton, Select, Shake, Toggle, useConfirm, type Tone } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { EditIcon, TicketIcon } from "@/components/icons/admin";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/app/admin/actions/coupons";
import { inr } from "@/lib/types";

type C = { id: string; code: string; description: string; type: "percent" | "flat"; value: number; min_order: number; max_discount: number | null; usage_limit: number | null; used_count: number; active: boolean; starts_at: string; ends_at: string | null; state: string; given: number };
const STATE_TONE: Record<string, Tone> = { live: "green", scheduled: "blue", expired: "neutral", "used up": "gold", paused: "neutral" };

function CouponForm({ c, onDone }: { c?: C; onDone: () => void }) {
  const act = useAction(saveCoupon);
  const [type, setType] = useState(c?.type ?? "percent");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Shake trigger={act.shakeKey}>
      <KeepForm
        className="grid gap-4"
        action={async (fd) => {
          const r = await act.run(fd);
          if (r.ok) setTimeout(onDone, 500);
        }}
      >
        {c && <input type="hidden" name="id" value={c.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" name="code" defaultValue={c?.code} required maxLength={20} className="uppercase" placeholder="SAVE10" error={act.fieldErrors.code} />
          <Field label="Description" name="description" defaultValue={c?.description} maxLength={160} placeholder="10% off for new customers" error={act.fieldErrors.description} />
          <Select label="Discount type" name="type" value={type} onChange={(e) => setType(e.target.value as "percent" | "flat")}>
            <option value="percent">Percentage (%)</option>
            <option value="flat">Flat amount (₹)</option>
          </Select>
          <Field label={type === "percent" ? "Percent off" : "Amount off (₹)"} name="value" type="number" step="0.01" min={0} defaultValue={c?.value} required error={act.fieldErrors.value} />
          <Field label="Minimum order (₹)" name="min_order" type="number" step="0.01" min={0} defaultValue={c?.min_order ?? 0} required error={act.fieldErrors.min_order} />
          {type === "percent" ? (
            <Field label="Maximum discount (₹)" name="max_discount" type="number" step="0.01" min={0} defaultValue={c?.max_discount ?? ""} hint="Optional cap" error={act.fieldErrors.max_discount} />
          ) : (
            <input type="hidden" name="max_discount" value="" />
          )}
          <Field label="Valid from" name="starts_at" type="date" defaultValue={c?.starts_at ?? today} required error={act.fieldErrors.starts_at} />
          <Field label="Valid until" name="ends_at" type="date" defaultValue={c?.ends_at ?? ""} hint="Leave empty for no end date" error={act.fieldErrors.ends_at} />
          <Field label="Usage limit" name="usage_limit" type="number" min={1} defaultValue={c?.usage_limit ?? ""} hint="Total uses across all customers. Empty = unlimited." error={act.fieldErrors.usage_limit} />
        </div>
        <Toggle name="active" label="Active" defaultChecked={c ? c.active : true} />
        <div className="flex justify-end">
          <SaveButton pending={act.pending} status={act.status}>{c ? "Save coupon" : "Create coupon"}</SaveButton>
        </div>
      </KeepForm>
    </Shake>
  );
}

export function CouponsClient({ rows }: { rows: C[] }) {
  const [editing, setEditing] = useState<C | "new" | null>(null);
  const toggle = useAction(toggleCoupon);
  const del = useAction(deleteCoupon);
  const confirm = useConfirm();
  const label = (c: C) => (c.type === "percent" ? `${c.value}% off${c.max_discount ? ` (max ${inr(c.max_discount)})` : ""}` : `${inr(c.value)} off`);
  return (
    <>
      <div className="mb-4">
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <PlusIcon size={16} eager /> New coupon
        </Btn>
      </div>
      <Card pad={false}>
        <DataList
          rows={rows}
          rowKey={(r) => r.id}
          empty={<EmptyState icon={<TicketIcon size={30} />} title="No coupons yet" body="Create a code like WELCOME10 to reward new customers." />}
          columns={[
            { key: "c", label: "Code", render: (r) => <div><p className="font-mono text-[14px] font-bold tracking-wider">{r.code}</p><p className="text-[12px] text-a-muted">{r.description}</p></div> },
            { key: "v", label: "Discount", render: (r) => <span>{label(r)}</span> },
            { key: "m", label: "Min order", align: "right", render: (r) => inr(r.min_order) },
            { key: "d", label: "Valid", render: (r) => <span className="text-[12.5px] text-a-muted">{r.starts_at} → {r.ends_at ?? "no end"}</span> },
            { key: "u", label: "Used", align: "right", render: (r) => <span>{r.used_count}{r.usage_limit ? ` / ${r.usage_limit}` : ""}<span className="block text-[11.5px] text-a-muted">{inr(r.given)} given</span></span> },
            { key: "s", label: "Status", render: (r) => <Pill tone={STATE_TONE[r.state] ?? "neutral"}>{r.state}</Pill> },
          ]}
          actions={(r) => (
            <>
              <Btn size="sm" onClick={() => toggle.run(r.id, !r.active)}>{r.active ? "Pause" : "Activate"}</Btn>
              <Btn size="sm" icon aria-label={`Edit ${r.code}`} onClick={() => setEditing(r)}><EditIcon size={15} eager /></Btn>
              <Btn size="sm" icon aria-label={`Delete ${r.code}`} className="text-a-danger" onClick={async () => (await confirm({ title: `Delete ${r.code}?`, body: "Customers won't be able to use this code any more. Past orders keep their discount." })) && del.run(r.id)}>
                <TrashIcon size={14} eager />
              </Btn>
            </>
          )}
          card={(r) => (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[15px] font-bold tracking-wider">{r.code}</p>
                <p className="text-[13px]">{label(r)} · min {inr(r.min_order)}</p>
                <p className="text-[12px] text-a-muted">Used {r.used_count}{r.usage_limit ? `/${r.usage_limit}` : ""} · until {r.ends_at ?? "no end"}</p>
              </div>
              <Pill tone={STATE_TONE[r.state] ?? "neutral"}>{r.state}</Pill>
            </div>
          )}
        />
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New coupon" : `Edit ${editing ? editing.code : ""}`} wide>
        {editing && <CouponForm c={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
