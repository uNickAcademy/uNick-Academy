-- 101: Utwardzenie publicznych zapisów
--  1. Losowe hasło startowe zamiast wspólnego dla wszystkich kont (logowanie przez "ustaw hasło")
--  2. Unikalny link do lekcji online per rezerwacja (zamiast wspólnego pokoju Meet)
--  3. Zapisywanie źródła zapisu (students.signup_source)
--  4. Polecenia trafiają też do tabeli referrals (historia poleceń w panelach)

-- ── 1. Losowe hasło startowe ──────────────────────────────────────────────
create or replace function public._booking_ensure_account(p_email text, p_full_name text, p_phone text)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare uid uuid; v_inst uuid;
begin
  select id into uid from auth.users where email = lower(p_email);
  if uid is null then
    select instance_id into v_inst from auth.users limit 1;
    uid := gen_random_uuid();
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
      confirmation_token,recovery_token,email_change_token_new,email_change,
      email_change_token_current,phone_change,phone_change_token,reauthentication_token)
    values(coalesce(v_inst,'00000000-0000-0000-0000-000000000000'),uid,'authenticated','authenticated',
      lower(p_email),
      -- hasło nieodgadywalne; uczeń ustawia własne przez /zapomniane-haslo
      crypt(md5(random()::text || clock_timestamp()::text || p_email), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name), now(),now(),
      '','','','','','','','');
    insert into auth.identities(provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values(uid::text, uid, jsonb_build_object('sub',uid::text,'email',lower(p_email),'email_verified',true),
      'email', now(),now(),now());
  end if;
  insert into public.profiles (id, email, full_name)
  values (uid, lower(p_email), p_full_name)
  on conflict (id) do nothing;
  update public.profiles set phone = coalesce(nullif(p_phone,''), phone),
         full_name = coalesce(full_name, p_full_name) where id = uid;
  return uid;
end $function$;

-- ── 2. Podkonto ucznia ze źródłem zapisu ──────────────────────────────────
drop function if exists public._booking_ensure_student(uuid, text, student_status, language_level);

create function public._booking_ensure_student(
  p_uid uuid, p_child text, p_status student_status, p_level language_level, p_source text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare sid uuid;
begin
  select id into sid from public.students where profile_id = p_uid and full_name = p_child and deleted_at is null limit 1;
  if sid is null then
    insert into public.students(profile_id, full_name, status, level, referral_code, signup_source)
    values(p_uid, p_child, p_status, p_level,
      'UN'||upper(substr(md5(random()::text||clock_timestamp()::text||p_child),1,7)),
      p_source)
    returning id into sid;
  end if;
  return sid;
end $function$;

-- ── 3+4. Rezerwacja online: unikalny link, referrals, źródło; zwraca link ─
drop function if exists public.public_book_online(
  text, text, text, text, uuid, timestamptz, timestamptz, boolean, integer, text, text, integer, jsonb);

create function public.public_book_online(
  p_email text, p_full_name text, p_phone text, p_child text,
  p_teacher uuid, p_starts timestamptz, p_ends timestamptz,
  p_ongoing boolean, p_weeks integer, p_referral text, p_discount text,
  p_terms_version integer, p_consents jsonb
)
returns text
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
declare uid uuid; sid uuid; i int; n int; disc record; ref_student uuid; v_meet text;
begin
  uid := public._booking_ensure_account(p_email, p_full_name, p_phone);
  sid := public._booking_ensure_student(uid, coalesce(nullif(p_child,''), p_full_name), 'active', 'A1', 'zapisy_online');
  -- Jeden stały, unikalny pokój na cały cykl zajęć tego ucznia
  v_meet := 'https://meet.jit.si/uNick-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
  n := case when p_ongoing then greatest(coalesce(p_weeks,12),1) else 1 end;
  for i in 0..(n-1) loop
    insert into public.lessons(student_id, teacher_id, type, format, starts_at, ends_at, level, is_confirmed, meeting_url)
    values(sid, p_teacher, 'online', 'individual',
      p_starts + (i * interval '7 days'), p_ends + (i * interval '7 days'), 'A1', true, v_meet);
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
  if p_referral is not null and p_referral <> '' then
    select id into ref_student from public.students where upper(referral_code)=upper(p_referral) and id<>sid limit 1;
    if ref_student is not null then
      insert into public.transactions(student_id,type,amount,description) values(ref_student,'credit',50,'Polecenie – nowy uczeń');
      insert into public.transactions(student_id,type,amount,description) values(sid,'credit',50,'Rabat za polecenie');
      insert into public.referrals(referrer_id, referred_id, code, referrer_credit, referred_discount)
      values(ref_student, sid, upper(p_referral), 50, 50);
      update public.students set referred_by = upper(p_referral) where id = sid;
    end if;
  end if;
  return v_meet;
end $function$;

-- ── Źródło zapisu w pozostałych ścieżkach ─────────────────────────────────
create or replace function public.public_enroll_group(
  p_email text, p_full_name text, p_phone text, p_child text,
  p_group_id uuid, p_terms_version integer, p_consents jsonb
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
end $function$;

create or replace function public.public_stationary_request(
  p_email text, p_full_name text, p_phone text, p_child text,
  p_level language_level, p_age integer, p_address text, p_slots jsonb,
  p_notes text, p_terms_version integer, p_consents jsonb
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
end $function$;
