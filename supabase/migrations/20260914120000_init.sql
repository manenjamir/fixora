-- Applied to Supabase project App (feestipyirkvemprvvrw)

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'tech')),
  full_name text,
  phone text unique,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  technician_id uuid references public.profiles (id) on delete set null,
  category text not null,
  place_tag text not null,
  address text not null,
  media_path text,
  media_type text check (media_type in ('image', 'video')),
  status text not null default 'requested' check (
    status in (
      'requested',
      'dispatched',
      'inspecting',
      'quoted',
      'accepted',
      'declined',
      'on_site_repaired',
      'warehouse',
      'delivered'
    )
  ),
  diagnosis text,
  price_a1 numeric,
  price_a2 numeric,
  price_a3 numeric,
  chosen_tier text check (chosen_tier in ('a1', 'a2', 'a3')),
  loaner_requested boolean not null default false,
  loaner_type text check (loaner_type in ('phone', 'laptop')),
  parts_in_stock boolean not null default true,
  parts_checked boolean not null default false,
  tech_lat double precision,
  tech_lng double precision,
  eta_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_customer_id_idx on public.jobs (customer_id);
create index jobs_technician_id_idx on public.jobs (technician_id);
create index jobs_status_idx on public.jobs (status);

create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

create or replace function public.is_technician()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'tech'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
begin
  selected_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
  if selected_role not in ('customer', 'tech') then
    selected_role := 'customer';
  end if;

  insert into public.profiles (id, role, phone, full_name)
  values (
    new.id,
    selected_role,
    new.phone,
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

create policy profiles_select_own_or_tech
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_technician());

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy jobs_select_customer_or_tech
on public.jobs for select
to authenticated
using (
  customer_id = auth.uid()
  or (
    public.is_technician()
    and (
      technician_id = auth.uid()
      or status not in ('declined', 'on_site_repaired', 'delivered')
    )
  )
);

create policy jobs_insert_customer
on public.jobs for insert
to authenticated
with check (
  customer_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'customer'
  )
);

create policy jobs_update_customer
on public.jobs for update
to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

create policy jobs_update_tech
on public.jobs for update
to authenticated
using (public.is_technician())
with check (public.is_technician());

insert into storage.buckets (id, name, public)
values ('job-media', 'job-media', false)
on conflict (id) do nothing;

create policy job_media_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'job-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy job_media_select_own_or_tech
on storage.objects for select
to authenticated
using (
  bucket_id = 'job-media'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_technician()
  )
);

create policy job_media_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'job-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

alter publication supabase_realtime add table public.jobs;
