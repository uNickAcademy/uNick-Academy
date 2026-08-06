import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateLessons, type Slot } from '@/lib/lessons/schedule'

// Harmonogram, stawka i link do zajęć dla JUŻ ISTNIEJĄCEGO ucznia
// indywidualnego (panel Studenci) — odpowiednik tego, co dzieje się przy
// zatwierdzaniu nowego zapisu (/api/admin/online-bookings), ale bez prawa
// ruszać przeszłość: ten uczeń mógł już odbyć dziesiątki lekcji z frekwencją
// i notatkami, więc nic sprzed „teraz" nie jest kasowane ani zastępowane.
//
// Dwa niezależne skutki zapisu:
//  1. Zawsze: link do zajęć, prowadzący i stawka nauczyciela aktualizują się
//     na WSZYSTKICH już zaplanowanych, przyszłych lekcjach (zwykły UPDATE,
//     nic nie znika).
//  2. Tylko gdy admin świadomie kliknie „Zastosuj terminy" (applySchedule):
//     przyszłe, jeszcze nieodbyte terminy zostają zastąpione nową serią
//     wygenerowaną z podanych terminów tygodniowych — to jedyny moment,
//     w którym coś jest usuwane, i dotyczy wyłącznie tego, co jeszcze się
//     nie wydarzyło.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const body = await req.json()
  const studentId: string | undefined = body.studentId
  const teacherId: string | undefined = body.teacherId
  const meetingUrl: string = body.meetingUrl || ''
  const slots: Slot[] = (body.slots ?? []).filter((s: Slot) => s && s.time && s.day >= 0 && s.day <= 6)
  const startDate: string | undefined = body.startDate
  const endDate: string | undefined = body.endDate
  const excludedDates: string[] = body.excludedDates ?? []
  const lessonPrice = numOrNull(body.lessonPrice)
  const teacherRate = numOrNull(body.teacherRate)
  const applySchedule: boolean = body.applySchedule === true

  if (!studentId) return NextResponse.json({ error: 'Brak ucznia' }, { status: 400 })

  const db = createAdminClient()
  const { data: student } = await db.from('students').select('id, level, teacher_id').eq('id', studentId).single()
  if (!student) return NextResponse.json({ error: 'Nie znaleziono ucznia' }, { status: 404 })

  const effectiveTeacherId = teacherId || student.teacher_id
  const now = new Date().toISOString()

  await db.from('students').update({
    teacher_id: effectiveTeacherId || null,
    custom_lesson_price: lessonPrice,
    custom_teacher_rate: teacherRate,
    // endDate puste = kurs bezterminowy (ongoing); zapisujemy to jako null,
    // nie jako brak konfiguracji — reszta przepisu (terminy, wykluczenia)
    // zostaje.
    course_config: slots.length > 0 && startDate
      ? { slots, startDate, endDate: endDate || null, excludedDates, meetingUrl }
      : null,
  }).eq('id', studentId)

  // Skutek 1: nie kasujemy niczego, tylko uaktualniamy to, co już zaplanowane.
  const { data: touched } = await db
    .from('lessons')
    .update({
      ...(effectiveTeacherId ? { teacher_id: effectiveTeacherId } : {}),
      ...(meetingUrl ? { meeting_url: meetingUrl } : {}),
      teacher_rate: teacherRate,
    })
    .eq('student_id', studentId)
    .is('cancelled_at', null)
    .is('group_id', null)
    .gt('starts_at', now)
    .select('id')

  let regenerated = 0
  if (applySchedule) {
    if (slots.length === 0 || !startDate) {
      return NextResponse.json({ error: 'Podaj terminy zajęć i początek kursu.' }, { status: 400 })
    }
    // Koniec kursu jest opcjonalny — brak oznacza zajęcia bezterminowe.
    if (endDate && endDate < startDate) {
      return NextResponse.json({ error: 'Koniec kursu nie może wypadać przed początkiem.' }, { status: 400 })
    }
    if (!effectiveTeacherId) {
      return NextResponse.json({ error: 'Przypisz nauczyciela przed wygenerowaniem terminów.' }, { status: 400 })
    }

    const { data: breaks } = await db.from('holidays').select('start_date, end_date')
    const breakDates = (breaks ?? []).flatMap((b) => {
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
    })

    // Regenerujemy wyłącznie ogon: dziś (albo późniejszy startDate) → koniec
    // kursu. Wszystko sprzed „teraz" zostaje nietknięte — tam jest historia.
    const today = now.slice(0, 10)
    const genFrom = startDate > today ? startDate : today
    const schedule = generateLessons({
      slots, startDate: genFrom, endDate,
      excludedDates: [...excludedDates, ...breakDates],
    })

    if (schedule.length === 0) {
      return NextResponse.json({ error: 'Ta konfiguracja nie daje żadnej lekcji w pozostałym czasie kursu.' }, { status: 400 })
    }

    await db.from('lessons').delete()
      .eq('student_id', studentId).is('cancelled_at', null).is('group_id', null).gt('starts_at', now)

    const { error: insertError } = await db.from('lessons').insert(schedule.map((s) => ({
      student_id: studentId,
      teacher_id: effectiveTeacherId,
      type: 'online' as const,
      format: 'individual' as const,
      level: student.level,
      starts_at: s.startsAt,
      ends_at: s.endsAt,
      is_confirmed: true,
      meeting_url: meetingUrl || null,
      teacher_rate: teacherRate,
    })))
    if (insertError) return NextResponse.json({ error: `Nie udało się zapisać terminów: ${insertError.message}` }, { status: 500 })
    regenerated = schedule.length
  }

  return NextResponse.json({
    success: true,
    updated: applySchedule ? 0 : (touched?.length ?? 0),
    regenerated,
  })
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}
