-- 3goods — Supabase schema
--
-- This documents the ACTUAL live production schema (project ref
-- hizvkpspyglvpgictqif) as reconciled in DECISIONS.md D-042 — it does not
-- match what an earlier session's schema.sql proposed and this repo's code
-- briefly assumed. Column names are snake_case, every id is a real
-- Postgres `uuid` (default gen_random_uuid()), and `categories`/`users` are
-- real tables rather than static in-app lists. Run this once in a fresh
-- Supabase project's SQL Editor to reproduce the live shape from scratch;
-- on the existing live project only the "additive" section below still
-- needs to be applied (everything above it already exists there).
--
-- No real auth in this prototype (see docs/DECISIONS.md D-004), so every
-- table gets a permissive RLS policy for the anon (public) role — anyone
-- with the anon key can read/write everything, same trust level the old
-- localStorage engine had (zero). Do not reuse this schema for anything
-- handling real user data without adding real auth + tighter policies first.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  description text,
  verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  org_id uuid references organisations (id),
  created_at timestamptz default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references categories (id),
  condition text,
  description text,
  area text,
  delivery_option text,
  collection_windows text,
  status text default 'available',
  donor_id uuid references users (id),
  image_base64 text,
  created_at timestamptz default now()
);

create table if not exists needs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations (id),
  category_id uuid references categories (id),
  quantity integer,
  unit text,
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items (id),
  org_id uuid references organisations (id),
  status text default 'requested',
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items (id),
  org_id uuid references organisations (id),
  donor_id uuid references users (id),
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations (id),
  sender_id uuid references users (id),
  body text,
  image_base64 text,
  created_at timestamptz default now()
);

-- === Additive migration (DECISIONS.md D-042) ===
-- Restores fields the live schema above didn't carry over but that were
-- real, working 3goods features — done as ALTERs so they're safe to run
-- against the existing production project without touching seeded data.

alter table organisations add column if not exists name_vi text;
alter table organisations add column if not exists description_vi text;
alter table organisations add column if not exists is_demo boolean not null default true;
alter table organisations add column if not exists past_received_item_ids uuid[] not null default '{}';

alter table items add column if not exists title_vi text;
alter table items add column if not exists need_tags text[] not null default '{}';
alter table items add column if not exists notes text;
alter table items add column if not exists accepted_request_id uuid references requests (id);
-- Optional 2nd category (e.g. a children's book can list under both Books
-- and Children Items) — see DECISIONS.md D-047. Deliberately a single
-- nullable FK, not an array/join table: items support at most one extra
-- category, never unbounded many. NULL means "just the one category" (the
-- overwhelming common case) — nothing else in the app treats this as
-- required.
alter table items add column if not exists secondary_category_id uuid references categories (id);

alter table needs add column if not exists tag text;

-- Quantity + unit on items (DECISIONS.md D-052). `needs` already had both
-- columns in the original live schema; `items` did not. Apply in the
-- Supabase SQL Editor (the anon key cannot run DDL). The app only writes
-- these two columns when a donor actually enters a quantity, so listings
-- without one keep working before this has been run.
alter table items add column if not exists quantity integer;
alter table items add column if not exists unit text;

alter table conversations add column if not exists request_id uuid references requests (id);

alter table messages add column if not exists system_code text;
alter table messages add column if not exists params jsonb not null default '{}';
alter table messages add column if not exists sender_role text;

-- Notifications / "Updates" feed — brand new table, no existing feature to migrate.
create table if not exists updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  params jsonb not null default '{}',
  link_item_id uuid references items (id),
  link_request_id uuid references requests (id),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Permissive RLS: enable it (Supabase requires this before policies apply),
-- then grant anon + authenticated full read/write on every table.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'categories','organisations','users','items','needs','requests',
    'conversations','messages','updates'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    -- CREATE POLICY has no IF NOT EXISTS clause in Postgres — drop first so
    -- re-running this script stays idempotent instead of erroring.
    execute format('drop policy if exists "public read/write" on %I', t);
    execute format(
      'create policy "public read/write" on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
