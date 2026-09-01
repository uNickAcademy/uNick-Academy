-- ============================================================================
-- Formularz dostępności (/pl/dostepnosc) dostaje pole „Preferowany
-- nauczyciel” (niewymagane, wolny tekst — nie realne przypisanie, tylko
-- życzenie do uwzględnienia przy układaniu grafiku).
--
-- Ta migracja też NADPISUJE public_availability_declaration() z
-- 20260828173000_availability_declaration_account.sql o nowy parametr
-- (p_preferred_teacher). Ponieważ zmienia się lista parametrów, dodajemy
-- najpierw `drop function if exists` na STARĄ sygnaturę — inaczej `create or
-- replace` (który wymaga identycznej listy parametrów, żeby faktycznie
-- podmienić funkcję) utworzyłby drugi, przeciążony wariant zamiast go
-- zastąpić, i baza odtworzona od zera z tych migracji skończyłaby z dwiema
-- wersjami tej samej funkcji. Na PRODUKCJI to i tak no-op: stara sygnatura
-- nigdy tam nie powstała (zablokowana wcześniej przez klasyfikator
-- bezpieczeństwa sesji, patrz docs/FORMULARZ-DOSTEPNOSCI.md) — funkcja
-- dopiero teraz powstanie, od razu w tej wersji.
-- ============================================================================

alter table public.availability_declarations
  add column preferred_teacher text;

drop function if exists public.public_availability_declaration(
  text, text, text, text, text, integer, text, text[], text[], text, text, text, jsonb, text, text, text
);

create or replace function public.public_availability_declaration(
  p_parent_first_name text,
  p_parent_last_name text,
  p_email text,
  p_phone text,
  p_child_name text,
  p_child_age integer,
  p_level text,
  p_mode text[],
  p_class_format text[],
  p_address text,
  p_school_name text,
  p_school_city text,
  p_availability jsonb,
  p_availability_text text,
  p_notes text,
  p_preferred_teacher text,
  p_referral text
)
returns table(declaration_id uuid, assigned_referral_code text)
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare
  uid uuid;
  sid uuid;
  v_code text;
  v_decl_id uuid;
begin
  uid := public._booking_ensure_account(
    p_email,
    nullif(btrim(coalesce(p_parent_first_name, '') || ' ' || coalesce(p_parent_last_name, '')), ''),
    p_phone
  );

  sid := public._booking_ensure_student(
    uid, coalesce(nullif(btrim(p_child_name), ''), p_parent_first_name), 'trial', 'A1', 'formularz_dostepnosc'
  );

  select s.referral_code into v_code from public.students s where s.id = sid;

  insert into public.availability_declarations(
    parent_first_name, parent_last_name, email, phone, child_name, child_age, level,
    mode, class_format, address, school_name, school_city,
    availability, availability_text, notes, preferred_teacher,
    referral_code, assigned_referral_code, student_id
  ) values (
    p_parent_first_name, p_parent_last_name, lower(btrim(p_email)), p_phone, p_child_name, p_child_age,
    nullif(p_level, ''),
    p_mode, p_class_format, nullif(p_address, ''), nullif(p_school_name, ''), nullif(p_school_city, ''),
    p_availability, p_availability_text, nullif(p_notes, ''), nullif(p_preferred_teacher, ''),
    nullif(btrim(coalesce(p_referral, '')), ''), v_code, sid
  ) returning id into v_decl_id;

  perform public.register_referral(p_referral, sid);

  return query select v_decl_id, v_code;
end
$function$;

revoke all on function public.public_availability_declaration(
  text, text, text, text, text, integer, text, text[], text[], text, text, text, jsonb, text, text, text, text
) from public;
grant execute on function public.public_availability_declaration(
  text, text, text, text, text, integer, text, text[], text[], text, text, text, jsonb, text, text, text, text
) to anon, authenticated;
