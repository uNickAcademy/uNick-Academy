-- Stawki za lekcje indywidualne online — per nauczyciel, per pojedyncze zajęcia.
--
-- Cena dla klienta i stawka wypłaty nauczyciela liczą się od pojedynczych
-- zajęć (30 min), nie od godziny — miesięczna opłata to ta stawka razy liczba
-- zajęć wypadających w danym miesiącu (patrz lib/lessons/schedule.ts
-- lessonsPerMonth + lib/billing/engine.ts). Istniejące hourly_rate/rate_group
-- zostają bez zmian — służą do rozliczeń godzinowych w raportach płac i nie
-- są tym samym pojęciem.
--
-- Wartości domyślne to punkt startowy dla formularza zatwierdzania zapisu
-- (admin/zapisy) — admin może je nadpisać ręcznie dla konkretnego kursu.

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS online_individual_client_rate NUMERIC(10,2);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS online_individual_pay_rate NUMERIC(10,2);

COMMENT ON COLUMN teachers.online_individual_client_rate IS
  'Domyślna cena dla klienta za pojedyncze zajęcia indywidualne online (zł/lekcja, 30 min). Nadpisywalna ręcznie przy zatwierdzaniu kursu.';
COMMENT ON COLUMN teachers.online_individual_pay_rate IS
  'Domyślna stawka wypłaty nauczyciela za pojedyncze zajęcia indywidualne online (zł/lekcja, 30 min). Nadpisywalna ręcznie przy zatwierdzaniu kursu.';

-- Seed z cennika dostarczonego przez szkołę (Cennik_nauczycieli.xlsx).
-- Nazwy w arkuszu to pisownia potoczna, nie zawsze zgodna z kartoteką
-- (Elliot→Elliott, Tony→Toni, Michell→Michelle) — norm_name() ujednolica
-- wielkość liter i kolejność słów, ale nie koryguje pisowni, więc dla tych
-- trzech osób dopasowanie jest jawne.
WITH cennik(nazwa, stawka_platnosci, cena_klienta) AS (
  VALUES
    ('Nick', 90.00, 90.00),
    ('Shakina', 35.00, 60.00),
    ('Elliott', 45.00, 75.00),
    ('Toni', 35.00, 40.00),
    ('Jack', 35.00, 75.00),
    ('Adriana', 30.00, 60.00),
    ('Gio', 16.00, 50.00),
    ('Stefania', 30.00, 75.00),
    ('Michelle', 30.00, 60.00),
    ('Tim', 40.00, 75.00),
    ('Mada', 35.00, 60.00),
    ('Yan', 40.00, 75.00),
    ('Bertie', 30.00, 60.00)
)
UPDATE teachers t
   SET online_individual_pay_rate = c.stawka_platnosci,
       online_individual_client_rate = c.cena_klienta
  FROM cennik c
  JOIN profiles p ON norm_name(p.full_name) = norm_name(c.nazwa)
 WHERE t.profile_id = p.id;
