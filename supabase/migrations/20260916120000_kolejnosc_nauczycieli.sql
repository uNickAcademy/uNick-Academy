-- Kolejność nauczycieli na stronie i zdjęcie Bertiego.
--
-- Reguła kolejności (ta sama, którą trzyma src/app/lib/teachers.js):
--   1  Nick i Toni, założyciele
--   2  ci, którzy mają film — nagranie jest najmocniejszym dowodem, jaki mamy
--   3  ci ze zdjęciem, bez filmu
--   4  na końcu ci bez zdjęcia i bez filmu
-- W obrębie grupy alfabetycznie.
--
-- Do tej pory `sort_order` miał 1 i 2 dla założycieli, a cała reszta 100, więc
-- o kolejności jedenastu osób decydował przypadek. Numery są rzadkie (10, 20,
-- 30...), żeby dało się kogoś wsunąć pomiędzy bez przenumerowywania wszystkich.
--
-- Zdjęcie Bertiego leży w repozytorium (public/team/bertie.png), a nie w
-- Supabase Storage, bo powstało poza panelem: tło zdjęte tym samym krokiem co
-- przy wgrywaniu z panelu, kadr 800x800 z przezroczystością. Gdy ktoś wgra je
-- jeszcze raz przez panel, trafi do Storage i ten adres się nadpisze.

update public.teachers t
set photo_url = 'https://unick-academy.pl/team/bertie.png'
from public.profiles p
where p.id = t.profile_id
  and p.full_name = 'Bertie'
  and t.photo_url is null;

update public.teachers t
set sort_order = v.pozycja
from public.profiles p,
     (values
        ('Nick', 10), ('Toni', 20),
        ('Bertie', 30), ('Gio', 40), ('Jack', 50),
        ('Shakina', 60), ('Tim', 70), ('Yan', 80),
        ('Adriana', 90), ('Elliott', 100), ('Mada', 110),
        ('Michelle', 120), ('Stefania', 130)
     ) as v(imie, pozycja)
where p.id = t.profile_id
  and p.full_name = v.imie;
