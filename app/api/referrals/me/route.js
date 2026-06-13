import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getStudentReferralOverview } from '@/lib/referrals'
import { REFERRAL_BONUS_PLN, QUALIFYING_PURCHASE_MIN_PLN, MIN_LESSONS_FOR_REFERRER_REWARD, MAX_CREDIT_REDEMPTION_RATIO } from '@/lib/constants'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const overview = await getStudentReferralOverview(user.id)

  return NextResponse.json({
    ...overview,
    rules: {
      bonusAmount: REFERRAL_BONUS_PLN,
      qualifyingMinAmount: QUALIFYING_PURCHASE_MIN_PLN,
      minLessonsForReferrerReward: MIN_LESSONS_FOR_REFERRER_REWARD,
      maxCreditRedemptionRatio: MAX_CREDIT_REDEMPTION_RATIO,
    },
  })
}
