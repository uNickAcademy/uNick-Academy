import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendBookingApproved } from '@/lib/email/send'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { periodKey, periodOf, periodLabel, periodFromDateString } from '@/lib/billing/engine'
import { generateLessons, lessonsPerMonth, describeSlots, type Slot } from '@/lib/lessons/schedule'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

// Zatwierdzanie zapisów online.
//
// Zatwierdzenie to moment, w którym zgłoszenie staje się kursem: admin ustala
// terminy w tygodniu, czas trwania, dni wyłączone, stawkę prowadzącego i cenę
// za zajęcia. Z tego przepisu generujemy całą serię lekcji — wcześniej dało się
// tylko przesunąć gotową serię 12 lekcji w jednym stałym terminie.
//
// Odrzucenie usuwa niepotwierdzone lekcje z serii.

type Body = {
  studentId?: string
  teacherId?: string
  action?: 'approve' | 'reject'
  newTeacherId?: string
  meetingUrl?: string
  /** Terminy tygodniowe: dzień (0 = pon), godzina „HH:MM", długość w minutach. */
  slots?: Slot[]
  startDate?: string
  endDate?: string
  excludedDates?: string[]
  /** Cena za pojedyncze zajęcia. */
  lessonPrice?: string | number
  /** Pensja prowadzącego za lekcję. */
  teacherRate?: string | number
  /** 'monthly' = klient płaci co miesiąc, 'upfront' = całość z góry. */
  paymentMode?: 'monthly' | 'upfront'
}

const num = (v: string | number | undefined | null): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const body = (await req.json()) as Body
  const { studentId, teacherId: currentTeacherId, action, newTeacherId, meetingUrl } = body
  if (!studentId || !currentTeacherId || !action) {
    return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
  }

  const db = createAdminClient()

  // Cała seria: niepotwierdzone lekcje online tego ucznia u tego nauczyciela.
  const { data: pending } = await db
    .from('lessons')
    .select('id, starts_at, ends_at, level, format')
    .eq('student_id', studentId)
    .eq('teacher_id', currentTeacherId)
    .eq('is_confirmed', false)
    .eq('type', 'online')
    .order('starts_at', { ascending: true })

  if (!pending || pending.length === 0) {
    return NextResponse.json({ error: 'Nie znaleziono oczekującego zapisu' }, { status: 404 })
  }

  if (action === 'reject') {
    await db.from('lessons').delete().in('id', pending.map((l) => l.id))
    return NextResponse.json({ success: true })
  }

  if (action !== 'approve') return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 })

  const teacherId = newTeacherId || currentTeacherId
  const slots = (body.slots ?? []).filter((s) => s && s.time && s.day >= 0 && s.day <= 6)
  if (slots.length === 0) return NextResponse.json({ error: 'Podaj przynajmniej jeden termin zajęć.' }, { status: 400 })
  if (!body.startDate) {
    return NextResponse.json({ error: 'Podaj początek kursu.' }, { status: 400 })
  }
  // Koniec kursu jest opcjonalny — brak oznacza zajęcia bezterminowe (ongoing);
  // generateLessons() dogeneruje wtedy terminy do końca roku szkolnego.
  if (body.endDate && body.endDate < body.startDate) {
    return NextResponse.json({ error: 'Koniec kursu nie może wypadać przed początkiem.' }, { status: 400 })
  }

  // Przerwy szkolne wchodzą do wykluczeń razem z dniami wskazanymi ręcznie —
  // w czasie ferii i świąt zajęcia się nie odbywają, więc nie mogą się też
  // znaleźć w rachunku.
  const { data: breaks } = await db.from('holidays').select('start_date, end_date')
  const excluded = [...new Set([...(body.excludedDates ?? [])])]

  const schedule = generateLessons({
    slots,
    startDate: body.startDate,
    endDate: body.endDate,
    excludedDates: [
      ...excluded,
      ...(breaks ?? []).flatMap((b) => {
        const out: string[] = []
        const last = String(b.end_date).slice(0, 10)
        let cur = String(b.start_date).slice(0, 10)
        for (let i = 0; cur <= last && i < 400; i++) {
          out.push(cur)
          const d = new Date(`${cur}T12:00:00Z`)
          d.setUTCDate(d.getUTCDate() + 1)
          cur = d.toISOString().slice(0, 10)
        }
        return out
      }),
    ],
  })

  if (schedule.length === 0) {
    return NextResponse.json({ error: 'Ta konfiguracja nie daje żadnej lekcji — sprawdź terminy i czas trwania.' }, { status: 400 })
  }

  const lessonPrice = num(body.lessonPrice)
  const teacherRate = num(body.teacherRate)
  const paymentMode = body.paymentMode === 'upfront' ? 'upfront' : 'monthly'
  const template = pending[0]

  // Seria powstaje od nowa z zatwierdzonego przepisu — stare, niepotwierdzone
  // terminy z kreatora przestają obowiązywać.
  await db.from('lessons').delete().in('id', pending.map((l) => l.id))

  const rows = schedule.map((s) => ({
    student_id: studentId,
    teacher_id: teacherId,
    type: 'online' as const,
    format: template.format ?? 'individual',
    level: template.level ?? 'A1',
    starts_at: s.startsAt,
    ends_at: s.endsAt,
    is_confirmed: true,
    meeting_url: meetingUrl || null,
    teacher_rate: teacherRate,
  }))
  const { error: insertError } = await db.from('lessons').insert(rows)
  if (insertError) {
    return NextResponse.json({ error: `Nie udało się zapisać terminów: ${insertError.message}` }, { status: 500 })
  }

  const studentUpdate: Record<string, unknown> = {
    teacher_id: teacherId,
    status: 'active',
    payment_mode: paymentMode,
    course_config: {
      slots,
      startDate: body.startDate,
      endDate: body.endDate,
      excludedDates: excluded,
      lessonPrice,
      teacherRate,
      paymentMode,
    },
  }
  if (lessonPrice != null) studentUpdate.custom_lesson_price = lessonPrice
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

  const firstStart = new Date(schedule[0].startsAt)
  const courseTotal = lessonPrice != null ? Math.round(lessonPrice * schedule.length) : null

  // Naliczenie zależy od tego, jak klient płaci. Przy „co miesiąc" obciążamy
  // tylko pierwszy miesiąc — kolejne dołoży cron pierwszego dnia miesiąca.
  // Przy „z góry" zapisujemy obciążenie na każdy miesiąc kursu, ale do zapłaty
  // idzie jedna kwota; dzięki temu cron nie naliczy niczego drugi raz.
  let amount: number | null = null
  let paymentUrl: string | null = null

  if (lessonPrice != null) {
    const perMonth = lessonsPerMonth(schedule)
    const months = Object.keys(perMonth).sort()
    const firstMonth = months[0]

    const charges = (paymentMode === 'upfront' ? months : [firstMonth]).map((m) => {
      const period = periodFromDateString(`${m}-01`)
      return {
        student_id: studentId,
        type: 'charge' as const,
        amount: Math.round(perMonth[m] * lessonPrice),
        description: `Abonament ${periodLabel(period)} — Lekcje indywidualne (${perMonth[m]} × ${lessonPrice} zł)`,
        billing_period: periodKey(period),
      }
    })

    // Nie dublujemy okresów już naliczonych (np. przy ponownym zatwierdzeniu).
    const { data: existing } = await db
      .from('transactions')
      .select('billing_period')
      .eq('student_id', studentId)
      .eq('type', 'charge')
      .in('billing_period', charges.map((c) => c.billing_period))
    const already = new Set((existing ?? []).map((e) => String(e.billing_period)))
    const fresh = charges.filter((c) => !already.has(c.billing_period))

    if (fresh.length > 0) await db.from('transactions').insert(fresh)
    amount = fresh.reduce((a, c) => a + c.amount, 0) || null

    if (amount && email) {
      try {
        const base = process.env.NEXT_PUBLIC_APP_URL || ''
        paymentUrl = await createCheckoutSession({
          amount, studentId, email,
          description: paymentMode === 'upfront'
            ? `Kurs — ${schedule.length} zajęć`
            : `Zajęcia — ${periodLabel(periodOf(firstStart))}`,
          successUrl: `${base}/platnosci?success=true`,
          cancelUrl: `${base}/platnosci?cancelled=true`,
        })
      } catch (err) {
        console.error('[Online booking approve] checkout error:', err)
      }
    }
  }

  if (email) {
    await sendBookingApproved(email, {
      studentName, teacherName,
      date: format(firstStart, 'EEEE, d MMMM yyyy', { locale: pl }),
      time: format(firstStart, 'HH:mm'),
      meetLink: meetingUrl || undefined,
      amount, paymentUrl,
      recurring: schedule.length > 1,
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    lessons: schedule.length,
    schedule: describeSlots(slots),
    courseTotal,
    charged: amount,
    paymentUrl,
  })
}
