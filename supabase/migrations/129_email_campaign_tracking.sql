-- ============================================================================
-- 123: Śledzenie otwarć i kliknięć w kampaniach mailowych.
--
-- Token jest losowy i przypisany do pary (kampania, uczeń). Nie zawiera
-- adresu e-mail ani identyfikatora ucznia, więc wyciek linku nie ujawnia,
-- czyj to mail.
-- ============================================================================
alter table public.email_campaign_log
  add column if not exists track_token   uuid not null default gen_random_uuid(),
  add column if not exists opened_at     timestamptz,
  add column if not exists open_count    integer not null default 0,
  add column if not exists clicked_at    timestamptz,
  add column if not exists click_count   integer not null default 0,
  add column if not exists last_click_url text,
  add column if not exists user_agent    text;

comment on column public.email_campaign_log.track_token is
  'Losowy identyfikator w linkach śledzących. Nie koduje danych osobowych.';
comment on column public.email_campaign_log.opened_at is
  'Pierwsze otwarcie. UWAGA na interpretację: Apple Mail Privacy Protection pobiera obrazki z wyprzedzeniem, więc część otwarć to prefetch, a klienci z wyłączonymi obrazkami nie odnotują otwarcia wcale.';

create unique index if not exists email_campaign_log_token_uniq
  on public.email_campaign_log (track_token);

create or replace function public.record_email_open(p_token uuid, p_user_agent text default null)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.email_campaign_log
     set opened_at  = coalesce(opened_at, now()),
         open_count = open_count + 1,
         user_agent = coalesce(user_agent, p_user_agent)
   where track_token = p_token;
  return found;
end $$;

create or replace function public.record_email_click(p_token uuid, p_url text, p_user_agent text default null)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.email_campaign_log
     set clicked_at     = coalesce(clicked_at, now()),
         click_count    = click_count + 1,
         last_click_url = p_url,
         -- Kliknięcie dowodzi otwarcia, nawet gdy piksel nie zadziałał.
         opened_at      = coalesce(opened_at, now()),
         user_agent     = coalesce(user_agent, p_user_agent)
   where track_token = p_token;
  return found;
end $$;

revoke execute on function public.record_email_open(uuid, text)        from public, anon, authenticated;
revoke execute on function public.record_email_click(uuid, text, text) from public, anon, authenticated;
grant  execute on function public.record_email_open(uuid, text)        to service_role;
grant  execute on function public.record_email_click(uuid, text, text) to service_role;

create or replace view public.v_email_campaign_stats
with (security_invoker = true) as
select
  campaign,
  count(*)                                   as wyslanych,
  count(*) filter (where opened_at is not null)  as otwartych,
  count(*) filter (where clicked_at is not null) as klikajacych,
  count(*) filter (where error is not null)      as bledow,
  round(100.0 * count(*) filter (where opened_at is not null)  / nullif(count(*), 0), 1) as pct_otwarc,
  round(100.0 * count(*) filter (where clicked_at is not null) / nullif(count(*), 0), 1) as pct_klikniec,
  min(created_at) as pierwsza_wysylka,
  max(created_at) as ostatnia_wysylka
from public.email_campaign_log
group by campaign;

revoke all  on public.v_email_campaign_stats from anon, public;
grant select on public.v_email_campaign_stats to authenticated;
