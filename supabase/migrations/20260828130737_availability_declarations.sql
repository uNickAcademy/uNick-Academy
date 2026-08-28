-- ============================================================================
-- Zgłoszenia z formularza dostępności na wrzesień (/pl/dostepnosc).
--
-- Dane nie pasują do kolumn `leads` (tryb/forma zajęć/przedziały godzinowe
-- to nic, co ma sens w lejku sprzedażowym new→contacted→...→won), więc — tak
-- jak w przypadku foundation_interest_declarations — dostają własną tabelę
-- zamiast wciskania na siłę w istniejący lejek.
--
-- Widoczność: admin i recepcja, tak jak leady (Prośby o zapis) — to też
-- skrzynka, którą zespół ma na bieżąco przeglądać i kontaktować się z osobami.
--
-- Tymczasowe razem z resztą naboru — usuwanie opisane w
-- docs/FORMULARZ-DOSTEPNOSCI.md.
-- ============================================================================

create table public.availability_declarations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'archived')),

  parent_first_name text not null check (char_length(parent_first_name) between 1 and 80),
  parent_last_name text not null check (char_length(parent_last_name) between 1 and 80),
  email text not null,
  phone text not null,

  child_name text not null check (char_length(child_name) between 1 and 80),
  child_age smallint not null check (child_age between 2 and 99),
  level text,

  mode text[] not null check (cardinality(mode) > 0),
  class_format text[] not null check (cardinality(class_format) > 0),
  address text,
  school_name text,
  school_city text,

  -- Ustrukturyzowana dostępność (do ewentualnego dalszego przetwarzania) oraz
  -- to samo spłaszczone do jednego czytelnego zdania — dokładnie to, co trafia
  -- do arkusza i maila, żeby podgląd w adminie nie wymagał odtwarzania z JSON-a.
  availability jsonb not null,
  availability_text text not null,
  notes text,

  -- Kod, który TA osoba podała przy zgłoszeniu (ktoś ją polecił) — ten sam
  -- wzorzec co leads.referral_code, wchodzi w grę automatycznie przy realnym
  -- zapisie (register_referral). Osobno: kod, który MY jej przyznajemy, żeby
  -- mogła podzielić się nim ze znajomymi (patrz komentarz niżej).
  referral_code text,
  assigned_referral_code text not null,

  consent boolean not null default true
);

comment on table public.availability_declarations is
  'Zgłoszenia z tymczasowego formularza dostępności na wrzesień (/pl/dostepnosc) — nabór, nie zapis.';

comment on column public.availability_declarations.assigned_referral_code is
  'Kod polecenia wygenerowany i wysłany tej osobie mailem, w tym samym formacie co generate_referral_code(). Zarezerwowany (nie koliduje z istniejącymi students.referral_code), ale NIE jest jeszcze aktywny w register_referral — ten wymaga realnego wiersza students (profile_id NOT NULL), którego zgłaszający jeszcze nie ma. Aktywuje się dopiero, gdy przy faktycznym zapisie dziecka ktoś przepisze ten kod do students.referral_code.';

create index availability_declarations_created_at_idx on public.availability_declarations (created_at desc);
create index availability_declarations_status_idx on public.availability_declarations (status, created_at desc);

create trigger availability_declarations_set_updated_at
  before update on public.availability_declarations
  for each row execute procedure public.set_updated_at();

alter table public.availability_declarations enable row level security;
revoke all on table public.availability_declarations from public, anon, authenticated;
grant select, update on table public.availability_declarations to authenticated;
grant all on table public.availability_declarations to service_role;

create policy "Admin i recepcja odczytują zgłoszenia dostępności"
  on public.availability_declarations for select to authenticated
  using (public.current_user_role() in ('admin', 'reception'));

create policy "Admin i recepcja aktualizują zgłoszenia dostępności"
  on public.availability_declarations for update to authenticated
  using (public.current_user_role() in ('admin', 'reception'))
  with check (public.current_user_role() in ('admin', 'reception'));
