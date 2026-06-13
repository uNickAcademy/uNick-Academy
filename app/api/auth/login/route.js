import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionUserId } from '@/lib/auth'

// NOTE: placeholder auth - logs in by email only, no password. Replace with
// real authentication; this exists purely so the referral programme has a
// concept of "the current student" to attach codes/credits to.
export async function POST(request) {
  const body = await request.json().catch(() => null)
  const email = body?.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 })
  }

  await setSessionUserId(user.id)

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, referralCode: user.referralCode },
  })
}
