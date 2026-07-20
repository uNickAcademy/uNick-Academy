-- 114: Ujednolicenie terminów grup — rok szkolny 2026/2027 i sama godzina.
-- schedule_text skracamy do formatu hh:mm (pierwsze wystąpienie godziny w opisie);
-- daty kursu ustawiamy na 1.09.2026 – 30.06.2027 dla wszystkich grup.
update public.groups set
  start_date = date '2026-09-01',
  end_date   = date '2027-06-30',
  schedule_text = coalesce(substring(schedule_text from '\d{1,2}:\d{2}'), schedule_text);
