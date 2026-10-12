alter table public.jobs
  add column if not exists preferred_at timestamptz,
  add column if not exists technician_notes text;

alter table public.profiles
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists avatar_path text;

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

  update public.jobs
  set
    technician_id = auth.uid(),
    status = 'dispatched'
  where id = job_id
    and status = 'requested'
    and technician_id is null;

  if not found then
    raise exception 'This job is no longer available';
  end if;
end;
$$;

revoke all on function public.accept_job(uuid) from public, anon;
grant execute on function public.accept_job(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', false)
on conflict (id) do nothing;

drop policy if exists profile_avatars_insert_own on storage.objects;
create policy profile_avatars_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists profile_avatars_select_own on storage.objects;
create policy profile_avatars_select_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists profile_avatars_update_own on storage.objects;
create policy profile_avatars_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
