import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { recordLesson } from '@/lib/referrals'

// Records a lesson for the current user. A real booking system would call
// this after a lesson takes place; attended lessons count towards the
// referrer's reward (rule #5).
export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const attended = body?.attended ?? true
  const isTrial = Boolean(body?.isTrial)

  const lesson = await recordLesson({ userId: user.id, attended, isTrial })
  return NextResponse.json({ lesson })
}
