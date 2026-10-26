-- Klima Servis — Supabase schema
-- Run once in Supabase > SQL Editor. Safe to re-run (idempotent where possible).
-- Single-owner app: every row carries owner_id and RLS limits each user to their own rows.

create extension if not exists pgcrypto;

-- ───────────────────────── settings (one row per user)
create table if not exists public.settings (
  owner_id        uuid primary key default auth.uid() references auth.users on delete cascade,
  business_name   text not null default '',
  business_phone  text not null default '',
  technician_name text not null default '',
  default_interval_months int not null default 12,
  remind_window_days      int not null default 30,   -- "Bakımı gelenler" list shows units due within N days
  message_template text not null default
    'Merhaba {ad}, klimanızın yıllık bakım zamanı geldi ({tarih}). Uygun olduğunuz bir gün yazarsanız randevu verelim. {isletme}',
  tasks   text[] not null default array['Filtre temizliği','İç ünite temizliği','Dış ünite temizliği','Gaz basıncı kontrolü','Gaz dolumu','Drenaj temizliği','Kumanda kontrolü','Dezenfeksiyon'],
  parts   text[] not null default array['Kapasitör','Fan motoru','Elektronik kart','Sensör','R32 gaz','R410A gaz','Kumanda','Drenaj hortumu'],
  faults  jsonb  not null default '[{"code":"E1","title":"Gaz kaçağı"},{"code":"F3","title":"Kompresör arızası"},{"code":"H6","title":"Fan motoru"}]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── customers
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users on delete cascade,
  name          text not null,
  phone         text not null default '',
  district      text not null default '',         -- mahalle
  address       text not null default '',
  location_note text not null default '',         -- "Migros'un arkası, mavi bina, 2. kat"
  map_link      text not null default '',
  lat           double precision,
  lng           double precision,
  note          text not null default '',         -- shown on every visit ("Köpek var, önce ara")
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists customers_owner_idx on public.customers(owner_id);

-- ───────────────────────── AC units
create table if not exists public.units (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users on delete cascade,
  customer_id      uuid not null references public.customers on delete cascade,
  room             text not null default '',      -- Salon, Yatak odası, Dükkan...
  brand            text not null default '',
  model            text not null default '',
  btu              int,
  serial_number    text not null default '',
  install_date     date,
  warranty_until   date,
  status           text not null default 'active' check (status in ('active','removed','replaced')),
  interval_months  int,                           -- null = no reminders for this unit
  last_service_date date,
  next_due_date    date,
  last_reminded_at timestamptz,
  photos           text[] not null default '{}',  -- storage paths
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists units_owner_idx on public.units(owner_id);
create index if not exists units_customer_idx on public.units(customer_id);
create index if not exists units_due_idx on public.units(owner_id, next_due_date);

-- ───────────────────────── visits (planned appointments and completed service records)
create table if not exists public.visits (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users on delete cascade,
  customer_id  uuid not null references public.customers on delete cascade,
  unit_id      uuid references public.units on delete set null,
  status       text not null default 'done' check (status in ('planned','done','cancelled')),
  date         date not null,
  time         text,                               -- '09:30' or null
  kind         text not null default 'bakim' check (kind in ('bakim','ariza','montaj','kontrol')),
  complaint    text not null default '',
  tasks        text[] not null default '{}',
  faults       text[] not null default '{}',
  parts        text[] not null default '{}',
  note         text not null default '',
  photos       text[] not null default '{}',
  technician   text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists visits_owner_date_idx on public.visits(owner_id, date);
create index if not exists visits_customer_idx on public.visits(customer_id);

-- ───────────────────────── updated_at triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['settings','customers','units','visits'] loop
    execute format('drop trigger if exists %1$s_touch on public.%1$s', t);
    execute format('create trigger %1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ───────────────────────── row level security
alter table public.settings  enable row level security;
alter table public.customers enable row level security;
alter table public.units     enable row level security;
alter table public.visits    enable row level security;

do $$ declare t text; begin
  foreach t in array array['settings','customers','units','visits'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- ───────────────────────── photo storage (private bucket, one folder per user)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "own photos read"   on storage.objects;
drop policy if exists "own photos write"  on storage.objects;
drop policy if exists "own photos delete" on storage.objects;
create policy "own photos read"   on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos write"  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
