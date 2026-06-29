-- Migration 002: Użytkownicy i role uFOS
-- Zastosowane: 2026-06-16

CREATE TABLE ufos.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text NOT NULL,
  role_label    text,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE ufos.user_entity_roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES ufos.users(id) ON DELETE CASCADE,
  entity_id     uuid REFERENCES ufos.entities(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN (
    'owner_cfo', 'accounting_ops', 'payroll_operator',
    'external_accountant', 'tax_advisor', 'read_only'
  )),
  granted_by    uuid REFERENCES ufos.users(id),
  granted_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, entity_id, role)
);

CREATE OR REPLACE FUNCTION ufos.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO ufos.users (id, email, full_name)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ufos.handle_new_user();

CREATE INDEX user_entity_roles_user_idx   ON ufos.user_entity_roles(user_id);
CREATE INDEX user_entity_roles_entity_idx ON ufos.user_entity_roles(entity_id);
