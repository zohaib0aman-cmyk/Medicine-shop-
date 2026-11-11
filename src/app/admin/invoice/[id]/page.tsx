import { notFound } from "next/navigation";
import { requirePage } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/admin/orders";
import { DEFAULT_INVOICE, DEFAULT_SHOP, getSetting } from "@/lib/server/storefront";
import { fullAddress, inr, type InvoiceSettings, type Shop } from "@/lib/types";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

const round2 = (n: number) => Math.round(n * 100) / 100;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("orders");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getOrder(me, id);
  if (!data) notFound();
  const [shop, inv] = await Promise.all([getSetting<Shop>("shop", DEFAULT_SHOP), getSetting<InvoiceSettings>("invoice", DEFAULT_INVOICE)]);
  const { order: o, items } = data;
  const rate = Number(inv.gstRate) || 0;
  const taxable = round2(o.total / (1 + rate / 100));
  const tax = round2(o.total - taxable);
  const invNo = `${inv.prefix || "INV"}-${o.number.replace(/^AD-/, "")}`;

  return (
    <div className="min-h-dvh bg-a-bg px-3 py-6 print:bg-white print:p-0">
      <div className="admin-no-print mx-auto mb-4 flex max-w-[820px] items-center justify-between">
        <a href={`/admin/orders/${o.id}`} className="text-[13px] font-semibold text-a-gold hover:underline">← Back to order</a>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[820px] rounded-2xl border border-a-border bg-white p-6 text-[13px] text-[#1F2421] shadow-xl sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-6 border-b-2 border-[#0F4C3A] pb-6 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden>
                <circle cx="24" cy="24" r="23" fill="#FAF6EE" stroke="#C9A24B" strokeWidth="1.5" />
                <path d="M20 10h8v10h10v8H28v10h-8V28H10v-8h10Z" fill="#0F4C3A" />
              </svg>
              <div>
                <h1 className="font-serif text-[26px] leading-none text-[#0F4C3A]">{shop.name}</h1>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A9852F]">{shop.tagline}</p>
              </div>
            </div>
            <p className="mt-3 max-w-xs leading-relaxed text-[#4A514D]">{fullAddress(shop)}</p>
            <p className="text-[#4A514D]">Phone: {shop.phoneDisplay}{shop.email && !shop.email.startsWith("[") ? ` · ${shop.email}` : ""}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-serif text-[22px] text-[#0F4C3A]">Tax Invoice</p>
            <dl className="mt-2 grid grid-cols-[auto_auto] justify-start gap-x-3 gap-y-0.5 sm:justify-end">
              <dt className="text-[#6B716D]">Invoice no.</dt><dd className="font-semibold">{invNo}</dd>
              <dt className="text-[#6B716D]">Order</dt><dd>{o.number}</dd>
              <dt className="text-[#6B716D]">Date</dt><dd>{new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</dd>
              <dt className="text-[#6B716D]">D.L. No.</dt><dd>{shop.drugLicence}</dd>
              <dt className="text-[#6B716D]">GSTIN</dt><dd>{shop.gstin}</dd>
            </dl>
          </div>
        </header>

        <section className="grid gap-4 border-b border-[#E9DFC9] py-5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A9852F]">Billed to</p>
            <p className="mt-1 font-semibold">{o.customer_name}</p>
            <p className="text-[#4A514D]">{o.customer_phone}</p>
            <p className="whitespace-pre-line text-[#4A514D]">{o.address}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A9852F]">Payment</p>
            <p className="mt-1 capitalize">{o.payment_status} · {o.payment_method === "cod" ? "Cash" : o.payment_method.toUpperCase()}</p>
            {shop.pharmacist && !shop.pharmacist.startsWith("[") ? <p className="mt-2 text-[#4A514D]">Pharmacist: {shop.pharmacist}</p> : null}
          </div>
        </section>

        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr className="border-b border-[#0F4C3A] text-left text-[10.5px] uppercase tracking-[0.12em] text-[#6B716D]">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Item</th>
              {inv.showBatch && <th className="py-2 pr-2">Batch / Exp</th>}
              <th className="py-2 pr-2 text-right">Qty</th>
              {inv.showMrp && <th className="py-2 pr-2 text-right">MRP</th>}
              <th className="py-2 pr-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id} className="border-b border-[#F3ECDD] align-top">
                <td className="py-2 pr-2 text-[#6B716D]">{i + 1}</td>
                <td className="py-2 pr-2">
                  <span className="font-medium">{it.name}</span>
                  {it.rx ? <span className="ml-1 text-[10px] font-bold text-[#8b2525]">Rx</span> : null}
                  <span className="block text-[11px] text-[#6B716D]">{it.pack}</span>
                </td>
                {inv.showBatch && (
                  <td className="py-2 pr-2 text-[11.5px] text-[#4A514D]">
                    {it.allocations?.length ? it.allocations.map((a) => <span key={a.batch_id} className="block">{a.batch_no} · {a.expiry.slice(5, 7)}/{a.expiry.slice(2, 4)}</span>) : "—"}
                  </td>
                )}
                <td className="py-2 pr-2 text-right tabular-nums">{it.qty}</td>
                {inv.showMrp && <td className="py-2 pr-2 text-right tabular-nums text-[#6B716D]">{inr(it.mrp)}</td>}
                <td className="py-2 pr-2 text-right tabular-nums">{inr(it.price)}</td>
                <td className="py-2 text-right tabular-nums">{inr(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-sm text-[11.5px] leading-relaxed text-[#6B716D]">
            {inv.footer ? <p>{inv.footer}</p> : null}
            <p className="mt-2">Medicines are dispensed only against a valid prescription by a registered pharmacist.</p>
          </div>
          <dl className="grid min-w-[240px] grid-cols-[1fr_auto] gap-x-6 gap-y-1">
            <dt className="text-[#6B716D]">Subtotal</dt><dd className="text-right tabular-nums">{inr(o.subtotal)}</dd>
            {o.discount > 0 && (<><dt className="text-[#6B716D]">Discount{o.coupon_code ? ` (${o.coupon_code})` : ""}</dt><dd className="text-right tabular-nums">−{inr(o.discount)}</dd></>)}
            <dt className="text-[#6B716D]">Delivery</dt><dd className="text-right tabular-nums">{inr(o.delivery_charge)}</dd>
            {rate > 0 && (<><dt className="text-[#6B716D]">Taxable value</dt><dd className="text-right tabular-nums">{inr(taxable)}</dd>
            <dt className="text-[#6B716D]">CGST {rate / 2}%</dt><dd className="text-right tabular-nums">{inr(round2(tax / 2))}</dd>
            <dt className="text-[#6B716D]">SGST {rate / 2}%</dt><dd className="text-right tabular-nums">{inr(round2(tax - round2(tax / 2)))}</dd></>)}
            <div className="col-span-2 mt-1 flex justify-between border-t-2 border-[#0F4C3A] pt-2 font-serif text-[18px] text-[#0F4C3A]">
              <dt>Total</dt>
              <dd className="tabular-nums">{inr(o.total)}</dd>
            </div>
          </dl>
        </div>
        {rate > 0 && <p className="mt-2 text-right text-[10.5px] text-[#6B716D]">Prices are inclusive of GST.</p>}
        <footer className="mt-10 flex items-end justify-between border-t border-[#E9DFC9] pt-4 text-[11px] text-[#6B716D]">
          <span>Thank you for choosing {shop.name}.</span>
          <span className="text-right">
            <span className="mb-8 block" />
            Authorised signatory
          </span>
        </footer>
      </article>
    </div>
  );
}
