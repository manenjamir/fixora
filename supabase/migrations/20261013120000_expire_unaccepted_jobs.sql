alter table public.jobs drop constraint if exists jobs_status_check;

alter table public.jobs
add constraint jobs_status_check check (
  status in (
    'requested',
    'dispatched',
    'inspecting',
    'quoted',
    'accepted',
    'expired',
    'declined_by_customer',
    'declined_by_technician',
    'on_site_repaired',
    'warehouse',
    'out_for_delivery',
    'delivered'
  )
);

create or replace function public.expire_unaccepted_jobs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs
  set status = 'expired'
  where status = 'requested'
    and technician_id is null
    and preferred_at is not null
    and preferred_at <= now();
end;
$$;

revoke all on function public.expire_unaccepted_jobs() from public, anon;
grant execute on function public.expire_unaccepted_jobs() to authenticated;

create or replace function public.accept_job(job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_technician() then
    raise exception 'Only a technician can accept a job';
  end if;

  perform public.expire_unaccepted_jobs();

  update public.jobs
  set
    technician_id = auth.uid(),
    status = 'dispatched'
  where id = job_id
    and status = 'requested'
    and technician_id is null
    and (preferred_at is null or preferred_at > now());

  if not found then
    raise exception 'This job is no longer available';
  end if;
end;
$$;

revoke all on function public.accept_job(uuid) from public, anon;
grant execute on function public.accept_job(uuid) to authenticated;

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
        'expired',
        'declined_by_customer',
        'declined_by_technician',
        'on_site_repaired',
        'delivered'
      )
    )
  )
);

do $$
begin
  perform cron.unschedule('expire-unaccepted-jobs');
exception
  when undefined_function then null;
  when others then null;
end $$;

do $$
begin
  perform cron.schedule(
    'expire-unaccepted-jobs',
    '* * * * *',
    $cron$select public.expire_unaccepted_jobs()$cron$
  );
exception
  when undefined_function then null;
  when others then null;
end $$;
