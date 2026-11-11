"use client";

import { KeepForm } from "@/components/ui/Form";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DataList } from "@/components/admin/DataList";
import { Btn, Card, EmptyState, Field, Modal, Pill, SaveButton, Select, Shake, Tabs, Toggle, useConfirm, type Tone } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { fmtDate } from "@/components/admin/status";
import { NAV } from "@/components/admin/nav";
import { EditIcon, HistoryIcon, LockIcon } from "@/components/icons/admin";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { createStaff, deleteStaff, resetStaffPassword, updateStaff } from "@/app/admin/actions/staff";
import { ROLES, ROLE_LABEL, canAccess, can, type Role } from "@/lib/permissions";

type S = { id: string; name: string; email: string; role: Role; active: boolean; created_at: string; last_login_at: string | null; sessions: number };
type L = { id: number; staff_name: string | null; action: string; entity: string; entity_id: string | null; summary: string; ip: string | null; created_at: string };
const ROLE_TONE: Record<Role, Tone> = { owner: "primary", pharmacist: "green", staff: "blue", delivery: "gold" };
const ROLE_DESC: Record<Role, string> = {
  owner: "Everything, including staff, settings and the activity log.",
  pharmacist: "Orders, prescription approval, stock, customers, reviews and reports.",
  staff: "Orders, stock, customers, coupons, website content and reviews. Can't approve prescriptions.",
  delivery: "Only packed orders: mark out for delivery / delivered and record payment.",
};

function StaffForm({ s, me, onDone }: { s?: S; me: string; onDone: () => void }) {
  const create = useAction(createStaff);
  const update = useAction(updateStaff);
  const act = s ? update : create;
  return (
    <Shake trigger={act.shakeKey}>
      <KeepForm
        className="grid gap-4"
        action={async (fd) => {
          const r = await act.run(fd);
          if (r.ok) setTimeout(onDone, 500);
        }}
      >
        {s && <input type="hidden" name="id" value={s.id} />}
        <Field label="Full name" name="name" defaultValue={s?.name} required maxLength={80} error={act.fieldErrors.name} />
        {!s && <Field label="Email (used to sign in)" name="email" type="email" required error={act.fieldErrors.email} />}
        <Select label="Role" name="role" defaultValue={s?.role ?? "staff"} disabled={s?.id === me}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]} — {ROLE_DESC[r]}</option>
          ))}
        </Select>
        {s?.id === me && <input type="hidden" name="role" value={s.role} />}
        {!s && <Field label="Temporary password" name="password" type="password" autoComplete="new-password" required minLength={10} hint="10+ characters with letters and a number. Share it privately; they can change it after signing in." />}
        {s && s.id !== me && <Toggle name="active" label="Active" hint="Inactive staff can't sign in and are signed out immediately." defaultChecked={s.active} />}
        {s && s.id === me && <input type="hidden" name="active" value="true" />}
        <div className="flex justify-end">
          <SaveButton pending={act.pending} status={act.status}>{s ? "Save" : "Add staff member"}</SaveButton>
        </div>
      </KeepForm>
    </Shake>
  );
}

function ResetForm({ s, onDone }: { s: S; onDone: () => void }) {
  const act = useAction(resetStaffPassword);
  return (
    <Shake trigger={act.shakeKey}>
      <KeepForm
        className="grid gap-4"
        action={async (fd) => {
          const r = await act.run(s.id, String(fd.get("password") ?? ""));
          if (r.ok) setTimeout(onDone, 500);
        }}
      >
        <p className="text-[13.5px] text-a-muted">{s.name} will be signed out on all devices and must use the new password.</p>
        <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={10} />
        <div className="flex justify-end">
          <SaveButton pending={act.pending} status={act.status}>Reset password</SaveButton>
        </div>
      </KeepForm>
    </Shake>
  );
}

export function StaffClient({ me, staff, log, logMeta, tab }: { me: string; staff: S[]; log: L[]; logMeta: { page: number; pages: number; total: number; who: string | null; entity: string | null; entities: string[] }; tab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();
  const del = useAction(deleteStaff);
  const [editing, setEditing] = useState<S | "new" | null>(null);
  const [resetting, setResetting] = useState<S | null>(null);
  const logQs = (p: Record<string, string | null>) => {
    const sp = new URLSearchParams({ tab: "activity", ...(logMeta.who ? { who: logMeta.who } : {}), ...(logMeta.entity ? { entity: logMeta.entity } : {}) });
    for (const [k, v] of Object.entries(p)) (v ? sp.set(k, v) : sp.delete(k));
    return `${pathname}?${sp}`;
  };

  return (
    <>
      <div className="mb-4">
        <Tabs id="staff-tab" value={tab} onChange={(v) => router.push(`${pathname}?tab=${v}`)} tabs={[{ value: "team", label: "Team", count: staff.length }, { value: "roles", label: "Roles & permissions" }, { value: "activity", label: "Activity log" }]} />
      </div>

      {tab === "team" && (
        <>
          <div className="mb-4">
            <Btn variant="primary" onClick={() => setEditing("new")}><PlusIcon size={16} eager /> Add staff</Btn>
          </div>
          <Card pad={false}>
            <DataList
              rows={staff}
              rowKey={(s) => s.id}
              rowClassName={(s) => (s.active ? "" : "opacity-60")}
              columns={[
                { key: "n", label: "Name", render: (s) => <div><p className="font-semibold">{s.name}{s.id === me ? <span className="ml-2 text-[11px] text-a-gold">(you)</span> : null}</p><p className="text-[12px] text-a-muted">{s.email}</p></div> },
                { key: "r", label: "Role", render: (s) => <Pill tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role]}</Pill> },
                { key: "a", label: "Status", render: (s) => (s.active ? <Pill tone="green">Active</Pill> : <Pill>Inactive</Pill>) },
                { key: "l", label: "Last sign-in", render: (s) => <span className="text-a-muted">{s.last_login_at ? fmtDate(s.last_login_at) : "Never"}{s.sessions ? ` · ${s.sessions} session${s.sessions > 1 ? "s" : ""}` : ""}</span> },
              ]}
              actions={(s) => (
                <>
                  <Btn size="sm" icon aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><EditIcon size={15} eager /></Btn>
                  <Btn size="sm" icon aria-label={`Reset password for ${s.name}`} onClick={() => setResetting(s)}><LockIcon size={15} eager /></Btn>
                  {s.id !== me && (
                    <Btn size="sm" icon aria-label={`Remove ${s.name}`} className="text-a-danger" onClick={async () => (await confirm({ title: `Remove ${s.name}?`, body: "They'll be signed out and can't sign in again. Their past actions stay in the activity log.", requireText: "REMOVE", confirm: "Remove" })) && del.run(s.id)}>
                      <TrashIcon size={14} eager />
                    </Btn>
                  )}
                </>
              )}
              card={(s) => (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{s.name}{s.id === me ? " (you)" : ""}</p>
                    <p className="truncate text-[12px] text-a-muted">{s.email}</p>
                    <p className="mt-1 text-[12px] text-a-muted">Last sign-in {s.last_login_at ? fmtDate(s.last_login_at) : "never"}</p>
                  </div>
                  <span className="grid justify-items-end gap-1"><Pill tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role]}</Pill>{!s.active && <Pill>Inactive</Pill>}</span>
                </div>
              )}
            />
          </Card>
        </>
      )}

      {tab === "roles" && (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-a-border/70">
                  <th className="a-th">Module</th>
                  {ROLES.map((r) => (
                    <th key={r} className="a-th text-center"><Pill tone={ROLE_TONE[r]}>{ROLE_LABEL[r]}</Pill></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NAV.map((n) => (
                  <tr key={n.module} className="border-b border-a-border/40">
                    <td className="a-td"><span className="flex items-center gap-2"><n.Icon size={18} /> {n.label}</span></td>
                    {ROLES.map((r) => (
                      <td key={r} className="a-td text-center">{canAccess(r, n.module) ? <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-a-ok-bg text-a-ok"><CheckIcon size={14} /></span> : <span className="text-a-border">—</span>}</td>
                    ))}
                  </tr>
                ))}
                {[
                  ["Approve / reject prescriptions", "rx.review"],
                  ["Cancel orders", "orders.cancel"],
                  ["Delete products & batches", "products.delete"],
                  ["Delete customers", "customers.delete"],
                ].map(([label, cap]) => (
                  <tr key={cap} className="border-b border-a-border/40 bg-a-raised/40">
                    <td className="a-td text-[13px] italic">{label}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="a-td text-center">{can(r, cap as Parameters<typeof can>[1]) ? <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-a-ok-bg text-a-ok"><CheckIcon size={14} /></span> : <span className="text-a-border">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-2 border-t border-a-border/70 p-5 text-[13px] text-a-muted sm:grid-cols-2">
            {ROLES.map((r) => (
              <li key={r}><strong className="text-a-text">{ROLE_LABEL[r]}:</strong> {ROLE_DESC[r]}</li>
            ))}
          </ul>
          <p className="border-t border-a-border/70 p-5 text-[12.5px] text-a-muted">These rules are enforced on the server for every page and action — hiding a menu item is only a convenience.</p>
        </Card>
      )}

      {tab === "activity" && (
        <Card pad={false}>
          <div className="flex flex-wrap gap-2 border-b border-a-border/70 p-4">
            <select aria-label="Filter by person" className="a-input !h-10 !w-auto" value={logMeta.who ?? ""} onChange={(e) => router.push(logQs({ who: e.target.value || null, page: null }))}>
              <option value="">Everyone</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select aria-label="Filter by area" className="a-input !h-10 !w-auto" value={logMeta.entity ?? ""} onChange={(e) => router.push(logQs({ entity: e.target.value || null, page: null }))}>
              <option value="">All areas</option>
              {logMeta.entities.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <span className="ml-auto self-center text-[12.5px] text-a-muted">{logMeta.total} entries</span>
          </div>
          {log.length === 0 ? (
            <EmptyState icon={<HistoryIcon size={30} />} title="No activity yet" />
          ) : (
            <ol className="divide-y divide-a-border/50">
              {log.map((l) => (
                <li key={l.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-40 shrink-0 text-[12px] tabular-nums text-a-muted">{fmtDate(l.created_at)}</span>
                  <span className="w-32 shrink-0 text-[13px] font-semibold">{l.staff_name ?? "System"}</span>
                  <span className="min-w-0 flex-1 text-[13.5px]">{l.summary}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Pill>{l.action}</Pill>
                    {l.ip ? <span className="text-[11px] text-a-muted">{l.ip}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {logMeta.pages > 1 && (
            <div className="flex items-center justify-between border-t border-a-border/70 px-4 py-3 text-[13px] text-a-muted">
              <span>Page {logMeta.page} of {logMeta.pages}</span>
              <span className="flex gap-2">
                {logMeta.page > 1 && <Link className="a-btn a-btn-ghost a-btn-sm" href={logQs({ page: String(logMeta.page - 1) })}>← Newer</Link>}
                {logMeta.page < logMeta.pages && <Link className="a-btn a-btn-ghost a-btn-sm" href={logQs({ page: String(logMeta.page + 1) })}>Older →</Link>}
              </span>
            </div>
          )}
        </Card>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add staff member" : `Edit ${editing ? editing.name : ""}`}>
        {editing && <StaffForm s={editing === "new" ? undefined : editing} me={me} onDone={() => setEditing(null)} />}
      </Modal>
      <Modal open={!!resetting} onClose={() => setResetting(null)} title={`Reset password · ${resetting?.name ?? ""}`}>
        {resetting && <ResetForm s={resetting} onDone={() => setResetting(null)} />}
      </Modal>
    </>
  );
}
