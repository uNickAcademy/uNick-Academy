import { createAdminClient } from '@/lib/supabase/admin'
import { UNICKORN_MONTHLY_SESSION_LIMITS, tierForStudent, currentPeriod } from './config'

const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active']

export async function checkUnickornAccess(studentId) {
  const supabase = createAdminClient()

  const { data: student, error } = await supabase
    .from('students')
    .select('id, is_unick_student, unickorn_subscription_status, unickorn_subscription_tier')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return { allowed: false, reason: 'student_not_found', action: 'upgrade' }
  }

  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(student.unickorn_subscription_status)) {
    return { allowed: false, reason: 'subscription_inactive', action: 'upgrade', student }
  }

  const tier = tierForStudent(student)
  const limit = UNICKORN_MONTHLY_SESSION_LIMITS[tier]
  const period = currentPeriod()

  const { data: usage } = await supabase
    .from('usage_counters')
    .select('sessions_used, minutes_used')
    .eq('student_id', studentId)
    .eq('period', period)
    .maybeSingle()

  const sessionsUsed = usage?.sessions_used ?? 0

  if (sessionsUsed >= limit) {
    return {
      allowed: false,
      reason: 'usage_limit_reached',
      action: 'topup',
      student,
      usage: { sessionsUsed, limit, period },
    }
  }

  return { allowed: true, student, usage: { sessionsUsed, limit, period } }
}
