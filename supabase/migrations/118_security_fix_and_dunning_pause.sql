-- ============================================================================
-- 118: (a) domknięcie uprawnień po migracjach 116/117,
--      (b) mechanizm wstrzymania windykacji dla kont w trakcie wyjaśniania.
--
-- Powód (a): Supabase security advisor po 116/117 pokazał, że trzy funkcje
-- SECURITY DEFINER są wystawione przez PostgREST szerzej, niż powinny:
--   * gdpr_delete_lead   — grant dla `authenticated`, a funkcja omija RLS.
--     KAŻDY zalogowany użytkownik (także uczeń) mógł skasować dowolnego leada
--     wołając /rest/v1/rpc/gdpr_delete_lead z podanym UUID. To była realna
--     dziura wprowadzona migracją 116.
--   * has_marketing_consent / match_student_by_contact — pozwalały sondować
--     bazę pytaniami „czy ten e-mail ma zgodę marketingową?" oraz „jaki
--     student_id kryje się za tym adresem?".
--
-- Powód (b): 2026-08-01 cron `monthly-billing` naliczył abonament 91 kontom
-- bez ani jednej lekcji w systemie (31 486 zł), a poniedziałkowy cron
-- `reminders` uruchomił wobec nich windykację. Do czasu rozstrzygnięcia, kto
-- z nich jest prawdziwym uczniem, te konta muszą wypaść z obu automatów.
-- ============================================================================


-- ── (a1) gdpr_delete_lead: wewnętrzna kontrola roli ─────────────────────────
-- Wzorzec bramkowania jak w admin_create_student/admin_create_hr: funkcja
-- zostaje SECURITY DEFINER (musi omijać RLS, żeby posprzątać kaskadowo), ale
-- sama sprawdza rolę wywołującego. Warunek `auth.uid() is not null` przepuszcza
-- wywołania z serwera (service_role, brak sesji), a blokuje zalogowanych
-- nie-adminów.
create or replace function public.gdpr_delete_lead(p_lead_id uuid, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_email text;
  v_phone text;
begin
  if auth.uid() is not null and coalesce(public.current_user_role()::text, '') <> 'admin' then
    raise exception 'Brak uprawnień: usuwanie danych leada jest zastrzeżone dla roli admin.'
      using errcode = 'insufficient_privilege';
  end if;

  select email_norm, phone_norm into v_email, v_phone
    from public.leads where id = p_lead_id;

  if not found then
    return false;
  end if;

  insert into public.gdpr_erasures (lead_id, email_sha256, phone_sha256, performed_by, note)
  values (
    p_lead_id,
    case when v_email is not null then encode(digest(v_email, 'sha256'), 'hex') end,
    case when v_phone is not null then encode(digest(v_phone, 'sha256'), 'hex') end,
    auth.uid(),
    p_note
  );

  delete from public.leads where id = p_lead_id;
  return true;
end $$;


-- ── (a2) Widok liczy zgodę inline, bez wywoływania funkcji ──────────────────
-- Widok ma security_invoker = true, więc funkcje w nim użyte wymagają EXECUTE
-- od pytającego. Przeniesienie logiki zgody do LATERAL pozwala odebrać
-- `authenticated` prawo wykonania helperów bez psucia panelu: widok czyta
-- tabele, które RLS i tak otwiera wyłącznie adminowi.
create or replace view public.v_reactivation_candidates
with (security_invoker = true) as
select
  s.id                                            as student_id,
  coalesce(s.full_name, p.full_name)              as imie_ucznia,
  s.guardian_name                                 as imie_rodzica,
  p.email,
  p.phone,
  s.age                                           as wiek,
  s.status                                        as status_ucznia,
  s.joined_at,
  s.signup_source,

  st.ostatnia_lekcja,
  st.lekcji_odbytych,
  coalesce(st.lekcji_przyszlych, 0)               as lekcji_przyszlych,
  case when st.ostatnia_lekcja is null then null
       else (current_date - st.ostatnia_lekcja::date)
  end                                             as dni_od_ostatniej_lekcji,

  h.started_on                                    as nauka_od,
  h.ended_on                                      as nauka_do,
  h.final_level                                   as poziom_koncowy,
  h.teacher_name                                  as lektor,

  coalesce(tx.saldo, 0)                           as saldo,
  coalesce(tx.saldo, 0) < 0                       as ma_zaleglosc,

  zg.zgoda                                        as zgoda_marketingowa,

  (
        s.deleted_at is null
    and coalesce(st.lekcji_przyszlych, 0) = 0
    and coalesce(nullif(btrim(coalesce(p.email, '')), ''), nullif(btrim(coalesce(p.phone, '')), '')) is not null
    and coalesce(tx.saldo, 0) >= 0
    and zg.zgoda
  )                                               as kwalifikuje_sie
from public.students s
join public.profiles p on p.id = s.profile_id
left join lateral (
  select
    max(l.starts_at) filter (where l.starts_at <  now())                    as ostatnia_lekcja,
    count(*)         filter (where l.starts_at <  now())                    as lekcji_odbytych,
    count(*)         filter (where l.starts_at >= now() and not l.is_event) as lekcji_przyszlych
  from public.lessons l
  where l.student_id = s.id
) st on true
left join lateral (
  select sum(case when t.type = 'charge' then -t.amount else t.amount end) as saldo
  from public.transactions t
  where t.student_id = s.id
) tx on true
left join lateral (
  select h2.started_on, h2.ended_on, h2.final_level, h2.teacher_name
  from public.student_learning_history h2
  where h2.student_id = s.id
  order by h2.ended_on desc nulls last, h2.created_at desc
  limit 1
) h on true
left join lateral (
  select coalesce(
    -- najświeższe oświadczenie z rejestru (udzielenie albo wycofanie)
    (select mc.granted
       from public.marketing_consents mc
      where (mc.email_norm is not null and mc.email_norm = nullif(lower(btrim(coalesce(p.email, ''))), ''))
         or (mc.phone_norm is not null and mc.phone_norm = nullif(right(regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'), 9), ''))
      order by mc.granted_at desc, mc.created_at desc
      limit 1),
    -- w braku rejestru: zgoda z formularza www
    (select true
       from public.consent_acceptances ca
       join public.consent_types ct on ct.code = 'marketing'
      where nullif(lower(btrim(coalesce(ca.email, ''))), '') = nullif(lower(btrim(coalesce(p.email, ''))), '')
        and (ca.consents ->> ct.id::text)::boolean is true
      limit 1),
    false
  ) as zgoda
) zg on true
where s.deleted_at is null;

comment on view public.v_reactivation_candidates is
  'Kandydaci do kampanii reaktywacyjnej wraz ze statusem zgody, aktywnością i saldem. Próg bezczynności ustala panel, nie widok.';


-- ── (a3) Odebranie helperów zalogowanym ─────────────────────────────────────
revoke execute on function public.has_marketing_consent(text, text)    from authenticated;
revoke execute on function public.match_student_by_contact(text, text) from authenticated;


-- ── (b) Wstrzymanie windykacji dla wybranych kont ───────────────────────────
-- Osobna kolumna, a nie nadpisanie `status`: status jest przedmiotem przeglądu
-- i nie chcemy go zamazać mechanizmem technicznym.
alter table public.students
  add column if not exists dunning_paused_until timestamptz,
  add column if not exists dunning_pause_reason text;

comment on column public.students.dunning_paused_until is
  'Do tej chwili uczeń jest pomijany przez windykację i naliczanie abonamentu. Ustawiane przy wyjaśnianiu spornych obciążeń.';

create index if not exists students_dunning_pause_idx
  on public.students (dunning_paused_until)
  where dunning_paused_until is not null;


-- Migawka stanu sprzed przeglądu — żeby dało się wrócić do punktu wyjścia
-- niezależnie od tego, co przegląd ustali.
create table if not exists public.billing_incident_snapshot (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  incident        text not null,
  student_id      uuid not null references public.students(id) on delete cascade,
  status_before   public.student_status not null,
  saldo_before    numeric(10,2) not null,
  note            text,
  unique (incident, student_id)
);

alter table public.billing_incident_snapshot enable row level security;

drop policy if exists "Admin czyta migawkę incydentu rozliczeniowego" on public.billing_incident_snapshot;
create policy "Admin czyta migawkę incydentu rozliczeniowego" on public.billing_incident_snapshot
  for select using (public.current_user_role() = 'admin');

revoke all on public.billing_incident_snapshot from anon, public;
grant select on public.billing_incident_snapshot to authenticated;


-- ── (c) Zastosowanie do incydentu z 2026-08-01 ──────────────────────────────
-- Definicja dotkniętych: obciążeni „Abonament sierpień 2026" dnia 2026-08-01
-- i NIEMAJĄCY ani jednej lekcji w systemie (przeszłej ani przyszłej).
-- Uruchomione jednorazowo 2026-08-03; objęło 91 kont na łączną kwotę 31 486 zł.
with dotknieci as (
  select s.id, s.status,
         coalesce((select sum(case when t.type = 'charge' then -t.amount else t.amount end)
                     from public.transactions t where t.student_id = s.id), 0) as saldo
  from public.students s
  where s.deleted_at is null
    and not exists (select 1 from public.lessons l where l.student_id = s.id)
    and exists (
      select 1 from public.transactions t
       where t.student_id = s.id
         and t.type = 'charge'
         and t.description ilike 'Abonament sierpie%'
         and t.created_at::date = date '2026-08-01'
    )
)
insert into public.billing_incident_snapshot (incident, student_id, status_before, saldo_before, note)
select 'abonament_sierpien_2026', d.id, d.status, d.saldo,
       'Naliczenie 2026-08-01 dla konta bez żadnej lekcji w systemie; do przeglądu.'
from dotknieci d
on conflict (incident, student_id) do nothing;

update public.students s
   set dunning_paused_until = timestamptz '2026-09-30 23:59:59+02',
       dunning_pause_reason = 'Incydent naliczenia 2026-08-01 — konto bez lekcji w systemie, w trakcie przeglądu.'
  from public.billing_incident_snapshot b
 where b.student_id = s.id and b.incident = 'abonament_sierpien_2026';

-- Zawór działający NATYCHMIAST, bez czekania na wdrożenie zmian w cronach:
-- obecny kod filtruje status in ('active','trial','overdue'), więc 'paused'
-- wypada zarówno z windykacji, jak i z naliczania 1 września.
-- Stan sprzed zmiany siedzi w billing_incident_snapshot.status_before.
update public.students s
   set status = 'paused'
  from public.billing_incident_snapshot b
 where b.student_id = s.id
   and b.incident = 'abonament_sierpien_2026'
   and s.status <> 'paused';
