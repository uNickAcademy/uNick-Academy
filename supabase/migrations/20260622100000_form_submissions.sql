create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  name text not null,
  email text not null,
  phone text,
  audience text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.form_submissions enable row level security;

create policy "Service role can insert form submissions"
  on public.form_submissions for insert
  to service_role
  with check (true);

create policy "Service role can read form submissions"
  on public.form_submissions for select
  to service_role
  using (true);
