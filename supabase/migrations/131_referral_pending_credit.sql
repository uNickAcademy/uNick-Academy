-- ============================================================================
-- 131: Kredyt oczekujący z poleceń, widoczny dla obu stron.
--
-- Świadomie NIE tworzymy wierszy w `transactions`. Saldo ucznia liczy się
-- właśnie z nich, więc obiecane 50 zł pojawiłoby się jako realne pieniądze
-- zanim zostanie zarobione: uczeń zobaczyłby niższą kwotę do zapłaty, a
-- raporty finansowe pokazałyby przychód, którego nie ma. Kredyt oczekujący
-- to obietnica, nie zdarzenie gospodarcze, więc żyje w osobnym widoku.
-- Do `transactions` trafia dopiero settle_referral(), po przekroczeniu progu.
-- ============================================================================

create or replace view public.v_referral_pending_credit
with (security_invoker = true) as
select
  r.referrer_id                                   as student_id,
  'polecajacy'::text                              as rola,
  r.id                                            as referral_id,
  r.reward_referrer_pln                           as kwota_pln,
  r.threshold_pln                                 as prog_pln,
  coalesce(w.wplacone, 0)                         as wplacone_pln,
  greatest(r.threshold_pln - coalesce(w.wplacone, 0), 0) as brakuje_pln,
  least(round(100.0 * coalesce(w.wplacone, 0) / nullif(r.threshold_pln, 0)), 100) as postep_pct,
  coalesce(nullif(btrim(sn.full_name), ''), pn.full_name) as druga_strona,
  r.code,
  r.created_at,
  r.expires_at
from public.referrals r
join public.students sn on sn.id = r.referred_id
join public.profiles pn on pn.id = sn.profile_id
left join lateral (
  select sum(t.amount) as wplacone
  from public.transactions t
  where t.student_id = r.referred_id and t.type = 'payment'
) w on true
where r.status = 'pending'

union all

select
  r.referred_id,
  'polecony'::text,
  r.id,
  r.reward_referred_pln,
  r.threshold_pln,
  coalesce(w.wplacone, 0),
  greatest(r.threshold_pln - coalesce(w.wplacone, 0), 0),
  least(round(100.0 * coalesce(w.wplacone, 0) / nullif(r.threshold_pln, 0)), 100),
  coalesce(nullif(btrim(sr.full_name), ''), pr.full_name),
  r.code,
  r.created_at,
  r.expires_at
from public.referrals r
join public.students sr on sr.id = r.referrer_id
join public.profiles pr on pr.id = sr.profile_id
left join lateral (
  select sum(t.amount) as wplacone
  from public.transactions t
  where t.student_id = r.referred_id and t.type = 'payment'
) w on true
where r.status = 'pending';

comment on view public.v_referral_pending_credit is
  'Kredyt oczekujący (CREDIT PENDING) z poleceń, dla polecającego i poleconego. NIE wchodzi do salda — do transactions trafia dopiero settle_referral() po przekroczeniu progu.';

revoke all  on public.v_referral_pending_credit from anon, public;
grant select on public.v_referral_pending_credit to authenticated;
