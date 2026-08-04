-- ============================================================================
-- 116: Warstwa danych warstwy sprzedażowej (Faza 1) — wspólny lejek leadów,
--      rozmowy agentów, telemetria kosztów AI i obsługa RODO.
--
-- Kontekst i decyzje projektowe:
--
--  * `leads` staje się JEDYNYM lejkiem B2C. `consultation_requests` przestaje
--    być źródłem prawdy — 4 istniejące wiersze migrujemy niżej, a tabelę
--    zostawiamy pustą i oznaczoną komentarzem (nie DROP-ujemy: /admin ma do
--    niej referencje w mailach i chcemy móc się cofnąć).
--  * `booking_requests` NIE jest leadem — to prośba o konkretny termin od
--    osoby już zdecydowanej. Zostaje bez zmian, spina się przez
--    `leads.existing_student_id`.
--  * `b2b_leads` zostaje osobno — inny lejek (`b2b_stage`), inny panel.
--
--  * Wiadomości: OSOBNA TABELA `messages`, nie `jsonb` w `conversations`.
--    Powody: (1) wyzwalacz ustawiający `first_response_at` na wierszach jest
--    trywialny, w jsonb-ie zawodny; (2) każdy dopis do tablicy jsonb to
--    read-modify-write całej rozmowy — dwa równoległe webhooki z Make gubią
--    wiadomość; (3) `agent_usage` musi wskazywać konkretną wiadomość.
--    Koszt: jeden JOIN więcej.
--
--  * Widoki mają `security_invoker = true`. Bez tego widok działa z prawami
--    właściciela i omija RLS pytającego — czyli uczeń zobaczyłby leady.
--
--  * Wszystkie funkcje mają ustawiony `search_path` i odebrane EXECUTE dla
--    PUBLIC — zgodnie z migracjami 105/106.
-- ============================================================================


-- ── 1. Typy wyliczeniowe ────────────────────────────────────────────────────
-- Postgres nie zna CREATE TYPE IF NOT EXISTS — stąd bloki DO.

do $$ begin
  create type public.lead_source as enum (
    'form', 'whatsapp', 'messenger', 'instagram', 'phone',
    'referral', 'reactivation', 'walk_in'
  );
exception when duplicate_object then null; end $$;

-- Kanał komunikacji ≠ źródło leada: lead ze źródła `referral` może rozmawiać
-- przez `whatsapp`. Dlatego osobny typ, a nie recykling `lead_source`.
do $$ begin
  create type public.lead_channel as enum (
    'whatsapp', 'messenger', 'instagram', 'email', 'sms', 'phone', 'form'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_student_type as enum ('child', 'teen', 'adult', 'corporate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum (
    'new', 'contacted', 'qualified', 'booked', 'no_show', 'won', 'lost', 'nurture'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_event_type as enum (
    'created', 'message_in', 'message_out', 'status_change',
    'booking', 'note', 'agent_action', 'error'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_actor as enum ('agent', 'human', 'system');
exception when duplicate_object then null; end $$;

-- Autor wiadomości — `lead_actor` nie ma wartości „lead", bo w słowniku zdarzeń
-- lead nie jest aktorem systemu. Tu jest, więc typ osobny.
do $$ begin
  create type public.message_author as enum ('lead', 'agent', 'human');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_direction as enum ('in', 'out');
exception when duplicate_object then null; end $$;


-- ── 2. Ranga etapu lejka ────────────────────────────────────────────────────
-- Kolejność etykiet w enumie NIE odpowiada kolejności w lejku (`no_show`
-- wypada po `booked`, `lost` po `won`), więc porównywanie enumów dałoby bzdurny
-- lejek. Stąd jawne mapowanie na rangę. `lost`/`nurture` to wyjścia z lejka,
-- nie etapy — nie podbijają rangi.
create or replace function public.lead_stage_rank(p_status public.lead_status)
returns smallint
language sql
immutable
set search_path to 'public'
as $$
  select case p_status
    when 'new'       then 0
    when 'contacted' then 1
    when 'qualified' then 2
    when 'booked'    then 3
    when 'no_show'   then 3
    when 'won'       then 4
    else 0
  end::smallint
$$;

revoke execute on function public.lead_stage_rank(public.lead_status) from public;
grant  execute on function public.lead_stage_rank(public.lead_status) to authenticated, service_role;


-- ── 3. leads ────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  source                public.lead_source not null,
  -- atrybucja reklamowa, np. 'meta_wrzesien_2026'
  campaign              text,

  first_name            text,
  last_name             text,
  phone                 text,
  email                 text,

  -- Kolumny znormalizowane pod deduplikację. Telefon: same cyfry, ostatnie 9
  -- (format PL — „+48 601-234-567", „601234567" i „0048601234567" dają ten sam
  -- klucz). Uwaga: dla numerów spoza PL 9 ostatnich cyfr może teoretycznie
  -- skolidować — świadomy kompromis, szkoła działa na rynku polskim.
  phone_norm            text generated always as (
                          nullif(right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 9), '')
                        ) stored,
  email_norm            text generated always as (
                          nullif(lower(btrim(coalesce(email, ''))), '')
                        ) stored,

  -- Nullable świadomie: przy pierwszym „cześć, ile kosztuje?" z WhatsAppa
  -- jeszcze nie wiemy, dla kogo i po co. Agent dopyta.
  student_type          public.lead_student_type,
  student_age           int,
  parent_name           text,
  goal                  text,
  previous_attempts     text,
  preferred_start       text,

  status                public.lead_status not null default 'new',
  -- Najdalszy osiągnięty etap. Utrzymywany wyzwalaczem — bez tego widok lejka
  -- liczyłby „przegrany na etapie new" jako zakwalifikowanego.
  max_stage             smallint not null default 0,
  lost_reason           text,
  owner_id              uuid references public.profiles(id) on delete set null,

  first_response_at     timestamptz,
  first_response_seconds int generated always as (
                          extract(epoch from (first_response_at - created_at))::int
                        ) stored,
  booked_slot_at        timestamptz,

  -- RODO: zgoda + moment + TREŚĆ klauzuli obowiązującej w chwili jej udzielenia.
  consent_marketing     boolean not null default false,
  consent_at            timestamptz,
  consent_clause        text,

  existing_student_id   uuid references public.students(id) on delete set null,
  -- Rozpoznany obecny uczeń lub rodzic obecnego ucznia → agent nie odpowiada,
  -- sprawa idzie od razu do człowieka.
  is_existing_contact   boolean not null default false,

  -- Stan maszynki follow-upów (4h → 24h → 3 dni → nurture).
  last_inbound_at       timestamptz,
  last_outbound_at      timestamptz,
  followups_sent        smallint not null default 0,
  next_followup_at      timestamptz,

  constraint leads_kontakt_wymagany
    check (coalesce(phone, '') <> '' or coalesce(email, '') <> ''),
  constraint leads_wiek_sensowny
    check (student_age is null or student_age between 1 and 120),
  constraint leads_zgoda_ma_date
    check (consent_marketing = false or consent_at is not null),
  constraint leads_followupy_w_zakresie
    check (followups_sent between 0 and 10)
);

comment on table public.leads is
  'Wspólny lejek leadów B2C (agenci Łowca/Odzyskiwacz + formularze www). B2B ma osobną tabelę b2b_leads.';
comment on column public.leads.max_stage is
  'Najdalszy osiągnięty etap wg lead_stage_rank(). Utrzymywany wyzwalaczem, nie ustawiać ręcznie.';
comment on column public.leads.consent_clause is
  'Dosłowna treść klauzuli zgody z chwili jej udzielenia — wymóg rozliczalności (art. 7 ust. 1 RODO).';

-- Indeksy wymagane briefem
create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);
create index if not exists leads_phone_idx       on public.leads (phone);
create index if not exists leads_email_idx       on public.leads (email);

-- Deduplikacja na poziomie bazy. Unikalność jest tu celowa: brief mówi
-- „jeśli lead istnieje, dopisz do rozmowy zamiast tworzyć nowy rekord" —
-- indeks zamienia to z wyścigu dwóch webhooków w twardą gwarancję.
-- Skutek uboczny do świadomej akceptacji: rodzic zapisujący dwoje dzieci z
-- tego samego maila to JEDEN lead (i jedna rozmowa) — co jest zgodne z tym,
-- jak taka rozmowa wygląda naprawdę.
create unique index if not exists leads_phone_norm_uniq
  on public.leads (phone_norm) where phone_norm is not null;
create unique index if not exists leads_email_norm_uniq
  on public.leads (email_norm) where email_norm is not null;

-- Kolejka follow-upów — cron pyta wyłącznie o wiersze wymagalne.
create index if not exists leads_followup_queue_idx
  on public.leads (next_followup_at)
  where next_followup_at is not null
    and status not in ('won', 'lost', 'nurture');

-- Retencja RODO — wyszukiwanie kandydatów do usunięcia.
create index if not exists leads_retencja_idx
  on public.leads (created_at)
  where status = 'lost' and consent_marketing = false;


-- ── 4. conversations ────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references public.leads(id) on delete cascade,
  channel           public.lead_channel not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_message_at   timestamptz,

  handoff_to_human  boolean not null default false,
  handoff_reason    text,
  handoff_at        timestamptz,

  -- Identyfikator wątku u dostawcy (channel_id z payloadu Make) — pozwala
  -- odesłać odpowiedź tam, skąd przyszła wiadomość.
  external_thread_id text,

  -- Jedna rozmowa na kanał na leada → dopisywanie przez ON CONFLICT.
  unique (lead_id, channel),
  constraint conversations_handoff_ma_date
    check (handoff_to_human = false or handoff_at is not null)
);

create index if not exists conversations_lead_idx     on public.conversations (lead_id);
create index if not exists conversations_handoff_idx  on public.conversations (handoff_at desc)
  where handoff_to_human = true;


-- ── 5. messages ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  -- Denormalizacja świadoma: panel i retencja pytają po leadzie, nie po rozmowie.
  lead_id          uuid not null references public.leads(id) on delete cascade,
  created_at       timestamptz not null default now(),

  direction        public.message_direction not null,
  author           public.message_author not null,
  content          text not null,

  -- Idempotencja webhooków. Make ponawia dostarczenie przy timeoucie; bez tego
  -- lead dostaje dwie odpowiedzi na jedną wiadomość.
  external_id      text,
  meta             jsonb not null default '{}'::jsonb,

  constraint messages_tresc_niepusta check (btrim(content) <> ''),
  -- Wiadomość przychodząca jest zawsze od leada; wychodząca nigdy.
  constraint messages_kierunek_zgodny_z_autorem check (
    (direction = 'in'  and author = 'lead') or
    (direction = 'out' and author in ('agent', 'human'))
  )
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_lead_idx         on public.messages (lead_id, created_at);
create unique index if not exists messages_external_id_uniq
  on public.messages (external_id) where external_id is not null;


-- ── 6. lead_events ──────────────────────────────────────────────────────────
create table if not exists public.lead_events (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  created_at  timestamptz not null default now(),
  type        public.lead_event_type not null,
  actor       public.lead_actor not null,
  agent_name  text,
  payload     jsonb not null default '{}'::jsonb
);

create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);
create index if not exists lead_events_type_idx on public.lead_events (type, created_at desc);

comment on table public.lead_events is
  'Oś czasu leada renderowana w panelu. Zdarzenia message_in/out i status_change wstawiają wyzwalacze — reszta z aplikacji.';


-- ── 7. agent_usage ──────────────────────────────────────────────────────────
-- Każde wywołanie Claude, z tokenami i kosztem. Osobno od ufos.* — to koszt
-- sprzedaży, nie księgowość; mieszanie z AI-CFO zaciemniłoby oba.
create table if not exists public.agent_usage (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  agent_name          text not null,
  model               text not null,

  lead_id             uuid references public.leads(id) on delete set null,
  message_id          uuid references public.messages(id) on delete set null,

  input_tokens        int not null default 0,
  output_tokens       int not null default 0,
  cache_read_tokens   int not null default 0,
  cache_write_tokens  int not null default 0,
  -- Koszt liczony po stronie aplikacji wg cennika modelu; 6 miejsc, bo
  -- pojedyncze wywołanie to ułamki centa.
  cost_usd            numeric(12, 6) not null default 0,

  latency_ms          int,
  success             boolean not null default true,
  error               text
);

create index if not exists agent_usage_created_idx on public.agent_usage (created_at desc);
create index if not exists agent_usage_agent_idx   on public.agent_usage (agent_name, created_at desc);
create index if not exists agent_usage_lead_idx    on public.agent_usage (lead_id);


-- ── 8. gdpr_erasures ────────────────────────────────────────────────────────
-- Dowód realizacji żądania usunięcia. Trzymamy WYŁĄCZNIE skróty kontaktów —
-- rejestr nie może sam być zbiorem danych osobowych, a musi pozwolić wykazać,
-- że konkretne żądanie zostało wykonane.
create table if not exists public.gdpr_erasures (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  lead_id        uuid not null,            -- bez FK: rekord już nie istnieje
  email_sha256   text,
  phone_sha256   text,
  reason         text not null default 'żądanie osoby, której dane dotyczą',
  performed_by   uuid references public.profiles(id) on delete set null,
  note           text
);

create index if not exists gdpr_erasures_created_idx on public.gdpr_erasures (created_at desc);


-- ── 9. Wyzwalacze ───────────────────────────────────────────────────────────

-- 9a. updated_at — reużywamy istniejącej public.set_updated_at()
drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();


-- 9b. Nowa wiadomość → znacznik czasu rozmowy, pierwsza odpowiedź, zdarzenie.
--
-- SECURITY DEFINER celowo: audyt musi się zapisać niezależnie od tego, kto
-- wstawia wiadomość (service role z webhooka albo admin z panelu).
create or replace function public.tg_message_after_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;

  if new.direction = 'in' then
    update public.leads
       set last_inbound_at = new.created_at,
           -- Lead się odezwał → licznik follow-upów od zera, kolejka czyszczona.
           followups_sent  = 0,
           next_followup_at = null
     where id = new.lead_id;
  else
    update public.leads
       set last_outbound_at = new.created_at,
           -- Sedno metryki „poniżej 60 sekund": ustawiamy TYLKO raz, przy
           -- pierwszej wiadomości wychodzącej. first_response_seconds to
           -- kolumna generowana, wyliczy się sama.
           first_response_at = coalesce(first_response_at, new.created_at)
     where id = new.lead_id;
  end if;

  insert into public.lead_events (lead_id, type, actor, agent_name, payload)
  values (
    new.lead_id,
    case when new.direction = 'in' then 'message_in'::public.lead_event_type
         else 'message_out'::public.lead_event_type end,
    case new.author when 'agent' then 'agent'::public.lead_actor
                    when 'human' then 'human'::public.lead_actor
                    else 'system'::public.lead_actor end,
    nullif(new.meta->>'agent_name', ''),
    jsonb_build_object(
      'message_id', new.id,
      'conversation_id', new.conversation_id,
      'direction', new.direction,
      'author', new.author,
      'chars', length(new.content)
    )
  );

  return null;
end $$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute procedure public.tg_message_after_insert();


-- 9c. Zmiana statusu → podbicie max_stage + wpis do osi czasu.
create or replace function public.tg_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status is distinct from old.status then
    new.max_stage := greatest(old.max_stage, public.lead_stage_rank(new.status));

    insert into public.lead_events (lead_id, type, actor, payload)
    values (
      new.id, 'status_change', 'system',
      jsonb_build_object('from', old.status, 'to', new.status, 'lost_reason', new.lost_reason)
    );
  end if;
  return new;
end $$;

drop trigger if exists leads_status_change on public.leads;
create trigger leads_status_change
  before update of status on public.leads
  for each row execute procedure public.tg_lead_status_change();


-- 9d. Nowy lead → max_stage z rangi statusu.
-- Bez tego lead wstawiony od razu ze statusem innym niż `new` (migracja
-- consultation_requests, import) miałby max_stage = 0 i wypadł z lejka.
create or replace function public.tg_lead_before_insert()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.max_stage := greatest(new.max_stage, public.lead_stage_rank(new.status));
  return new;
end $$;

drop trigger if exists leads_before_insert on public.leads;
create trigger leads_before_insert
  before insert on public.leads
  for each row execute procedure public.tg_lead_before_insert();


-- 9e. Nowy lead → zdarzenie `created` na osi czasu.
create or replace function public.tg_lead_after_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.lead_events (lead_id, type, actor, payload)
  values (new.id, 'created', 'system',
          jsonb_build_object('source', new.source, 'campaign', new.campaign));
  return null;
end $$;

drop trigger if exists leads_after_insert on public.leads;
create trigger leads_after_insert
  after insert on public.leads
  for each row execute procedure public.tg_lead_after_insert();


-- ── 10. Widok lejka ─────────────────────────────────────────────────────────
-- Konwersje liczone po NAJDALSZYM osiągniętym etapie (max_stage), nie po
-- statusie bieżącym — inaczej lead przegrany po umówieniu zniknąłby z licznika
-- umówionych i konwersje wyszłyby zawyżone.
create or replace view public.v_lead_funnel
with (security_invoker = true) as
select
  date_trunc('month', l.created_at)::date            as miesiac,
  l.source,
  coalesce(l.campaign, '(brak kampanii)')            as campaign,

  count(*)                                           as leadow,
  count(*) filter (where l.max_stage >= 1)           as skontaktowanych,
  count(*) filter (where l.max_stage >= 2)           as zakwalifikowanych,
  count(*) filter (where l.max_stage >= 3)           as umowionych,
  count(*) filter (where l.max_stage >= 4)           as wygranych,
  count(*) filter (where l.status = 'no_show')       as nieobecnych,
  count(*) filter (where l.status = 'lost')          as przegranych,
  count(*) filter (where l.status = 'nurture')       as w_nurture,

  -- Konwersje etap→etap (%). NULLIF chroni przed dzieleniem przez zero.
  round(100.0 * count(*) filter (where l.max_stage >= 1)
        / nullif(count(*), 0), 1)                                          as pct_kontakt,
  round(100.0 * count(*) filter (where l.max_stage >= 2)
        / nullif(count(*) filter (where l.max_stage >= 1), 0), 1)          as pct_kwalifikacja,
  round(100.0 * count(*) filter (where l.max_stage >= 3)
        / nullif(count(*) filter (where l.max_stage >= 2), 0), 1)          as pct_umowienie,
  round(100.0 * count(*) filter (where l.max_stage >= 4)
        / nullif(count(*) filter (where l.max_stage >= 3), 0), 1)          as pct_domkniecie,
  round(100.0 * count(*) filter (where l.max_stage >= 4)
        / nullif(count(*), 0), 1)                                          as pct_lead_do_klienta,

  -- Czas pierwszej odpowiedzi. Mediana obok średniej, bo jeden lead
  -- odpowiedziany po dwóch dniach rozwala średnią i ukrywa realny wynik.
  round(avg(l.first_response_seconds))::int                                as sr_pierwsza_odp_s,
  percentile_cont(0.5) within group (order by l.first_response_seconds)::int
                                                                           as mediana_pierwszej_odp_s,
  count(*) filter (where l.first_response_seconds <= 60)                   as odp_ponizej_60s,
  count(*) filter (where l.first_response_at is null)                      as bez_odpowiedzi
from public.leads l
group by 1, 2, 3;

comment on view public.v_lead_funnel is
  'Lejek leadów per miesiąc/źródło/kampania: konwersje etap→etap liczone po max_stage oraz czas pierwszej odpowiedzi.';


-- ── 11. Retencja RODO ───────────────────────────────────────────────────────
-- Leady `lost` bez zgody marketingowej starsze niż 12 miesięcy. Kasowanie
-- kaskadowe zabiera rozmowy, wiadomości i zdarzenia (FK ON DELETE CASCADE).
create or replace function public.purge_expired_leads()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_usuniete integer;
begin
  with usuniete as (
    delete from public.leads
     where status = 'lost'
       and consent_marketing = false
       and created_at < now() - interval '12 months'
    returning id
  )
  select count(*) into v_usuniete from usuniete;

  return v_usuniete;
end $$;

comment on function public.purge_expired_leads() is
  'Retencja: kasuje leady lost bez zgody marketingowej starsze niż 12 miesięcy. Wołane z pg_cron (migracja 118).';

revoke execute on function public.purge_expired_leads() from public, anon, authenticated;
grant  execute on function public.purge_expired_leads() to service_role;


-- Usunięcie danych konkretnego leada na żądanie + wpis do rejestru.
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

comment on function public.gdpr_delete_lead(uuid, text) is
  'Trwale usuwa leada wraz z rozmowami i zdarzeniami, zapisując w gdpr_erasures skróty kontaktów jako dowód wykonania żądania.';

revoke execute on function public.gdpr_delete_lead(uuid, text) from public, anon;
grant  execute on function public.gdpr_delete_lead(uuid, text) to authenticated, service_role;


-- ── 12. RLS ─────────────────────────────────────────────────────────────────
-- Wzorzec z całego projektu: current_user_role(). Leady widzi ZESPÓŁ.
-- Świadomie NIE MA żadnej polityki dla ról `student`, `teacher`, `hr` —
-- brak polityki przy włączonym RLS = brak dostępu. Zapis z webhooków robi
-- service_role, który RLS omija, więc polityk INSERT dla `anon` też nie ma.

alter table public.leads          enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.lead_events    enable row level security;
alter table public.agent_usage    enable row level security;
alter table public.gdpr_erasures  enable row level security;

drop policy if exists "Zespół zarządza leadami" on public.leads;
create policy "Zespół zarządza leadami" on public.leads
  for all
  using      (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

drop policy if exists "Zespół zarządza rozmowami" on public.conversations;
create policy "Zespół zarządza rozmowami" on public.conversations
  for all
  using      (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

drop policy if exists "Zespół zarządza wiadomościami" on public.messages;
create policy "Zespół zarządza wiadomościami" on public.messages
  for all
  using      (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));

-- Oś czasu jest audytem: zespół czyta, nikt nie edytuje z panelu.
-- Wpisy powstają z wyzwalaczy (SECURITY DEFINER) i z aplikacji (service_role).
drop policy if exists "Zespół czyta oś czasu leada" on public.lead_events;
create policy "Zespół czyta oś czasu leada" on public.lead_events
  for select using (public.current_user_role() in ('admin', 'reception'));

-- Koszty AI to dane zarządcze — recepcja ich nie potrzebuje.
drop policy if exists "Admin czyta zużycie agentów" on public.agent_usage;
create policy "Admin czyta zużycie agentów" on public.agent_usage
  for select using (public.current_user_role() = 'admin');

drop policy if exists "Admin czyta rejestr usunięć RODO" on public.gdpr_erasures;
create policy "Admin czyta rejestr usunięć RODO" on public.gdpr_erasures
  for select using (public.current_user_role() = 'admin');


-- ── 13. Uprawnienia ─────────────────────────────────────────────────────────
-- Defense-in-depth zgodnie z migracją 106: `anon` nie ma tu czego szukać,
-- `authenticated` dostaje dostęp tabelaryczny bramkowany przez RLS wyżej.

revoke all on public.leads, public.conversations, public.messages,
              public.lead_events, public.agent_usage, public.gdpr_erasures
  from anon, public;

grant select, insert, update, delete
  on public.leads, public.conversations, public.messages
  to authenticated;
grant select on public.lead_events, public.agent_usage, public.gdpr_erasures to authenticated;

revoke all on public.v_lead_funnel from anon, public;
grant select on public.v_lead_funnel to authenticated;

revoke execute on function public.tg_message_after_insert()  from public, anon, authenticated;
revoke execute on function public.tg_lead_status_change()    from public, anon, authenticated;
revoke execute on function public.tg_lead_before_insert()    from public, anon, authenticated;
revoke execute on function public.tg_lead_after_insert()     from public, anon, authenticated;


-- ── 14. Migracja consultation_requests → leads ──────────────────────────────
-- 4 wiersze na produkcji, wszystkie status 'new', audience 'adult'/'teen'
-- (mapuje się 1:1 na lead_student_type).
--
-- Uwaga na ON CONFLICT: mamy DWA częściowe indeksy unikalne (mail i telefon),
-- a ON CONFLICT potrafi wnioskować tylko z jednego naraz — kolizja na tym
-- drugim wywaliłaby całą migrację. Dlatego zamiast ON CONFLICT:
--  * DISTINCT ON odsiewa duplikaty wewnątrz samej czwórki (starszy wygrywa),
--  * NOT EXISTS czyni krok idempotentnym przy powtórnym uruchomieniu.
with zrodlo as (
  select distinct on (
      nullif(lower(btrim(coalesce(cr.email, ''))), ''),
      nullif(right(regexp_replace(coalesce(cr.phone, ''), '[^0-9]', '', 'g'), 9), '')
    )
    cr.created_at,
    nullif(btrim(cr.name), '')                                                     as first_name,
    nullif(btrim(cr.email), '')                                                    as email,
    nullif(btrim(cr.phone), '')                                                    as phone,
    nullif(lower(btrim(coalesce(cr.email, ''))), '')                               as email_norm,
    nullif(right(regexp_replace(coalesce(cr.phone, ''), '[^0-9]', '', 'g'), 9), '') as phone_norm,
    cr.audience,
    nullif(btrim(cr.message), '')                                                  as message,
    cr.status
  from public.consultation_requests cr
  order by
    nullif(lower(btrim(coalesce(cr.email, ''))), ''),
    nullif(right(regexp_replace(coalesce(cr.phone, ''), '[^0-9]', '', 'g'), 9), ''),
    cr.created_at
)
insert into public.leads (
  created_at, source, first_name, email, phone, student_type, goal, status, campaign
)
select
  z.created_at,
  'form'::public.lead_source,
  z.first_name,
  z.email,
  z.phone,
  case z.audience
    when 'child'     then 'child'::public.lead_student_type
    when 'teen'      then 'teen'::public.lead_student_type
    when 'adult'     then 'adult'::public.lead_student_type
    when 'corporate' then 'corporate'::public.lead_student_type
    else null
  end,
  z.message,
  case z.status
    when 'contacted' then 'contacted'::public.lead_status
    when 'closed'    then 'lost'::public.lead_status
    else 'new'::public.lead_status
  end,
  'migracja_consultation_requests'
from zrodlo z
where not exists (
  select 1 from public.leads l
   where (z.email_norm is not null and l.email_norm = z.email_norm)
      or (z.phone_norm is not null and l.phone_norm = z.phone_norm)
);

comment on table public.consultation_requests is
  'ZASTĄPIONA przez public.leads (migracja 116). Zostawiona pusto na wypadek wycofania zmiany — nie pisać tu nic nowego.';
