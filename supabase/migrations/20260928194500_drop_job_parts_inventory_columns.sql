-- Applied to Supabase project App (feestipyirkvemprvvrw)

alter table public.jobs
  drop column if exists parts_checked,
  drop column if exists parts_in_stock;
