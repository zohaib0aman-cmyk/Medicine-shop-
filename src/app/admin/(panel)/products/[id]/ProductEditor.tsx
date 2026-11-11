"use client";

import { KeepForm } from "@/components/ui/Form";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Btn, Card, Field, Modal, PageHeader, Pill, SaveButton, Select, Shake, TextArea, Toggle, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { CalendarIcon, EditIcon, UploadArrowIcon } from "@/components/icons/admin";
import { CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ICONS, iconFor } from "@/components/icons/map";
import { deleteBatch, deleteProduct, saveBatch, saveProduct } from "@/app/admin/actions/products";
import { discountPct, inr } from "@/lib/types";
import { ExpiryPill } from "../ProductsClient";

type Batch = { id: string; batch_no: string; expiry_date: string; quantity: number; days_left: number };
type Product = { id: string; sku: string; name: string; brand: string; salt: string; category_id: string; pack: string; mrp: number; price: number; rx: boolean; active: boolean; featured: boolean; low_stock_threshold: number; art: string; description: string; imageUrls: { key: string; url: string }[] };

function BatchForm({ productId, batch, onDone }: { productId: string; batch?: Batch; onDone: () => void }) {
  const act = useAction(saveBatch);
  return (
    <Shake trigger={act.shakeKey}>
      <KeepForm
        className="grid gap-4"
        action={async (fd) => {
          const r = await act.run(fd);
          if (r.ok) setTimeout(onDone, 500);
        }}
      >
        <input type="hidden" name="product_id" value={productId} />
        {batch && <input type="hidden" name="id" value={batch.id} />}
        <Field label="Batch number" name="batch_no" defaultValue={batch?.batch_no} required maxLength={40} error={act.fieldErrors.batch_no} className="uppercase" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry date" name="expiry_date" type="date" defaultValue={batch?.expiry_date} required error={act.fieldErrors.expiry_date} />
          <Field label="Quantity" name="quantity" type="number" min={0} defaultValue={batch?.quantity ?? ""} required error={act.fieldErrors.quantity} />
        </div>
        <div className="flex justify-end">
          <SaveButton pending={act.pending} status={act.status}>{batch ? "Save batch" : "Add batch"}</SaveButton>
        </div>
      </KeepForm>
    </Shake>
  );
}

export function ProductEditor({ data, categories, canDelete }: { data: { product: Product; batches: Batch[] } | null; categories: { id: string; name: string }[]; canDelete: boolean }) {
  const p = data?.product;
  const router = useRouter();
  const confirm = useConfirm();
  const save = useAction(saveProduct);
  const del = useAction(deleteProduct, { refresh: false });
  const delBatch = useAction(deleteBatch);
  const [mrp, setMrp] = useState(String(p?.mrp ?? ""));
  const [price, setPrice] = useState(String(p?.price ?? ""));
  const [keep, setKeep] = useState(p?.imageUrls ?? []);
  const [newFiles, setNewFiles] = useState<{ name: string; url: string }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const imagesKey = JSON.stringify(p?.imageUrls ?? []);
  // after a save, the server's image list is the source of truth
  useEffect(() => {
    setKeep(JSON.parse(imagesKey));
    setNewFiles([]);
    if (fileInput.current) fileInput.current.value = "";
  }, [imagesKey]);
  const [art, setArt] = useState(p?.art ?? "blister");
  const [batchModal, setBatchModal] = useState<Batch | "new" | null>(null);
  const disc = Number(mrp) > 0 && Number(price) >= 0 ? discountPct({ mrp: Number(mrp), price: Number(price) }) : 0;
  const stock = data?.batches.filter((b) => b.days_left > 0).reduce((s, b) => s + b.quantity, 0) ?? 0;
  const Art = iconFor(art);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/admin/products" className="hover:underline">← Products</Link>}
        title={p ? p.name : "New product"}
        subtitle={p ? `${p.sku} · ${stock} in stock` : "Add a product to the catalogue. Stock is added as batches after saving."}
        actions={
          p && canDelete ? (
            <Btn
              className="text-a-danger"
              onClick={async () => {
                if (await confirm({ title: `Delete ${p.name}?`, body: "This removes the product and all of its batches. Past orders keep their own copy of the item details.", requireText: p.sku })) {
                  const r = await del.run(p.id);
                  if (r.ok) router.push("/admin/products");
                }
              }}
            >
              <TrashIcon size={16} eager /> Delete
            </Btn>
          ) : null
        }
      />
      <Shake trigger={save.shakeKey}>
        <KeepForm
          className="grid gap-5 xl:grid-cols-3"
          action={async (fd) => {
            const r = await save.run(fd);
            if (r.ok && !p && r.data && typeof r.data === "object" && "id" in r.data) router.push(`/admin/products/${(r.data as { id: string }).id}`);
          }}
        >
          {p && <input type="hidden" name="id" value={p.id} />}
          {keep.map((k) => (
            <input key={k.key} type="hidden" name="keepImages" value={k.key} />
          ))}
          <div className="grid content-start gap-5 xl:col-span-2">
            <Card title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" name="name" defaultValue={p?.name} required maxLength={120} error={save.fieldErrors.name} className="sm:col-span-2" />
                <Field label="Brand / manufacturer" name="brand" defaultValue={p?.brand} maxLength={80} error={save.fieldErrors.brand} />
                <Field label="SKU" name="sku" defaultValue={p?.sku} required maxLength={40} hint="Unique code, used for imports" error={save.fieldErrors.sku} />
                <Field label="Salt composition" name="salt" defaultValue={p?.salt} maxLength={200} hint="e.g. Paracetamol 650 mg" error={save.fieldErrors.salt} className="sm:col-span-2" />
                <Select label="Category" name="category_id" defaultValue={p?.category_id ?? categories[0]?.id} error={save.fieldErrors.category_id}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
                <Field label="Pack size" name="pack" defaultValue={p?.pack} maxLength={60} placeholder="Strip of 10" error={save.fieldErrors.pack} />
                <TextArea label="Description" name="description" defaultValue={p?.description} maxLength={2000} rows={4} className="sm:col-span-2" error={save.fieldErrors.description} />
              </div>
            </Card>

            <Card title="Pricing">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="MRP (₹)" name="mrp" type="number" step="0.01" min={0} value={mrp} onChange={(e) => setMrp(e.target.value)} required error={save.fieldErrors.mrp} />
                <Field
                  label="Discount (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={disc}
                  onChange={(e) => {
                    const d = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                    setPrice(String(Math.round(Number(mrp) * (1 - d / 100) * 100) / 100));
                  }}
                  hint="Changes the selling price"
                />
                <Field label="Selling price (₹)" name="price" type="number" step="0.01" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required error={save.fieldErrors.price} />
              </div>
              {Number(mrp) > 0 && <p className="mt-3 text-[13px] text-a-muted">Customer saves {inr(Math.max(0, Number(mrp) - Number(price)))} ({disc}% off MRP).</p>}
            </Card>

            {p ? (
              <Card title="Batches & expiry" action={<Btn size="sm" variant="primary" onClick={() => setBatchModal("new")}><PlusIcon size={14} eager /> Add batch</Btn>} pad={false}>
                {data!.batches.length === 0 ? (
                  <p className="p-5 text-[13.5px] text-a-muted">No stock yet. Add a batch with its expiry date and quantity.</p>
                ) : (
                  <ul className="divide-y divide-a-border/60">
                    <AnimatePresence initial={false}>
                      {data!.batches.map((b) => (
                        <motion.li key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${b.days_left <= 0 ? "bg-a-danger-bg/60" : b.days_left <= 30 ? "bg-a-danger-bg/30" : b.days_left <= 90 ? "bg-a-warn-bg/40" : ""}`}>
                          <span className="text-a-primary"><CalendarIcon size={20} /></span>
                          <span className="min-w-[110px] font-semibold">{b.batch_no}</span>
                          <ExpiryPill date={b.expiry_date} expired={b.days_left <= 0 ? b.quantity || 1 : 0} />
                          <span className="ml-auto text-[13px] tabular-nums">Qty <strong>{b.quantity}</strong></span>
                          <Btn size="sm" icon aria-label={`Edit batch ${b.batch_no}`} onClick={() => setBatchModal(b)}>
                            <EditIcon size={15} eager />
                          </Btn>
                          {canDelete && (
                            <Btn
                              size="sm"
                              icon
                              aria-label={`Delete batch ${b.batch_no}`}
                              className="text-a-danger"
                              onClick={async () => {
                                if (await confirm({ title: `Delete batch ${b.batch_no}?`, body: `${b.quantity} units will be removed from stock.` })) delBatch.run(b.id);
                              }}
                            >
                              <TrashIcon size={14} eager />
                            </Btn>
                          )}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </Card>
            ) : null}
          </div>

          <div className="grid content-start gap-5">
            <Card title="Visibility & rules">
              <div className="grid gap-3">
                <Toggle name="rx" label="Prescription required (Rx)" hint="Customers must upload a prescription; orders stay locked until a pharmacist approves it." defaultChecked={p?.rx} />
                <Toggle name="active" label="Show on website" defaultChecked={p ? p.active : true} />
                <Toggle name="featured" label="Featured" hint="Shown in the Featured row on the home page." defaultChecked={p?.featured} />
                <Field label="Low-stock alert at" name="low_stock_threshold" type="number" min={0} defaultValue={p?.low_stock_threshold ?? 10} hint="Highlighted in gold at or below this quantity" error={save.fieldErrors.low_stock_threshold} />
              </div>
            </Card>

            <Card title="Images">
              <div className="grid grid-cols-3 gap-2">
                <AnimatePresence>
                  {[...keep.map((k) => ({ ...k, kept: true })), ...newFiles.map((f) => ({ key: f.name, url: f.url, kept: false }))].map((img) => (
                    <motion.div key={img.key} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative aspect-square overflow-hidden rounded-xl border border-a-border bg-a-raised">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      {img.kept && (
                        <button type="button" onClick={() => setKeep((k) => k.filter((x) => x.key !== img.key))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove image">
                          <CloseIcon size={12} eager />
                        </button>
                      )}
                      {!img.kept && <span className="absolute bottom-1 left-1 rounded bg-a-gold px-1.5 text-[10px] font-bold text-emerald-950">NEW</span>}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-a-gold/50 px-3 py-4 text-[13px] text-a-muted hover:border-a-gold">
                <UploadArrowIcon size={20} eager /> Add images (JPG, PNG, WebP · 3 MB)
                <input
                  ref={fileInput}
                  type="file"
                  name="images"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => setNewFiles([...(e.target.files ?? [])].map((f) => ({ name: f.name, url: URL.createObjectURL(f) })))}
                />
              </label>
              <p className="mt-3 text-[12px] text-a-muted">Without a photo, the website shows this animated illustration:</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-a-raised text-a-primary">
                  <Art key={art} size={36} eager />
                </span>
                <Select label="Illustration" name="art" value={art} onChange={(e) => setArt(e.target.value)} className="flex-1">
                  {Object.entries(ICONS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </Select>
              </div>
            </Card>

            <div className="sticky bottom-24 z-10 flex justify-end gap-2 rounded-2xl border border-a-border bg-a-surface/95 p-3 shadow-lg backdrop-blur md:bottom-4">
              {p?.rx ? <Pill tone="red" className="mr-auto self-center">Rx</Pill> : null}
              <Link href="/admin/products" className="a-btn a-btn-ghost">Cancel</Link>
              <SaveButton pending={save.pending} status={save.status}>{p ? "Save product" : "Create product"}</SaveButton>
            </div>
          </div>
        </KeepForm>
      </Shake>
      {p && (
        <Modal open={!!batchModal} onClose={() => setBatchModal(null)} title={batchModal === "new" ? "Add batch" : `Edit batch ${batchModal ? batchModal.batch_no : ""}`}>
          {batchModal && <BatchForm productId={p.id} batch={batchModal === "new" ? undefined : batchModal} onDone={() => setBatchModal(null)} />}
        </Modal>
      )}
    </>
  );
}
