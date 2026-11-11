"use client";

import { KeepForm } from "@/components/ui/Form";

import { Card, Field, SaveButton, Select, Shake, TextArea, Toggle } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { saveSettings } from "@/app/admin/actions/settings";
import type { InvoiceSettings, Shop } from "@/lib/types";

const clean = (v: string) => (v.startsWith("[") ? "" : v);

export function SettingsClient({ shop, invoice }: { shop: Shop; invoice: InvoiceSettings }) {
  const s = useAction(saveSettings.bind(null, "shop"));
  const inv = useAction(saveSettings.bind(null, "invoice"));
  const e = s.fieldErrors;
  return (
    <div className="grid gap-5">
      <Shake trigger={s.shakeKey}>
        <KeepForm className="grid gap-5 xl:grid-cols-2" action={async (fd) => { await s.run(fd); }}>
          <Card title="Shop">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Shop name" name="name" defaultValue={shop.name} required maxLength={60} error={e.name} />
              <Field label="Tagline" name="tagline" defaultValue={shop.tagline} maxLength={80} error={e.tagline} />
              <Field label="Street address" name="street" defaultValue={clean(shop.street)} required className="sm:col-span-2" error={e.street} />
              <Field label="City" name="city" defaultValue={clean(shop.city)} required error={e.city} />
              <Field label="State" name="region" defaultValue={clean(shop.region)} error={e.region} />
              <Field label="PIN code" name="postalCode" defaultValue={clean(shop.postalCode)} error={e.postalCode} />
              <Field label="Timings" name="timings" defaultValue={clean(shop.timings)} required error={e.timings} />
              <Field label="Opening hours (Google format)" name="openingHours" defaultValue={shop.openingHours} className="sm:col-span-2" hint="e.g. Mo-Sa 08:00-22:00, Su 09:00-14:00" error={e.openingHours} />
              <Field label="Map latitude" name="lat" type="number" step="any" defaultValue={shop.lat || ""} hint="Optional — improves the map pin" error={e.lat} />
              <Field label="Map longitude" name="lng" type="number" step="any" defaultValue={shop.lng || ""} error={e.lng} />
            </div>
          </Card>
          <div className="grid content-start gap-5">
            <Card title="Licence & tax">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Drug Licence No." name="drugLicence" defaultValue={clean(shop.drugLicence)} required error={e.drugLicence} />
                <Field label="GSTIN" name="gstin" defaultValue={clean(shop.gstin)} maxLength={20} error={e.gstin} />
                <Field label="Registered pharmacist (name, Reg. No.)" name="pharmacist" defaultValue={clean(shop.pharmacist)} className="sm:col-span-2" error={e.pharmacist} />
              </div>
            </Card>
            <Card title="Contact & WhatsApp">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone (as displayed)" name="phoneDisplay" defaultValue={clean(shop.phoneDisplay)} required error={e.phoneDisplay} />
                <Field label="Phone for calls" name="phoneE164" defaultValue={shop.phoneE164} required hint="+919876543210" error={e.phoneE164} />
                <Field label="WhatsApp number" name="whatsapp" defaultValue={shop.whatsapp} required hint="Digits with country code" error={e.whatsapp} />
                <Field label="Email" name="email" type="email" defaultValue={clean(shop.email)} error={e.email} />
              </div>
            </Card>
          </div>
          <Card title="Delivery">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Delivery area" name="deliveryArea" defaultValue={clean(shop.deliveryArea)} required className="sm:col-span-3" hint="Shown on the website, e.g. “within 5 km of Civil Lines”" error={e.deliveryArea} />
              <Field label="Delivery charge (₹)" name="deliveryCharge" type="number" step="1" min={0} defaultValue={shop.deliveryCharge} required error={e.deliveryCharge} />
              <Field label="Free delivery above (₹)" name="freeDeliveryAbove" type="number" step="1" min={0} defaultValue={shop.freeDeliveryAbove} required error={e.freeDeliveryAbove} />
            </div>
          </Card>
          <Card title="Social links">
            <div className="grid gap-3">
              <Field label="Instagram" name="instagram" defaultValue={shop.instagram} placeholder="https://instagram.com/…" error={e.instagram} />
              <Field label="Facebook" name="facebook" defaultValue={shop.facebook} placeholder="https://facebook.com/…" error={e.facebook} />
              <Field label="Google reviews link" name="google" defaultValue={shop.google} placeholder="https://g.page/r/…" error={e.google} />
            </div>
          </Card>
          <div className="sticky bottom-24 z-10 flex justify-end rounded-2xl border border-a-border bg-a-surface/95 p-3 shadow-lg backdrop-blur md:bottom-4 xl:col-span-2">
            <SaveButton pending={s.pending} status={s.status}>Save shop settings</SaveButton>
          </div>
        </KeepForm>
      </Shake>

      <Shake trigger={inv.shakeKey}>
        <Card title="Invoice format">
          <KeepForm className="grid gap-3 sm:grid-cols-2" action={async (fd) => { await inv.run(fd); }}>
            <Field label="Invoice number prefix" name="prefix" defaultValue={invoice.prefix} required maxLength={10} hint="Invoice no. = prefix + order number, e.g. INV-1042" error={inv.fieldErrors.prefix} />
            <Select label="GST rate (prices include GST)" name="gstRate" defaultValue={String(invoice.gstRate)} error={inv.fieldErrors.gstRate}>
              {[0, 5, 12, 18, 28].map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </Select>
            <Toggle name="showBatch" label="Show batch & expiry on invoice" defaultChecked={invoice.showBatch} />
            <Toggle name="showMrp" label="Show MRP column" defaultChecked={invoice.showMrp} />
            <TextArea label="Footer note" name="footer" defaultValue={invoice.footer} maxLength={400} rows={3} className="sm:col-span-2" error={inv.fieldErrors.footer} />
            <div className="flex justify-end sm:col-span-2">
              <SaveButton pending={inv.pending} status={inv.status}>Save invoice format</SaveButton>
            </div>
          </KeepForm>
        </Card>
      </Shake>
    </div>
  );
}
