-- ════════════════════════════════════════════════════════════════════
--  A.D Pharma — database schema (Supabase / Postgres 15+)
--  Run in the Supabase SQL editor, or `npm run db:migrate`.
--
--  Security model
--  • Row Level Security is ENABLED on every table with NO policies, so the
--    public anon / authenticated API keys can read or write nothing.
--  • The Next.js server connects with the database connection string
--    (DATABASE_URL) and enforces staff roles on every action itself.
-- ════════════════════════════════════════════════════════════════════

do $$ begin
  create type staff_role     as enum ('owner','pharmacist','staff','delivery');
  create type order_status   as enum ('new','confirmed','packed','out_for_delivery','delivered','cancelled');
  create type payment_status as enum ('unpaid','paid','refunded');
  create type rx_status      as enum ('pending','approved','rejected');
  create type review_status  as enum ('pending','approved','hidden');
  create type discount_type  as enum ('percent','flat');
exception when duplicate_object then null; end $$;

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ───────────── Staff, sessions, rate limiting ─────────────
create table if not exists staff (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(name) between 1 and 80),
  email          text not null unique check (email = lower(email)),
  password_hash  text not null,
  role           staff_role not null default 'staff',
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  token_hash    text not null unique,
  staff_id      uuid not null references staff(id) on delete cascade,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_seen_at  timestamptz not null default now(),
  ip            text,
  user_agent    text
);
create index if not exists sessions_staff_idx on sessions(staff_id);

create table if not exists login_attempts (
  id          bigserial primary key,
  email       text not null,
  ip          text,
  success     boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on login_attempts(email, created_at desc);
create index if not exists login_attempts_ip_idx on login_attempts(ip, created_at desc);

create table if not exists rate_limits (
  key           text primary key,
  window_start  timestamptz not null,
  count         int not null
);

-- ───────────── Catalogue ─────────────
create table if not exists categories (
  id          text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name        text not null check (length(name) between 1 and 60),
  blurb       text not null default '' check (length(blurb) <= 120),
  icon        text not null default 'capsule',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists products (
  id                   uuid primary key default gen_random_uuid(),
  sku                  text not null unique check (sku ~ '^[A-Za-z0-9._-]{2,40}$'),
  name                 text not null check (length(name) between 2 and 120),
  brand                text not null default '' check (length(brand) <= 80),
  salt                 text not null default '' check (length(salt) <= 200),
  category_id          text not null references categories(id) on update cascade on delete restrict,
  pack                 text not null default '' check (length(pack) <= 60),
  mrp                  numeric(10,2) not null check (mrp >= 0),
  price                numeric(10,2) not null check (price >= 0),
  rx                   boolean not null default false,
  description          text not null default '' check (length(description) <= 2000),
  art                  text not null default 'blister',
  images               text[] not null default '{}',
  low_stock_threshold  int not null default 10 check (low_stock_threshold >= 0),
  active               boolean not null default true,
  featured             boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint price_not_above_mrp check (price <= mrp)
);
create index if not exists products_category_idx on products(category_id);

create table if not exists batches (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  batch_no     text not null check (length(batch_no) between 1 and 40),
  expiry_date  date not null,
  quantity     int not null check (quantity >= 0),
  created_at   timestamptz not null default now(),
  unique (product_id, batch_no)
);
create index if not exists batches_expiry_idx on batches(expiry_date);

-- ───────────── Customers ─────────────
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 80),
  phone       text not null unique check (phone ~ '^\+?[0-9]{8,15}$'),
  email       text check (email is null or length(email) <= 120),
  notes       text not null default '' check (length(notes) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete cascade,
  label        text not null default 'Home' check (length(label) <= 30),
  line         text not null check (length(line) between 3 and 300),
  created_at   timestamptz not null default now(),
  unique (customer_id, line)
);

-- ───────────── Coupons ─────────────
create table if not exists coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[A-Z0-9_-]{3,20}$'),
  description   text not null default '' check (length(description) <= 160),
  type          discount_type not null,
  value         numeric(10,2) not null check (value > 0),
  min_order     numeric(10,2) not null default 0 check (min_order >= 0),
  max_discount  numeric(10,2) check (max_discount is null or max_discount > 0),
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz,
  usage_limit   int check (usage_limit is null or usage_limit > 0),
  used_count    int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint percent_max_100 check (type <> 'percent' or value <= 100)
);

-- ───────────── Orders ─────────────
create sequence if not exists order_number_seq start 1001;

create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  number           text not null unique default ('AD-' || nextval('order_number_seq')),
  customer_id      uuid references customers(id) on delete set null,
  customer_name    text not null,
  customer_phone   text not null,
  address          text not null default '',
  status           order_status not null default 'new',
  payment_status   payment_status not null default 'unpaid',
  payment_method   text not null default 'cod',
  subtotal         numeric(10,2) not null default 0,
  discount         numeric(10,2) not null default 0,
  delivery_charge  numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  coupon_code      text,
  notes            text not null default '',
  source           text not null default 'website',
  stock_deducted   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_status_idx on orders(status, created_at desc);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_customer_idx on orders(customer_id);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  name         text not null,
  pack         text not null default '',
  rx           boolean not null default false,
  mrp          numeric(10,2) not null,
  price        numeric(10,2) not null,
  qty          int not null check (qty between 1 and 99),
  allocations  jsonb not null default '[]'   -- [{batch_id, batch_no, qty}] once stock is deducted
);
create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists order_items_product_idx on order_items(product_id);

create table if not exists order_events (
  id          bigserial primary key,
  order_id    uuid not null references orders(id) on delete cascade,
  status      order_status not null,
  staff_id    uuid references staff(id) on delete set null,
  staff_name  text,
  created_at  timestamptz not null default now()
);

-- ───────────── Prescriptions ─────────────
create table if not exists prescriptions (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references orders(id) on delete set null,
  customer_id     uuid references customers(id) on delete set null,
  customer_name   text not null default '',
  customer_phone  text not null default '',
  file_path       text not null,           -- key inside the PRIVATE "prescriptions" bucket
  file_type       text not null,
  file_size       int not null,
  status          rx_status not null default 'pending',
  reject_reason   text,
  notes           text not null default '',
  reviewed_by     uuid references staff(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists prescriptions_status_idx on prescriptions(status, created_at);
create index if not exists prescriptions_order_idx on prescriptions(order_id);

-- ───────────── Reviews ─────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 60),
  rating      smallint not null check (rating between 1 and 5),
  text        text not null check (length(text) between 5 and 1000),
  source      text not null default 'Website',
  status      review_status not null default 'pending',
  reply       text check (reply is null or length(reply) <= 1000),
  replied_by  uuid references staff(id) on delete set null,
  replied_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ───────────── Website content & settings (key → JSON) ─────────────
create table if not exists site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references staff(id) on delete set null
);

-- ───────────── Activity log ─────────────
create table if not exists activity_log (
  id          bigserial primary key,
  staff_id    uuid references staff(id) on delete set null,
  staff_name  text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  summary     text not null,
  details     jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists activity_created_idx on activity_log(created_at desc);

-- ───────────── updated_at triggers ─────────────
do $$ declare t text; begin
  foreach t in array array['staff','categories','products','customers','orders'] loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format('create trigger %I_touch before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- ───────────── Lock the tables away from the public API ─────────────
do $$ declare t text; begin
  foreach t in array array['staff','sessions','login_attempts','rate_limits','categories','products','batches','customers',
                           'addresses','coupons','orders','order_items','order_events','prescriptions','reviews',
                           'site_settings','activity_log'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ───────────── Storage buckets (Supabase only; skipped on plain Postgres) ─────────────
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('prescriptions', 'prescriptions', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
    on conflict (id) do update set public = false;
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('product-images', 'product-images', true, 3145728, array['image/jpeg','image/png','image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
