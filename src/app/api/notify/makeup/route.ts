import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBulkMessage, isEmailConfigured } from '@/lib/email/send'

// Powiadamia prowadzącego o zgłoszonej nieobecności lub zapisie na odrabianie
export async function POST(req: NextRequest) {
  const { lessonId, kind } = await req.json() as { lessonId: string; kind: 'absence' | 'booked' }
  if (!lessonId || !kind) return NextResponse.json({ error: 'Brak danych' }, { status: 400 })

  const admin = createAdminClient()
  const { data: lesson } = await admin
    .from('lessons')
    .select('starts_at, topic, teacher:teachers(profile:profiles(full_name, email)), student:students(profile:profiles(full_name))')
    .eq('id', lessonId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Nie znaleziono lekcji' }, { status: 404 })

  // @ts-expect-error zagnieżdżenie joinów
  const teacher = Array.isArray(lesson.teacher) ? lesson.teacher[0] : lesson.teacher
  const tProfile = Array.isArray(teacher?.profile) ? teacher.profile[0] : teacher?.profile
  // @ts-expect-error zagnieżdżenie joinów
  const student = Array.isArray(lesson.student) ? lesson.student[0] : lesson.student
  const sProfile = Array.isArray(student?.profile) ? student.profile[0] : student?.profile

  const teacherEmail: string | undefined = tProfile?.email
  const teacherName: string = tProfile?.full_name ?? 'Nauczycielu'
  const studentName: string = sProfile?.full_name ?? 'Uczeń'
  const when = new Date(lesson.starts_at).toLocaleString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

  if (!teacherEmail || !isEmailConfigured()) {
    return NextResponse.json({ sent: false, emailConfigured: isEmailConfigured() })
  }

  const subject = kind === 'absence'
    ? `Zgłoszona nieobecność – ${studentName}`
    : `Zapis na odrabianie – ${studentName}`
  const body = kind === 'absence'
    ? `${studentName} zgłosił/a nieobecność na lekcji (${when}).\nUczeń może zapisać się na odrabianie z Twojej dostępności.`
    : `${studentName} zapisał/a się na odrabianie: ${when}.\nNowa lekcja jest już w Twoim kalendarzu i dzienniku.`

  await sendBulkMessage([{ email: teacherEmail, name: teacherName }], subject, body)
  return NextResponse.json({ sent: true })
}
