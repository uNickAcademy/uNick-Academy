-- ============================================================================
-- 121: Pola leada potrzebne wejściom ze strony (Blok 4 + Kroki 2 i 4 kreatora)
--
-- Kontekst: migracja 116 uczyniła `leads` jedynym lejkiem B2C i wprost wycofała
-- `consultation_requests` („nie pisać tu nic nowego"). Wszystkie formularze na
-- stronie mają więc trafiać do `leads`. Brakuje im trzech rzeczy.
--
-- Dlaczego NIE recyklingujemy `campaign` na oznaczenie formularza:
-- w 116 `campaign` jest udokumentowana jako atrybucja reklamowa
-- (np. 'meta_wrzesien_2026'). Wpisanie tam nazwy formularza uniemożliwiłoby
-- późniejsze mierzenie kampanii — a `v_lead_funnel` grupuje właśnie po niej.
-- Stąd osobna kolumna. Enum `lead_source` zostaje nietknięty, żeby nie mieszać
-- taksonomii „kanał kontaktu" z taksonomią „który formularz".
-- ============================================================================


-- ── 1. Wejście do lejka ─────────────────────────────────────────────────────
-- Tekst, nie enum: lista wejść zmienia się razem ze stroną, a każda zmiana
-- enuma to migracja. Wartości pilnuje warstwa aplikacji (typ LeadEntryPoint).

alter table public.leads
  add column if not exists entry_point text;

comment on column public.leads.entry_point is
  'Formularz, z którego przyszedł lead: zapisy_wizard, consultation_modal, contact_form, group_list_button, advice. Uzupełnia source (kanał) i campaign (atrybucja reklamowa) — nie zastępuje żadnego z nich.';

create index if not exists leads_entry_point_idx on public.leads (entry_point);


-- ── 2. Lokalizacja (Krok 2 kreatora) ────────────────────────────────────────
-- „Rumianek czy online" filtruje wszystko, co pokazujemy dalej, i jest
-- pierwszą rzeczą, o którą zapyta Sara oddzwaniając.

do $$ begin
  create type public.lead_location as enum ('rumianek', 'online', 'any');
exception when duplicate_object then null; end $$;

alter table public.leads
  add column if not exists location public.lead_location;

comment on column public.leads.location is
  'Preferowana forma zajęć wskazana w kreatorze. `any` = osobie nie robi różnicy.';


-- ── 3. Wybrana grupa (Krok 4 kreatora) ──────────────────────────────────────
-- ON DELETE SET NULL, nie CASCADE: usunięcie grupy nie może kasować leada.

alter table public.leads
  add column if not exists interested_group_id uuid
  references public.groups(id) on delete set null;

comment on column public.leads.interested_group_id is
  'Grupa wybrana w kroku 4 kreatora. NULL dla leadów bez konkretnej oferty (ścieżka „jeszcze nie wiem", zajęcia indywidualne).';

create index if not exists leads_interested_group_idx
  on public.leads (interested_group_id) where interested_group_id is not null;


-- Uprawnienia: `leads` ma nadania na poziomie TABELI (migracja 116), które
-- obejmują także kolumny dodane później — w odróżnieniu od `teachers`, gdzie
-- migracja 104 nadała uprawnienia kolumnowo. Nic tu nie trzeba dodawać.
