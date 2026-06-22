import { NextResponse } from 'next/server'
import { getCurrentStudentId } from '@/lib/auth'
import { applyReferralCode, ReferralError } from '@/lib/referrals'

export async function POST(request) {
  const studentId = await getCurrentStudentId()
  if (!studentId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const code = body?.code?.trim()
  if (!code) return NextResponse.json({ error: 'Referral code is required.' }, { status: 400 })

  try {
    const referral = await applyReferralCode({ candidateStudentId: studentId, code })
    return NextResponse.json({ referral })
  } catch (err) {
    if (err instanceof ReferralError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }
}
