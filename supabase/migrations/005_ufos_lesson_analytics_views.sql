-- Migration 005: Widoki analityczne czytające ze schematu public
-- Brak CSV importu – dane lekcyjne są w tej samej bazie (public schema)
-- Zastosowane: 2026-06-16

CREATE OR REPLACE VIEW ufos.lesson_analytics AS
SELECT
  l.id,
  l.starts_at::date                                                      AS lesson_date,
  l.starts_at,
  l.ends_at,
  ROUND(EXTRACT(EPOCH FROM (l.ends_at - l.starts_at)) / 3600.0, 2)      AS duration_hours,
  l.type                                                                  AS location_type,
  l.format                                                                AS lesson_format,
  l.level,
  l.attendance                                                            AS lesson_status,
  l.is_confirmed,
  l.student_id,
  COALESCE(s.full_name, sp.full_name)                                     AS student_name,
  s.status                                                                AS student_status,
  s.credit_balance,
  s.billing_type,
  l.teacher_id,
  tp.full_name                                                            AS teacher_name,
  t.hourly_rate,
  t.rate_group,
  l.group_id,
  g.name                                                                  AS group_name,
  ROUND(
    CASE
      WHEN l.format = 'group' AND t.rate_group IS NOT NULL
        THEN t.rate_group * EXTRACT(EPOCH FROM (l.ends_at - l.starts_at)) / 3600.0
      WHEN t.hourly_rate IS NOT NULL
        THEN t.hourly_rate * EXTRACT(EPOCH FROM (l.ends_at - l.starts_at)) / 3600.0
      ELSE 0
    END
  , 2)                                                                    AS teacher_cost,
  COALESCE(
    s.custom_monthly_price,
    (SELECT pp.price_per_lesson FROM public.pricing_plans pp WHERE pp.is_active = true ORDER BY pp.created_at LIMIT 1)
  )                                                                       AS price_per_lesson,
  ROUND(
    COALESCE(
      s.custom_monthly_price,
      (SELECT pp.price_per_lesson FROM public.pricing_plans pp WHERE pp.is_active = true ORDER BY pp.created_at LIMIT 1)
    ) -
    CASE
      WHEN l.format = 'group' AND t.rate_group IS NOT NULL
        THEN t.rate_group * EXTRACT(EPOCH FROM (l.ends_at - l.starts_at)) / 3600.0
      WHEN t.hourly_rate IS NOT NULL
        THEN t.hourly_rate * EXTRACT(EPOCH FROM (l.ends_at - l.starts_at)) / 3600.0
      ELSE 0
    END
  , 2)                                                                    AS gross_margin
FROM public.lessons l
LEFT JOIN public.students s ON s.id = l.student_id
LEFT JOIN public.profiles sp ON sp.id = s.profile_id
LEFT JOIN public.teachers t ON t.id = l.teacher_id
LEFT JOIN public.profiles tp ON tp.id = t.profile_id
LEFT JOIN public.groups g ON g.id = l.group_id
WHERE l.is_event = false;

CREATE OR REPLACE VIEW ufos.teacher_profitability AS
SELECT
  la.teacher_id,
  la.teacher_name,
  date_trunc('month', la.starts_at)::date                                AS period,
  COUNT(*) FILTER (WHERE la.lesson_status = 'present')                   AS completed_lessons,
  COUNT(*) FILTER (WHERE la.lesson_status = 'absent')                    AS cancelled_lessons,
  COUNT(*) FILTER (WHERE la.lesson_status = 'excused')                   AS excused_lessons,
  COUNT(*) FILTER (WHERE la.lesson_status = 'scheduled')                 AS scheduled_lessons,
  ROUND(SUM(la.duration_hours) FILTER (WHERE la.lesson_status = 'present'), 2) AS hours_worked,
  ROUND(SUM(la.price_per_lesson) FILTER (WHERE la.lesson_status = 'present'), 2) AS revenue_generated,
  ROUND(SUM(la.teacher_cost) FILTER (WHERE la.lesson_status = 'present'), 2) AS total_cost,
  ROUND(SUM(la.gross_margin) FILTER (WHERE la.lesson_status = 'present'), 2) AS total_margin,
  ROUND(
    CASE
      WHEN SUM(la.price_per_lesson) FILTER (WHERE la.lesson_status = 'present') > 0
      THEN (SUM(la.gross_margin) FILTER (WHERE la.lesson_status = 'present') /
            SUM(la.price_per_lesson) FILTER (WHERE la.lesson_status = 'present') * 100)
      ELSE 0 END
  , 1)                                                                    AS margin_pct
FROM ufos.lesson_analytics la
WHERE la.teacher_id IS NOT NULL
GROUP BY la.teacher_id, la.teacher_name, date_trunc('month', la.starts_at)::date;

CREATE OR REPLACE VIEW ufos.monthly_summary AS
SELECT
  date_trunc('month', la.starts_at)::date                                AS period,
  COUNT(*) FILTER (WHERE la.lesson_status = 'present')                   AS completed_lessons,
  COUNT(*) FILTER (WHERE la.lesson_status IN ('absent', 'excused'))      AS missed_lessons,
  COUNT(*) FILTER (WHERE la.lesson_status = 'scheduled')                 AS upcoming_lessons,
  COUNT(DISTINCT la.student_id)                                          AS active_students,
  COUNT(DISTINCT la.teacher_id)                                          AS active_teachers,
  ROUND(SUM(la.price_per_lesson) FILTER (WHERE la.lesson_status = 'present'), 2) AS total_revenue,
  ROUND(SUM(la.teacher_cost) FILTER (WHERE la.lesson_status = 'present'), 2)     AS total_teacher_cost,
  ROUND(SUM(la.gross_margin) FILTER (WHERE la.lesson_status = 'present'), 2)     AS total_margin,
  ROUND(
    CASE WHEN SUM(la.price_per_lesson) FILTER (WHERE la.lesson_status = 'present') > 0
    THEN (SUM(la.gross_margin) FILTER (WHERE la.lesson_status = 'present') /
          SUM(la.price_per_lesson) FILTER (WHERE la.lesson_status = 'present') * 100)
    ELSE 0 END
  , 1)                                                                    AS avg_margin_pct
FROM ufos.lesson_analytics la
GROUP BY date_trunc('month', la.starts_at)::date
ORDER BY period DESC;

CREATE OR REPLACE VIEW ufos.students_with_debt AS
SELECT
  s.id,
  COALESCE(s.full_name, p.full_name)                                     AS student_name,
  p.email,
  p.phone,
  s.status,
  s.credit_balance,
  s.billing_type,
  tp.full_name                                                            AS teacher_name,
  COUNT(l.id) FILTER (WHERE l.attendance = 'scheduled')                  AS upcoming_lessons,
  MAX(l.starts_at) FILTER (WHERE l.attendance = 'present')               AS last_lesson_at
FROM public.students s
LEFT JOIN public.profiles p ON p.id = s.profile_id
LEFT JOIN public.teachers t ON t.id = s.teacher_id
LEFT JOIN public.profiles tp ON tp.id = t.profile_id
LEFT JOIN public.lessons l ON l.student_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.full_name, p.full_name, p.email, p.phone, s.status,
         s.credit_balance, s.billing_type, tp.full_name
ORDER BY s.credit_balance ASC;
