-- ════════════════════════════════════════════════════════════════════
--  A.D Pharma — base seed data (safe to re-run; skips rows that exist)
--  Products and prices are a SAMPLE catalogue: edit them in /admin.
--  The first Owner login is created with `npm run admin:create-owner`
--  (passwords are hashed in Node, never stored in SQL files).
-- ════════════════════════════════════════════════════════════════════

insert into categories (id, name, blurb, icon, sort_order) values
  ('prescription', 'Prescription Medicines', 'Dispensed against a valid Rx',        'prescription', 1),
  ('otc',          'OTC & Wellness',         'Vitamins, pain relief, daily care',   'capsule',      2),
  ('baby',         'Baby Care',              'Gentle essentials for little ones',   'baby',         3),
  ('diabetes',     'Diabetes Care',          'Strips, meters & monthly refills',    'glucose',      4),
  ('skin',         'Skin & Personal Care',   'Derma-trusted skin & hygiene',        'lotion',       5),
  ('ayurvedic',    'Ayurvedic',              'Classical formulations & herbs',      'mortar',       6),
  ('devices',      'Medical Devices',        'BP monitors, nebulisers & more',      'stethoscope',  7),
  ('firstaid',     'First Aid',              'Dressings, antiseptics, kits',        'firstaid',     8)
on conflict (id) do nothing;

insert into products (sku, name, brand, salt, category_id, pack, mrp, price, rx, art, low_stock_threshold, featured, description) values
  ('AMX-500',  'Amoxicillin 500 mg Capsules',  'Generic',       'Amoxicillin Trihydrate 500 mg',           'prescription', 'Strip of 10',  108,  92, true,  'capsule',     15, true,  'Broad-spectrum penicillin antibiotic. Prescription only.'),
  ('AZI-500',  'Azithromycin 500 mg Tablets',  'Generic',       'Azithromycin 500 mg',                     'prescription', 'Strip of 3',    89,  76, true,  'blister',     10, false, 'Macrolide antibiotic. Prescription only.'),
  ('MET-500',  'Metformin 500 mg Tablets',     'Generic',       'Metformin Hydrochloride 500 mg',          'diabetes',     'Strip of 20',   45,  38, true,  'blister',     20, true,  'First-line oral therapy for type 2 diabetes. Prescription only.'),
  ('AML-5',    'Amlodipine 5 mg Tablets',      'Generic',       'Amlodipine Besylate 5 mg',                'prescription', 'Strip of 15',   52,  44, true,  'blister',     15, false, 'Calcium-channel blocker for blood pressure. Prescription only.'),
  ('PCM-650',  'Paracetamol 650 mg Tablets',   'Generic',       'Paracetamol 650 mg',                      'otc',          'Strip of 15',   33,  29, false, 'blister',     30, true,  'For fever and mild to moderate pain.'),
  ('VTC-ZN',   'Vitamin C + Zinc Chewables',   'House Brand',   'Ascorbic Acid 500 mg, Zinc 10 mg',        'otc',          'Bottle of 60', 299, 245, false, 'capsule',     10, true,  'Daily immunity support, orange flavour.'),
  ('ORS-200',  'ORS Electrolyte Drink',        'Generic',       'WHO-formula oral rehydration salts',     'otc',          '200 ml',        40,  36, false, 'syrup',       24, false, 'Ready-to-drink electrolyte replenishment.'),
  ('HCS-100',  'Herbal Cough Syrup',           'Ayur Classic',  'Tulsi, Vasaka, Mulethi',                 'ayurvedic',    '100 ml',       115,  99, false, 'syrup',       12, true,  'Soothing herbal syrup for dry and wet cough.'),
  ('ASH-60',   'Ashwagandha Root Tablets',     'Ayur Classic',  'Withania somnifera root extract 500 mg', 'ayurvedic',    '60 tablets',   250, 199, false, 'mortar',       8, true,  'Traditional adaptogen for stress and vitality.'),
  ('GLS-50',   'Glucometer Test Strips',       'GlucoCheck',    '—',                                       'diabetes',     'Box of 50',    950, 799, false, 'glucose',      6, true,  'Compatible with GlucoCheck meters.'),
  ('CER-200',  'Ceramide Moisturising Lotion', 'DermaCalm',     'Ceramides, Glycerin, Niacinamide',        'skin',         '200 ml',       399, 345, false, 'lotion',       8, true,  'Fragrance-free barrier repair for dry skin.'),
  ('SUN-50',   'Sunscreen SPF 50 Gel',         'DermaCalm',     'Broad-spectrum UVA/UVB filters',          'skin',         '50 g',         499, 449, false, 'lotion',       8, false, 'Non-greasy, matte finish.'),
  ('FBT-250',  'Anti-Colic Feeding Bottle',    'LittleNest',    '—',                                       'baby',         '250 ml',       349, 279, false, 'baby',         5, true,  'BPA-free with anti-colic vent.'),
  ('BWP-72',   'Baby Wipes (Water-based)',     'LittleNest',    '99% water',                               'baby',         'Pack of 72',   199, 169, false, 'baby',        10, false, 'Gentle, fragrance-free wipes.'),
  ('THR-DG',   'Digital Thermometer',          'MediSure',      '—',                                       'devices',      '1 unit',       250, 189, false, 'thermometer',  5, true,  'Fast 10-second reading with fever alarm.'),
  ('STH-DH',   'Dual-Head Stethoscope',        'MediSure',      '—',                                       'devices',      '1 unit',      1150, 899, false, 'stethoscope',  3, false, 'Stainless steel dual-head chest piece.'),
  ('FAK-32',   'Home First-Aid Kit',           'MediSure',      '—',                                       'firstaid',     '32 pieces',    650, 499, false, 'firstaid',     4, true,  'Bandages, gauze, antiseptic wipes, tape and scissors.'),
  ('POV-100',  'Povidone-Iodine Solution 5%',  'Generic',       'Povidone-Iodine 5% w/v',                  'firstaid',     '100 ml',        95,  84, false, 'syrup',       10, false, 'Antiseptic for cuts and wounds.')
on conflict (sku) do nothing;

-- stock batches with staggered expiry dates (some expiring soon, some low)
insert into batches (product_id, batch_no, expiry_date, quantity)
select p.id, b.batch_no, current_date + b.days, b.qty
from (values
  ('AMX-500','AMX2401', 420, 60), ('AMX-500','AMX2312', 25, 8),
  ('AZI-500','AZI2402', 300, 6),
  ('MET-500','MET2403', 540, 140),
  ('AML-5','AML2401', 75, 40),
  ('PCM-650','PCM2404', 610, 220), ('PCM-650','PCM2311', 50, 30),
  ('VTC-ZN','VTC2402', 280, 18),
  ('ORS-200','ORS2405', 85, 48),
  ('HCS-100','HCS2401', 200, 9),
  ('ASH-60','ASH2403', 700, 24),
  ('GLS-50','GLS2402', 160, 4),
  ('CER-200','CER2401', 400, 22),
  ('SUN-50','SUN2402', 20, 12),
  ('FBT-250','FBT2401', 1500, 15),
  ('BWP-72','BWP2403', 365, 40),
  ('THR-DG','THR2401', 1800, 11),
  ('STH-DH','STH2401', 2500, 3),
  ('FAK-32','FAK2402', 900, 7),
  ('POV-100','POV2401', 58, 26)
) as b(sku, batch_no, days, qty)
join products p on p.sku = b.sku
on conflict (product_id, batch_no) do nothing;

insert into site_settings (key, value) values
('shop', '{
  "name": "A.D Pharma",
  "tagline": "Family Chemist & Druggist",
  "city": "[CITY]",
  "street": "[ADDRESS]",
  "region": "[STATE]",
  "postalCode": "[PIN]",
  "phoneDisplay": "[NUMBER]",
  "phoneE164": "+910000000000",
  "whatsapp": "910000000000",
  "email": "[EMAIL]",
  "timings": "[TIMINGS]",
  "openingHours": "Mo-Su 08:00-23:00",
  "drugLicence": "[DL NUMBER]",
  "gstin": "[GSTIN]",
  "pharmacist": "[PHARMACIST NAME, Reg. No.]",
  "deliveryArea": "[AREA]",
  "deliveryCharge": 30,
  "freeDeliveryAbove": 499,
  "lat": 0, "lng": 0,
  "instagram": "", "facebook": "", "google": ""
}'::jsonb),
('hero', '{
  "eyebrow": "Est. family chemist",
  "title": "Your Trusted *Family Chemist* in {city}",
  "subtitle": "Genuine medicines, honest advice from a qualified pharmacist, and quick home delivery. Send your prescription — we''ll take care of the rest."
}'::jsonb),
('offer', '{
  "active": true,
  "eyebrow": "This month",
  "title": "Free home delivery on orders above ₹499",
  "details": "Use code WELCOME10 for 10% off your first order.",
  "cta": "Claim on WhatsApp"
}'::jsonb),
('stats', '[
  {"value": 100, "suffix": "%", "label": "Genuine, sourced from authorised distributors"},
  {"value": 24, "suffix": "x7", "label": "WhatsApp order support"},
  {"value": 5000, "suffix": "+", "label": "Products in stock"},
  {"value": 45, "suffix": " min", "label": "Typical local delivery time"}
]'::jsonb),
('faqs', '[
  {"q": "Do you deliver medicines at home?", "a": "Yes. Send your list or prescription and we will confirm availability, price and delivery time on a call."},
  {"q": "Can I order prescription medicines online?", "a": "Yes, but only with a valid prescription from a registered medical practitioner. Our registered pharmacist verifies it before dispensing."},
  {"q": "How does ordering work?", "a": "Add items, enter your name, phone and address and place the order. We confirm on call or WhatsApp and deliver to your door."},
  {"q": "Are your medicines genuine?", "a": "We are a licensed pharmacy and source only from authorised distributors and manufacturers. Every bill carries our Drug Licence number and batch details."},
  {"q": "Which payment methods do you accept?", "a": "[PAYMENT MODES — e.g. Cash, UPI and cards on delivery]"}
]'::jsonb),
('invoice', '{
  "prefix": "INV",
  "footer": "Goods once sold will be taken back only as per pharmacy policy. Please check expiry before use.",
  "showBatch": true,
  "showMrp": true,
  "gstRate": 12
}'::jsonb)
on conflict (key) do nothing;

insert into coupons (code, description, type, value, min_order, max_discount, usage_limit, ends_at) values
  ('WELCOME10', '10% off your first order', 'percent', 10, 199, 150, 500, now() + interval '180 days'),
  ('FLAT50',    '₹50 off orders above ₹699', 'flat', 50, 699, null, null, now() + interval '60 days')
on conflict (code) do nothing;
