-- ============================================================================
-- 121: Przegenerowanie kodów poleceń z użyciem pick_first_name().
--
-- Kody z migracji 119 nie zostały nikomu przekazane (0 poleceń w bazie,
-- wdrożone tego samego dnia), więc nadpisujemy je bez okresu przejściowego.
-- Zmieniło się 89 ze 146 kodów — tyle trafiało w nazwisko zamiast w imię.
-- ============================================================================

create or replace function public.generate_referral_code(p_name text)
returns text
language plpgsql
volatile
set search_path to 'public'
as $$
declare
  v_alfabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_imie    text;
  v_kod     text;
  i         int;
begin
  select left(public.slugify_first_name(f.imie), 12) into v_imie
    from public.pick_first_name(p_name) f;

  v_imie := coalesce(nullif(v_imie, ''), 'Uczen');

  for _ in 1..50 loop
    v_kod := 'uNick' || v_imie;
    for i in 1..4 loop
      v_kod := v_kod || substr(v_alfabet, 1 + floor(random() * length(v_alfabet))::int, 1);
    end loop;

    if not exists (
      select 1 from public.students s where lower(s.referral_code) = lower(v_kod)
    ) then
      return v_kod;
    end if;
  end loop;

  raise exception 'Nie udało się wygenerować unikalnego kodu polecenia dla %', p_name;
end $$;

comment on function public.generate_referral_code(text) is
  'Kod uNickImie8DJ9. Imię wykrywane przez pick_first_name (obsługuje „Nazwisko Imię"). Alfabet bez znaków mylących.';

alter table public.students
  add column if not exists referral_code_confidence text;

comment on column public.students.referral_code_confidence is
  'Jak rozpoznano imię w kodzie: pewne (słownik) / koncowka / jeden_czlon / niepewne (do ręcznego przeglądu) / reczna_korekta.';

do $$
declare
  r record;
begin
  for r in
    select s.id,
           coalesce(nullif(btrim(s.guardian_name), ''),
                    nullif(btrim(p.full_name), ''),
                    nullif(btrim(s.full_name), '')) as zrodlo
    from public.students s
    join public.profiles p on p.id = s.profile_id
  loop
    update public.students
       set referral_code = public.generate_referral_code(r.zrodlo),
           referral_code_confidence = (select f.pewnosc from public.pick_first_name(r.zrodlo) f)
     where id = r.id;
  end loop;
end $$;

-- Korekta celowana: „Korbanek Mieszko" — Mieszko to imię, Korbanek nazwisko
-- bez typowej końcówki, a Mieszka nie było w słowniku.
update public.students
   set referral_code = public.generate_referral_code('Mieszko Korbanek'),
       referral_code_confidence = 'reczna_korekta'
 where referral_code like 'uNickKorbanek%';
