-- ============================================================================
-- „Dla mnie” w formularzu dostępności (/pl/dostepnosc) nie pyta już o wiek —
-- dorosły zgłaszający się dla siebie ma to samo imię co w danych kontaktowych,
-- a wiek nic nie zmienia w planowaniu (dorosłych i tak planuje się osobno od
-- grup dziecięcych). Kolumna była NOT NULL tylko dlatego, że formularz
-- wcześniej zakładał wyłącznie dziecko — teraz może być pusta.
--
-- CHECK (child_age between 2 and 99) zostaje bez zmian: w Postgresie warunek
-- CHECK przechodzi automatycznie, gdy wyrażenie daje NULL (nie FALSE), więc
-- nie trzeba go przepisywać — nadal pilnuje sensownego zakresu, gdy wiek
-- jest podany (zgłoszenie „dla dziecka").
-- ============================================================================

alter table public.availability_declarations
  alter column child_age drop not null;
