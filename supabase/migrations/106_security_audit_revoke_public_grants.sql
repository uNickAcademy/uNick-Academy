-- 106: Poprawka do 105 — poprzednia migracja odbierała EXECUTE tylko rolom
-- `anon`/`authenticated` wprost, ale wszystkie te funkcje miały OSOBNY grant
-- dla PUBLIC (domyślne zachowanie CREATE FUNCTION w Postgresie), który każda
-- rola dziedziczy niezależnie od jej własnych GRANT/REVOKE. Zweryfikowano
-- empirycznie: `admin_create_student` wciąż wykonywało się jako `anon` mimo
-- migracji 105. Właściwa naprawa to REVOKE ... FROM PUBLIC.
--
-- `authenticated` ma OSOBNY, jawny grant na tych funkcjach (niezależny od
-- PUBLIC) — zweryfikowane w information_schema.routine_privileges — więc
-- odebranie PUBLIC nie zabiera dostępu adminowi/HR zalogowanym przez appkę.

revoke execute on function public._booking_ensure_account(text, text, text) from public;
revoke execute on function public._booking_ensure_student(uuid, text, student_status, language_level, text) from public;
revoke execute on function public.admin_create_hr(text, text, text, uuid) from public;
revoke execute on function public.admin_create_student(text, text, text, language_level, uuid) from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.hr_reschedule_lesson(uuid, timestamptz, timestamptz) from public;
revoke execute on function public.hr_reschedule_lesson(uuid, timestamptz, timestamptz, uuid) from public;
revoke execute on function public.increment_unickorn_usage(uuid, text) from public;
revoke execute on function public.list_billing_entities() from public;
revoke execute on function public.log_group_removal() from public;
revoke execute on function public.recalc_student_balance() from public;
revoke execute on function ufos.handle_new_user() from public;

-- authenticated musi zachować dostęp do funkcji admina/HR wołanych z panelu
grant execute on function public.admin_create_hr(text, text, text, uuid) to authenticated;
grant execute on function public.admin_create_student(text, text, text, language_level, uuid) to authenticated;
grant execute on function public.hr_reschedule_lesson(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.hr_reschedule_lesson(uuid, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.list_billing_entities() to authenticated;
