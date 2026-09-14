-- Polish-only override for a teacher's bio, shown on /pl/meet-us. Falls back to
-- the existing single `bio` column (used on /en and whenever no translation is
-- set) so every teacher besides the ones we translate keeps behaving exactly
-- as before.
alter table public.teachers add column if not exists bio_pl text;

comment on column public.teachers.bio_pl is
  'Polish translation of bio, shown on /pl/meet-us; falls back to bio when null.';

-- Keep the anon public column grant (see migration 104) in sync with the new column.
grant select (bio_pl) on public.teachers to anon;
