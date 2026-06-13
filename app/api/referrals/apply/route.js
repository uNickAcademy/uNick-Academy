import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { applyReferralCode, ReferralError } from '@/lib/referrals'

// Lets an existing student redeem a referral code before their first
// purchase (rule #2). Registration can also apply a code directly.
export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const code = body?.code?.trim()
  if (!code) return NextResponse.json({ error: 'Referral code is required.' }, { status: 400 })

  try {
    const referral = await applyReferralCode({ candidateUserId: user.id, code })
    return NextResponse.json({ referral })
  } catch (err) {
    if (err instanceof ReferralError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }
}
