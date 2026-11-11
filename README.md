# A.D Pharma — website

A classic-apothecary pharmacy website built with **Next.js 15 (App Router) + Tailwind CSS + Framer Motion**.
Every icon is a hand-made inline SVG that draws itself on scroll and then runs its own subtle idle loop.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Make it yours (edit these files)

| What | File |
| --- | --- |
| Shop name, address, phone, WhatsApp, timings, DL no., GSTIN, delivery area, map coordinates, social links, stats | `src/lib/site.ts` |
| Products, prices, categories, which items need a prescription (`rx: true`), product photos | `src/data/catalog.ts` |
| FAQ answers, real customer reviews | `src/data/content.ts` |

Placeholders in square brackets, like `[ADDRESS]`, still need real values. **Check before going live:**
- `whatsapp` and `phoneE164` in `site.ts` are dummy numbers. Order links won't work until you set them.
- The **stats** in `site.ts`, the **offer text** in `src/components/sections/Offers.tsx` and the **sample products and prices** in `catalog.ts` are examples. Replace them with your real figures.
- **Reviews:** the slider shows clearly marked empty slots until you add real reviews to `reviews` in `content.ts`.
- Set `url` in `site.ts` to your domain for the canonical URL, sitemap and schema.

## How it works

- **Icons:** `src/components/icons/IconBase.tsx` (draw-in system) and `src/components/icons/index.tsx` (all icons). Idle loops are CSS keyframes in `src/app/globals.css` and animate only `transform`/`opacity`.
- **Orders:** `src/lib/order.tsx` holds the order (saved in the browser). `src/lib/whatsapp.ts` builds the pre-filled WhatsApp message.
- **Prescription rule:** an item marked `rx: true` can't be added, and an order containing one can't be sent, until a prescription photo is added. The photo stays on the customer's device; they attach it in the WhatsApp chat.
- **Reduced motion:** with `prefers-reduced-motion`, the loops, intro and parallax are turned off and only simple fades remain.
- **SEO:** metadata, Open Graph, `Pharmacy` LocalBusiness and FAQPage JSON-LD, `robots.txt` and `sitemap.xml`.
