-- Konfiguracja kursu indywidualnego przy zatwierdzaniu zapisu.
--
-- Do tej pory zatwierdzenie potrafiło tylko przesunąć gotową serię 12 lekcji
-- w jednym stałym terminie tygodniowo. Realne kursy mają kilka terminów
-- (np. wtorki i czwartki), własny czas trwania (lipiec–czerwiec), dni
-- wyłączone (Wigilia, ferie), stawkę prowadzącego i cenę za zajęcia.
--
-- Konkretne daty lekcji nadal żyją w tabeli lessons — tutaj trzymamy sam
-- przepis, żeby dało się go później otworzyć, poprawić i wygenerować serię
-- od nowa.

ALTER TABLE students ADD COLUMN IF NOT EXISTS course_config JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_lesson_price NUMERIC(10,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_mode TEXT
  CHECK (payment_mode IS NULL OR payment_mode IN ('monthly', 'upfront'));

COMMENT ON COLUMN students.course_config IS
  'Przepis na kurs: terminy tygodniowe, czas trwania i dni wyłączone. Z niego generowana jest seria lekcji.';
COMMENT ON COLUMN students.custom_lesson_price IS
  'Cena za pojedyncze zajęcia ustalona dla tego ucznia — ma pierwszeństwo przed cennikiem.';
COMMENT ON COLUMN students.payment_mode IS
  'monthly = klient płaci co miesiąc (domyślnie), upfront = całość kursu z góry.';

-- Pensja prowadzącego bywa ustalana per kurs, nie tylko globalnie w kartotece
-- nauczyciela — raporty biorą tę stawkę, gdy jest ustawiona.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS teacher_rate NUMERIC(10,2);

COMMENT ON COLUMN lessons.teacher_rate IS
  'Stawka prowadzącego za tę lekcję. NULL = stawka z kartoteki nauczyciela.';
