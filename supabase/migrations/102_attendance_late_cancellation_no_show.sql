-- 102: Nowy model obecności
--  - Domyślnie lekcja = obecność (auto po zakończeniu; realizowane w cronie).
--  - Uczeń zgłasza nieobecność: >=24h przed startem -> 'excused' (do odrobienia),
--    <24h przed startem lub po -> 'late_cancellation' (lekcja przepada, liczona jako odbyta).
--  - Lektor może oznaczyć 'late_cancellation' albo 'no_show'.
--
-- Uwaga: ALTER TYPE ... ADD VALUE nie może działać w bloku transakcyjnym,
-- dlatego te wartości dodano bezpośrednio na bazie. Ten plik dokumentuje zmianę
-- i jest idempotentny przy odtwarzaniu środowiska.

alter type attendance_status add value if not exists 'late_cancellation';
alter type attendance_status add value if not exists 'no_show';
