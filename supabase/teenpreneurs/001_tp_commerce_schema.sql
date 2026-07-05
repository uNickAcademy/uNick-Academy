-- Teenpreneurs Supabase project (teenpreneurs-website / dtbeumqzgpsjtpbixmcn).
-- ALREADY APPLIED on 2026-07-05 as migration `tp_commerce_schema` — kept in
-- the repo for reference and disaster recovery. The pre-existing
-- waitlist_signups table (full_name, email, age, language) is reused as-is.
--
-- Product catalogue + prices live in src/lib/teenpreneurs/products.ts;
-- order rows snapshot what was actually sold, so history survives price changes.

create table tp_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  customer_name text,
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  status text not null default 'paid' check (status in ('paid','failed','cancelled','refunded')),
  amount_total_cents integer not null,
  currency text not null,
  shipping_address jsonb,
  fulfilment_status text not null default 'not_required'
    check (fulfilment_status in ('not_required','pending','shipped')),
  shipped_at timestamptz,
  locale text not null default 'en'
);

create table tp_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references tp_orders(id) on delete cascade,
  variant_id text not null,          -- e.g. 'journal-physical', 'shameless-digital'
  product_name text not null,        -- snapshot at time of sale
  quantity integer not null check (quantity > 0),
  unit_amount_cents integer not null,
  is_digital boolean not null default false
);

create table tp_download_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_item_id uuid not null references tp_order_items(id) on delete cascade,
  token text not null unique,
  storage_path text not null,        -- object path in the private 'tp-downloads' bucket
  expires_at timestamptz not null,
  download_count integer not null default 0,
  max_downloads integer not null default 5
);

create table tp_enrolments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_name text not null,
  parent_name text,
  email text not null,
  age_track text not null check (age_track in ('13-15','16-19')),
  time_slot text not null,
  stripe_session_id text not null unique,
  status text not null default 'paid' check (status in ('paid','refunded')),
  amount_cents integer not null,
  currency text not null,
  locale text not null default 'en'
);

create table tp_event_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_slug text not null,
  name text not null,
  email text not null,
  parent_consent boolean not null default false,
  locale text not null default 'en',
  reminded_at timestamptz
);
create unique index tp_event_registrations_unique
  on tp_event_registrations (event_slug, lower(email));

create index tp_orders_email_idx on tp_orders (lower(email));
create index tp_order_items_order_idx on tp_order_items (order_id);
create index tp_download_links_item_idx on tp_download_links (order_item_id);

-- RLS: default deny. No policies on purpose — only the service role
-- (used by the site's serverless routes) can read or write these tables.
alter table tp_orders enable row level security;
alter table tp_order_items enable row level security;
alter table tp_download_links enable row level security;
alter table tp_enrolments enable row level security;
alter table tp_event_registrations enable row level security;

-- Private bucket for digital products; files are served only via
-- short-lived signed URLs created by the download route.
insert into storage.buckets (id, name, public)
values ('tp-downloads', 'tp-downloads', false)
on conflict (id) do nothing;
