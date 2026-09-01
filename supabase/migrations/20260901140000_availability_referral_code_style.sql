-- ============================================================================
-- Kod polecenia przyznawany przy zgłoszeniu dostępności wracał w brzydkim,
-- technicznym formacie „UN” + 7 losowych znaków — bo to auto-generowany kod
-- z _booking_ensure_student() (ten sam mechanizm co zwykłe zapisy online).
-- Chcemy ładniejszy, imienny format generate_referral_code() (np.
-- „uNickAnna8DJ9”), ale bez tworzenia OSOBNEGO, niepowiązanego kodu — ma być
-- dalej PRAWDZIWY kod tego konkretnego konta.
--
-- Rozwiązanie: sprawdzamy PRZED wywołaniem _booking_ensure_student(), czy
-- taki uczeń (profil + znormalizowane imię) już istnieje. Jeśli nie — to
-- świeżo założone konto, więc nadpisujemy jego auto-wygenerowany kod ładniej
-- wyglądającym z generate_referral_code(). Jeśli konto już istniało (np.
-- rodzina zgłasza się drugi raz, albo to już realny, aktywny uczeń) — NIE
-- ruszamy jego kodu, bo mógł już trafić do znajomych.
-- ============================================================================

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
  v_existing_sid uuid;
  v_learner_name text;
  v_code text;
  v_decl_id uuid;
begin
  uid := public._booking_ensure_account(
    p_email,
    nullif(btrim(coalesce(p_parent_first_name, '') || ' ' || coalesce(p_parent_last_name, '')), ''),
    p_phone
  );

  v_learner_name := coalesce(nullif(btrim(p_child_name), ''), p_parent_first_name);

  -- Ten sam warunek dopasowania co wewnątrz _booking_ensure_student() —
  -- sprawdzamy z wyprzedzeniem, żeby wiedzieć, czy zaraz powstanie NOWY
  -- wiersz (i wolno nadpisać jego kod), czy trafiamy w istniejący (nie wolno).
  select s.id into v_existing_sid
    from public.students s
    left join public.profiles p on p.id = s.profile_id
   where s.profile_id = uid
     and s.deleted_at is null
     and public.norm_name(coalesce(nullif(trim(s.full_name), ''), p.full_name)) = public.norm_name(v_learner_name)
   order by s.joined_at
   limit 1;

  sid := public._booking_ensure_student(uid, v_learner_name, 'trial', 'A1', 'formularz_dostepnosc');

  if v_existing_sid is null then
    select public.generate_referral_code(p_parent_first_name) into v_code;
    update public.students set referral_code = v_code where id = sid;
  else
    select s.referral_code into v_code from public.students s where s.id = sid;
  end if;

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
