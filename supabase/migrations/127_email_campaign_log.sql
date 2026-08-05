-- ============================================================================
-- 122: Log wysyłek kampanii mailowych.
-- Przy wysyłce do żywych skrzynek nie ma „cofnij", a ponowne uruchomienie
-- endpointu po błędzie w połowie nie może wysłać nikomu tego samego dwa razy.
-- Wpis powstaje PRZED wysyłką; unikalność (kampania, uczeń) jest bramką.
-- ============================================================================
create table if not exists public.email_campaign_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  campaign    text not null,
  student_id  uuid not null references public.students(id) on delete cascade,
  email       text not null,
  error       text,
  unique (campaign, student_id)
);

create index if not exists email_campaign_log_campaign_idx
  on public.email_campaign_log (campaign, created_at desc);

alter table public.email_campaign_log enable row level security;

drop policy if exists "Admin czyta log kampanii" on public.email_campaign_log;
create policy "Admin czyta log kampanii" on public.email_campaign_log
  for select using (public.current_user_role() = 'admin');

revoke all   on public.email_campaign_log from anon, public;
grant select on public.email_campaign_log to authenticated;
