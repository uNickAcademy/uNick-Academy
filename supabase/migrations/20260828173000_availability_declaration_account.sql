-- ============================================================================
-- Zgłoszenie dostępności zakłada od razu konto (wzorzec z public_book_online /
-- public_enroll_group / public_stationary_request — _booking_ensure_account +
-- _booking_ensure_student — dokładnie ten sam mechanizm, którego już używa
-- ścieżka „doradztwo / zajęcia indywidualne” w src/app/api/booking/route.ts,
-- gdzie konto też powstaje od razu, żeby klient nie musiał zakładać go
-- osobno).
--
-- Dzięki temu:
--   - przyznany kod polecenia to PRAWDZIWY students.referral_code (nie
--     osobno wygenerowany, zarezerwowany napis) — działa w register_referral
--     od razu, bez ręcznego przepisywania przy późniejszym zapisie;
--   - kod POLECONY PRZEZ (jeśli rodzina go podała) rejestruje się od razu
--     przez register_referral — nie trzeba czekać na realny zapis;
--   - rodzina, która się zdecyduje, tylko ustawia hasło (link w mailu
--     podziękowania) — reszta danych już czeka.
--
-- Konto ma status 'trial' (tak samo jak każdy nowy zapis w tym systemie) i
-- signup_source = 'formularz_dostepnosc', żeby dało się je odróżnić od
-- realnych zapisów w raportach i — gdyby nabór trzeba było kiedyś w całości
-- wycofać — łatwo znaleźć te konta, które nigdy nie ruszyły dalej.
-- ============================================================================

alter table public.availability_declarations
  add column student_id uuid references public.students(id) on delete set null;

comment on column public.availability_declarations.student_id is
  'Uczeń założony automatycznie przy zgłoszeniu (status trial, signup_source ''formularz_dostepnosc''). Ten sam wiersz co profile.id po stronie auth.users/profiles — rodzina loguje się tym samym e-mailem, gdy ustawi hasło.';

comment on column public.availability_declarations.assigned_referral_code is
  'Prawdziwy students.referral_code przyznanego od razu konta (patrz student_id) — działa w register_referral natychmiast, bez ręcznego przepisywania.';

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

  -- Poziom z formularza to zgrubna samoocena rodzica na potrzeby grafiku, nie
  -- realna diagnoza — konto dostaje domyślne A1, tak jak każdy nowy zapis;
  -- prawdziwy poziom ustali nauczyciel na pierwszych zajęciach.
  sid := public._booking_ensure_student(
    uid, coalesce(nullif(btrim(p_child_name), ''), p_parent_first_name), 'trial', 'A1', 'formularz_dostepnosc'
  );

  select s.referral_code into v_code from public.students s where s.id = sid;

  insert into public.availability_declarations(
    parent_first_name, parent_last_name, email, phone, child_name, child_age, level,
    mode, class_format, address, school_name, school_city,
    availability, availability_text, notes,
    referral_code, assigned_referral_code, student_id
  ) values (
    p_parent_first_name, p_parent_last_name, lower(btrim(p_email)), p_phone, p_child_name, p_child_age,
    nullif(p_level, ''),
    p_mode, p_class_format, nullif(p_address, ''), nullif(p_school_name, ''), nullif(p_school_city, ''),
    p_availability, p_availability_text, nullif(p_notes, ''),
    nullif(btrim(coalesce(p_referral, '')), ''), v_code, sid
  ) returning id into v_decl_id;

  -- Kod POLECONY PRZEZ tę rodzinę (jeśli podała) — rejestruje relację od razu
  -- (świadczenie naliczy się dopiero po realnej wpłacie, ale nie trzeba już
  -- czekać na ręczne dopisanie kodu przy zapisie).
  perform public.register_referral(p_referral, sid);

  return query select v_decl_id, v_code;
end
$function$;

revoke all on function public.public_availability_declaration(
  text, text, text, text, text, integer, text, text[], text[], text, text, text, jsonb, text, text, text
) from public;
grant execute on function public.public_availability_declaration(
  text, text, text, text, text, integer, text, text[], text[], text, text, text, jsonb, text, text, text
) to anon, authenticated;
