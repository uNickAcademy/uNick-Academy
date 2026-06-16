-- Migration 007: System dokumentów
-- Zastosowane: 2026-06-16

CREATE TABLE ufos.documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID REFERENCES ufos.entities(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  document_type   TEXT NOT NULL DEFAULT 'other',  -- invoice_in, invoice_out, contract, tax_return, payroll, bank_statement, other
  status          TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, approved, rejected, archived
  amount          NUMERIC(12, 2),
  currency        TEXT DEFAULT 'PLN',
  document_date   DATE,
  due_date        DATE,
  counterparty    TEXT,  -- kontrahent
  description     TEXT,
  storage_path    TEXT,  -- Supabase Storage path
  file_name       TEXT,
  file_size       BIGINT,
  mime_type       TEXT,
  uploaded_by     UUID REFERENCES ufos.users(id) ON DELETE SET NULL,
  reviewed_by     UUID REFERENCES ufos.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT documents_type_check   CHECK (document_type IN ('invoice_in', 'invoice_out', 'contract', 'tax_return', 'payroll', 'bank_statement', 'other')),
  CONSTRAINT documents_status_check CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'archived'))
);

CREATE INDEX documents_entity_id_idx     ON ufos.documents(entity_id);
CREATE INDEX documents_status_idx        ON ufos.documents(status);
CREATE INDEX documents_document_date_idx ON ufos.documents(document_date DESC);
CREATE INDEX documents_deleted_at_idx    ON ufos.documents(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON ufos.documents
  FOR EACH ROW EXECUTE FUNCTION ufos.update_updated_at();

-- RLS
ALTER TABLE ufos.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_select ON ufos.documents FOR SELECT
  USING (deleted_at IS NULL AND (ufos.has_entity_access(entity_id) OR entity_id IS NULL));

CREATE POLICY documents_insert ON ufos.documents FOR INSERT
  WITH CHECK (ufos.get_my_role() IN ('owner_cfo', 'accounting_ops', 'payroll_operator'));

CREATE POLICY documents_update ON ufos.documents FOR UPDATE
  USING (ufos.get_my_role() IN ('owner_cfo', 'accounting_ops'));

-- Storage bucket setup (dokumentacja — bucket trzeba stworzyć ręcznie w Supabase Storage)
-- Bucket name: ufos-documents, public: false
