-- Migration 012: let HR change the assigned teacher when rescheduling a company employee's lesson

CREATE OR REPLACE FUNCTION public.hr_reschedule_lesson(
  p_lesson_id      uuid,
  p_new_start      timestamptz,
  p_new_end        timestamptz,
  p_new_teacher_id uuid DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_old_start timestamptz;
BEGIN
  SELECT l.starts_at INTO v_old_start
  FROM lessons l
  JOIN students s ON s.id = l.student_id
  WHERE l.id = p_lesson_id
    AND s.company_id = current_hr_company()
    AND current_hr_company() IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brak uprawnień do tej lekcji';
  END IF;

  UPDATE lessons SET
    original_starts_at = CASE WHEN v_old_start IS DISTINCT FROM p_new_start THEN COALESCE(original_starts_at, v_old_start) ELSE original_starts_at END,
    reschedule_count   = CASE WHEN v_old_start IS DISTINCT FROM p_new_start THEN reschedule_count + 1 ELSE reschedule_count END,
    starts_at          = p_new_start,
    ends_at            = p_new_end,
    teacher_id         = COALESCE(p_new_teacher_id, teacher_id)
  WHERE id = p_lesson_id;
END $$;
GRANT EXECUTE ON FUNCTION public.hr_reschedule_lesson(uuid, timestamptz, timestamptz, uuid) TO authenticated;
