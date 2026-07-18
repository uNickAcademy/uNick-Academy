-- 110: Grupy zajęć stacjonarnych uNick Academy 2026/2027 (wrzesień–czerwiec).
-- Lokalizacja: ul. Nowa 23, Rumianek. 8 miejsc/grupę, 250 zł/miesiąc, format offline.
-- Poziomy CEFR przypisane orientacyjnie (do korekty w panelu admina) — pole level
-- jest NOT NULL i pokazuje się jako badge na karcie zapisu. Nauczyciele nieprzypisani
-- (teacher_id NULL) — do uzupełnienia w /admin/grupy.
-- age_range trzyma faktyczny przedział wieku grupy (filtr na /zapisy buduje listę
-- z istniejących wartości, więc nie musi to być jeden z pięciu domyślnych kubełków).

insert into public.groups
  (name, level, color, is_active, capacity, price_per_month, format, day_of_week, age_range, schedule_text, description)
values
  -- Poniedziałek (day_of_week = 0)
  ('Little Explorers', 'A1', '#F59E0B', true, 8, 250, 'offline', 0, '4-6',
   'Poniedziałki 16:30 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Pierwsze spotkania z angielskim poprzez ruch, historie, piosenki i twórczą zabawę. Cel: dziecko rozumie coraz więcej angielskiego, reaguje bez tłumaczenia i nabiera odwagi do mówienia.'),
  ('Gaming Station', 'A1', '#7C3AED', true, 8, 250, 'offline', 0, '7-9',
   'Poniedziałki 17:40 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Angielski poprzez gry, misje, zagadki i zespołowe wyzwania. Cel: dziecko używa angielskiego jako narzędzia potrzebnego do zabawy, komunikacji i wspólnego celu.'),
  ('Teenage Talk', 'B1', '#DB2777', true, 8, 250, 'offline', 0, '13-17',
   'Poniedziałki 18:50 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Prawdziwe rozmowy po angielsku o tym, co interesuje młodych ludzi. Cel: uczestnik swobodniej wyraża opinie, rozwija wypowiedź i prowadzi naturalną rozmowę.'),

  -- Wtorek (day_of_week = 1)
  ('Crafty English', 'A1', '#16A34A', true, 8, 250, 'offline', 1, '6-9',
   'Wtorki 16:30 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Angielski poprzez tworzenie, projektowanie i pracę własnymi rękami. Cel: dziecko rozwija angielski, kreatywność i samodzielność, tworząc coś własnego.'),
  ('Science Explorers', 'A2', '#0891B2', true, 8, 250, 'offline', 1, '9-12',
   'Wtorki 17:40 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Eksperymenty, zagadki i odkrywanie świata po angielsku. Cel: dziecko uczy się zadawać pytania, opisywać obserwacje, stawiać hipotezy i wyciągać wnioski.'),
  ('Video Podcast Studio', 'A2', '#DC2626', true, 8, 250, 'offline', 1, '10-15',
   'Wtorki 18:50 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Kreatywne studio, w którym uczestnicy tworzą własny wideopodcast po angielsku. Cel: pewność przed kamerą, prowadzenie rozmowy i jasne wyrażanie myśli.'),

  -- Środa (day_of_week = 2)
  ('Big Action Games', 'A1', '#EA580C', true, 8, 250, 'offline', 2, '6-9',
   'Środy 16:30 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Angielski w ruchu, podczas zabawy, współpracy i dynamicznych wyzwań. Cel: dziecko mówi po angielsku spontanicznie, bo jest zaangażowane w zabawę.'),
  ('AI Creative Lab', 'A2', '#2563EB', true, 8, 250, 'offline', 2, '10-14',
   'Środy 17:40 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Sztuczna inteligencja, kreatywność i projekty przyszłości po angielsku. Cel: angielski, kreatywność, krytyczne myślenie i świadome korzystanie z AI.'),
  ('Teenpreneurs', 'B1', '#9333EA', true, 8, 250, 'offline', 2, '12-17',
   'Środy 18:50 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Od pomysłu do prawdziwego projektu. Po angielsku. Cel: praktyczne kompetencje przyszłości i przekonanie, że własny pomysł może stać się czymś realnym. Rok kończy Teenpreneurs Demo Day.'),

  -- Czwartek (day_of_week = 3)
  ('Wiecznie Początkujący Dorosły', 'A2', '#0D9488', true, 8, 250, 'offline', 3, '18+',
   'Czwartki 17:00 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Dla osób, które znają wiele słów i zasad, ale wciąż odczuwają blokadę podczas mówienia. Cel: uczestnik odzyskuje język, którego się uczył, i zaczyna go naprawdę używać.'),
  ('Advanced Conversation Club', 'C1', '#4F46E5', true, 8, 250, 'offline', 3, '18+',
   'Czwartki 18:00 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Dla osób, które już swobodnie mówią po angielsku, ale chcą mówić naturalniej i precyzyjniej. Cel: wyrażać się przekonująco, naturalnie i we własnym stylu.'),
  ('Angielski od podstaw', 'A1', '#65A30D', true, 8, 250, 'offline', 3, '18+',
   'Czwartki 19:00 (wrzesień–czerwiec) · ul. Nowa 23, Rumianek',
   'Spokojne, przyjazne zajęcia dla osób, które dopiero zaczynają lub chcą zacząć od nowa. Cel: solidne podstawy i mówienie od początku, zamiast miesięcy samych reguł.');
