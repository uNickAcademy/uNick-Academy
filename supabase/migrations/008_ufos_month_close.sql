-- Migration 008: Zamknięcie miesiąca
-- Zastosowane: 2026-06-16

CREATE TABLE ufos.month_closes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID REFERENCES ufos.entities(id) ON DELETE CASCADE,
  period          DATE NOT NULL,  -- pierwszy dzień miesiąca
  status          TEXT NOT NULL DEFAULT 'open',  -- open, in_review, approved, locked
  checklist       JSONB DEFAULT '[]'::jsonb,     -- [{key, label, done, done_at, done_by}]
  notes           TEXT,
  opened_by       UUID REFERENCES ufos.users(id) ON DELETE SET NULL,
  approved_by     UUID REFERENCES ufos.users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  locked_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT month_closes_status_check CHECK (status IN ('open', 'in_review', 'approved', 'locked')),
  UNIQUE (entity_id, period)
);

CREATE INDEX month_closes_entity_period ON ufos.month_closes(entity_id, period DESC);

CREATE TRIGGER month_closes_updated_at
  BEFORE UPDATE ON ufos.month_closes
  FOR EACH ROW EXECUTE FUNCTION ufos.update_updated_at();

-- RLS
ALTER TABLE ufos.month_closes ENABLE ROW LEVEL SECURITY;

CREATE POLICY month_closes_select ON ufos.month_closes FOR SELECT
  USING (ufos.has_entity_access(entity_id) OR entity_id IS NULL);

CREATE POLICY month_closes_all ON ufos.month_closes FOR ALL
  USING (ufos.get_my_role() IN ('owner_cfo', 'accounting_ops'));

-- Domyślna checklista dla nowego zamknięcia
CREATE OR REPLACE FUNCTION ufos.default_checklist()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT '[
    {"key": "lessons_marked",     "label": "Lekcje zaznaczone przez nauczycieli",    "done": false},
    {"key": "invoices_collected",  "label": "Faktury kosztowe zebrane",                "done": false},
    {"key": "bank_reconciled",    "label": "Wyciąg bankowy zweryfikowany",            "done": false},
    {"key": "payroll_prepared",   "label": "Listy płac przygotowane",                 "done": false},
    {"key": "jpk_sent",           "label": "JPK_VAT wysłany do US",                   "done": false},
    {"key": "cit_advance",        "label": "Zaliczka CIT opłacona",                   "done": false},
    {"key": "zus_paid",           "label": "ZUS zapłacony",                           "done": false},
    {"key": "margin_reviewed",    "label": "Marżowość zweryfikowana przez Milenę",    "done": false}
  ]'::jsonb
$$;
