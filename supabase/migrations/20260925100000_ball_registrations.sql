-- Zgłoszenia na The uNickorn Ball (27.11.2026, Hotel 500, Tarnowo Podgórne).
--
-- Zgłoszenie NIE jest opłaconym biletem. Formularz zapisuje rezerwację ze
-- statusem „oczekuje na wpłatę", a udział potwierdza dopiero człowiek po
-- zaksięgowaniu przelewu (§2 ust. 3 i 4 regulaminu). Dlatego status zmienia
-- się wyłącznie ręcznie — nic w kodzie nie ustawia „paid" samo z siebie.
--
-- Uprawnienia jak przy deklaracjach Fundacji: publiczny formularz pisze
-- kluczem serwisowym, czyta wyłącznie admin. Lista gości to dane osobowe osób
-- trzecich, więc nie ma tu żadnej polityki dla anon.

create sequence if not exists public.ball_registration_seq;

create table public.ball_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Numer zgłoszenia podawany gościom i w tytule przelewu. Z sekwencji, żeby
  -- był krótki i czytelny przy przepisywaniu do bankowości.
  reference text not null unique
    default 'BAL-' || lpad(nextval('public.ball_registration_seq')::text, 4, '0'),

  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'paid', 'cancelled')),

  single_tickets smallint not null default 0 check (single_tickets between 0 and 20),
  couple_tickets smallint not null default 0 check (couple_tickets between 0 and 20),
  seats smallint not null check (seats > 0),
  -- Kwota w pełnych złotych: cennik nie ma groszy (300 zł i 550 zł).
  amount_pln integer not null check (amount_pln > 0),

  guests text[] not null check (cardinality(guests) > 0),

  contact_name text not null check (char_length(contact_name) between 3 and 120),
  email text not null,
  phone text not null check (phone ~ '^\+48[0-9]{9}$'),

  table_request text,
  -- Potrzeby żywieniowe potrafią ujawnić dane o zdrowiu (§8 ust. 2 regulaminu),
  -- więc są dobrowolne i mają własną zgodę. Bez zgody pole musi zostać puste.
  dietary_notes text,
  dietary_consent boolean not null default false,

  terms_accepted boolean not null check (terms_accepted),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  terms_version text not null,
  consented_at timestamptz not null default now(),

  paid_at timestamptz,
  notes text,

  check (single_tickets + couple_tickets > 0),
  check (seats = single_tickets + couple_tickets * 2),
  check (amount_pln = single_tickets * 300 + couple_tickets * 550),
  check (cardinality(guests) = seats),
  check (dietary_notes is null or dietary_consent),
  check (status <> 'paid' or paid_at is not null)
);

comment on table public.ball_registrations is
  'Zgłoszenia na The uNickorn Ball. Status „paid" ustawia człowiek po zaksięgowaniu wpłaty — samo wysłanie formularza nie jest opłaceniem biletu.';
comment on column public.ball_registrations.reference is
  'Numer zgłoszenia podawany gościowi i wpisywany w tytule przelewu.';
comment on column public.ball_registrations.dietary_notes is
  'Dobrowolne. Może zawierać dane o zdrowiu — wymaga dietary_consent.';

create index ball_registrations_created_at_idx on public.ball_registrations (created_at desc);
create index ball_registrations_status_idx on public.ball_registrations (status, created_at desc);

create trigger ball_registrations_set_updated_at
  before update on public.ball_registrations
  for each row execute procedure public.set_updated_at();

alter table public.ball_registrations enable row level security;
revoke all on table public.ball_registrations from public, anon, authenticated;
grant select, update on table public.ball_registrations to authenticated;
grant all on table public.ball_registrations to service_role;
grant usage on sequence public.ball_registration_seq to service_role;

create policy "Tylko admin odczytuje zgloszenia na bal"
  on public.ball_registrations for select to authenticated
  using (public.current_user_role() = 'admin'::public.user_role);

create policy "Tylko admin aktualizuje zgloszenia na bal"
  on public.ball_registrations for update to authenticated
  using (public.current_user_role() = 'admin'::public.user_role)
  with check (public.current_user_role() = 'admin'::public.user_role);
