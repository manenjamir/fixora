alter table public.jobs drop constraint if exists jobs_status_check;

update public.jobs
set status = 'declined_by_customer'
where status = 'declined';

alter table public.jobs
add constraint jobs_status_check check (
  status in (
    'requested',
    'dispatched',
    'inspecting',
    'quoted',
    'accepted',
    'declined_by_customer',
    'declined_by_technician',
    'on_site_repaired',
    'warehouse',
    'out_for_delivery',
    'delivered'
  )
);

alter table public.jobs
add column if not exists estimated_completion text not null default '1-2 days';

alter table public.jobs drop column if exists loaner_requested;
alter table public.jobs drop column if exists loaner_type;

drop policy if exists jobs_select_customer_or_tech on public.jobs;

create policy jobs_select_customer_or_tech
on public.jobs for select
to authenticated
using (
  customer_id = auth.uid()
  or (
    public.is_technician()
    and (
      technician_id = auth.uid()
      or status not in (
        'declined_by_customer',
        'declined_by_technician',
        'on_site_repaired',
        'delivered'
      )
    )
  )
);
