-- Migration 011: Corporate clients — legal-entity assignment, lesson outcome tracking, one-HR-per-company

-- 1. Link students and companies to one of our two legal entities (UAI/UA)
ALTER TABLE students ADD COLUMN IF NOT EXISTS legal_entity_id uuid REFERENCES ufos.entities(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_entity_id uuid REFERENCES ufos.entities(id);

DO $$
DECLARE
  v_uai uuid;
  v_ua  uuid;
BEGIN
  SELECT id INTO v_uai FROM ufos.entities WHERE short_name = 'UAI';
  SELECT id INTO v_ua  FROM ufos.entities WHERE short_name = 'UA';

  -- Backfill existing rows
  UPDATE students SET legal_entity_id = v_uai WHERE legal_entity_id IS NULL AND billing_type = 'individual';
  UPDATE students SET legal_entity_id = v_ua  WHERE legal_entity_id IS NULL AND billing_type = 'b2b';
  UPDATE companies SET legal_entity_id = v_ua  WHERE legal_entity_id IS NULL;

  -- Column-level defaults for new rows (EXECUTE required to use a variable)
  EXECUTE format('ALTER TABLE students ALTER COLUMN legal_entity_id SET DEFAULT %L', v_uai);
  EXECUTE format('ALTER TABLE companies ALTER COLUMN legal_entity_id SET DEFAULT %L', v_ua);
END $$;

ALTER TABLE students ALTER COLUMN legal_entity_id SET NOT NULL;
ALTER TABLE companies ALTER COLUMN legal_entity_id SET NOT NULL;

-- 2. SECURITY DEFINER function so admin/HR can list our legal entities without uFOS role membership
CREATE OR REPLACE FUNCTION public.list_billing_entities()
RETURNS TABLE (id uuid, short_name text, name text, vat_payer boolean)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id, short_name, name, vat_payer
  FROM ufos.entities
  WHERE active = true
  ORDER BY short_name;
$$;
GRANT EXECUTE ON FUNCTION public.list_billing_entities() TO authenticated;

-- 3. Lesson outcome columns (soft-cancel: replace hard DELETE with UPDATE)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cancelled_reason text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS original_starts_at timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS reschedule_count int NOT NULL DEFAULT 0;

-- 4. Prevent creating a second HR account per company
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_hr_per_company
  ON profiles (company_id) WHERE role = 'hr' AND company_id IS NOT NULL;

-- 5. Atomic reschedule RPC (preserves original_starts_at, increments reschedule_count)
CREATE OR REPLACE FUNCTION public.hr_reschedule_lesson(
  p_lesson_id   uuid,
  p_new_start   timestamptz,
  p_new_end     timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  -- Verify the lesson belongs to this HR's company
  IF NOT EXISTS (
    SELECT 1 FROM lessons l
    JOIN students s ON s.id = l.student_id
    WHERE l.id = p_lesson_id
      AND s.company_id = current_hr_company()
      AND current_hr_company() IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do tej lekcji';
  END IF;

  UPDATE lessons SET
    original_starts_at = COALESCE(original_starts_at, starts_at),
    reschedule_count   = reschedule_count + 1,
    starts_at          = p_new_start,
    ends_at            = p_new_end
  WHERE id = p_lesson_id;
END $$;
GRANT EXECUTE ON FUNCTION public.hr_reschedule_lesson(uuid, timestamptz, timestamptz) TO authenticated;

-- 6. RLS: HR can soft-cancel (UPDATE) lessons — existing "HR przekłada lekcje" policy already covers UPDATE
--    No new RLS policy needed since we switch cancel from DELETE to UPDATE within the same company scope.
--    The DELETE policy remains for backward compat (admin may still hard-delete if needed via admin role).
