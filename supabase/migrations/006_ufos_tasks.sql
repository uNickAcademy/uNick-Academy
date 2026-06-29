-- Migration 006: System zadań operacyjnych
-- Zastosowane: 2026-06-16

CREATE TABLE ufos.tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    UUID REFERENCES ufos.entities(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL DEFAULT 'other',  -- tax, payroll, accounting, legal, operational, other
  priority     TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status       TEXT NOT NULL DEFAULT 'open',   -- open, in_progress, done, cancelled
  due_date     DATE,
  assigned_to  UUID REFERENCES ufos.users(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES ufos.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT tasks_category_check CHECK (category IN ('tax', 'payroll', 'accounting', 'legal', 'operational', 'other')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT tasks_status_check  CHECK (status  IN ('open', 'in_progress', 'done', 'cancelled'))
);

CREATE INDEX tasks_entity_id_idx    ON ufos.tasks(entity_id);
CREATE INDEX tasks_status_idx       ON ufos.tasks(status);
CREATE INDEX tasks_due_date_idx     ON ufos.tasks(due_date);
CREATE INDEX tasks_assigned_to_idx  ON ufos.tasks(assigned_to);

-- Szablony zadań cyklicznych
CREATE TABLE ufos.task_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    UUID REFERENCES ufos.entities(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL DEFAULT 'other',
  priority     TEXT NOT NULL DEFAULT 'medium',
  recurrence   TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly, weekly
  day_of_month INT,   -- dla monthly/quarterly: dzień miesiąca (np. 20 = do 20-go)
  months       INT[], -- dla quarterly: miesiące (np. {1,4,7,10})
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Automatyczna aktualizacja updated_at
CREATE OR REPLACE FUNCTION ufos.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON ufos.tasks
  FOR EACH ROW EXECUTE FUNCTION ufos.update_updated_at();

-- RLS
ALTER TABLE ufos.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ufos.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_select ON ufos.tasks FOR SELECT
  USING (ufos.has_entity_access(entity_id) OR entity_id IS NULL);

CREATE POLICY tasks_all ON ufos.tasks FOR ALL
  USING (ufos.get_my_role() IN ('owner_cfo', 'accounting_ops'));

CREATE POLICY task_templates_select ON ufos.task_templates FOR SELECT
  USING (ufos.has_entity_access(entity_id) OR entity_id IS NULL);

CREATE POLICY task_templates_all ON ufos.task_templates FOR ALL
  USING (ufos.get_my_role() IN ('owner_cfo', 'accounting_ops'));
