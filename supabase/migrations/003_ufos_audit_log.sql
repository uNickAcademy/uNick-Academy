-- Migration 003: Audit log
-- Zastosowane: 2026-06-16

CREATE TABLE ufos.audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id      uuid REFERENCES ufos.entities(id),
  user_id        uuid NOT NULL REFERENCES ufos.users(id),
  table_name     text NOT NULL,
  record_id      uuid NOT NULL,
  action         text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject')),
  old_values     jsonb,
  new_values     jsonb,
  changed_fields text[],
  reason         text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX audit_log_entity_idx   ON ufos.audit_log(entity_id);
CREATE INDEX audit_log_user_idx     ON ufos.audit_log(user_id);
CREATE INDEX audit_log_created_idx  ON ufos.audit_log(created_at DESC);
CREATE INDEX audit_log_table_record ON ufos.audit_log(table_name, record_id);
