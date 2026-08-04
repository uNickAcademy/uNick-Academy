-- ============================================================================
-- 128: Generowanie lekcji dla grup
--
-- (Numer zmieniony ze 122 przy scaleniu: równolegle powstała inna migracja
--  o tym samym numerze. Obie są już zaaplikowane na produkcji i wzajemnie
--  niezależne, więc kolejność między nimi nie ma znaczenia.)
--
-- Problem: zapis do grupy dopisywał ucznia do `group_members` i na tym się
-- kończył. Nic nie tworzyło lekcji, więc w kalendarzu nie było ani jednej
-- przyszłej lekcji grupowej. Mail potwierdzający obiecywał „pierwsze zajęcia
-- 1 września", a panel ucznia świecił pustką — dokładnie w momencie, w którym
-- właśnie zdobyliśmy zaufanie.
--
-- Model: JEDNA lekcja na jedno spotkanie grupy, z `group_id` i `student_id`
-- pustym. Tak już czyta je panel ucznia (`getStudentLessons` łączy lekcje
-- własne z lekcjami grup, do których uczeń należy), więc nie mnożymy wierszy
-- per uczestnik — dopisanie kogoś do grupy w połowie semestru od razu pokazuje
-- mu cały harmonogram, a odejście niczego nie kasuje.
-- ============================================================================


-- ── 1. Ochrona przed duplikatami ────────────────────────────────────────────
-- Funkcja niżej i tak pomija istniejące terminy, ale indeks czyni ją odporną
-- na dwa równoległe wywołania (np. podwójne kliknięcie w panelu).

create unique index if not exists lessons_group_slot_uniq
  on public.lessons (group_id, starts_at)
  where group_id is not null;


-- ── 2. Generator ────────────────────────────────────────────────────────────
create or replace function public.generate_group_lessons(
  p_group_id uuid,
  p_duration_minutes integer default 60
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  g            record;
  v_time       time;
  v_date       date;
  v_target_dow integer;   -- ISO: 1 = poniedziałek … 7 = niedziela
  v_starts     timestamptz;
  v_created    integer := 0;
begin
  select id, teacher_id, day_of_week, schedule_text, start_date, end_date,
         level, format, is_active
    into g
    from public.groups
   where id = p_group_id;

  if not found then
    raise exception 'Nie ma grupy o podanym identyfikatorze.';
  end if;
  if g.teacher_id is null then
    raise exception 'Grupa nie ma przypisanego nauczyciela — bez tego nie da się utworzyć lekcji.';
  end if;
  if g.start_date is null or g.end_date is null then
    raise exception 'Grupa nie ma ustawionych dat semestru.';
  end if;
  if g.day_of_week is null then
    raise exception 'Grupa nie ma ustawionego dnia tygodnia.';
  end if;

  -- `schedule_text` to godzina wpisywana ręcznie w panelu. Jeśli ktoś wpisał
  -- tam opis zamiast godziny, wolimy jasny komunikat niż lekcje o północy.
  if g.schedule_text !~ '^[0-9]{1,2}:[0-9]{2}$' then
    raise exception 'Godzina zajęć („%") nie jest w formacie GG:MM.', g.schedule_text;
  end if;
  v_time := g.schedule_text::time;

  -- W bazie 0 = poniedziałek; `extract(isodow)` liczy od 1.
  v_target_dow := g.day_of_week + 1;

  v_date := g.start_date;
  while v_date <= g.end_date loop
    if extract(isodow from v_date)::integer = v_target_dow
       and not exists (
         select 1 from public.holidays h
          where v_date between h.start_date and h.end_date
       )
    then
      -- Godzina jest lokalna. Konwersja przez strefę, a nie przez stałe
      -- przesunięcie: rok szkolny przechodzi przez dwie zmiany czasu, więc
      -- inaczej połowa semestru wypadłaby o godzinę obok.
      v_starts := (v_date + v_time) at time zone 'Europe/Warsaw';

      insert into public.lessons (
        student_id, teacher_id, group_id, type, format, level,
        starts_at, ends_at, is_confirmed
      )
      values (
        null, g.teacher_id, g.id,
        (case when g.format = 'online' then 'online' else 'offline' end)::public.lesson_type,
        'group'::public.lesson_format,
        g.level,
        v_starts,
        v_starts + make_interval(mins => p_duration_minutes),
        true
      )
      on conflict do nothing;

      if found then
        v_created := v_created + 1;
      end if;
    end if;

    v_date := v_date + 1;
  end loop;

  return v_created;
end
$function$;

comment on function public.generate_group_lessons(uuid, integer) is
  'Tworzy lekcje dla grupy na każdy dzień zajęć od start_date do end_date, pomijając dni wolne z tabeli holidays. Idempotentna — istniejące terminy pomija. Zwraca liczbę utworzonych lekcji.';

revoke execute on function public.generate_group_lessons(uuid, integer) from public, anon;
grant  execute on function public.generate_group_lessons(uuid, integer) to service_role;


-- ── 3. Usuwanie przyszłych lekcji grupy ─────────────────────────────────────
-- Potrzebne, gdy zmieni się dzień albo godzina zajęć: kasujemy to, co jeszcze
-- się nie odbyło, i generujemy od nowa. Przeszłość zostaje nietknięta, bo
-- wisi na niej frekwencja i rozliczenia.
create or replace function public.clear_future_group_lessons(p_group_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_deleted integer;
begin
  with usuniete as (
    delete from public.lessons
     where group_id = p_group_id
       and starts_at > now()
       and attendance = 'scheduled'
    returning id
  )
  select count(*) into v_deleted from usuniete;
  return v_deleted;
end
$function$;

comment on function public.clear_future_group_lessons(uuid) is
  'Kasuje przyszłe, nieodbyte lekcje grupy. Przeszłość i lekcje z oznaczoną frekwencją zostają.';

revoke execute on function public.clear_future_group_lessons(uuid) from public, anon;
grant  execute on function public.clear_future_group_lessons(uuid) to service_role;
