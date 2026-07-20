-- 113: Daty rozpoczęcia i zakończenia kursu w grupach.
-- schedule_text staje się polem tylko na godzinę (np. "17:40"); termin (dzień)
-- trzyma day_of_week, a zakres kursu — start_date/end_date.
alter table public.groups
  add column if not exists start_date date,
  add column if not exists end_date date;
