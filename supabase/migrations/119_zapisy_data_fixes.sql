-- ============================================================================
-- 120: Naprawa danych pod przebudowę zapisów (Blok 1)
--
-- Numeracja: 116–118 należą do gałęzi `claude/ufos-sales-data-layer-oxcrqk`
-- (zaaplikowane na produkcji, pliki jeszcze poza `main`). Zostawiam lukę
-- 119 dla tamtej gałęzi i startuję od 120, żeby nie zderzyć numerów.
--
-- Zakres:
--   1. Publiczny licznik miejsc w grupach (naprawa fałszywego „8 wolnych")
--   2. Flaga `is_bookable_online` dla nauczycieli bez grafiku
--   3. Język nauczyciela (kolumna + dane)
--   4. Nazwy i opis dwóch grup dla dorosłych
-- ============================================================================


-- ── 1. Publiczny licznik miejsc ─────────────────────────────────────────────
--
-- Problem: `/zapisy` czyta bazę jako `anon`, a polityka RLS na `group_members`
-- brzmi „Członkostwa widoczne dla zalogowanych". Zagnieżdżony odczyt
-- `members:group_members(student_id)` zwraca więc PUSTĄ TABLICĘ — bez błędu.
-- Skutek: każda grupa pokazuje `taken = 0, spots = capacity`, badge „Lista
-- rezerwowa" jest publicznie nieosiągalny, a `public_enroll_group`
-- (SECURITY DEFINER, widzi prawdę) odrzuca zapis dopiero po wypełnieniu
-- całego formularza.
--
-- Rozwiązanie: funkcja SECURITY DEFINER zwracająca WYŁĄCZNIE liczby.
-- Nie rozluźniamy RLS na `group_members` — dane osobowe uczniów zostają
-- niewidoczne dla anonimowych. Na zewnątrz wychodzi para (group_id, taken).

create or replace function public.public_group_seat_counts()
returns table (group_id uuid, taken integer)
language sql
security definer
stable
set search_path to 'public'
as $$
  select g.id, coalesce(count(gm.student_id), 0)::integer
    from public.groups g
    left join public.group_members gm on gm.group_id = g.id
   where g.is_active
   group by g.id
$$;

comment on function public.public_group_seat_counts() is
  'Liczba zajętych miejsc w aktywnych grupach — wyłącznie liczby, bez danych osobowych. Omija RLS na group_members, żeby publiczna strona zapisów pokazywała prawdziwą dostępność.';

revoke execute on function public.public_group_seat_counts() from public;
grant  execute on function public.public_group_seat_counts() to anon, authenticated, service_role;


-- ── 2. Nauczyciele dostępni do rezerwacji online ────────────────────────────
--
-- Świadomie NIE ruszamy `is_active`. Pusta dostępność nie znaczy „nie pracuje":
-- Jack ma 128 przyszłych lekcji i zero wpisów w `availability`, Elliott 56,
-- Mada 21. Wyłączenie ich przez `is_active` wywaliłoby z systemu trzy osoby,
-- które realnie uczą. Stąd osobna flaga, dotycząca tylko rezerwacji online.

alter table public.teachers
  add column if not exists is_bookable_online boolean not null default true;

comment on column public.teachers.is_bookable_online is
  'Czy nauczyciel może być proponowany w publicznej rezerwacji online. Niezależne od is_active — nauczyciel bez opublikowanego grafiku nadal uczy, po prostu nie da się go zarezerwować samodzielnie.';

-- Wyłączamy tych, którzy nie mają ani jednego aktywnego slotu dostępności.
-- Warunek jest wyliczany z danych, nie z listy imion — po uzupełnieniu
-- grafiku wystarczy przestawić flagę z powrotem.
update public.teachers t
   set is_bookable_online = false
 where not exists (
   select 1 from public.availability a
    where a.teacher_id = t.id and a.is_active
 );


-- ── 3. Język nauczyciela ────────────────────────────────────────────────────
--
-- W bazie nie było ŻADNEGO pola na język — ani w `teachers`, ani w `groups`.
-- Decyzja: jeden język na osobę (nie tablica).
--
-- Uwaga do §3 briefu: po przeniesieniu zajęć indywidualnych na ścieżkę
-- „lead do rozmowy diagnostycznej" kreator nie wybiera już nauczyciela, więc
-- filtr języka nie ma tam gdzie zadziałać. Kolumna jest potrzebna publicznej
-- liście nauczycieli (`/nauczyciele`) i przyszłemu dopasowaniu — tam ją wepniemy.

do $$ begin
  create type public.teaching_language as enum ('en', 'es', 'de');
exception when duplicate_object then null; end $$;

alter table public.teachers
  add column if not exists language public.teaching_language not null default 'en';

comment on column public.teachers.language is
  'Język, którego uczy nauczyciel. Domyślnie angielski.';

-- Dane wg ustaleń: wszyscy angielski poza dwiema osobami.
update public.teachers t
   set language = 'es'
  from public.profiles p
 where p.id = t.profile_id and p.full_name = 'Adriana';

update public.teachers t
   set language = 'de'
  from public.profiles p
 where p.id = t.profile_id and p.full_name = 'Stefania';


-- ── 3b. Uprawnienia kolumnowe ───────────────────────────────────────────────
--
-- Migracja 104 zablokowała `teachers` białą listą kolumn — `anon` widzi tylko
-- wskazane, a `hourly_rate`, `rate_group`, `location` i `whatsapp_phone` są
-- przed nim ukryte. Nowa kolumna NIE dziedziczy tych uprawnień, więc bez
-- jawnego GRANT-a publiczna strona dostałaby błąd uprawnień przy odczycie.
-- Nadajemy dostęp wyłącznie do dwóch nowych, niewrażliwych kolumn.

grant select (is_bookable_online, language) on public.teachers to anon, authenticated;


-- ── 4. Dwie grupy dla dorosłych ─────────────────────────────────────────────
--
-- To nie są duplikaty: online obejmuje A1–A2 za 199 zł, stacjonarna A2–B1 za
-- 250 zł. Przez niemal identyczną nazwę wyglądają na pomyłkę po edycji.
-- Poziomy są już widoczne na karcie jako osobne plakietki, więc do nazwy
-- wchodzi tylko forma zajęć. Wersja online dostaje brakujący opis.

update public.groups
   set name = 'Wiecznie Początkujący Dorosły · online',
       description = 'Dla osób, które zaczynają od podstaw albo wracają do '
                  || 'angielskiego po latach przerwy. Zajęcia online, w małej '
                  || 'grupie, z naciskiem na mówienie od pierwszej lekcji.'
 where id = 'f49f4f7c-8978-46be-9be0-a2ab959d8b8b';

update public.groups
   set name = 'Wiecznie Początkujący Dorosły · stacjonarnie'
 where id = '0b30b7c1-5332-4ac3-859b-5d47e3bd662e';


-- ── Weryfikacja po uruchomieniu ─────────────────────────────────────────────
-- select count(*) filter (where is_bookable_online) as do_rezerwacji,
--        count(*) filter (where not is_bookable_online) as bez_grafiku,
--        count(*) filter (where language <> 'en') as inne_jezyki
--   from public.teachers where is_active;
-- select * from public.public_group_seat_counts() order by taken desc;
