-- 105: Domknięcie audytu bezpieczeństwa (Supabase security advisor).
-- Każdy punkt zweryfikowany pod kątem realnego wpływu przed naprawą:
--  - admin_create_hr / admin_create_student / hr_reschedule_lesson / list_billing_entities /
--    increment_unickorn_usage były wykonywalne przez `anon`. Pierwsze trzy mają wewnętrzne
--    sprawdzenie roli (RAISE EXCEPTION dla nie-admina/nie-HR) — nie były aktywnie
--    exploitowalne, ale zdejmujemy zbędne uprawnienie `anon` jako defense-in-depth.
--    increment_unickorn_usage NIE miała żadnego zabezpieczenia i nie jest dziś wywoływana
--    przez żaden kod aplikacji (martwa funkcja nieukończonej subskrypcji uNickorn) —
--    zdejmujemy anon całkowicie.
--  - _booking_ensure_account / _booking_ensure_student to wewnętrzne funkcje pomocnicze
--    wołane WYŁĄCZNIE z wnętrza innych funkcji SECURITY DEFINER (public_book_online itd.),
--    nigdy bezpośrednio z kodu aplikacji. Zdejmujemy EXECUTE dla anon i authenticated —
--    wywołania wewnętrzne (definer-owned) nie są tym ograniczone.
--  - handle_new_user (x2)/log_group_removal/recalc_student_balance to funkcje TRIGGER —
--    nie da się ich wywołać jako RPC (Postgres blokuje wywołanie typu `trigger` poza
--    kontekstem wyzwalacza), więc REVOKE tu tylko czyści fałszywy alarm, nie zmienia
--    działania samych wyzwalaczy (te nie są bramkowane uprawnieniem EXECUTE wołającego).
--  - Ustawienie search_path na functions bez niego (ochrona przed podmianą funkcji przez
--    obiekt o tej samej nazwie w innym schemacie, istotne zwłaszcza dla SECURITY DEFINER).
--  - Usunięcie nadmiarowej polityki SELECT na storage.objects dla lesson-files/teacher-photos:
--    oba buckety mają bucket.public=true, więc bezpośrednie linki (getPublicUrl) działają
--    niezależnie od tej polityki — usuwamy tylko możliwość WYLISTOWANIA całej zawartości
--    bucketu (zweryfikowane: aplikacja nigdzie nie woła storage .list()).

-- ── Zbędne uprawnienia anon na funkcjach z wewnętrznym sprawdzeniem roli ────
revoke execute on function public.admin_create_hr(text, text, text, uuid) from anon;
revoke execute on function public.admin_create_student(text, text, text, language_level, uuid) from anon;
revoke execute on function public.hr_reschedule_lesson(uuid, timestamptz, timestamptz) from anon;
revoke execute on function public.hr_reschedule_lesson(uuid, timestamptz, timestamptz, uuid) from anon;
revoke execute on function public.list_billing_entities() from anon;

-- ── Martwa, niezabezpieczona funkcja (nieużywana przez żaden kod) ──────────
revoke execute on function public.increment_unickorn_usage(uuid, text) from anon, authenticated;

-- ── Wewnętrzne helpery bookingu — tylko wywołania definer-owned od środka ──
revoke execute on function public._booking_ensure_account(text, text, text) from anon, authenticated;
revoke execute on function public._booking_ensure_student(uuid, text, student_status, language_level, text) from anon, authenticated;

-- ── Funkcje-wyzwalacze: RPC i tak niemożliwe, tylko czyścimy alarm ─────────
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function ufos.handle_new_user() from anon, authenticated;
revoke execute on function public.log_group_removal() from anon, authenticated;
revoke execute on function public.recalc_student_balance() from anon, authenticated;

-- ── search_path na funkcjach, które go nie miały ────────────────────────────
alter function public.handle_new_user() set search_path = 'public';
alter function public.increment_unickorn_usage(uuid, text) set search_path = 'public';
alter function public.list_billing_entities() set search_path = 'public', 'ufos';
alter function public.set_updated_at() set search_path = 'public';
alter function ufos.handle_new_user() set search_path = 'ufos', 'public';
alter function ufos.has_entity_access(uuid) set search_path = 'ufos';
alter function ufos.get_my_role(uuid) set search_path = 'ufos';
alter function ufos.update_updated_at() set search_path = 'ufos';
alter function ufos.default_checklist() set search_path = 'ufos';

-- ── Usunięcie możliwości wylistowania zawartości publicznych bucketów ──────
-- (bezpośrednie linki nadal działają — governed przez bucket.public=true, nie przez RLS)
drop policy if exists "Pliki lekcji publicznie czytelne" on storage.objects;
drop policy if exists "Teacher photos are publicly readable" on storage.objects;
