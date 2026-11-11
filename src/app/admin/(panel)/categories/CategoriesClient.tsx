"use client";

import { KeepForm } from "@/components/ui/Form";

import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Btn, Card, Field, Modal, SaveButton, Shake, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { DragIcon, EditIcon } from "@/components/icons/admin";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { ICONS, iconFor } from "@/components/icons/map";
import { deleteCategory, reorderCategories, saveCategory } from "@/app/admin/actions/categories";

type Cat = { id: string; name: string; blurb: string; icon: string; products: number };

function Row({ c, onEdit, onDelete, canDelete, onDragEnd }: { c: Cat; onEdit: () => void; onDelete: () => void; canDelete: boolean; onDragEnd: () => void }) {
  const controls = useDragControls();
  const Icon = iconFor(c.icon);
  return (
    <Reorder.Item
      value={c}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px -12px rgba(15,76,58,.35)" }}
      className="flex items-center gap-3 rounded-2xl border border-a-border bg-a-surface p-3 sm:p-4"
    >
      <button onPointerDown={(e) => controls.start(e)} className="grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-a-muted hover:bg-a-raised active:cursor-grabbing" aria-label={`Drag to reorder ${c.name}`}>
        <DragIcon size={20} eager />
      </button>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-a-gold/40 bg-a-raised text-a-primary">
        <Icon size={30} eager />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[1.1rem]">{c.name}</p>
        <p className="truncate text-[12.5px] text-a-muted">{c.blurb || "—"} · {c.products} product{c.products === 1 ? "" : "s"}</p>
      </div>
      <Btn size="sm" icon aria-label={`Edit ${c.name}`} onClick={onEdit}>
        <EditIcon size={16} eager />
      </Btn>
      {canDelete && (
        <Btn size="sm" icon aria-label={`Delete ${c.name}`} className="text-a-danger" onClick={onDelete}>
          <TrashIcon size={14} eager />
        </Btn>
      )}
    </Reorder.Item>
  );
}

function CategoryForm({ c, onDone }: { c?: Cat; onDone: () => void }) {
  const act = useAction(saveCategory);
  const [icon, setIcon] = useState(c?.icon ?? "capsule");
  const [name, setName] = useState(c?.name ?? "");
  return (
    <Shake trigger={act.shakeKey}>
      <KeepForm
        className="grid gap-4"
        action={async (fd) => {
          fd.set("icon", icon);
          const r = await act.run(fd);
          if (r.ok) setTimeout(onDone, 500);
        }}
      >
        {c && <input type="hidden" name="original" value={c.id} />}
        <Field label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} error={act.fieldErrors.name} />
        <Field label="URL key" name="id" defaultValue={c?.id} placeholder={name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")} required maxLength={40} hint="Lowercase, used internally and in imports" error={act.fieldErrors.id} />
        <Field label="Short description" name="blurb" defaultValue={c?.blurb} maxLength={120} error={act.fieldErrors.blurb} />
        <fieldset>
          <legend className="mb-2 text-[12.5px] font-semibold text-a-muted">Icon</legend>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {Object.entries(ICONS).map(([k, { label, Icon }]) => (
              <button
                key={k}
                type="button"
                onClick={() => setIcon(k)}
                aria-pressed={icon === k}
                title={label}
                className={`grid aspect-square place-items-center rounded-xl border-2 transition-colors ${icon === k ? "border-a-gold bg-a-warn-bg text-a-primary" : "border-a-border text-a-muted hover:border-a-gold/50"}`}
              >
                <Icon size={28} eager />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end">
          <SaveButton pending={act.pending} status={act.status}>{c ? "Save" : "Add category"}</SaveButton>
        </div>
      </KeepForm>
    </Shake>
  );
}

export function CategoriesClient({ rows, canDelete }: { rows: Cat[]; canDelete: boolean }) {
  const [items, setItems] = useState(rows);
  const [editing, setEditing] = useState<Cat | "new" | null>(null);
  const reorder = useAction(reorderCategories);
  const del = useAction(deleteCategory);
  const confirm = useConfirm();
  const latest = useRef(items);
  latest.current = items;
  useEffect(() => setItems(rows), [rows]);
  const changed = items.map((i) => i.id).join() !== rows.map((r) => r.id).join();
  // save as soon as an item is dropped
  const saveOrder = () => setTimeout(() => {
    const ids = latest.current.map((i) => i.id);
    if (ids.join() !== rows.map((r) => r.id).join()) reorder.run(ids);
  }, 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <PlusIcon size={16} eager /> Add category
        </Btn>
        {(changed || reorder.pending) && <span className="text-[12.5px] text-a-muted">{reorder.pending ? "Saving order…" : "Unsaved order"}</span>}
        {reorder.status === "success" && <span className="text-[12.5px] text-a-ok">Order saved ✓</span>}
      </div>
      <Card>
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="grid gap-2">
          {items.map((c) => (
            <Row
              key={c.id}
              c={c}
              canDelete={canDelete}
              onEdit={() => setEditing(c)}
              onDragEnd={saveOrder}
              onDelete={async () => {
                if (await confirm({ title: `Delete ${c.name}?`, body: c.products ? `It still has ${c.products} products — move them first.` : "It will disappear from the website." })) del.run(c.id);
              }}
            />
          ))}
        </Reorder.Group>
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"}>
        {editing && <CategoryForm c={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
