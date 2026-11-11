"use client";

import { KeepForm } from "@/components/ui/Form";

import { Reorder, motion } from "framer-motion";
import { useState } from "react";
import { Btn, Card, Field, SaveButton, Shake, TextArea, Toggle, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { DragIcon } from "@/components/icons/admin";
import { PlusIcon, StarIcon, TrashIcon } from "@/components/icons";
import { RichTitle } from "@/components/RichTitle";
import { saveFaqs, saveSettings, saveStats } from "@/app/admin/actions/settings";
import { toggleProduct } from "@/app/admin/actions/products";
import type { Faq, Hero, Offer, Shop, Stat } from "@/lib/types";

const keyed = <T,>(a: T[]) => a.map((x) => ({ ...x, _k: Math.random().toString(36).slice(2) }));

function HeroCard({ hero, city }: { hero: Hero; city: string }) {
  const act = useAction(saveSettings.bind(null, "hero"));
  const [h, setH] = useState(hero);
  return (
    <Card title="Hero">
      <div className="mb-4 rounded-2xl border border-a-gold/40 bg-cream p-5 text-center text-charcoal">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-600">{h.eyebrow} · {city}</p>
        <p className="mt-2 font-serif text-2xl leading-tight text-emerald-900 sm:text-3xl">
          <RichTitle text={h.title} city={city} />
        </p>
        <p className="mx-auto mt-2 max-w-md text-[12.5px] text-charcoal-70">{h.subtitle}</p>
      </div>
      <Shake trigger={act.shakeKey}>
        <KeepForm className="grid gap-3" action={async (fd) => { await act.run(fd); }}>
          <Field label="Small line above the headline" name="eyebrow" value={h.eyebrow} onChange={(e) => setH({ ...h, eyebrow: e.target.value })} maxLength={60} error={act.fieldErrors.eyebrow} />
          <Field label="Headline" name="title" value={h.title} onChange={(e) => setH({ ...h, title: e.target.value })} maxLength={120} required hint={<>Wrap words in *stars* for gold italics. {"{city}"} is replaced with your city.</>} error={act.fieldErrors.title} />
          <TextArea label="Sub-line" name="subtitle" value={h.subtitle} onChange={(e) => setH({ ...h, subtitle: e.target.value })} maxLength={400} rows={3} error={act.fieldErrors.subtitle} />
          <SaveButton pending={act.pending} status={act.status} className="justify-self-end" />
        </KeepForm>
      </Shake>
    </Card>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const act = useAction(saveSettings.bind(null, "offer"));
  const [o, setO] = useState(offer);
  return (
    <Card title="Offer banner">
      <div className={`shimmer mb-4 rounded-2xl border border-gold bg-gradient-to-r from-cream-200 via-cream-50 to-cream-200 p-4 text-charcoal transition-opacity ${o.active ? "" : "opacity-40"}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">{o.eyebrow}</p>
        <p className="font-serif text-xl text-emerald-900">{o.title}</p>
        <p className="text-[12.5px] text-charcoal-70">{o.details}</p>
        <span className="mt-2 inline-block rounded-full bg-gold px-3 py-1 text-[12px] font-semibold text-emerald-950">{o.cta}</span>
      </div>
      <Shake trigger={act.shakeKey}>
        <KeepForm className="grid gap-3" action={async (fd) => { await act.run(fd); }}>
          <Toggle name="active" label="Show the banner" checked={o.active} onChange={(v) => setO({ ...o, active: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Small label" name="eyebrow" value={o.eyebrow} onChange={(e) => setO({ ...o, eyebrow: e.target.value })} maxLength={40} />
            <Field label="Button text" name="cta" value={o.cta} onChange={(e) => setO({ ...o, cta: e.target.value })} maxLength={30} required error={act.fieldErrors.cta} />
          </div>
          <Field label="Headline" name="title" value={o.title} onChange={(e) => setO({ ...o, title: e.target.value })} maxLength={120} required error={act.fieldErrors.title} />
          <Field label="Details" name="details" value={o.details} onChange={(e) => setO({ ...o, details: e.target.value })} maxLength={240} />
          <SaveButton pending={act.pending} status={act.status} className="justify-self-end" />
        </KeepForm>
      </Shake>
    </Card>
  );
}

function FeaturedCard({ products }: { products: { id: string; name: string; pack: string; featured: boolean; active: boolean }[] }) {
  const act = useAction(toggleProduct);
  const [q, setQ] = useState("");
  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const count = products.filter((p) => p.featured).length;
  return (
    <Card title="Featured products" action={<span className="text-[12px] text-a-muted">{count} featured</span>}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter products" className="a-input !h-10 mb-3" aria-label="Filter products" />
      <ul className="no-scrollbar grid max-h-[360px] gap-1 overflow-y-auto">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-a-raised/60">
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              onClick={() => act.run(p.id, "featured", !p.featured)}
              aria-pressed={p.featured}
              aria-label={p.featured ? `Unfeature ${p.name}` : `Feature ${p.name}`}
              className={p.featured ? "text-gold" : "text-a-border"}
            >
              <StarIcon size={24} eager />
            </motion.button>
            <span className="min-w-0 flex-1 truncate text-[13.5px]">{p.name} <span className="text-a-muted">· {p.pack}</span></span>
            {!p.active && <span className="text-[11px] text-a-muted">hidden</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FaqCard({ faqs }: { faqs: Faq[] }) {
  const act = useAction(saveFaqs);
  const confirm = useConfirm();
  const [items, setItems] = useState(() => keyed(faqs));
  return (
    <Card title="FAQ" action={<Btn size="sm" onClick={() => setItems([...items, ...keyed([{ q: "", a: "" }])])}><PlusIcon size={14} eager /> Question</Btn>}>
      <Shake trigger={act.shakeKey}>
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="grid gap-3">
          {items.map((f, i) => (
            <Reorder.Item key={f._k} value={f} className="rounded-2xl border border-a-border bg-a-surface p-3" whileDrag={{ scale: 1.01, boxShadow: "0 14px 30px -12px rgba(0,0,0,.3)" }}>
              <div className="flex items-start gap-2">
                <span className="mt-2 cursor-grab touch-none text-a-muted" aria-label="Drag to reorder"><DragIcon size={18} eager /></span>
                <div className="grid flex-1 gap-2">
                  <input className="a-input font-semibold" placeholder="Question" value={f.q} maxLength={200} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} aria-invalid={!!act.fieldErrors[`${i}.q`] || undefined} />
                  <textarea className="a-input" placeholder="Answer" rows={3} value={f.a} maxLength={1500} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} aria-invalid={!!act.fieldErrors[`${i}.a`] || undefined} />
                </div>
                <Btn size="sm" icon className="text-a-danger" aria-label="Remove question" onClick={async () => (!f.q && !f.a) || (await confirm({ title: "Remove this question?", body: f.q })) ? setItems(items.filter((_, j) => j !== i)) : undefined}>
                  <TrashIcon size={14} eager />
                </Btn>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <KeepForm className="mt-3 flex justify-end" action={async () => { await act.run(items.map(({ q, a }) => ({ q, a }))); }}>
          <SaveButton pending={act.pending} status={act.status}>Save FAQ</SaveButton>
        </KeepForm>
      </Shake>
    </Card>
  );
}

function StatsCard({ stats }: { stats: Stat[] }) {
  const act = useAction(saveStats);
  const [items, setItems] = useState(stats);
  return (
    <Card title="“Why choose us” figures" action={items.length < 6 ? <Btn size="sm" onClick={() => setItems([...items, { value: 0, suffix: "", label: "" }])}><PlusIcon size={14} eager /> Figure</Btn> : null}>
      <p className="mb-3 text-[12.5px] text-a-muted">Use your shop&apos;s real numbers. They count up on the website.</p>
      <Shake trigger={act.shakeKey}>
        <div className="grid gap-2">
          {items.map((s, i) => (
            <div key={i} className="grid grid-cols-[90px_70px_1fr_auto] items-center gap-2">
              <input className="a-input" type="number" min={0} value={s.value} aria-label="Number" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} />
              <input className="a-input" value={s.suffix} maxLength={10} placeholder="+" aria-label="Suffix" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, suffix: e.target.value } : x)))} />
              <input className="a-input" value={s.label} maxLength={80} placeholder="Label" aria-label="Label" aria-invalid={!!act.fieldErrors[`${i}.label`] || undefined} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <Btn size="sm" icon className="text-a-danger" aria-label="Remove figure" onClick={() => setItems(items.filter((_, j) => j !== i))}><TrashIcon size={14} eager /></Btn>
            </div>
          ))}
        </div>
        <KeepForm className="mt-3 flex justify-end" action={async () => { await act.run(items); }}>
          <SaveButton pending={act.pending} status={act.status}>Save figures</SaveButton>
        </KeepForm>
      </Shake>
    </Card>
  );
}

function ContactCard({ shop }: { shop: Shop }) {
  const act = useAction(saveSettings.bind(null, "contact"));
  const e = act.fieldErrors;
  return (
    <Card title="Timings & contact">
      <Shake trigger={act.shakeKey}>
        <KeepForm className="grid gap-3 sm:grid-cols-2" action={async (fd) => { await act.run(fd); }}>
          <Field label="Timings (shown on site)" name="timings" defaultValue={shop.timings} required maxLength={120} error={e.timings} className="sm:col-span-2" placeholder="Open daily 8 AM – 11 PM" />
          <Field label="Opening hours for Google" name="openingHours" defaultValue={shop.openingHours} maxLength={200} hint="e.g. Mo-Sa 08:00-22:00, Su 09:00-14:00" error={e.openingHours} className="sm:col-span-2" />
          <Field label="Phone (as displayed)" name="phoneDisplay" defaultValue={shop.phoneDisplay} required error={e.phoneDisplay} />
          <Field label="Phone for calls" name="phoneE164" defaultValue={shop.phoneE164} required hint="With country code, e.g. +919876543210" error={e.phoneE164} />
          <Field label="WhatsApp number" name="whatsapp" defaultValue={shop.whatsapp} required hint="Digits with country code: 919876543210" error={e.whatsapp} />
          <Field label="Email" name="email" type="email" defaultValue={shop.email.startsWith("[") ? "" : shop.email} error={e.email} />
          <Field label="Street address" name="street" defaultValue={shop.street} required error={e.street} className="sm:col-span-2" />
          <Field label="City" name="city" defaultValue={shop.city} required error={e.city} />
          <Field label="State" name="region" defaultValue={shop.region} error={e.region} />
          <Field label="PIN code" name="postalCode" defaultValue={shop.postalCode} error={e.postalCode} />
          <div className="flex items-end justify-end sm:col-span-2">
            <SaveButton pending={act.pending} status={act.status} />
          </div>
        </KeepForm>
      </Shake>
    </Card>
  );
}

export function ContentClient({ hero, offer, faqs, stats, shop, products }: { hero: Hero; offer: Offer; faqs: Faq[]; stats: Stat[]; shop: Shop; products: { id: string; name: string; pack: string; featured: boolean; active: boolean }[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <HeroCard hero={hero} city={shop.city} />
      <OfferCard offer={offer} />
      <FaqCard faqs={faqs} />
      <div className="grid content-start gap-5">
        <FeaturedCard products={products} />
        <StatsCard stats={stats} />
      </div>
      <div className="xl:col-span-2">
        <ContactCard shop={shop} />
      </div>
    </div>
  );
}
