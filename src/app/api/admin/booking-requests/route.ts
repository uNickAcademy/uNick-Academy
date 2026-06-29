import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // tylko admin/recepcja
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { id, action, teacherId, slot, rate } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })

  const db = createAdminClient()
  const { data: reqRow } = await db.from('booking_requests').select('*').eq('id', id).single()
  if (!reqRow) return NextResponse.json({ error: 'Nie znaleziono prośby' }, { status: 404 })

  if (action === 'reject') {
    await db.from('booking_requests').update({ status: 'rejected', handled_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (action === 'approve') {
    if (!teacherId || !slot) return NextResponse.json({ error: 'Wybierz nauczyciela i termin' }, { status: 400 })
    const startsAt = new Date(slot)
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)

    if (reqRow.student_id) {
      await db.from('lessons').insert({
        student_id: reqRow.student_id, teacher_id: teacherId, type: 'offline', format: 'individual',
        starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), level: reqRow.level ?? 'A1', is_confirmed: true,
      })
      const update: Record<string, unknown> = { status: 'active', teacher_id: teacherId }
      if (rate != null && rate !== '') update.custom_monthly_price = Number(rate)
      await db.from('students').update(update).eq('id', reqRow.student_id)
    }

    await db.from('booking_requests').update({
      status: 'approved', teacher_id: teacherId, approved_slot: startsAt.toISOString(),
      approved_rate: rate != null && rate !== '' ? Number(rate) : null, handled_at: new Date().toISOString(),
    }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 })
}
