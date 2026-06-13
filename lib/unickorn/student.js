import { createAdminClient } from '../supabase/admin'

// Resolves the students row for the currently authenticated profile.
export async function getStudentForUser(userId) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('profile_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null
  return data
}

// Loads everything needed to build the student context block (spec section 6):
// the student row, their student_profile (if any), and the last 1-3
// tutor_sessions summaries.
export async function loadStudentContext(studentId) {
  const supabase = createAdminClient()

  const [{ data: student }, { data: profile }, { data: recentSessions }] = await Promise.all([
    supabase.from('students').select('*').eq('id', studentId).single(),
    supabase.from('student_profile').select('*').eq('student_id', studentId).maybeSingle(),
    supabase
      .from('tutor_sessions')
      .select('summary, started_at')
      .eq('student_id', studentId)
      .not('summary', 'is', null)
      .order('started_at', { ascending: false })
      .limit(3),
  ])

  return { student, profile, recentSessions: recentSessions || [] }
}
