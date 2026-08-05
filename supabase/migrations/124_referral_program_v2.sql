-- ============================================================================
-- 119: Program poleceń v2 — czytelne kody `uNickImie8DJ9`, próg 250 zł
--      i wypłata obu stronom dopiero po jego przekroczeniu.
--
-- Stan zastany (2026-08-03): 146 uczniów ma kody w formacie `UN179B4FE`,
-- a poleceń w bazie jest ZERO. Powody były trzy i tylko jeden dotyczył kodu:
--   1. `referralCode` trafiał do payloadu wyłącznie na ścieżce `online`
--      (BookingWizard.tsx:118) — zapis do grupy i stacjonarny gubiły kod po
--      cichu. Naprawiane niżej po stronie SQL + osobno w kliencie.
--   2. Wypłata była natychmiastowa i bezwarunkowa — brak miejsca na próg.
--   3. Nikt o kodzie nie wiedział (brak w mailach) — poza zakresem migracji.
--
-- Decyzje właścicielskie zapisane w tej migracji:
--   * Kod budujemy z imienia OPIEKUNA (posiadacza konta), nie dziecka —
--     kod ląduje w publicznym linku, a 69 z 88 kont legacy to dzieci.
--   * Obie nagrody (50 zł + 50 zł) wypłacają się DOPIERO gdy polecony
--     wpłaci łącznie ≥ 250 zł. Nowy uczeń nie dostaje nic na starcie.
--   * Wszystkie stare kody przestają działać — przepisujemy 146 rekordów.
--
-- „Wykupić lekcje za 250 zł" = suma transakcji typu `payment` (realne wpłaty),
-- a nie `charge` (naliczenia). Naliczenie bez wpłaty nie uruchamia nagrody.
-- ============================================================================


-- ── 1. Generator kodu ───────────────────────────────────────────────────────

-- Transliteracja polskich znaków. „Michał" → „Michal": bez tego kod trafia do
-- URL-a jako %C5%82 i część klientów WhatsApp urywa link.
create or replace function public.slugify_first_name(p_name text)
returns text
language sql
immutable
set search_path to 'public'
as $$
  select coalesce(
    nullif(
      regexp_replace(
        initcap(lower(split_part(btrim(translate(
          coalesce(p_name, ''),
          'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ',
          'acelnoszzACELNOSZZ'
        )), ' ', 1))),
        '[^A-Za-z]', '', 'g'
      ),
      ''
    ),
    'Uczen'   -- awaryjnie, gdy imienia brak albo składa się z samych znaków spec.
  )
$$;

comment on function public.slugify_first_name(text) is
  'Pierwszy człon imienia bez polskich znaków, z wielkiej litery. Używane do budowy kodu polecenia.';

revoke execute on function public.slugify_first_name(text) from public, anon;
grant  execute on function public.slugify_first_name(text) to authenticated, service_role;


-- Cztery znaki z alfabetu BEZ 0/O/1/I/L — kod bywa dyktowany przez telefon
-- i przepisywany z ekranu, a te znaki gwarantują pomyłki.
-- 32^4 ≈ 1,05 mln kombinacji na imię: kolizje praktycznie nie występują,
-- a i tak pilnuje ich pętla z unikalnym indeksem.
create or replace function public.generate_referral_code(p_name text)
returns text
language plpgsql
volatile
set search_path to 'public'
as $$
declare
  v_alfabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_imie    text := left(public.slugify_first_name(p_name), 12);
  v_kod     text;
  i         int;
begin
  for _ in 1..50 loop
    v_kod := 'uNick' || v_imie;
    for i in 1..4 loop
      v_kod := v_kod || substr(v_alfabet, 1 + floor(random() * length(v_alfabet))::int, 1);
    end loop;

    -- Porównanie bez wielkości liter: formularz zapisu i tak bywa
    -- „poprawiany" przez autokorektę na telefonie.
    if not exists (
      select 1 from public.students s where lower(s.referral_code) = lower(v_kod)
    ) then
      return v_kod;
    end if;
  end loop;

  raise exception 'Nie udało się wygenerować unikalnego kodu polecenia dla %', p_name;
end $$;

comment on function public.generate_referral_code(text) is
  'Zwraca kod w formacie uNickImie8DJ9. Alfabet bez znaków mylących (0/O/1/I/L). Unikalność sprawdzana bez wielkości liter.';

revoke execute on function public.generate_referral_code(text) from public, anon;
grant  execute on function public.generate_referral_code(text) to authenticated, service_role;


-- ── 2. Przepisanie 146 istniejących kodów ───────────────────────────────────
-- Imię bierzemy z opiekuna, a gdy go nie ma (uczeń dorosły) — z posiadacza
-- konta. `students.full_name` (imię dziecka) używamy dopiero w ostateczności.
do $$
declare
  r record;
begin
  for r in
    select s.id, coalesce(nullif(btrim(s.guardian_name), ''),
                          nullif(btrim(p.full_name), ''),
                          nullif(btrim(s.full_name), '')) as imie
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where s.referral_code !~ '^uNick'      -- idempotencja: nie ruszamy już przepisanych
  loop
    update public.students
       set referral_code = public.generate_referral_code(r.imie)
     where id = r.id;
  end loop;
end $$;

-- Unikalność bez rozróżniania wielkości liter (obok istniejącego
-- students_referral_code_key, które jest wrażliwe na wielkość).
create unique index if not exists students_referral_code_lower_uniq
  on public.students (lower(referral_code));


-- ── 3. Rozbudowa tabeli referrals ───────────────────────────────────────────
-- Dotąd wiersz w `referrals` powstawał już PO wypłacie, więc nie było czego
-- śledzić. Teraz wiersz powstaje w chwili zapisu i żyje do rozliczenia.

do $$ begin
  create type public.referral_status as enum ('pending', 'paid', 'rejected', 'expired');
exception when duplicate_object then null; end $$;

alter table public.referrals
  add column if not exists status              public.referral_status not null default 'pending',
  add column if not exists threshold_pln       numeric(10,2) not null default 250,
  add column if not exists reward_referrer_pln numeric(10,2) not null default 50,
  add column if not exists reward_referred_pln numeric(10,2) not null default 50,
  add column if not exists qualified_at        timestamptz,
  add column if not exists paid_at             timestamptz,
  add column if not exists rejected_reason     text,
  add column if not exists expires_at          timestamptz;

comment on column public.referrals.threshold_pln is
  'Próg wpłat poleconego odblokowujący obie nagrody. Zapisany na rekordzie, żeby zmiana regulaminu nie zmieniała zasad ludziom w trakcie.';
comment on column public.referrals.status is
  'pending → paid (po przekroczeniu progu) | rejected (nadużycie) | expired (próg nieosiągnięty w terminie).';

-- Jeden nowy uczeń = jedno polecenie. Bez tego da się podpiąć go pod kilku
-- polecających i wypłacić nagrodę wielokrotnie.
create unique index if not exists referrals_referred_uniq
  on public.referrals (referred_id);

create index if not exists referrals_status_idx    on public.referrals (status, created_at desc);
create index if not exists referrals_referrer_idx  on public.referrals (referrer_id, status);


-- ── 4. Rejestracja polecenia przy zapisie ───────────────────────────────────
-- Jedno miejsce z całą walidacją; wołane ze wszystkich trzech ścieżek zapisu.
-- Nie rzuca wyjątkiem przy złym kodzie — zapis ucznia jest ważniejszy niż
-- polecenie i nie może się wywalić przez literówkę w kodzie.
create or replace function public.register_referral(p_code text, p_student_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ref        record;
  v_new        record;
  v_kod        text := nullif(btrim(coalesce(p_code, '')), '');
begin
  if v_kod is null then
    return 'brak_kodu';
  end if;

  select s.id, s.referral_code, p.email, p.phone, s.deleted_at
    into v_ref
    from public.students s
    join public.profiles p on p.id = s.profile_id
   where lower(s.referral_code) = lower(v_kod)
   limit 1;

  if v_ref.id is null then
    return 'kod_nieznany';
  end if;
  if v_ref.deleted_at is not null then
    return 'kod_nieaktywny';
  end if;

  select s.id, s.profile_id, p.email, p.phone
    into v_new
    from public.students s
    join public.profiles p on p.id = s.profile_id
   where s.id = p_student_id;

  if v_new.id is null then
    return 'brak_ucznia';
  end if;

  -- Polecanie samego siebie: ten sam rekord, to samo konto, ten sam e-mail
  -- albo ten sam telefon. Sam warunek `id <> id` (jak w starym kodzie) nie
  -- wystarczał — drugi adres e-mail obchodził go w całości.
  if v_ref.id = v_new.id then
    return 'samopolecenie';
  end if;
  if nullif(lower(btrim(coalesce(v_ref.email, ''))), '') is not null
     and nullif(lower(btrim(coalesce(v_ref.email, ''))), '')
       = nullif(lower(btrim(coalesce(v_new.email, ''))), '') then
    return 'samopolecenie';
  end if;
  if nullif(right(regexp_replace(coalesce(v_ref.phone, ''), '[^0-9]', '', 'g'), 9), '') is not null
     and nullif(right(regexp_replace(coalesce(v_ref.phone, ''), '[^0-9]', '', 'g'), 9), '')
       = nullif(right(regexp_replace(coalesce(v_new.phone, ''), '[^0-9]', '', 'g'), 9), '') then
    return 'samopolecenie';
  end if;

  -- Warunek z założeń: kod jest dla osób, których jeszcze u nas nie było.
  -- Sprawdzamy, czy ten kontakt nie ma STARSZEGO konta ucznia.
  if exists (
    select 1
      from public.students s2
      join public.profiles p2 on p2.id = s2.profile_id
     where s2.id <> v_new.id
       and s2.deleted_at is null
       and s2.joined_at < (select joined_at from public.students where id = v_new.id)
       and (
         nullif(lower(btrim(coalesce(p2.email, ''))), '')
           = nullif(lower(btrim(coalesce(v_new.email, ''))), '')
         or nullif(right(regexp_replace(coalesce(p2.phone, ''), '[^0-9]', '', 'g'), 9), '')
           = nullif(right(regexp_replace(coalesce(v_new.phone, ''), '[^0-9]', '', 'g'), 9), '')
       )
  ) then
    return 'juz_byl_uczniem';
  end if;

  if exists (select 1 from public.referrals where referred_id = v_new.id) then
    return 'juz_polecony';
  end if;

  insert into public.referrals (
    referrer_id, referred_id, code, status,
    referrer_credit, referred_discount,
    threshold_pln, reward_referrer_pln, reward_referred_pln,
    expires_at
  )
  values (
    v_ref.id, v_new.id, v_ref.referral_code, 'pending',
    50, 50,
    250, 50, 50,
    now() + interval '6 months'   -- nieosiągnięty próg nie wisi w nieskończoność
  );

  update public.students set referred_by = v_ref.referral_code where id = v_new.id;

  return 'zarejestrowano';
end $$;

comment on function public.register_referral(text, uuid) is
  'Waliduje kod i zakłada polecenie w stanie pending. Zwraca kod wyniku zamiast rzucać wyjątkiem — literówka nie może wywalić zapisu ucznia.';

revoke execute on function public.register_referral(text, uuid) from public, anon, authenticated;
grant  execute on function public.register_referral(text, uuid) to service_role;


-- ── 5. Rozliczenie po przekroczeniu progu ───────────────────────────────────
create or replace function public.settle_referral(p_student_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_r        record;
  v_wplacone numeric(10,2);
begin
  select * into v_r
    from public.referrals
   where referred_id = p_student_id and status = 'pending'
   limit 1;

  if v_r.id is null then
    return false;
  end if;

  if v_r.expires_at is not null and v_r.expires_at < now() then
    update public.referrals
       set status = 'expired',
           rejected_reason = 'Próg nieosiągnięty w terminie 6 miesięcy.'
     where id = v_r.id;
    return false;
  end if;

  -- Liczą się realne wpłaty, nie naliczenia.
  select coalesce(sum(amount), 0) into v_wplacone
    from public.transactions
   where student_id = p_student_id and type = 'payment';

  if v_wplacone < v_r.threshold_pln then
    return false;
  end if;

  insert into public.transactions (student_id, type, amount, description)
  values (v_r.referrer_id, 'credit', v_r.reward_referrer_pln,
          'Polecenie — znajomy rozpoczął naukę (kod ' || v_r.code || ')');

  insert into public.transactions (student_id, type, amount, description)
  values (v_r.referred_id, 'credit', v_r.reward_referred_pln,
          'Bonus powitalny za polecenie (kod ' || v_r.code || ')');

  update public.referrals
     set status = 'paid', qualified_at = coalesce(qualified_at, now()), paid_at = now()
   where id = v_r.id;

  return true;
end $$;

revoke execute on function public.settle_referral(uuid) from public, anon, authenticated;
grant  execute on function public.settle_referral(uuid) to service_role;


-- Wyzwalacz: każda wpłata sprawdza, czy nie domknęła progu.
-- Rekurencji nie ma — wypłata księguje wiersze typu `credit`, a wyzwalacz
-- reaguje wyłącznie na `payment` (klauzula WHEN).
create or replace function public.tg_settle_referral_on_payment()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform public.settle_referral(new.student_id);
  return null;
end $$;

drop trigger if exists transactions_settle_referral on public.transactions;
create trigger transactions_settle_referral
  after insert on public.transactions
  for each row
  when (new.type = 'payment')
  execute procedure public.tg_settle_referral_on_payment();

revoke execute on function public.tg_settle_referral_on_payment() from public, anon, authenticated;


-- ── 6. Wpięcie kodu we WSZYSTKIE trzy ścieżki zapisu ────────────────────────
-- Dotąd kod działał tylko przy `public_book_online`. Grupy — czyli produkt
-- wrześniowy, 13 aktywnych — gubiły go bez śladu.

-- 6a. Online: usuwamy natychmiastową, bezwarunkową wypłatę 50+50 i zastępujemy
--     ją rejestracją polecenia w stanie pending.
create or replace function public.public_book_online(
  p_email text, p_full_name text, p_phone text, p_child text, p_teacher uuid,
  p_starts timestamptz, p_ends timestamptz,
  p_ongoing boolean, p_weeks integer, p_referral text, p_discount text,
  p_terms_version integer, p_consents jsonb)
returns text
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare uid uuid; sid uuid; i int; n int; disc record; v_meet text;
begin
  uid := public._booking_ensure_account(p_email, p_full_name, p_phone);
  sid := public._booking_ensure_student(uid, coalesce(nullif(p_child,''), p_full_name), 'active', 'A1', 'zapisy_online');
  v_meet := 'https://meet.jit.si/uNick-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  n := case when p_ongoing then greatest(coalesce(p_weeks,12),1) else 1 end;
  for i in 0..(n-1) loop
    insert into public.lessons(student_id, teacher_id, type, format, starts_at, ends_at, level, is_confirmed, meeting_url)
    values(sid, p_teacher, 'online', 'individual',
      p_starts + (i * interval '7 days'), p_ends + (i * interval '7 days'), 'A1', false, v_meet);
  end loop;
  insert into public.consent_acceptances(student_id, email, full_name, terms_version, consents)
  values(sid, lower(p_email), p_full_name, p_terms_version, coalesce(p_consents,'{}'::jsonb));
  if p_discount is not null and p_discount <> '' then
    select * into disc from public.discount_codes where upper(code)=upper(p_discount) and is_active
      and (valid_until is null or valid_until >= current_date)
      and (max_uses is null or times_used < max_uses) limit 1;
    if disc.id is not null and disc.amount_off is not null then
      insert into public.transactions(student_id,type,amount,description)
        values(sid,'credit',disc.amount_off,'Kod rabatowy '||disc.code);
      update public.discount_codes set times_used = times_used + 1 where id = disc.id;
    end if;
  end if;
  perform public.register_referral(p_referral, sid);
  return v_meet;
end $function$;

-- 6b. Grupy: dochodzi parametr p_referral. Stara sygnatura znika, żeby nie
--     powstała dwuznaczna para przeciążeń.
drop function if exists public.public_enroll_group(text, text, text, text, uuid, integer, jsonb);

create function public.public_enroll_group(
  p_email text, p_full_name text, p_phone text, p_child text,
  p_group_id uuid, p_terms_version integer, p_consents jsonb,
  p_referral text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare uid uuid; sid uuid; cap int; cnt int; lvl language_level;
begin
  select capacity, level into cap, lvl from public.groups where id = p_group_id and is_active;
  if cap is null then raise exception 'Grupa niedostępna'; end if;
  select count(*) into cnt from public.group_members where group_id = p_group_id;
  if cnt >= cap then raise exception 'Brak wolnych miejsc w grupie'; end if;
  uid := public._booking_ensure_account(p_email, p_full_name, p_phone);
  sid := public._booking_ensure_student(uid, coalesce(nullif(p_child,''), p_full_name), 'active', lvl, 'zapisy_grupa');
  if not exists (select 1 from public.group_members where group_id = p_group_id and student_id = sid) then
    insert into public.group_members(group_id, student_id) values(p_group_id, sid);
  end if;
  insert into public.consent_acceptances(student_id, email, full_name, terms_version, consents)
  values(sid, lower(p_email), p_full_name, p_terms_version, coalesce(p_consents,'{}'::jsonb));
  perform public.register_referral(p_referral, sid);
end $function$;

-- 6c. Stacjonarny: to samo.
drop function if exists public.public_stationary_request(text, text, text, text, language_level, integer, text, jsonb, text, integer, jsonb);

create function public.public_stationary_request(
  p_email text, p_full_name text, p_phone text, p_child text,
  p_level language_level, p_age integer, p_address text, p_slots jsonb,
  p_notes text, p_terms_version integer, p_consents jsonb,
  p_referral text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare uid uuid; sid uuid;
begin
  if coalesce(p_address,'') = '' then raise exception 'Podaj adres zajęć'; end if;
  uid := public._booking_ensure_account(p_email, p_full_name, p_phone);
  sid := public._booking_ensure_student(uid, coalesce(nullif(p_child,''), p_full_name), 'trial', coalesce(p_level,'A1'), 'zapisy_stacjonarne');
  insert into public.booking_requests(full_name,email,phone,level,age,address,available_slots,notes,student_id)
  values(p_full_name, lower(p_email), nullif(p_phone,''), coalesce(p_level,'A1'), p_age, p_address,
    coalesce(p_slots,'[]'::jsonb), p_notes, sid);
  insert into public.consent_acceptances(student_id, email, full_name, terms_version, consents)
  values(sid, lower(p_email), p_full_name, p_terms_version, coalesce(p_consents,'{}'::jsonb));
  perform public.register_referral(p_referral, sid);
end $function$;

-- Uprawnienia jak w migracji 106: anon woła te funkcje z publicznego formularza.
grant execute on function public.public_enroll_group(text, text, text, text, uuid, integer, jsonb, text) to anon, authenticated;
grant execute on function public.public_stationary_request(text, text, text, text, language_level, integer, text, jsonb, text, integer, jsonb, text) to anon, authenticated;


-- ── 7. Widok postępu dla panelu ucznia ──────────────────────────────────────
-- Sedno pętli: polecający ma WIDZIEĆ, ile brakuje do jego 50 zł. Bez tego
-- między poleceniem a nagrodą są tygodnie ciszy.
create or replace view public.v_referral_progress
with (security_invoker = true) as
select
  r.id,
  r.referrer_id,
  r.referred_id,
  r.code,
  r.status,
  r.created_at,
  coalesce(nullif(btrim(sn.full_name), ''), pn.full_name)          as imie_polecony,
  r.threshold_pln                                                  as prog_pln,
  coalesce(w.wplacone, 0)                                          as wplacone_pln,
  greatest(r.threshold_pln - coalesce(w.wplacone, 0), 0)           as brakuje_pln,
  least(round(100.0 * coalesce(w.wplacone, 0) / nullif(r.threshold_pln, 0)), 100) as postep_pct,
  r.reward_referrer_pln,
  r.paid_at,
  r.expires_at
from public.referrals r
join public.students sn on sn.id = r.referred_id
join public.profiles pn on pn.id = sn.profile_id
left join lateral (
  select sum(t.amount) as wplacone
  from public.transactions t
  where t.student_id = r.referred_id and t.type = 'payment'
) w on true;

comment on view public.v_referral_progress is
  'Postęp poleconego do progu — zasila pasek „Kasia wpłaciła 160 z 250 zł" w panelu ucznia.';

revoke all  on public.v_referral_progress from anon, public;
grant select on public.v_referral_progress to authenticated;
