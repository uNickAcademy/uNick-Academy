-- 111: Grupy — wiek jako zakres liczbowy (od/do) oraz wiele poziomów CEFR.
--
-- age_min / age_max zastępują tekstowe age_range (które zostaje jako pole
-- wyświetlane, aktualizowane z od/do przy zapisie — dla zgodności wstecznej).
-- age_max NULL oznacza "i więcej" (np. 18+); age_min NULL — "do X".
--
-- levels (tablica language_level) pozwala przypisać kilka poziomów naraz
-- (np. A1 i A2). Kolumna level (NOT NULL) zostaje i trzyma pierwszy z poziomów
-- — używa jej publiczny select i domyślny poziom lekcji, więc jej nie usuwamy.

alter table public.groups
  add column if not exists age_min smallint,
  add column if not exists age_max smallint,
  add column if not exists levels language_level[] not null default '{}';

-- Backfill poziomów: dotychczasowy pojedynczy level → jednoelementowa tablica
update public.groups
  set levels = array[level]
  where cardinality(levels) = 0;

-- Backfill wieku z tekstowego age_range:
--   "4-6"  → min 4, max 6
--   "18+"  → min 18, max NULL
update public.groups set
  age_min = case
    when age_range ~ '^\d+\s*-\s*\d+$' then split_part(replace(age_range, ' ', ''), '-', 1)::smallint
    when age_range ~ '^\d+\s*\+$' then regexp_replace(age_range, '\D', '', 'g')::smallint
    else age_min
  end,
  age_max = case
    when age_range ~ '^\d+\s*-\s*\d+$' then split_part(replace(age_range, ' ', ''), '-', 2)::smallint
    else age_max
  end
where age_range is not null and age_min is null;
