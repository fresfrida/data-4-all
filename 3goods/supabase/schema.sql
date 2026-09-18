-- 3goods — Supabase schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- No real auth in this prototype (see docs/DECISIONS.md D-004), so every
-- table gets a permissive RLS policy for the anon (public) role — anyone
-- with the anon key can read/write everything, same trust level as the old
-- localStorage engine had (zero). Do not reuse this schema for anything
-- handling real user data without adding real auth + tighter policies first.

create table if not exists items (
  id text primary key,
  "donorId" text not null,
  "donorName" text not null,
  title text not null,
  "titleVi" text,
  category text not null,
  "needTags" text[] not null default '{}',
  condition text default '',
  "areaId" text not null,
  description text default '',
  "deliveryOption" text not null,
  "collectionWindows" text[] not null default '{}',
  notes text default '',
  "photoPaths" text[] not null default '{}',
  status text not null default 'available',
  "acceptedRequestId" text,
  "createdAt" timestamptz not null default now()
);

create table if not exists needs (
  id text primary key,
  "organisationId" text not null,
  category text not null,
  tag text not null,
  priority boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists organisations (
  id text primary key,
  name jsonb not null,
  mission jsonb not null,
  "areaId" text not null,
  verified boolean not null default false,
  "isDemo" boolean not null default true,
  "pastReceivedItemIds" text[] not null default '{}'
);

create table if not exists requests (
  id text primary key,
  "itemId" text not null,
  "organisationId" text not null,
  status text not null default 'requested',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  "requestId" text,
  "donorId" text not null,
  "organisationId" text not null
);

create table if not exists messages (
  id text primary key,
  "conversationId" text not null,
  "senderId" text not null,
  "senderRole" text not null,
  text text,
  "systemCode" text,
  params jsonb not null default '{}',
  "createdAt" timestamptz not null default now()
);

create table if not exists updates (
  id text primary key,
  "userId" text not null,
  type text not null,
  params jsonb not null default '{}',
  "linkItemId" text,
  "linkRequestId" text,
  read boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- Permissive RLS: enable it (Supabase requires this before policies apply),
-- then grant anon + authenticated full read/write on every table.
do $$
declare
  t text;
begin
  for t in select unnest(array['items','needs','organisations','requests','conversations','messages','updates'])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy if not exists "public read/write" on %I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Storage bucket for donation photos (D-008 superseded — see DECISIONS.md).
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy if not exists "public read item-photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'item-photos');

create policy if not exists "public upload item-photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'item-photos');
