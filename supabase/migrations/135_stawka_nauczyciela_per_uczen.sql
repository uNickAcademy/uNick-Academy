-- Stawka wypłaty nauczyciela ustalona dla konkretnego ucznia/kursu.
--
-- custom_lesson_price (migracja 125) to cena dla klienta. Potrzebna jest
-- analogiczna kolumna po stronie kosztowej — stawka, jaką dostaje prowadzący
-- za pojedyncze zajęcia tego ucznia — żeby dało się ją zapamiętać i ponownie
-- nałożyć na przyszłe terminy przy edycji harmonogramu (panel Studenci),
-- tak samo jak dzieje się to przy zatwierdzaniu nowego zapisu.

ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_teacher_rate NUMERIC(10,2);

COMMENT ON COLUMN students.custom_teacher_rate IS
  'Stawka wypłaty nauczyciela za pojedyncze zajęcia z tym uczniem (zł/lekcja). Startuje z cennika nauczyciela, nadpisywalna ręcznie.';
