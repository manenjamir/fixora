-- Applied to Supabase project App (feestipyirkvemprvvrw)

alter table public.profiles
  add column if not exists specializations text[] not null default '{}';

alter table public.profiles
  drop constraint if exists profiles_specializations_check;

alter table public.profiles
  add constraint profiles_specializations_check
  check (specializations <@ array['electronics', 'appliances', 'installation']::text[]);

alter table public.jobs
  add column if not exists repair_location text;

alter table public.jobs
  drop constraint if exists jobs_repair_location_check;

alter table public.jobs
  add constraint jobs_repair_location_check
  check (repair_location is null or repair_location in ('on_site', 'warehouse'));

alter table public.jobs
  add column if not exists completed_at timestamptz;

alter table public.jobs
  add column if not exists completion_media_path text;

alter table public.jobs
  add column if not exists completion_media_type text;

alter table public.jobs
  drop constraint if exists jobs_completion_media_type_check;

alter table public.jobs
  add constraint jobs_completion_media_type_check
  check (completion_media_type is null or completion_media_type in ('image', 'video'));

drop policy if exists job_media_insert_tech on storage.objects;
create policy job_media_insert_tech
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'job-media'
  and public.is_technician()
);

drop policy if exists job_media_update_tech on storage.objects;
create policy job_media_update_tech
on storage.objects for update
to authenticated
using (
  bucket_id = 'job-media'
  and public.is_technician()
)
with check (
  bucket_id = 'job-media'
  and public.is_technician()
);
