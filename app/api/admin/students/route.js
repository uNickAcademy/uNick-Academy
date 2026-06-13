import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    include: {
      students: {
        orderBy: { name: 'asc' },
        include: { enrollment: { include: { teacher: true } } },
      },
    },
  })

  return NextResponse.json({
    companies: companies.map((c) => ({
      id: c.id,
      name: c.name,
      students: c.students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        referralCode: s.referralCode,
        teacher: s.enrollment?.teacher?.name ?? null,
        mode: s.enrollment?.mode ?? null,
        dayOfWeek: s.enrollment?.dayOfWeek ?? null,
        startTime: s.enrollment?.startTime ?? null,
        level: s.enrollment?.level ?? null,
        notes: s.enrollment?.notes ?? null,
      })),
    })),
  })
}
