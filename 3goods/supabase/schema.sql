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
  status text default 'pending', -- pending | accepted | declined (D-075; was 'requested')
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

-- Optional exact position of an organisation (DECISIONS.md D-073), used to match OpenStreetMap facility pins on the
-- map to registered organisations by distance. NULL = only the province (`city`) is known. Added by supabase/seed-coverage.sql.
alter table organisations add column if not exists lat double precision;
alter table organisations add column if not exists lng double precision;

-- "This facility hasn't joined 3goods yet" interest form on the map (D-073). Insert-only for the public key: contact details
-- are written but cannot be read back with it (read them in the Supabase dashboard). Created by supabase/seed-coverage.sql.
create table if not exists facility_interests (
  id uuid primary key default gen_random_uuid(),
  osm_type text,
  osm_id text,
  facility_name text not null,
  facility_lat double precision,
  facility_lon double precision,
  contact_name text not null,
  contact text not null,
  locale text,
  created_at timestamptz not null default now()
);

-- Provinces (DECISIONS.md D-062): the 63 real provinces, replacing the old hard-coded 8-area list. `slug` is the
-- area id stored in organisations.city / items.area. The rows, the remap of the old 8 area ids and the
-- one-need-per-organisation-per-category index (D-064) are in supabase/migration-provinces.sql (run it in the
-- SQL Editor); `npm run db:seed` also upserts the provinces from src/data/provinces.js.
create table if not exists provinces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  map_key text not null unique,
  name text not null,
  name_vi text not null,
  region text,
  created_at timestamptz default now()
);

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
    'conversations','messages','updates','provinces'
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

-- === D-075: start_conversation (also in supabase/migration-start-conversation.sql) ===
-- to re-run (create or replace). To remove: drop function start_conversation(uuid, uuid, uuid, uuid, text, text);

create or replace function start_conversation(
  p_item_id uuid,
  p_org_id uuid,
  p_donor_id uuid,
  p_sender_id uuid,
  p_sender_role text,
  p_body text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_conversation conversations;
  v_message messages;
begin
  if p_body is null or btrim(p_body) = '' then
    raise exception 'message body required' using errcode = '22023';
  end if;

  -- Two people opening the same thread at once must not create two conversations.
  perform pg_advisory_xact_lock(hashtextextended(p_item_id::text || p_org_id::text || p_donor_id::text, 0));

  select * into v_conversation
    from conversations
    where item_id = p_item_id and org_id = p_org_id and donor_id = p_donor_id
    order by created_at
    limit 1;

  if not found then
    insert into conversations (item_id, org_id, donor_id)
      values (p_item_id, p_org_id, p_donor_id)
      returning * into v_conversation;
  end if;

  insert into messages (conversation_id, sender_id, sender_role, body, created_at)
    values (v_conversation.id, p_sender_id, p_sender_role, btrim(p_body), now())
    returning * into v_message;

  return jsonb_build_object('conversation', to_jsonb(v_conversation), 'message', to_jsonb(v_message));
end;
$$;-- 3goods — Supabase schema
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
  status text default 'pending', -- pending | accepted | declined (D-075; was 'requested')
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

-- Optional exact position of an organisation (DECISIONS.md D-073), used to match OpenStreetMap facility pins on the
-- map to registered organisations by distance. NULL = only the province (`city`) is known. Added by supabase/seed-coverage.sql.
alter table organisations add column if not exists lat double precision;
alter table organisations add column if not exists lng double precision;

-- "This facility hasn't joined 3goods yet" interest form on the map (D-073). Insert-only for the public key: contact details
-- are written but cannot be read back with it (read them in the Supabase dashboard). Created by supabase/seed-coverage.sql.
create table if not exists facility_interests (
  id uuid primary key default gen_random_uuid(),
  osm_type text,
  osm_id text,
  facility_name text not null,
  facility_lat double precision,
  facility_lon double precision,
  contact_name text not null,
  contact text not null,
  locale text,
  created_at timestamptz not null default now()
);

-- Provinces (DECISIONS.md D-062): the 63 real provinces, replacing the old hard-coded 8-area list. `slug` is the
-- area id stored in organisations.city / items.area. The rows, the remap of the old 8 area ids and the
-- one-need-per-organisation-per-category index (D-064) are in supabase/migration-provinces.sql (run it in the
-- SQL Editor); `npm run db:seed` also upserts the provinces from src/data/provinces.js.
create table if not exists provinces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  map_key text not null unique,
  name text not null,
  name_vi text not null,
  region text,
  created_at timestamptz default now()
);

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
    'conversations','messages','updates','provinces'
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

-- === D-075: start_conversation (also in supabase/migration-start-conversation.sql) ===
-- to re-run (create or replace). To remove: drop function start_conversation(uuid, uuid, uuid, uuid, text, text);

create or replace function start_conversation(
  p_item_id uuid,
  p_org_id uuid,
  p_donor_id uuid,
  p_sender_id uuid,
  p_sender_role text,
  p_body text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_conversation conversations;
  v_message messages;
begin
  if p_body is null or btrim(p_body) = '' then
    raise exception 'message body required' using errcode = '22023';
  end if;

  -- Two people opening the same thread at once must not create two conversations.
  perform pg_advisory_xact_lock(hashtextextended(p_item_id::text || p_org_id::text || p_donor_id::text, 0));

  select * into v_conversation
    from conversations
    where item_id = p_item_id and org_id = p_org_id and donor_id = p_donor_id
    order by created_at
    limit 1;

  if not found then
    insert into conversations (item_id, org_id, donor_id)
      values (p_item_id, p_org_id, p_donor_id)
      returning * into v_conversation;
  end if;

  insert into messages (conversation_id, sender_id, sender_role, body, created_at)
    values (v_conversation.id, p_sender_id, p_sender_role, btrim(p_body), now())
    returning * into v_message;

  return jsonb_build_object('conversation', to_jsonb(v_conversation), 'message', to_jsonb(v_message));
end;
$$;

-- === D-076: accept_request (also in supabase/migration-accept-request.sql; rules and error codes are explained there) ===
create or replace function accept_request(p_request_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_item_id uuid;
  v_item items;
  v_request requests;
begin
  select item_id into v_item_id from requests where id = p_request_id;
  if not found then
    raise exception 'requestNotFound';
  end if;

  select * into v_item from items where id = v_item_id for update;
  if not found then
    raise exception 'itemForRequestNotFound';
  end if;

  select * into v_request from requests where id = p_request_id for update;

  if v_request.status = 'accepted' then
    return jsonb_build_object('changed', false, 'request', to_jsonb(v_request), 'item', to_jsonb(v_item));
  end if;
  if v_request.status is distinct from 'pending' then
    raise exception 'requestNotPending';
  end if;
  if v_item.status is distinct from 'available' then
    raise exception 'itemAlreadyReserved';
  end if;

  update items set status = 'reserved', accepted_request_id = p_request_id
    where id = v_item.id
    returning * into v_item;

  update requests set status = 'accepted'
    where id = p_request_id
    returning * into v_request;

  update requests set status = 'declined'
    where item_id = v_item.id and status = 'pending' and id <> p_request_id;

  return jsonb_build_object('changed', true, 'request', to_jsonb(v_request), 'item', to_jsonb(v_item));
end;
$$;
