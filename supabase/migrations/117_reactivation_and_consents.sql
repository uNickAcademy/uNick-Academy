-- ============================================================================
-- 117: Agent Odzyskiwacz — rejestr zgód marketingowych, historia nauki
--      (miejsce na dane ze starego systemu) i kampanie reaktywacyjne.
--
-- Kontekst decyzji (stan bazy na 2026-08-03):
--
--  * W `consent_acceptances` są DWIE zgody marketingowe na 145 uczniów —
--    tabela powstała później niż większość kont. Zgody z papieru i starego
--    systemu trzeba dać się zaimportować, stąd `marketing_consents` z polem
--    na treść klauzuli, datę i źródło (art. 7 ust. 1 RODO: trzeba umieć
--    WYKAZAĆ zgodę, nie tylko ją mieć).
--
--  * Brak zgody = brak wysyłki. Egzekwuje to WYZWALACZ, nie kod aplikacji —
--    dzięki temu żadna ścieżka (panel, skrypt, service_role) tego nie obejdzie.
--
--  * `student_learning_history` jest dziś PUSTA i to jest w porządku. System
--    ma historię lekcji dopiero od 2026-06-15, a 88 kandydatów do reaktywacji
--    ma zero lekcji, `teacher_id = NULL` i `level = 'A1'` (wartość domyślna,
--    nie realny poziom). Tabela czeka na eksport ze starego systemu; do tego
--    czasu personalizacja opiera się na imieniu ucznia i imieniu rodzica.
--    Widok niżej czyta historię, jeśli jest — bez przebudowy czegokolwiek.
-- ============================================================================


-- ── 1. Kod zgody marketingowej w consent_types ──────────────────────────────
-- Dotąd jedynym uchwytem była etykieta po polsku. Wiązanie logiki z tekstem
-- widocznym w UI jest kruche — dokładamy stabilny kod. Zmiana addytywna.
alter table public.consent_types
  add column if not exists code text;

create unique index if not exists consent_types_code_uniq
  on public.consent_types (code) where code is not null;

update public.consent_types
   set code = 'marketing'
 where code is null
   and label ilike '%marketingow%';

update public.consent_types
   set code = 'regulamin'
 where code is null
   and (label ilike '%regulamin%' or label ilike '%polityki prywatno%');

update public.consent_types
   set code = 'wizerunek'
 where code is null
   and label ilike '%wizerunk%';


-- ── 2. Typy ─────────────────────────────────────────────────────────────────
do $$ begin
  create type public.consent_source as enum (
    'paper', 'legacy_import', 'web_form', 'phone', 'agent'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.campaign_status as enum ('draft', 'review', 'running', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.candidate_status as enum (
    'pending', 'approved', 'skipped', 'sent', 'failed', 'replied'
  );
exception when duplicate_object then null; end $$;


-- ── 3. marketing_consents ───────────────────────────────────────────────────
-- Jeden wiersz = jedno oświadczenie woli (udzielenie ALBO wycofanie).
-- Historii nie nadpisujemy — obowiązuje najświeższy wpis dla danego kontaktu.
create table if not exists public.marketing_consents (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  student_id    uuid references public.students(id) on delete cascade,
  lead_id       uuid references public.leads(id)    on delete cascade,

  full_name     text,
  email         text,
  phone         text,
  email_norm    text generated always as (
                  nullif(lower(btrim(coalesce(email, ''))), '')
                ) stored,
  phone_norm    text generated always as (
                  nullif(right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 9), '')
                ) stored,

  -- false = wycofanie zgody. Wycofania NIE kasujemy — musi zostać ślad.
  granted       boolean not null default true,
  granted_at    timestamptz not null,
  -- Dosłowna treść klauzuli. Przy imporcie z papieru: treść z formularza,
  -- który podpisał rodzic.
  clause_text   text not null,
  source        public.consent_source not null,

  import_batch  text,
  imported_by   uuid references public.profiles(id) on delete set null,
  note          text,

  constraint marketing_consents_kontakt_wymagany
    check (coalesce(email, '') <> '' or coalesce(phone, '') <> ''),
  constraint marketing_consents_klauzula_niepusta
    check (btrim(clause_text) <> '')
);

comment on table public.marketing_consents is
  'Rejestr zgód marketingowych ze wszystkich źródeł (papier, stary system, formularz www). Obowiązuje najświeższy wpis per kontakt.';

create index if not exists marketing_consents_email_idx   on public.marketing_consents (email_norm) where email_norm is not null;
create index if not exists marketing_consents_phone_idx   on public.marketing_consents (phone_norm) where phone_norm is not null;
create index if not exists marketing_consents_student_idx on public.marketing_consents (student_id);
create index if not exists marketing_consents_batch_idx   on public.marketing_consents (import_batch, created_at desc);


-- ── 4. Sprawdzanie zgody ────────────────────────────────────────────────────
-- Dwa źródła prawdy: rejestr importowany (wyżej) i zgody z formularzy www
-- zapisane w consent_acceptances.consents (mapa {consent_type_id: true}).
-- Zgoda „jest", jeśli którekolwiek źródło ją potwierdza i nie została wycofana.
create or replace function public.has_marketing_consent(p_email text, p_phone text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  with kontakt as (
    select
      nullif(lower(btrim(coalesce(p_email, ''))), '')                               as e,
      nullif(right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 9), '') as t
  ),
  -- Najświeższe oświadczenie z rejestru: udzielenie albo wycofanie.
  rejestr as (
    select mc.granted
      from public.marketing_consents mc, kontakt k
     where (k.e is not null and mc.email_norm = k.e)
        or (k.t is not null and mc.phone_norm = k.t)
     order by mc.granted_at desc, mc.created_at desc
     limit 1
  ),
  formularz as (
    select exists (
      select 1
        from public.consent_acceptances ca
        cross join kontakt k
       where k.e is not null
         and nullif(lower(btrim(coalesce(ca.email, ''))), '') = k.e
         and exists (
           select 1 from public.consent_types ct
            where ct.code = 'marketing'
              and (ca.consents ->> ct.id::text)::boolean is true
         )
    ) as ok
  )
  select case
           -- Wycofanie w rejestrze jest nadrzędne wobec starszej zgody z formularza.
           when (select granted from rejestr) is not null then (select granted from rejestr)
           else coalesce((select ok from formularz), false)
         end
$$;

comment on function public.has_marketing_consent(text, text) is
  'TRUE, jeśli kontakt ma ważną zgodę marketingową. Najświeższy wpis w marketing_consents ma pierwszeństwo przed consent_acceptances (obsługa wycofania zgody).';

revoke execute on function public.has_marketing_consent(text, text) from public, anon;
grant  execute on function public.has_marketing_consent(text, text) to authenticated, service_role;


-- Dopasowanie kontaktu z CSV do istniejącego ucznia — używane przy imporcie
-- zgód, żeby wpis od razu wiązał się z kartoteką.
create or replace function public.match_student_by_contact(p_email text, p_phone text)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  with kontakt as (
    select
      nullif(lower(btrim(coalesce(p_email, ''))), '')                               as e,
      nullif(right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 9), '') as t
  )
  select s.id
    from public.students s
    join public.profiles p on p.id = s.profile_id
    cross join kontakt k
   where s.deleted_at is null
     and (
       (k.e is not null and nullif(lower(btrim(coalesce(p.email, ''))), '') = k.e)
       or
       (k.t is not null and nullif(right(regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'), 9), '') = k.t)
     )
   order by s.joined_at
   limit 1
$$;

revoke execute on function public.match_student_by_contact(text, text) from public, anon;
grant  execute on function public.match_student_by_contact(text, text) to authenticated, service_role;


-- ── 5. student_learning_history ─────────────────────────────────────────────
-- Miejsce na dane ze starego systemu. Osobna tabela, nie kolumny na
-- `students`, bo: (1) uczeń mógł uczyć się w kilku okresach; (2) lektora
-- trzymamy jako TEKST — osoby, która uczyła trzy lata temu, może już nie być
-- w tabeli `teachers`, a imię w wiadomości ma się pojawić mimo to.
create table if not exists public.student_learning_history (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  student_id    uuid not null references public.students(id) on delete cascade,

  started_on    date,
  ended_on      date,
  final_level   public.language_level,
  -- Imię lektora do personalizacji wiadomości; teacher_id tylko jeśli uda się
  -- dopasować do obecnej kadry.
  teacher_name  text,
  teacher_id    uuid references public.teachers(id) on delete set null,
  lessons_count int,
  format        public.lesson_format,
  note          text,
  source        text not null default 'legacy_import',

  constraint slh_okres_sensowny
    check (started_on is null or ended_on is null or ended_on >= started_on)
);

comment on table public.student_learning_history is
  'Historia nauki sprzed uruchomienia systemu (import ze starego systemu). Zasila personalizację Agenta Odzyskiwacza. Dziś pusta — czeka na eksport.';

create index if not exists slh_student_idx on public.student_learning_history (student_id, ended_on desc);


-- ── 6. Kampanie reaktywacyjne ───────────────────────────────────────────────
create table if not exists public.reactivation_campaigns (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  name          text not null,
  status        public.campaign_status not null default 'draft',
  channel       public.lead_channel not null default 'email',
  -- Limit dzienny. Domyślnie 30 — nie dlatego, że kanał tego wymaga (e-mail
  -- zniesie więcej), tylko dlatego, że tyle odpowiedzi da się obsłużyć.
  daily_limit   smallint not null default 30,
  -- Klauzula pokazana odbiorcy w tej kampanii — do rozliczalności.
  clause_text   text,
  created_by    uuid references public.profiles(id) on delete set null,
  note          text,

  constraint reactivation_campaigns_limit_sensowny check (daily_limit between 1 and 500),
  constraint reactivation_campaigns_nazwa_niepusta check (btrim(name) <> '')
);

drop trigger if exists set_reactivation_campaigns_updated_at on public.reactivation_campaigns;
create trigger set_reactivation_campaigns_updated_at
  before update on public.reactivation_campaigns
  for each row execute procedure public.set_updated_at();


create table if not exists public.reactivation_candidates (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  campaign_id        uuid not null references public.reactivation_campaigns(id) on delete cascade,
  student_id         uuid not null references public.students(id) on delete cascade,

  -- Kontakt zamrożony w chwili generowania listy — żeby audyt pokazywał, na
  -- jaki adres poszła wiadomość, nawet jeśli kartoteka później się zmieni.
  email              text,
  phone              text,

  generated_message  text,
  edited_message     text,
  -- To, co faktycznie idzie do wysyłki.
  final_message      text generated always as (
                       coalesce(nullif(btrim(coalesce(edited_message, '')), ''), generated_message)
                     ) stored,

  status             public.candidate_status not null default 'pending',
  -- Migawka zgody z chwili generowania. NIE jest podstawą do wysyłki —
  -- wyzwalacz niżej sprawdza zgodę na nowo. Służy do pokazania w panelu,
  -- dlaczego kandydat jest zablokowany.
  consent_ok         boolean not null default false,

  approved_by        uuid references public.profiles(id) on delete set null,
  approved_at        timestamptz,
  sent_at            timestamptz,
  replied_at         timestamptz,
  -- Lead utworzony, gdy odbiorca odpowie (wpada w pipeline Łowcy, source='reactivation').
  lead_id            uuid references public.leads(id) on delete set null,
  error              text,

  unique (campaign_id, student_id)
);

comment on table public.reactivation_candidates is
  'Lista do RĘCZNEGO przeglądu. Nic nie wychodzi automatycznie — wysyłkę odblokowuje dopiero zatwierdzenie przez człowieka i potwierdzona zgoda marketingowa.';

create index if not exists reactivation_candidates_campaign_idx
  on public.reactivation_candidates (campaign_id, status);
create index if not exists reactivation_candidates_sent_idx
  on public.reactivation_candidates (sent_at desc) where sent_at is not null;

drop trigger if exists set_reactivation_candidates_updated_at on public.reactivation_candidates;
create trigger set_reactivation_candidates_updated_at
  before update on public.reactivation_candidates
  for each row execute procedure public.set_updated_at();


-- ── 7. Twarda blokada wysyłki bez zgody ─────────────────────────────────────
-- Sprawdzenie w bazie, nie w aplikacji: panel, skrypt migracyjny i
-- service_role przechodzą przez tę samą bramkę. `consent_ok` jest tylko
-- migawką dla UI — tutaj pytamy o stan bieżący.
create or replace function public.tg_reactivation_wymaga_zgody()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status in ('approved', 'sent')
     and (tg_op = 'INSERT' or new.status is distinct from old.status)
  then
    if not public.has_marketing_consent(new.email, new.phone) then
      raise exception
        'Brak zapisanej zgody marketingowej dla kandydata % — wysyłka zablokowana (RODO).', new.id
        using errcode = 'check_violation',
              hint = 'Zaimportuj zgodę w /admin/odzyskiwanie → Import zgód (CSV) albo pomiń kandydata.';
    end if;
  end if;

  if new.status = 'approved' and new.approved_at is null then
    new.approved_at := now();
  end if;
  if new.status = 'sent' and new.sent_at is null then
    new.sent_at := now();
  end if;

  return new;
end $$;

drop trigger if exists reactivation_candidates_wymaga_zgody on public.reactivation_candidates;
create trigger reactivation_candidates_wymaga_zgody
  before insert or update on public.reactivation_candidates
  for each row execute procedure public.tg_reactivation_wymaga_zgody();

revoke execute on function public.tg_reactivation_wymaga_zgody() from public, anon, authenticated;


-- ── 8. Widok kandydatów do reaktywacji ──────────────────────────────────────
-- Widok NIE filtruje twardo po „3 miesiącach bezczynności" — system ma
-- historię lekcji dopiero od 2026-06-15, więc taki próg byłby fikcją.
-- Zamiast tego wystawia surowe liczby, a próg wybiera panel.
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

  -- Aktywność wg lekcji w systemie
  st.ostatnia_lekcja,
  st.lekcji_odbytych,
  coalesce(st.lekcji_przyszlych, 0)               as lekcji_przyszlych,
  case when st.ostatnia_lekcja is null then null
       else (current_date - st.ostatnia_lekcja::date)
  end                                             as dni_od_ostatniej_lekcji,

  -- Historia ze starego systemu (dziś pusta — patrz komentarz nagłówkowy)
  h.started_on                                    as nauka_od,
  h.ended_on                                      as nauka_do,
  h.final_level                                   as poziom_koncowy,
  h.teacher_name                                  as lektor,

  -- Saldo z transakcji. UWAGA: `students.status = 'overdue'` NIE jest
  -- wiarygodnym sygnałem zaległości — ustawia go cron windykacyjny, a przy
  -- błędnym naliczeniu abonamentu flaguje też osoby bez zobowiązań.
  -- Liczymy z transakcji.
  coalesce(tx.saldo, 0)                           as saldo,
  coalesce(tx.saldo, 0) < 0                       as ma_zaleglosc,

  public.has_marketing_consent(p.email, p.phone)  as zgoda_marketingowa,

  -- Kwalifikacja do wysyłki. Zgoda jest warunkiem koniecznym — bez niej
  -- panel pokaże kandydata, ale wyzwalacz i tak nie przepuści wysyłki.
  (
        s.deleted_at is null
    and coalesce(st.lekcji_przyszlych, 0) = 0
    and coalesce(nullif(btrim(coalesce(p.email, '')), ''), nullif(btrim(coalesce(p.phone, '')), '')) is not null
    and coalesce(tx.saldo, 0) >= 0
    and public.has_marketing_consent(p.email, p.phone)
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
where s.deleted_at is null;

comment on view public.v_reactivation_candidates is
  'Kandydaci do kampanii reaktywacyjnej wraz ze statusem zgody, aktywnością i saldem. Próg bezczynności ustala panel, nie widok.';


-- ── 9. RLS ──────────────────────────────────────────────────────────────────
alter table public.marketing_consents       enable row level security;
alter table public.student_learning_history enable row level security;
alter table public.reactivation_campaigns   enable row level security;
alter table public.reactivation_candidates  enable row level security;

-- Zgody i kampanie marketingowe to decyzje właścicielskie — recepcja ich
-- nie prowadzi, uczeń nie ma tu wstępu.
drop policy if exists "Admin zarządza zgodami marketingowymi" on public.marketing_consents;
create policy "Admin zarządza zgodami marketingowymi" on public.marketing_consents
  for all
  using      (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "Admin zarządza historią nauki" on public.student_learning_history;
create policy "Admin zarządza historią nauki" on public.student_learning_history
  for all
  using      (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "Admin zarządza kampaniami" on public.reactivation_campaigns;
create policy "Admin zarządza kampaniami" on public.reactivation_campaigns
  for all
  using      (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "Admin zarządza kandydatami" on public.reactivation_candidates;
create policy "Admin zarządza kandydatami" on public.reactivation_candidates
  for all
  using      (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');


-- ── 10. Uprawnienia ─────────────────────────────────────────────────────────
revoke all on public.marketing_consents, public.student_learning_history,
              public.reactivation_campaigns, public.reactivation_candidates
  from anon, public;

grant select, insert, update, delete
  on public.marketing_consents, public.student_learning_history,
     public.reactivation_campaigns, public.reactivation_candidates
  to authenticated;

revoke all  on public.v_reactivation_candidates from anon, public;
grant select on public.v_reactivation_candidates to authenticated;
