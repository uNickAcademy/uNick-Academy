import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendBookingApproved } from '@/lib/email/send'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

// Zatwierdzanie zapisów online: admin ustala nauczyciela, termin i link do
// zajęć, a po akceptacji uczeń dostaje potwierdzenie z linkiem do płatności
// za pierwszą lekcję. Odrzucenie usuwa niepotwierdzone lekcje z serii.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { studentId, teacherId: currentTeacherId, action, newTeacherId, slot, meetingUrl, firstAmount, monthlyPrice } = await req.json()
  if (!studentId || !currentTeacherId || !action) {
    return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
  }

  const db = createAdminClient()

  // Cała seria: niepotwierdzone lekcje online tego ucznia u tego nauczyciela.
  const { data: lessons } = await db
    .from('lessons')
    .select('id, starts_at, ends_at')
    .eq('student_id', studentId)
    .eq('teacher_id', currentTeacherId)
    .eq('is_confirmed', false)
    .eq('type', 'online')
    .order('starts_at', { ascending: true })

  if (!lessons || lessons.length === 0) {
    return NextResponse.json({ error: 'Nie znaleziono oczekującego zapisu' }, { status: 404 })
  }

  if (action === 'reject') {
    await db.from('lessons').delete().in('id', lessons.map((l) => l.id))
    return NextResponse.json({ success: true })
  }

  if (action !== 'approve') return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 })

  const teacherId = newTeacherId || currentTeacherId
  const first = lessons[0]
  const originalStart = new Date(first.starts_at)
  const durationMs = new Date(first.ends_at).getTime() - originalStart.getTime()

  // Przesunięcie terminu dotyczy całej serii — kolejne lekcje trzymają
  // tygodniowy odstęp względem nowego terminu pierwszej lekcji.
  const newStart = slot ? new Date(slot) : originalStart
  const shiftMs = newStart.getTime() - originalStart.getTime()

  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i]
    const starts = new Date(new Date(l.starts_at).getTime() + shiftMs)
    const update: Record<string, unknown> = {
      teacher_id: teacherId,
      is_confirmed: true,
      starts_at: starts.toISOString(),
      ends_at: new Date(starts.getTime() + durationMs).toISOString(),
    }
    if (meetingUrl) update.meeting_url = meetingUrl
    await db.from('lessons').update(update).eq('id', l.id)
  }

  // Uczeń przypisany do zatwierdzonego nauczyciela; cena miesięczna napędza
  // późniejsze naliczanie abonamentu 1. dnia miesiąca.
  const studentUpdate: Record<string, unknown> = { teacher_id: teacherId, status: 'active' }
  if (monthlyPrice != null && monthlyPrice !== '') studentUpdate.custom_monthly_price = Number(monthlyPrice)
  await db.from('students').update(studentUpdate).eq('id', studentId)

  // Dane do maila
  const { data: student } = await db
    .from('students')
    .select('id, full_name, profile:profiles(full_name, email)')
    .eq('id', studentId)
    .single()
  const sp = student?.profile as { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | undefined
  const sProfile = Array.isArray(sp) ? sp[0] : sp
  const email = sProfile?.email ?? ''
  const studentName = (student?.full_name as string) || sProfile?.full_name || 'Uczniu'

  const { data: teacher } = await db.from('teachers').select('profile:profiles(full_name)').eq('id', teacherId).single()
  const tp = teacher?.profile as { full_name?: string } | { full_name?: string }[] | undefined
  const teacherName = (Array.isArray(tp) ? tp[0] : tp)?.full_name ?? 'Nauczyciel'

  const { data: firstLesson } = await db
    .from('lessons').select('meeting_url').eq('id', first.id).single()

  // Link do płatności za pierwszą lekcję (Stripe). Brak kwoty lub brak Stripe
  // nie blokuje zatwierdzenia — mail wyjdzie bez sekcji płatności.
  const amount = firstAmount != null && firstAmount !== '' ? Number(firstAmount) : null
  let paymentUrl: string | null = null
  if (amount && amount > 0) {
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || ''
      paymentUrl = await createCheckoutSession({
        amount, studentId, email,
        description: `Pierwsza lekcja — ${format(newStart, 'd MMMM yyyy', { locale: pl })}`,
        successUrl: `${base}/platnosci?success=true`,
        cancelUrl: `${base}/platnosci?cancelled=true`,
      })
      await db.from('transactions').insert({
        student_id: studentId, type: 'charge', amount,
        description: `Pierwsza lekcja — ${format(newStart, 'd.MM.yyyy')}`,
      })
    } catch (err) {
      console.error('[Online booking approve] checkout error:', err)
    }
  }

  if (email) {
    await sendBookingApproved(email, {
      studentName, teacherName,
      date: format(newStart, 'EEEE, d MMMM yyyy', { locale: pl }),
      time: format(newStart, 'HH:mm'),
      meetLink: (firstLesson?.meeting_url as string) ?? undefined,
      amount, paymentUrl,
      recurring: lessons.length > 1,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, paymentUrl })
}
