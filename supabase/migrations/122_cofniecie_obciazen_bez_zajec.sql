-- Cofnięcie obciążeń naliczonych osobom bez zajęć (sierpień 2026).
--
-- Cron rozliczeniowy naliczał ryczałt z domyślnego planu cennika
-- (80 zł × 1 lekcja/tydz. × 4,33 = 346 zł) każdemu uczniowi o statusie
-- aktywny/próbny, bez sprawdzania, czy ten uczeń ma w danym miesiącu
-- jakiekolwiek zajęcia. 1.08.2026 poszło w ten sposób 93 obciążenia na
-- 32 178 zł — w tym 92 osobom, które w sierpniu nie miały ani jednej lekcji,
-- ani kursu w toku (grupy startują 1.09.2026).
--
-- Nikt z tych osób niczego nie wpłacił, żaden dokument księgowy nie powstał —
-- to artefakt błędu, nie zdarzenie gospodarcze. Usuwamy je, ale najpierw
-- odkładamy komplet danych do tabeli archiwalnej, żeby operacja była
-- odwracalna i możliwa do zaudytowania.
--
-- Reguła na przyszłość jest w src/lib/billing/engine.ts: brak kursu w toku
-- i brak lekcji w miesiącu = 0 zł, bez wyjątków.

CREATE TABLE IF NOT EXISTS transactions_voided (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  billing_period DATE,
  voided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  void_reason TEXT NOT NULL
);

ALTER TABLE transactions_voided ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin widzi cofnięte transakcje" ON transactions_voided;
CREATE POLICY "Admin widzi cofnięte transakcje" ON transactions_voided
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Obciążenia za sierpień 2026 dla uczniów, którzy nie mieli w tym miesiącu
-- ani jednej lekcji, ani kursu w toku.
WITH bez_zajec AS (
  SELECT t.*
    FROM transactions t
   WHERE t.type = 'charge'
     AND t.billing_period = DATE '2026-08-01'
     AND NOT EXISTS (
       SELECT 1 FROM lessons l
        WHERE l.student_id = t.student_id
          AND l.cancelled_at IS NULL
          AND l.starts_at >= TIMESTAMPTZ '2026-08-01'
          AND l.starts_at <  TIMESTAMPTZ '2026-09-01'
     )
     AND NOT EXISTS (
       SELECT 1 FROM group_members gm
         JOIN groups g ON g.id = gm.group_id
        WHERE gm.student_id = t.student_id
          AND (g.start_date IS NULL OR g.start_date <= DATE '2026-08-31')
          AND (g.end_date   IS NULL OR g.end_date   >= DATE '2026-08-01')
     )
)
INSERT INTO transactions_voided (id, student_id, type, amount, description, created_at, billing_period, void_reason)
SELECT id, student_id, type::text, amount, description, created_at, billing_period,
       'Naliczone mimo braku zajęć w sierpniu 2026 — błąd cyklu rozliczeniowego'
  FROM bez_zajec
ON CONFLICT (id) DO NOTHING;

-- Trigger recalc_student_balance przelicza saldo po każdym usunięciu.
DELETE FROM transactions t
 USING transactions_voided v
 WHERE t.id = v.id;

-- Uczeń z realnymi lekcjami w sierpniu: należność to liczba lekcji × stawka
-- z cennika (4 × 80 zł), a nie ryczałt 346 zł.
UPDATE transactions t
   SET amount = sub.nalezne,
       description = 'Abonament sierpień 2026 — Lekcje indywidualne (' || sub.lekcje || ' × 80 zł)'
  FROM (
    SELECT t2.id,
           (SELECT COUNT(*) FROM lessons l
             WHERE l.student_id = t2.student_id AND l.cancelled_at IS NULL AND l.group_id IS NULL
               AND l.starts_at >= TIMESTAMPTZ '2026-08-01' AND l.starts_at < TIMESTAMPTZ '2026-09-01') AS lekcje,
           (SELECT COUNT(*) * 80 FROM lessons l
             WHERE l.student_id = t2.student_id AND l.cancelled_at IS NULL AND l.group_id IS NULL
               AND l.starts_at >= TIMESTAMPTZ '2026-08-01' AND l.starts_at < TIMESTAMPTZ '2026-09-01') AS nalezne
      FROM transactions t2
     WHERE t2.type = 'charge' AND t2.billing_period = DATE '2026-08-01'
  ) sub
 WHERE t.id = sub.id
   AND sub.nalezne > 0
   AND t.amount <> sub.nalezne;

-- Status „zaległość" wynikał z fikcyjnego długu — po korekcie wraca aktywny.
UPDATE students
   SET status = 'active'
 WHERE status = 'overdue'
   AND credit_balance >= 0
   AND deleted_at IS NULL;
