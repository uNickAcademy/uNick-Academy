-- ============================================================================
-- 124: Wiersze testowe w logu kampanii.
-- Mail próbny idzie na dowolny adres i nie jest powiązany z uczniem, a chcemy
-- żeby miał prawdziwy track_token i dało się sprawdzić, czy zliczanie otwarć
-- i kliknięć faktycznie działa. Unikalność (campaign, student_id) nadal chroni
-- wysyłki właściwe: w Postgresie wartości NULL są w indeksie unikalnym
-- traktowane jako różne, więc wiele wierszy testowych może współistnieć.
-- ============================================================================
alter table public.email_campaign_log
  alter column student_id drop not null;

comment on column public.email_campaign_log.student_id is
  'NULL oznacza wysyłkę testową, niepowiązaną z kartoteką ucznia.';
