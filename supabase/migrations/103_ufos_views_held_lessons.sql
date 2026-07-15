-- 103: Widoki finansowe uFOS w nowym modelu obecności.
-- „Odbyte i płatne” (held) = present + late_cancellation + no_show — lektor prowadził
-- lub zarezerwował slot, uczeń jest rozliczany. 'excused' = odwołane w terminie
-- (do odrobienia, neutralne przychodowo). Przychód/koszt/marża liczymy po held.

create or replace view ufos.teacher_profitability as
select teacher_id,
  teacher_name,
  (date_trunc('month'::text, starts_at))::date as period,
  count(*) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))) as completed_lessons,
  count(*) filter (where (lesson_status = 'no_show'::attendance_status)) as cancelled_lessons,
  count(*) filter (where (lesson_status = 'excused'::attendance_status)) as excused_lessons,
  count(*) filter (where (lesson_status = 'scheduled'::attendance_status)) as scheduled_lessons,
  round(sum(duration_hours) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as hours_worked,
  round(sum(price_per_lesson) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as revenue_generated,
  round(sum(teacher_cost) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as total_cost,
  round(sum(gross_margin) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as total_margin,
  round(
    case
      when (sum(price_per_lesson) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))) > (0)::numeric)
      then ((sum(gross_margin) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[])))
           / sum(price_per_lesson) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[])))) * (100)::numeric)
      else (0)::numeric
    end, 1) as margin_pct
from ufos.lesson_analytics la
where (teacher_id is not null)
group by teacher_id, teacher_name, ((date_trunc('month'::text, starts_at))::date);

create or replace view ufos.monthly_summary as
select (date_trunc('month'::text, starts_at))::date as period,
  count(*) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))) as completed_lessons,
  count(*) filter (where (lesson_status = 'excused'::attendance_status)) as missed_lessons,
  count(*) filter (where (lesson_status = 'scheduled'::attendance_status)) as upcoming_lessons,
  count(distinct student_id) as active_students,
  count(distinct teacher_id) as active_teachers,
  round(sum(price_per_lesson) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as total_revenue,
  round(sum(teacher_cost) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as total_teacher_cost,
  round(sum(gross_margin) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))), 2) as total_margin,
  round(
    case
      when (sum(price_per_lesson) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[]))) > (0)::numeric)
      then ((sum(gross_margin) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[])))
           / sum(price_per_lesson) filter (where (lesson_status = any (array['present','late_cancellation','no_show']::attendance_status[])))) * (100)::numeric)
      else (0)::numeric
    end, 1) as avg_margin_pct
from ufos.lesson_analytics la
group by ((date_trunc('month'::text, starts_at))::date)
order by ((date_trunc('month'::text, starts_at))::date) desc;
