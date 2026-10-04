-- Applied to Supabase project App (feestipyirkvemprvvrw)

alter table public.jobs
  add column if not exists customer_issue text,
  add column if not exists device_brand text;
