-- Zapisy online trafiają teraz do akceptacji administracji: lekcje powstają
-- jako niepotwierdzone (is_confirmed = false). Admin w /admin/zapisy ustala
-- nauczyciela, termin i link do zajęć, a dopiero zatwierdzenie potwierdza
-- lekcje i uruchamia płatność za pierwszą lekcję.
CREATE OR REPLACE FUNCTION public.public_book_online(
  p_email text, p_full_name text, p_phone text, p_child text, p_teacher uuid,
  p_starts timestamp with time zone, p_ends timestamp with time zone,
  p_ongoing boolean, p_weeks integer, p_referral text, p_discount text,
  p_terms_version integer, p_consents jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
declare uid uuid; sid uuid; i int; n int; disc record; ref_student uuid; v_meet text;
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
