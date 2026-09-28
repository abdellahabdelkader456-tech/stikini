-- stikini Supabase schema
-- Run this entire file once in Supabase -> SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  type text not null default 'client' check (type in ('client', 'owner')),
  salon_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  salon_id text not null,
  salon_name text not null,
  services jsonb not null default '[]'::jsonb,
  barber_name text not null,
  date date not null,
  time text not null,
  client_name text not null,
  phone text not null,
  email text not null default '',
  notes text not null default '',
  total_price numeric not null default 0,
  discount numeric not null default 0,
  promo_code text,
  status text not null default 'مؤكد' check (status in ('مؤكد', 'ملغى', 'مكتمل')),
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  salon_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, salon_id)
);

create unique index if not exists bookings_active_slot_unique
  on public.bookings (salon_id, barber_name, date, time)
  where status = 'مؤكد';

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_salon_id_idx on public.bookings(salon_id);
create index if not exists bookings_date_time_idx on public.bookings(date, time);

-- Create/update a profile automatically whenever Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'type' = 'owner' then 'owner' else 'client' end
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    type = excluded.type;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;

-- Profiles: users can read/update only their own account profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Bookings: a customer can read and cancel their own bookings.
drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own
on public.bookings for select
to authenticated
using (user_id = auth.uid());

-- Salon owners can read every booking belonging to their salon.
drop policy if exists bookings_select_owner_salon on public.bookings;
create policy bookings_select_owner_salon
on public.bookings for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.type = 'owner'
      and p.salon_id = bookings.salon_id
  )
);

-- A signed-in user can create a booking for their own account.
drop policy if exists bookings_insert_own on public.bookings;
create policy bookings_insert_own
on public.bookings for insert
to authenticated
with check (user_id = auth.uid());

-- Customers may only change their own booking. The application uses this to cancel it.
drop policy if exists bookings_update_own on public.bookings;
create policy bookings_update_own
on public.bookings for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Salon owners may change the status of bookings in their salon.
drop policy if exists bookings_update_owner_salon on public.bookings;
create policy bookings_update_owner_salon
on public.bookings for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.type = 'owner'
      and p.salon_id = bookings.salon_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.type = 'owner'
      and p.salon_id = bookings.salon_id
  )
);

-- Favorites: each user owns only their own favorite rows.
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own
on public.favorites for select
to authenticated
using (user_id = auth.uid());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own
on public.favorites for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own
on public.favorites for delete
to authenticated
using (user_id = auth.uid());

-- Public upcoming list used by Dashboard and BookingPage.
-- It intentionally excludes customer name, phone, email and private notes.
drop view if exists public.public_upcoming_bookings;
create view public.public_upcoming_bookings as
select
  id,
  code,
  salon_id,
  salon_name,
  services,
  barber_name,
  date,
  time,
  total_price,
  discount,
  promo_code,
  status,
  created_at
from public.bookings
where status = 'مؤكد'
  and date >= current_date;

revoke all on public.public_upcoming_bookings from public, anon;
grant select on public.public_upcoming_bookings to authenticated;
