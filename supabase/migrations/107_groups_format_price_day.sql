-- 107: Rozszerzenie grup o dane potrzebne do filtrowania i pełnej prezentacji
-- przy publicznym zapisie: forma zajęć (stacjonarnie/online), cena, dzień
-- tygodnia jako pole strukturalne (do filtrowania — schedule_text zostaje
-- jako czytelny tekst do wyświetlenia, np. "Czwartki 18:00").
--
-- Grupa wiekowa (age_range) zostaje kolumną tekstową bez zmian — ograniczenie
-- do 5 kubełków (2-5, 6-9, 10-13, 14-18, 18+) wymuszamy na poziomie formularza
-- administracyjnego (select zamiast dowolnego tekstu), nie w bazie.

alter table public.groups
  add column if not exists format lesson_type,
  add column if not exists price_per_month numeric(10,2),
  add column if not exists day_of_week smallint;

alter table public.groups
  drop constraint if exists groups_day_of_week_check;
alter table public.groups
  add constraint groups_day_of_week_check check (day_of_week is null or day_of_week between 0 and 6);

comment on column public.groups.format is 'online / offline — forma zajęć grupowych';
comment on column public.groups.price_per_month is 'Miesięczna cena za udział w grupie (zł), opcjonalna';
comment on column public.groups.day_of_week is 'Dzień tygodnia zajęć: 0=poniedziałek .. 6=niedziela (konwencja jak w availability.day_of_week)';

-- Backfill jedynej istniejącej grupy na podstawie jej opisu/harmonogramu
-- ("Stacjonarnie w Rumianku", "Czwartki 18:00" → offline, czwartek=3)
update public.groups
set format = 'offline', day_of_week = 3
where schedule_text = 'Czwartki 18:00' and format is null;
