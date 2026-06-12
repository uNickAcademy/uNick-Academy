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

  const rec = lesson as Record<string, unknown>
  const teacher = (Array.isArray(rec.teacher) ? rec.teacher[0] : rec.teacher) as { profile?: unknown } | undefined
  const tProfile = (Array.isArray(teacher?.profile) ? teacher!.profile[0] : teacher?.profile) as { email?: string; full_name?: string } | undefined
  const student = (Array.isArray(rec.student) ? rec.student[0] : rec.student) as { profile?: unknown } | undefined
  const sProfile = (Array.isArray(student?.profile) ? student!.profile[0] : student?.profile) as { full_name?: string } | undefined

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
