-- Migration 004: Row Level Security
-- Zastosowane: 2026-06-16

ALTER TABLE ufos.entities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ufos.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ufos.user_entity_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ufos.audit_log        ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION ufos.has_entity_access(p_entity_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ufos.user_entity_roles
    WHERE user_id = auth.uid()
      AND (entity_id = p_entity_id OR entity_id IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION ufos.get_my_role(p_entity_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role
  FROM ufos.user_entity_roles
  WHERE user_id = auth.uid()
    AND (entity_id = p_entity_id OR entity_id IS NULL)
  ORDER BY
    CASE WHEN entity_id IS NULL THEN 1 ELSE 0 END ASC,
    CASE role
      WHEN 'owner_cfo' THEN 0 WHEN 'accounting_ops' THEN 1
      WHEN 'payroll_operator' THEN 2 WHEN 'external_accountant' THEN 3
      WHEN 'tax_advisor' THEN 4 WHEN 'read_only' THEN 5
    END ASC
  LIMIT 1;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Entities
CREATE POLICY "entities_select" ON ufos.entities FOR SELECT TO authenticated USING (ufos.has_entity_access(id));
CREATE POLICY "entities_insert" ON ufos.entities FOR INSERT TO authenticated WITH CHECK (ufos.get_my_role() = 'owner_cfo');
CREATE POLICY "entities_update" ON ufos.entities FOR UPDATE TO authenticated USING (ufos.get_my_role() = 'owner_cfo');

-- Users
CREATE POLICY "users_select" ON ufos.users FOR SELECT TO authenticated USING (id = auth.uid() OR ufos.get_my_role() = 'owner_cfo');
CREATE POLICY "users_insert" ON ufos.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users_update" ON ufos.users FOR UPDATE TO authenticated USING (id = auth.uid() OR ufos.get_my_role() = 'owner_cfo');

-- Roles
CREATE POLICY "roles_select" ON ufos.user_entity_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR ufos.get_my_role() = 'owner_cfo');
CREATE POLICY "roles_insert" ON ufos.user_entity_roles FOR INSERT TO authenticated WITH CHECK (ufos.get_my_role() = 'owner_cfo');
CREATE POLICY "roles_update" ON ufos.user_entity_roles FOR UPDATE TO authenticated USING (ufos.get_my_role() = 'owner_cfo');
CREATE POLICY "roles_delete" ON ufos.user_entity_roles FOR DELETE TO authenticated USING (ufos.get_my_role() = 'owner_cfo');

-- Audit log
CREATE POLICY "audit_log_select" ON ufos.audit_log FOR SELECT TO authenticated
  USING (ufos.get_my_role() = 'owner_cfo' OR (entity_id IS NOT NULL AND ufos.has_entity_access(entity_id) AND ufos.get_my_role() IN ('accounting_ops', 'payroll_operator')));
CREATE POLICY "audit_log_insert" ON ufos.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
