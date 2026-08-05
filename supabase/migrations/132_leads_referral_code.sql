-- ============================================================================
-- 132: Kod polecenia na leadzie + automatyczne przeniesienie go na zapis.
--
-- Ścieżki „porada" i „zajęcia indywidualne" tworzą leada, a nie ucznia, więc
-- podany przy nich kod polecenia nie miał się z czym powiązać i przepadał.
-- Teraz siedzi na leadzie i sam wchodzi w grę, gdy ta osoba faktycznie się
-- zapisze, niezależnie od tego, którą ścieżką i po jakim czasie.
--
-- Rozwiązanie celowo NIE wymaga zmian w miejscach zapisu: fallback siedzi
-- w register_referral, więc każda obecna i przyszła ścieżka dostaje to za darmo.
-- ============================================================================

alter table public.leads
  add column if not exists referral_code text;

comment on column public.leads.referral_code is
  'Kod polecenia podany przy zgłoszeniu. Przenoszony na polecenie automatycznie w chwili zapisu (register_referral).';

create index if not exists leads_referral_code_idx
  on public.leads (lower(referral_code)) where referral_code is not null;

create or replace function public.register_referral(p_code text, p_student_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ref  record;
  v_new  record;
  v_kod  text := nullif(btrim(coalesce(p_code, '')), '');
begin
  select s.id, s.profile_id, p.email, p.phone
    into v_new
    from public.students s
    join public.profiles p on p.id = s.profile_id
   where s.id = p_student_id;

  if v_new.id is null then
    return 'brak_ucznia';
  end if;

  -- Kod nie przyszedł z formularza? Sprawdzamy, czy ta osoba nie zostawiła go
  -- wcześniej jako lead (np. przy zapisie na rozmowę doradczą).
  if v_kod is null then
    select nullif(btrim(l.referral_code), '') into v_kod
      from public.leads l
     where l.referral_code is not null
       and (
         (l.email_norm is not null
           and l.email_norm = nullif(lower(btrim(coalesce(v_new.email, ''))), ''))
         or (l.phone_norm is not null
           and l.phone_norm = nullif(right(regexp_replace(coalesce(v_new.phone, ''), '[^0-9]', '', 'g'), 9), ''))
       )
     order by l.created_at desc
     limit 1;
  end if;

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
    50, 50, 250, 50, 50,
    now() + interval '6 months'
  );

  update public.students set referred_by = v_ref.referral_code where id = v_new.id;

  return 'zarejestrowano';
end $$;

comment on function public.register_referral(text, uuid) is
  'Zakłada polecenie w stanie pending. Gdy kod nie przyszedł z formularza, sięga po zapisany wcześniej na leadzie tej samej osoby. Zwraca kod wyniku zamiast wyjątku.';

revoke execute on function public.register_referral(text, uuid) from public, anon, authenticated;
grant  execute on function public.register_referral(text, uuid) to service_role;

-- Śledzenie skuteczności kodów: od kliknięcia w link do wypłaconej nagrody.
create or replace view public.v_referral_tracking
with (security_invoker = true) as
with kody as (
  select s.id as referrer_id, s.referral_code,
         coalesce(nullif(btrim(s.guardian_name), ''), p.full_name) as wlasciciel
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where s.deleted_at is null
)
select
  k.referral_code,
  k.wlasciciel,
  (select count(*) from public.leads l
    where lower(l.referral_code) = lower(k.referral_code))                    as leadow_z_kodem,
  (select count(*) from public.referrals r
    where lower(r.code) = lower(k.referral_code))                             as zarejestrowanych_polecen,
  (select count(*) from public.referrals r
    where lower(r.code) = lower(k.referral_code) and r.status = 'pending')    as oczekujacych,
  (select count(*) from public.referrals r
    where lower(r.code) = lower(k.referral_code) and r.status = 'paid')       as rozliczonych,
  (select count(*) from public.referrals r
    where lower(r.code) = lower(k.referral_code) and r.status = 'expired')    as wygaslych,
  (select coalesce(sum(r.reward_referrer_pln + r.reward_referred_pln), 0)
     from public.referrals r
    where lower(r.code) = lower(k.referral_code) and r.status = 'paid')       as wyplacono_pln
from kody k
where exists (select 1 from public.leads l where lower(l.referral_code) = lower(k.referral_code))
   or exists (select 1 from public.referrals r where lower(r.code) = lower(k.referral_code));

comment on view public.v_referral_tracking is
  'Skuteczność kodów poleceń: ile leadów przyszło z kodem, ile zamieniło się w polecenia, ile rozliczono i za ile.';

revoke all  on public.v_referral_tracking from anon, public;
grant select on public.v_referral_tracking to authenticated;
