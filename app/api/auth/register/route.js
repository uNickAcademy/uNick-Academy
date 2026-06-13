import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateUniqueReferralCode } from '@/lib/referral-code'
import { setSessionUserId } from '@/lib/auth'
import { applyReferralCode, ReferralError } from '@/lib/referrals'

export async function POST(request) {
  const body = await request.json().catch(() => null)
  const name = body?.name?.trim()
  const email = body?.email?.trim().toLowerCase()
  const phone = body?.phone?.trim() || null
  const referralCode = body?.referralCode?.trim()

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email or phone number already exists.' },
      { status: 409 }
    )
  }

  const user = await prisma.user.create({
    data: { name, email, phone, referralCode: await generateUniqueReferralCode() },
  })

  let referralWarning = null
  if (referralCode) {
    try {
      await applyReferralCode({ candidateUserId: user.id, code: referralCode })
    } catch (err) {
      if (err instanceof ReferralError) {
        referralWarning = err.message
      } else {
        throw err
      }
    }
  }

  await setSessionUserId(user.id)

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, referralCode: user.referralCode },
    referralWarning,
  })
}
