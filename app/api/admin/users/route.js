import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCreditSummary } from '@/lib/referrals'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })

  const withCredit = await Promise.all(
    users.map(async (u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      referralCode: u.referralCode,
      creditBalance: (await getCreditSummary(u.id)).balance,
    }))
  )

  return NextResponse.json({ users: withCredit })
}
