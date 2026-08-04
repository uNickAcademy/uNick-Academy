-- Wykrywanie, łączenie i blokowanie duplikatów kartotek uczniów.
--
-- Skąd się brały: `_booking_ensure_student` szukał istniejącego ucznia przez
-- dokładną równość tekstu (`full_name = p_child`). „Bartl Klara" i „Klara
-- Bartl", „Kaczmarek Tymoteusz, Stanisław" i „Tymoteusz Stanisław Kaczmarek",
-- czy nazwa z końcową spacją zakładały za każdym razem nową kartotekę.
--
-- Uwaga na fałszywe trafienia: wspólny e-mail NIE oznacza duplikatu — model
-- zakłada rodzica z kilkorgiem dzieci pod jednym kontem (Kurek Marcel i Kurek
-- Igor to dwie osoby). Duplikat to ten sam człowiek: to samo konto i ta sama
-- nazwa po normalizacji.

-- ── Znormalizowany klucz nazwy ────────────────────────────────────────────
-- małe litery, polskie znaki bez ogonków, bez interpunkcji, słowa posortowane
-- alfabetycznie — dzięki temu kolejność imienia i nazwiska nie ma znaczenia.
CREATE OR REPLACE FUNCTION norm_name(txt TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT array_to_string(
    ARRAY(
      SELECT w FROM unnest(string_to_array(
        regexp_replace(
          lower(translate(coalesce(txt, ''), 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')),
          '[^a-z0-9 ]', ' ', 'g'),
        ' ')) w
      WHERE w <> ''
      ORDER BY w
    ), ' ');
$$;

COMMENT ON FUNCTION norm_name IS
  'Klucz porównawczy nazwy ucznia: bez wielkości liter, ogonków, interpunkcji i kolejności słów.';

-- ── Rejestr połączeń ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kept_student_id UUID NOT NULL REFERENCES students(id),
  merged_student_id UUID NOT NULL,
  merged_name TEXT,
  moved JSONB NOT NULL DEFAULT '{}'::jsonb,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student_merges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin widzi połączenia kartotek" ON student_merges;
CREATE POLICY "Admin widzi połączenia kartotek" ON student_merges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Łączenie kartotek ─────────────────────────────────────────────────────
-- Przepina wszystko, co wisi na duplikacie (lekcje, płatności, grupy, zgody,
-- faktury…), uzupełnia braki w rekordzie docelowym i oznacza duplikat jako
-- przeniesiony. Nic nie jest kasowane — historia zostaje pod jednym kontem.
CREATE OR REPLACE FUNCTION merge_students(p_keep UUID, p_merge UUID[])
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_profile UUID;
  v_moved JSONB := '{}'::jsonb;
  n INT;
BEGIN
  IF p_keep IS NULL OR p_merge IS NULL OR array_length(p_merge, 1) IS NULL THEN
    RAISE EXCEPTION 'Brak rekordów do połączenia';
  END IF;
  IF p_keep = ANY(p_merge) THEN
    RAISE EXCEPTION 'Rekord docelowy nie może być jednocześnie łączony';
  END IF;

  SELECT profile_id INTO v_profile FROM students WHERE id = p_keep AND deleted_at IS NULL;
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono kartoteki docelowej';
  END IF;

  -- Tabele bez ograniczeń unikalności — zwykłe przepięcie.
  UPDATE lessons SET student_id = p_keep WHERE student_id = ANY(p_merge);
  GET DIAGNOSTICS n = ROW_COUNT; v_moved := v_moved || jsonb_build_object('lekcje', n);

  UPDATE transactions SET student_id = p_keep WHERE student_id = ANY(p_merge);
  GET DIAGNOSTICS n = ROW_COUNT; v_moved := v_moved || jsonb_build_object('transakcje', n);

  UPDATE credit_transactions SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE invoices            SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE consent_acceptances SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE booking_requests    SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE admin_notifications SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE marketing_consents  SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE purchases           SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE tutor_sessions      SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE student_learning_history SET student_id = p_keep WHERE student_id = ANY(p_merge);
  UPDATE leads SET existing_student_id = p_keep WHERE existing_student_id = ANY(p_merge);

  -- Tabele z unikalnością — najpierw kasujemy kolizje, potem przepinamy resztę.
  DELETE FROM group_members m WHERE m.student_id = ANY(p_merge)
     AND EXISTS (SELECT 1 FROM group_members k WHERE k.student_id = p_keep AND k.group_id = m.group_id);
  UPDATE group_members SET student_id = p_keep WHERE student_id = ANY(p_merge);
  GET DIAGNOSTICS n = ROW_COUNT; v_moved := v_moved || jsonb_build_object('grupy', n);

  DELETE FROM enrollments e WHERE e.student_id = ANY(p_merge)
     AND EXISTS (SELECT 1 FROM enrollments k WHERE k.student_id = p_keep);
  UPDATE enrollments SET student_id = p_keep WHERE student_id = ANY(p_merge);

  DELETE FROM student_profile s WHERE s.student_id = ANY(p_merge)
     AND EXISTS (SELECT 1 FROM student_profile k WHERE k.student_id = p_keep);
  UPDATE student_profile SET student_id = p_keep WHERE student_id = ANY(p_merge);

  DELETE FROM usage_counters u WHERE u.student_id = ANY(p_merge)
     AND EXISTS (SELECT 1 FROM usage_counters k WHERE k.student_id = p_keep AND k.period = u.period);
  UPDATE usage_counters SET student_id = p_keep WHERE student_id = ANY(p_merge);

  DELETE FROM reactivation_candidates r WHERE r.student_id = ANY(p_merge)
     AND EXISTS (SELECT 1 FROM reactivation_candidates k WHERE k.student_id = p_keep AND k.campaign_id = r.campaign_id);
  UPDATE reactivation_candidates SET student_id = p_keep WHERE student_id = ANY(p_merge);

  DELETE FROM billing_incident_snapshot b WHERE b.student_id = ANY(p_merge)
     AND EXISTS (SELECT 1 FROM billing_incident_snapshot k WHERE k.student_id = p_keep AND k.incident = b.incident);
  UPDATE billing_incident_snapshot SET student_id = p_keep WHERE student_id = ANY(p_merge);

  -- Polecenia: po scaleniu nikt nie może polecić sam siebie.
  UPDATE referrals SET referrer_id = p_keep WHERE referrer_id = ANY(p_merge);
  UPDATE referrals SET referred_id = p_keep WHERE referred_id = ANY(p_merge);
  DELETE FROM referrals WHERE referrer_id = referred_id;

  -- Uzupełnienie braków w kartotece docelowej danymi z duplikatów.
  UPDATE students k SET
    phone                = COALESCE(k.phone, src.phone),
    teacher_id           = COALESCE(k.teacher_id, src.teacher_id),
    custom_monthly_price = COALESCE(k.custom_monthly_price, src.custom_monthly_price),
    company_id           = COALESCE(k.company_id, src.company_id),
    company_name         = COALESCE(k.company_name, src.company_name),
    nip                  = COALESCE(k.nip, src.nip),
    guardian_name        = COALESCE(k.guardian_name, src.guardian_name),
    age                  = COALESCE(k.age, src.age),
    age_group            = COALESCE(k.age_group, src.age_group),
    stripe_customer_id   = COALESCE(k.stripe_customer_id, src.stripe_customer_id),
    joined_at            = LEAST(k.joined_at, src.joined_at)
  FROM (
    -- MIN pomija NULL-e, więc bierze pierwszą uzupełnioną wartość z duplikatów.
    SELECT MIN(joined_at) AS joined_at,
           MIN(phone) AS phone,
           MIN(teacher_id::text)::uuid AS teacher_id,
           MIN(custom_monthly_price) AS custom_monthly_price,
           MIN(company_id::text)::uuid AS company_id,
           MIN(company_name) AS company_name,
           MIN(nip) AS nip,
           MIN(guardian_name) AS guardian_name,
           MIN(age) AS age,
           MIN(age_group) AS age_group,
           MIN(stripe_customer_id) AS stripe_customer_id
      FROM students WHERE id = ANY(p_merge)
  ) src
  WHERE k.id = p_keep;

  INSERT INTO student_merges (kept_student_id, merged_student_id, merged_name, moved)
  SELECT p_keep, s.id, s.full_name, v_moved FROM students s WHERE s.id = ANY(p_merge);

  -- Duplikat trafia do poczekalni; saldo zeruje się razem z przepiętymi transakcjami.
  UPDATE students SET deleted_at = NOW(), credit_balance = 0 WHERE id = ANY(p_merge);

  -- Przeliczenie salda kartoteki docelowej po przepięciu transakcji.
  UPDATE students SET credit_balance = (
    SELECT COALESCE(SUM(CASE WHEN type = 'charge' THEN -amount ELSE amount END), 0)
      FROM transactions WHERE student_id = p_keep
  ) WHERE id = p_keep;

  RETURN v_moved || jsonb_build_object('polaczono', array_length(p_merge, 1));
END $$;

REVOKE ALL ON FUNCTION merge_students(UUID, UUID[]) FROM PUBLIC, anon, authenticated;

-- ── Zapobieganie ──────────────────────────────────────────────────────────
-- Dopasowanie po znormalizowanej nazwie zamiast dokładnej równości tekstu.
-- Kartoteki bez własnej nazwy (starsze rekordy) porównujemy z nazwą z profilu.
CREATE OR REPLACE FUNCTION _booking_ensure_student(
  p_uid UUID, p_child TEXT, p_status student_status, p_level language_level, p_source TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE sid UUID; v_key TEXT;
BEGIN
  v_key := norm_name(p_child);

  SELECT s.id INTO sid
    FROM students s
    LEFT JOIN profiles p ON p.id = s.profile_id
   WHERE s.profile_id = p_uid
     AND s.deleted_at IS NULL
     AND norm_name(COALESCE(NULLIF(TRIM(s.full_name), ''), p.full_name)) = v_key
   ORDER BY s.joined_at
   LIMIT 1;

  IF sid IS NULL THEN
    INSERT INTO students(profile_id, full_name, status, level, referral_code, signup_source)
    VALUES (p_uid, TRIM(p_child), p_status, p_level,
      'UN' || upper(substr(md5(random()::text || clock_timestamp()::text || p_child), 1, 7)),
      p_source)
    RETURNING id INTO sid;
  END IF;

  RETURN sid;
END $$;

-- Nazwa własna kartoteki dla starszych rekordów — żeby indeks poniżej objął
-- wszystkich. Bezpieczne: żaden profil nie ma dwóch kartotek bez nazwy.
UPDATE students s
   SET full_name = p.full_name
  FROM profiles p
 WHERE p.id = s.profile_id
   AND s.deleted_at IS NULL
   AND (s.full_name IS NULL OR TRIM(s.full_name) = '')
   AND p.full_name IS NOT NULL;

-- Połączenie duplikatów zastanych w bazie. Zostaje kartoteka z największym
-- dorobkiem (lekcje, grupy, płatności), przy remisie — najstarsza.
DO $$
DECLARE grp RECORD; v_keep UUID; v_rest UUID[];
BEGIN
  FOR grp IN
    SELECT s.profile_id, norm_name(s.full_name) AS klucz
      FROM students s
     WHERE s.deleted_at IS NULL AND s.full_name IS NOT NULL
     GROUP BY s.profile_id, norm_name(s.full_name)
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO v_keep FROM students s
     WHERE s.profile_id = grp.profile_id AND s.deleted_at IS NULL AND norm_name(s.full_name) = grp.klucz
     ORDER BY (
       (SELECT COUNT(*) FROM lessons l WHERE l.student_id = s.id AND l.cancelled_at IS NULL) +
       (SELECT COUNT(*) FROM group_members g WHERE g.student_id = s.id) +
       (SELECT COUNT(*) FROM transactions t WHERE t.student_id = s.id)
     ) DESC, s.joined_at ASC
     LIMIT 1;

    SELECT array_agg(id) INTO v_rest FROM students s
     WHERE s.profile_id = grp.profile_id AND s.deleted_at IS NULL
       AND norm_name(s.full_name) = grp.klucz AND s.id <> v_keep;

    IF v_rest IS NOT NULL THEN
      PERFORM merge_students(v_keep, v_rest);
    END IF;
  END LOOP;
END $$;

-- Twarda blokada: pod jednym kontem nie może istnieć druga kartoteka tej samej
-- osoby. Rodzeństwo ma różne nazwy, więc indeks go nie dotyka.
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_profile_name
  ON students (profile_id, norm_name(full_name))
  WHERE deleted_at IS NULL AND full_name IS NOT NULL;
