alter table public.jobs
  add column if not exists customer_lat double precision,
  add column if not exists customer_lng double precision;

create or replace function public.guard_tech_coordinates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.allow_tech_location', true) = 'on' then
    return new;
  end if;

  new.tech_lat := old.tech_lat;
  new.tech_lng := old.tech_lng;
  return new;
end;
$$;

drop trigger if exists jobs_guard_tech_coordinates on public.jobs;

create trigger jobs_guard_tech_coordinates
before update on public.jobs
for each row
execute function public.guard_tech_coordinates();

revoke all on function public.guard_tech_coordinates() from public, anon, authenticated;

create or replace function public.update_tech_location(
  job_id uuid,
  lat double precision,
  lng double precision,
  eta_minutes integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_tech_location', 'on', true);

  update public.jobs
  set
    tech_lat = lat,
    tech_lng = lng,
    eta_minutes = update_tech_location.eta_minutes
  where id = job_id
    and technician_id = auth.uid()
    and status in ('dispatched', 'out_for_delivery');

  if not found then
    raise exception 'Location update not allowed for this job';
  end if;
end;
$$;

revoke all on function public.update_tech_location(uuid, double precision, double precision, integer) from public, anon;
grant execute on function public.update_tech_location(uuid, double precision, double precision, integer) to authenticated;
