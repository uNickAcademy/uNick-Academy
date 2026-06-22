import { NextResponse } from 'next/server'
import { getCurrentStudentId } from '@/lib/auth'
import { recordLesson } from '@/lib/referrals'

export async function POST(request) {
  const studentId = await getCurrentStudentId()
  if (!studentId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const attended = body?.attended ?? true
  const isTrial = Boolean(body?.isTrial)

  const lesson = await recordLesson({ studentId, attended, isTrial })
  return NextResponse.json({ lesson })
}
