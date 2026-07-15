-- 104: Typ umowy lektora (do wyliczenia wypłaty netto) + zawężenie publicznego
-- dostępu do kolumn na teachers/profiles.
--
-- Kontekst bezpieczeństwa: RLS na `teachers` i `profiles` miały politykę SELECT
-- otwartą (qual = true) dla publicznych stron (lista lektorów, /zapisy). Rola
-- `anon` miała też pełny GRANT SELECT na całą tabelę (domyślne uprawnienia
-- Supabase), więc każdy — bez logowania, z pominięciem aplikacji — mógł przez
-- REST API pobrać stawki godzinowe, numer WhatsApp i inne wrażliwe dane
-- WSZYSTKICH lektorów. RLS (rzędy) zostaje bez zmian (nadal potrzebne dla
-- publicznych stron), ale zawężamy GRANT (kolumny) dla `anon` do zestawu,
-- który faktycznie renderują strony publiczne. Rola `authenticated` (panel
-- admina, własny profil lektora) zachowuje pełny dostęp — tam decyduje RLS
-- rzędowe, które już poprawnie ogranicza widoczność.

-- ── Typ umowy lektora ──────────────────────────────────────────────────────
do $$ begin
  create type teacher_contract_type as enum ('b2b', 'zlecenie', 'zlecenie_student');
exception when duplicate_object then null;
end $$;

-- Domyślnie 'b2b' dla istniejących lektorów — zachowuje dotychczasowe
-- zachowanie (100% stawki, bez potrąceń), admin ręcznie przeklasyfikuje tych
-- na umowie zlecenie.
alter table public.teachers
  add column if not exists contract_type teacher_contract_type not null default 'b2b';

comment on column public.teachers.contract_type is
  'b2b: lektor sam wystawia fakturę, wypłata = 100% stawki. '
  'zlecenie: potrącamy szacunkowy podatek i ZUS. '
  'zlecenie_student: student/uczeń do 26 rż na zleceniu — zwolniony z PIT i ZUS, wypłata = 100%.';

-- ── Zawężenie kolumn dla roli anon (publiczne strony bez logowania) ────────
revoke select on public.teachers from anon;
grant select (
  id, profile_id, bio, levels, rating, review_count, video_url, color,
  is_active, created_at, contact_email, sort_order, photo_url
) on public.teachers to anon;
-- Celowo NIE przyznane anonimowym: hourly_rate, rate_group, whatsapp_phone,
-- location, contract_type — żadna strona publiczna ich nie renderuje.

revoke select on public.profiles from anon;
grant select (id, full_name, email, avatar_url) on public.profiles to anon;
-- Celowo NIE przyznane anonimowym: phone, role, company_id, created_at.
