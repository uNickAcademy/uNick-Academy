import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { getStudentForUser } from '../../../../lib/unickorn/student'

function generateReferralCode(fullName) {
  const letters = (fullName || '').replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'UNICK'
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${letters}${suffix}`
}

// Ensures a `students` row exists for the signed-in profile. Existing uNick
// Academy students already have one (and is_unick_student=true). Brand-new
// signups via this app's login page get one created here, flagged as
// external until proven otherwise.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const existing = await getStudentForUser(user.id)
  if (existing) {
    return NextResponse.json({ studentId: existing.id })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()

  const { data: student, error } = await admin
    .from('students')
    .insert({
      profile_id: user.id,
      referral_code: generateReferralCode(profile?.full_name),
      is_unick_student: false,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'provision_failed' }, { status: 500 })
  }

  return NextResponse.json({ studentId: student.id })
}
