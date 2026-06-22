import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStudentForUser } from '@/lib/unickorn/student'
import { checkUnickornAccess } from '@/lib/unickorn/access'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ allowed: false, reason: 'not_authenticated', action: 'login' }, { status: 401 })
  }

  const student = await getStudentForUser(user.id)
  if (!student) {
    return NextResponse.json({ allowed: false, reason: 'student_not_found', action: 'upgrade' }, { status: 404 })
  }

  const result = await checkUnickornAccess(student.id)
  return NextResponse.json(result)
}
