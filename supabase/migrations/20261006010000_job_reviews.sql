create table public.job_reviews (
  job_id uuid primary key references public.jobs (id) on delete cascade,
  customer_id uuid not null references public.profiles (id),
  technician_id uuid not null references public.profiles (id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.job_reviews enable row level security;

create policy job_reviews_select_parties
on public.job_reviews for select
to authenticated
using (customer_id = auth.uid() or technician_id = auth.uid());

create policy job_reviews_insert_own_completed
on public.job_reviews for insert
to authenticated
with check (
  customer_id = auth.uid()
  and exists (
    select 1
    from public.jobs
    where jobs.id = job_id
      and jobs.customer_id = auth.uid()
      and jobs.technician_id = technician_id
      and jobs.status in ('on_site_repaired', 'delivered')
  )
);

grant select, insert on public.job_reviews to authenticated;
