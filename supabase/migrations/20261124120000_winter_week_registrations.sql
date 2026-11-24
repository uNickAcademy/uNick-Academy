-- Zgłoszenia na Winter Project Week (22–26.02.2027), wydarzenie w ramach
-- projektu „Kreatorzy Przyszłości”.
--
-- Zgłoszenie nie gwarantuje miejsca: uczestników jest 20, a pierwszeństwo mają
-- osoby z regularnych grup. Status zmienia wyłącznie człowiek w panelu admina.
--
-- Uprawnienia jak przy deklaracjach Fundacji i zgłoszeniach na bal: publiczny
-- formularz pisze kluczem serwisowym, czyta wyłącznie admin. Dane dotyczą
-- osób niepełnoletnich, więc nie ma tu żadnej polityki dla anon.

create sequence if not exists public.winter_week_registration_seq;

create table public.winter_week_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Krótki numer do rozmów z rodzicami i do panelu.
  reference text not null unique
    default 'WPW-' || lpad(nextval('public.winter_week_registration_seq')::text, 4, '0'),

  status text not null default 'new'
    check (status in ('new', 'confirmed', 'waitlist', 'cancelled')),

  participant_name text not null check (char_length(participant_name) between 3 and 120),
  birth_date date not null,
  -- Wiek na 1 listopada 2026, tak samo jak w deklaracjach Kreatorów Przyszłości.
  participant_age smallint not null check (participant_age between 10 and 18),
  municipality text not null
    check (municipality in ('tarnowo_podgorne', 'rokietnica', 'kazmierz', 'szamotuly')),
  residence_confirmed boolean not null check (residence_confirmed),

  -- Pierwszeństwo mają osoby z regularnych zajęć Kreatorów Przyszłości.
  regular_participant boolean not null,
  regular_groups jsonb not null default '[]'::jsonb,

  attendance_declaration boolean not null check (attendance_declaration),
  rules_accepted boolean not null check (rules_accepted),
  special_needs text,

  contact_name text not null check (char_length(contact_name) between 3 and 120),
  email text not null,
  phone text not null check (phone ~ '^\+48[0-9]{9}$'),

  consent_contact boolean not null check (consent_contact),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  consent_version text not null,
  consented_at timestamptz not null default now(),

  notes text,

  check (regular_participant or jsonb_array_length(regular_groups) = 0)
);

comment on table public.winter_week_registrations is
  'Zgłoszenia na Winter Project Week 22–26.02.2027. Zgłoszenie nie gwarantuje miejsca — status ustawia człowiek.';
comment on column public.winter_week_registrations.regular_participant is
  'Czy uczestnik bierze udział w regularnych zajęciach Kreatorów Przyszłości (pierwszeństwo).';
comment on column public.winter_week_registrations.special_needs is
  'Dobrowolne potrzeby organizacyjne i komunikacyjne. Bez szczegółowych danych medycznych.';

create index winter_week_registrations_created_at_idx
  on public.winter_week_registrations (created_at desc);
create index winter_week_registrations_status_idx
  on public.winter_week_registrations (status, created_at desc);

create trigger winter_week_registrations_set_updated_at
  before update on public.winter_week_registrations
  for each row execute procedure public.set_updated_at();

alter table public.winter_week_registrations enable row level security;
revoke all on table public.winter_week_registrations from public, anon, authenticated;
grant select, update on table public.winter_week_registrations to authenticated;
grant all on table public.winter_week_registrations to service_role;
grant usage on sequence public.winter_week_registration_seq to service_role;

create policy "Tylko admin odczytuje zgloszenia na ferie"
  on public.winter_week_registrations for select to authenticated
  using (public.current_user_role() = 'admin'::public.user_role);

create policy "Tylko admin aktualizuje zgloszenia na ferie"
  on public.winter_week_registrations for update to authenticated
  using (public.current_user_role() = 'admin'::public.user_role)
  with check (public.current_user_role() = 'admin'::public.user_role);
