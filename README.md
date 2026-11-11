# A.D Pharma — website & admin panel

A classic-apothecary pharmacy website with a full staff admin panel at **`/admin`**.
Built with **Next.js 15 (App Router) + Tailwind CSS + Framer Motion**, backed by **Supabase (Postgres + Storage)**.
Every icon on the site and in the admin is a hand-made inline SVG that draws itself in and then runs its own subtle loop.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local          # then set DATABASE_URL (local Postgres or Supabase)
npm run db:setup                    # create tables + seed catalogue, content, coupons
npm run admin:create-owner          # create the first Owner login (prompts for email + password)
npm run db:demo                     # optional: demo customers/orders/prescriptions to explore the admin
npm run dev                         # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

Without `DATABASE_URL` the public website still runs on the static sample data in `src/lib/site.ts` and `src/data/*`
(orders then simply hand over to WhatsApp), but the admin panel needs the database.

## Deploying with Supabase

1. Create a Supabase project.
2. **SQL editor** → run `supabase/migrations/0001_schema.sql`, then `supabase/seed.sql`.
   This also creates the storage buckets: `prescriptions` (**private**) and `product-images` (public).
   (Or run `npm run db:setup` locally with `DATABASE_URL` pointing at Supabase.)
3. Set environment variables on your host (e.g. Vercel):
   - `DATABASE_URL` — *Project Settings → Database → Connection string → Transaction pooler* (port 6543)
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — *Project Settings → API* (server-side only; never expose it)
4. Create the Owner: `DATABASE_URL=… npm run admin:create-owner`.
5. Sign in at `/admin`, then fill in **Settings** (shop name, address, Drug Licence No., GSTIN, WhatsApp number, delivery charges)
   and **Website Content**. Replace the sample products in **Products** (or bulk-import a spreadsheet).

**Before going live:** the seeded products/prices, the “Why choose us” figures and the offer text are samples — replace them with your real data. `npm run db:demo` data is clearly marked “(demo)”; don't run it on production.

---

## Admin modules

| Module | What it does |
|---|---|
| Dashboard | Count-up cards (today's orders & sales, pending Rx, low stock, expiring ≤ 60 days), animated sales chart (7 d / 30 d / 12 m), latest orders, top sellers |
| Orders | Status tabs (New → Confirmed → Packed → Out for Delivery → Delivered / Cancelled), one-tap next status, swipe actions on mobile, detail with items, batches, customer, address, attached prescriptions, payment, notes, timeline, pre-filled WhatsApp status messages, printable invoice (shop name, D.L. No., GSTIN, GST split) |
| Prescriptions | Private queue with zoom/pan/rotate viewer, approve / reject with reason, link to an order |
| Products & Inventory | Add/edit/delete, brand, salt, category, MRP / price / discount, images, Rx toggle, batches with expiry & quantity, per-product low-stock threshold, expiry alerts (30/60/90 days), CSV/Excel import & export |
| Categories | Add / edit, choose an animated icon, drag-and-drop ordering |
| Customers | List with total spend, order history, saved addresses, staff notes |
| Offers & Coupons | % or flat, minimum order, max discount, validity dates, usage limit; live status |
| Website Content | Hero text (with live preview), offer banner, featured products, FAQ (drag to reorder), figures, timings & contact |
| Reviews | Approve, hide, reply (reply shows on the website), delete |
| Reports | Sales, best sellers, stock value, expiry — any date range, export to Excel or PDF |
| Staff & Roles | Owner / Pharmacist / Staff / Delivery, permissions matrix, password resets, activity log |
| Settings | Shop details, licence & GST, WhatsApp, delivery charge & free-delivery threshold, invoice format |

Changes made in the admin appear on the public website **immediately** (the storefront cache is invalidated on every save).

### How an order flows
1. Customer adds items → checkout (name, phone, address, optional coupon). Prices, discounts and delivery are **recalculated on the server**; stock is checked.
2. Prescription-only items require a prescription upload; it's stored in the private bucket and linked to the order.
3. The admin bell shakes, a soft chime plays and the badge pulses (polling every 15 s).
4. A pharmacist approves the prescription. **An order with Rx items cannot be confirmed until a linked prescription is approved** (enforced on the server).
5. Confirming deducts stock first-expiry-first-out from unexpired batches (recorded per item, printed on the invoice). Cancelling puts it back.

### Roles

| | Owner | Pharmacist | Staff | Delivery |
|---|:-:|:-:|:-:|:-:|
| Dashboard, Orders | ✓ | ✓ | ✓ | packed / out / delivered only |
| Prescriptions (view) | ✓ | ✓ | – | – |
| Approve / reject prescriptions | ✓ | ✓ | – | – |
| Products, Categories, Customers | ✓ | ✓ | ✓ | – |
| Coupons, Website Content | ✓ | – | ✓ | – |
| Reviews | ✓ | ✓ | ✓ | – |
| Reports | ✓ | ✓ | – | – |
| Staff & Roles, Settings, Activity log | ✓ | – | – | – |

The matrix lives in `src/lib/permissions.ts` and is checked in every page, server action and API route.

---

## Security

- **Passwords:** scrypt (per-user salt, N=32768). Minimum 10 characters with letters and a number.
- **Sessions:** random 256-bit token in an `httpOnly`, `SameSite=Lax` (and `Secure` in production) cookie; only its SHA-256 hash is stored. 12-hour absolute lifetime, signed out after 2 hours idle. Deactivating a user, changing their role or resetting their password ends their sessions immediately.
- **Login rate limiting:** 5 failed attempts per email (or 20 per IP) lock sign-in for 15 minutes; timing is equalised for unknown emails.
- **Authorisation on the server:** every server action, page and API route calls `requireStaff(module, capability)`. Hidden menu items are only a convenience.
- **Database:** Row Level Security is enabled on every table with no policies, so Supabase's public API keys can read nothing. The app connects with the database connection string from the server only.
- **Prescriptions:** private bucket; streamed only through `/admin/api/rx/:id` to signed-in staff (not Delivery), with `no-store` and a locked-down CSP. File types are verified from the file's bytes (JPG/PNG/WebP/PDF, max 5 MB).
- **Input:** all input is validated with Zod and stripped of control characters; SQL is always parameterised; spreadsheet exports neutralise formula injection; JSON-LD is escaped.
- **Public forms:** honeypot field + Postgres-backed rate limits on orders, prescription uploads, reviews and coupon checks.
- **Deletes** always go through a confirmation dialog (typed confirmation for products, customers and staff).
- **Activity log:** who did what, when, and from which IP — logins, status changes, approvals, price edits, imports/exports, settings, staff changes.
- Admin responses send `X-Frame-Options: DENY`, `Cache-Control: no-store` and `noindex`.

**Why not Supabase Auth?** Staff accounts, roles, session expiry and rate limiting are implemented in the app's own tables so every rule is enforced in one place on the server and nothing is exposed to the browser through Supabase's public keys. Supabase still provides the Postgres database and file storage.

---

## Project map

```
supabase/migrations/0001_schema.sql   tables, enums, RLS lock-down, storage buckets
supabase/seed.sql                     categories, sample catalogue + batches, site content, coupons
scripts/db.mjs                        migrate · seed · setup · demo · create-owner
src/app/(site)/                       public website (+ actions.ts: checkout, Rx upload, reviews, coupons)
src/app/admin/                        admin: login, (panel)/<module>, invoice, api/ (poll, rx files, exports)
src/lib/server/                       db, auth, storage, validation, rate limiting, storefront, admin queries
src/lib/permissions.ts                roles → modules / capabilities
src/components/icons/                 animated SVG icon system (site + admin)
src/components/admin/                 shell, data list, chart, toasts, dialogs, form controls
```

## Notes & limits

- New-order alerts use 15-second polling (no websocket needed). Browsers only allow the chime after you've clicked somewhere in the admin; mute/unmute it from the bell menu.
- WhatsApp buttons open WhatsApp with a pre-filled message; sending is still done by a person.
- PDF reports print amounts as “Rs.” because the built-in PDF fonts have no ₹ glyph. Invoices are printed from the browser (“Print / Save PDF”) and show ₹.
- Dark mode is available in the admin; the public site is light only.
- `prefers-reduced-motion` turns off icon loops, parallax and the intro everywhere, leaving simple fades.
