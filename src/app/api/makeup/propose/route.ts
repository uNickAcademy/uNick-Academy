import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendBulkMessage, isEmailConfigured } from '@/lib/email/send'

type ProfileLite = { full_name?: string; email?: string }
type StudentLite = { profile_id: string; profile?: ProfileLite | ProfileLite[] }
type TeacherLite = { profile_id: string; profile?: ProfileLite | ProfileLite[] }

// Uczeń albo nauczyciel proponuje termin odrobienia odwołanej lekcji.
// Druga strona musi ją zaakceptować (/api/makeup/respond), zanim powstanie
// nowa lekcja — samo wysłanie propozycji niczego jeszcze nie rezerwuje.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })

  const { lessonId, startsAt, endsAt, meetingUrl } = await req.json() as {
    lessonId: string; startsAt: string; endsAt: string; meetingUrl?: string
  }
  if (!lessonId || !startsAt || !endsAt) return NextResponse.json({ error: 'Brakuje danych' }, { status: 400 })
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) return NextResponse.json({ error: 'Zły zakres czasu' }, { status: 400 })
  if (new Date(startsAt).getTime() < Date.now()) return NextResponse.json({ error: 'Termin musi być w przyszłości' }, { status: 400 })

  const db = createAdminClient()
  const { data: lesson } = await db.from('lessons')
    .select(`
      id, student_id, teacher_id, attendance, cancelled_at,
      student:students(profile_id, profile:profiles(full_name, email)),
      teacher:teachers(profile_id, profile:profiles(full_name, email))
    `)
    .eq('id', lessonId).single()
  if (!lesson) return NextResponse.json({ error: 'Nie znaleziono lekcji' }, { status: 404 })
  if (lesson.attendance !== 'excused' || lesson.cancelled_at) {
    return NextResponse.json({ error: 'Ta lekcja nie kwalifikuje się do odrobienia' }, { status: 400 })
  }

  const student = (Array.isArray(lesson.student) ? lesson.student[0] : lesson.student) as StudentLite | undefined
  const teacher = (Array.isArray(lesson.teacher) ? lesson.teacher[0] : lesson.teacher) as TeacherLite | undefined
  const sProfile = (Array.isArray(student?.profile) ? student!.profile[0] : student?.profile) as ProfileLite | undefined
  const tProfile = (Array.isArray(teacher?.profile) ? teacher!.profile[0] : teacher?.profile) as ProfileLite | undefined

  let proposedBy: 'student' | 'teacher'
  if (student?.profile_id === user.id) proposedBy = 'student'
  else if (teacher?.profile_id === user.id) proposedBy = 'teacher'
  else return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const { data: alreadyMadeUp } = await db.from('makeup_proposals')
    .select('id').eq('lesson_id', lessonId).eq('status', 'accepted').maybeSingle()
  if (alreadyMadeUp) return NextResponse.json({ error: 'Ta lekcja została już odrobiona' }, { status: 400 })

  // Nowa propozycja zastępuje poprzednią oczekującą (jedna aktywna na lekcję).
  await db.from('makeup_proposals')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('lesson_id', lessonId).eq('status', 'pending')

  const { data: proposal, error } = await db.from('makeup_proposals').insert({
    lesson_id: lessonId,
    student_id: lesson.student_id,
    teacher_id: lesson.teacher_id,
    proposed_by: proposedBy,
    proposed_starts_at: startsAt,
    proposed_ends_at: endsAt,
    meeting_url: meetingUrl || null,
    status: 'pending',
  }).select('*').single()
  if (error) return NextResponse.json({ error: 'Nie udało się wysłać propozycji: ' + error.message }, { status: 500 })

  if (isEmailConfigured()) {
    const when = new Date(startsAt).toLocaleString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    if (proposedBy === 'student' && tProfile?.email) {
      await sendBulkMessage([{ email: tProfile.email, name: tProfile.full_name ?? 'Nauczycielu' }],
        `Propozycja terminu odrabiania – ${sProfile?.full_name ?? 'Uczeń'}`,
        `${sProfile?.full_name ?? 'Uczeń'} proponuje odrobienie odwołanych zajęć: ${when}.\nZaakceptuj lub odrzuć propozycję w Dzienniku.`)
    } else if (proposedBy === 'teacher' && sProfile?.email) {
      await sendBulkMessage([{ email: sProfile.email, name: sProfile.full_name ?? 'Uczniu' }],
        'Propozycja terminu odrabiania',
        `${tProfile?.full_name ?? 'Nauczyciel'} proponuje termin odrobienia odwołanych zajęć: ${when}.\nZaakceptuj lub odrzuć propozycję w sekcji „Moje lekcje".`)
    }
  }

  return NextResponse.json({ proposal })
}
