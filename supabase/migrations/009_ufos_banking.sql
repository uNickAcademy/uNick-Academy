-- uFOS Migration 009: Banking & reconciliation
-- VAT config per entity + bank accounts + bank transactions with reconciliation.
--
-- Business rules (confirmed with CFO):
--   UAI = B2C, VAT-exempt, bank account #1, pays all teachers except Nick
--   UA  = B2B, VAT 23%,     bank account #2, pays only Nick
--   Fundacja = inactive until September 2026

-- === VAT configuration per entity ===
ALTER TABLE ufos.entities
  ADD COLUMN IF NOT EXISTS vat_payer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) NOT NULL DEFAULT 0;

UPDATE ufos.entities SET vat_payer = false, vat_rate = 0  WHERE short_name = 'UAI';
UPDATE ufos.entities SET vat_payer = true,  vat_rate = 23 WHERE short_name = 'UA';
UPDATE ufos.entities SET vat_payer = false, vat_rate = 0  WHERE short_name = 'Fundacja';

-- === Bank accounts ===
CREATE TABLE IF NOT EXISTS ufos.bank_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       uuid NOT NULL REFERENCES ufos.entities(id),
  name            text NOT NULL,
  bank_name       text,
  iban            text,
  account_number  text,
  currency        text NOT NULL DEFAULT 'PLN',
  -- Open Banking integration (GoCardless Bank Account Data)
  provider            text,                   -- 'gocardless' | 'manual' | 'csv'
  provider_account_id text,                   -- account id at provider
  requisition_id      text,                   -- consent / requisition id
  last_synced_at  timestamptz,
  current_balance numeric(14,2),
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_entity ON ufos.bank_accounts(entity_id);

-- === Bank transactions ===
CREATE TABLE IF NOT EXISTS ufos.bank_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       uuid NOT NULL REFERENCES ufos.entities(id),
  account_id      uuid NOT NULL REFERENCES ufos.bank_accounts(id) ON DELETE CASCADE,
  external_id     text,                       -- provider tx id (dedup)
  booking_date    date NOT NULL,
  value_date      date,
  amount          numeric(14,2) NOT NULL,     -- positive = inflow, negative = outflow
  currency        text NOT NULL DEFAULT 'PLN',
  counterparty_name text,
  counterparty_iban text,
  description     text,                       -- transfer title
  -- Reconciliation
  match_status    text NOT NULL DEFAULT 'unmatched',
  -- 'unmatched' | 'matched' | 'ignored' | 'manual'
  matched_student_id uuid,                    -- link to public.students (id only, no FK across schema)
  matched_note    text,
  matched_by      uuid REFERENCES ufos.users(id),
  matched_at      timestamptz,
  raw_data        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_bank_tx_entity  ON ufos.bank_transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_account ON ufos.bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_status  ON ufos.bank_transactions(match_status);
CREATE INDEX IF NOT EXISTS idx_bank_tx_date    ON ufos.bank_transactions(booking_date DESC);

-- === RLS ===
ALTER TABLE ufos.bank_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ufos.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY bank_accounts_select ON ufos.bank_accounts
  FOR SELECT TO authenticated USING (ufos.has_entity_access(entity_id));
CREATE POLICY bank_accounts_insert ON ufos.bank_accounts
  FOR INSERT TO authenticated WITH CHECK (ufos.has_entity_access(entity_id));
CREATE POLICY bank_accounts_update ON ufos.bank_accounts
  FOR UPDATE TO authenticated USING (ufos.has_entity_access(entity_id));

CREATE POLICY bank_tx_select ON ufos.bank_transactions
  FOR SELECT TO authenticated USING (ufos.has_entity_access(entity_id));
CREATE POLICY bank_tx_insert ON ufos.bank_transactions
  FOR INSERT TO authenticated WITH CHECK (ufos.has_entity_access(entity_id));
CREATE POLICY bank_tx_update ON ufos.bank_transactions
  FOR UPDATE TO authenticated USING (ufos.has_entity_access(entity_id));
