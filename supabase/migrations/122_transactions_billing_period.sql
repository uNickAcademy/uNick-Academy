-- Okres rozliczeniowy transakcji.
--
-- Do tej pory „czy uczeń ma już naliczony ten miesiąc?" sprawdzano po dacie
-- utworzenia transakcji i opisie zaczynającym się od „Abonament”. To wyklucza
-- naliczenie z góry (kurs startujący we wrześniu opłacany przy zapisie w
-- sierpniu) i rozjeżdża się przy każdej korekcie opisu. Trzymamy więc okres
-- wprost: pierwszy dzień rozliczanego miesiąca.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS billing_period DATE;

COMMENT ON COLUMN transactions.billing_period IS
  'Pierwszy dzień miesiąca, którego dotyczy obciążenie (NULL dla wpłat i korekt spoza cyklu).';

CREATE INDEX IF NOT EXISTS idx_transactions_student_period
  ON transactions(student_id, billing_period);

-- Dotychczasowe naliczenia abonamentu dotyczyły miesiąca, w którym powstały.
UPDATE transactions
   SET billing_period = date_trunc('month', created_at)::date
 WHERE billing_period IS NULL
   AND type = 'charge'
   AND description ILIKE 'Abonament%';
