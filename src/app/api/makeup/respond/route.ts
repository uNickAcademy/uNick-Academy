import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendBulkMessage, isEmailConfigured } from '@/lib/email/send'

type ProfileLite = { full_name?: string; email?: string }

// Druga strona odpowiada na propozycję terminu odrobienia: akceptuje (tworzy
// nową lekcję), odrzuca, albo autor ją wycofuje zanim ktokolwiek odpowie.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })

  const { proposalId, action } = await req.json() as { proposalId: string; action: 'accept' | 'decline' | 'cancel' }
  if (!proposalId || !['accept', 'decline', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Złe dane' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: proposal } = await db.from('makeup_proposals')
    .select('*, lesson:lessons(id, type, level, starts_at, meeting_url)')
    .eq('id', proposalId).single()
  if (!proposal) return NextResponse.json({ error: 'Nie znaleziono propozycji' }, { status: 404 })
  if (proposal.status !== 'pending') return NextResponse.json({ error: 'Ta propozycja została już rozpatrzona' }, { status: 400 })

  const { data: student } = await db.from('students').select('id, profile_id, full_name, profile:profiles(full_name, email)').eq('id', proposal.student_id).single()
  const { data: teacher } = await db.from('teachers').select('id, profile_id, profile:profiles(full_name, email)').eq('id', proposal.teacher_id).single()
  const sProfile = (Array.isArray(student?.profile) ? student!.profile[0] : student?.profile) as ProfileLite | undefined
  const tProfile = (Array.isArray(teacher?.profile) ? teacher!.profile[0] : teacher?.profile) as ProfileLite | undefined

  const isStudentUser = student?.profile_id === user.id
  const isTeacherUser = teacher?.profile_id === user.id
  if (!isStudentUser && !isTeacherUser) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  if (action === 'cancel') {
    const isProposer = (proposal.proposed_by === 'student' && isStudentUser) || (proposal.proposed_by === 'teacher' && isTeacherUser)
    if (!isProposer) return NextResponse.json({ error: 'Tylko autor może wycofać propozycję' }, { status: 403 })
    await db.from('makeup_proposals').update({ status: 'cancelled', responded_at: new Date().toISOString() }).eq('id', proposalId)
    return NextResponse.json({ success: true })
  }

  const isCounterparty = (proposal.proposed_by === 'student' && isTeacherUser) || (proposal.proposed_by === 'teacher' && isStudentUser)
  if (!isCounterparty) return NextResponse.json({ error: 'Tylko druga strona może odpowiedzieć na propozycję' }, { status: 403 })

  const when = new Date(proposal.proposed_starts_at).toLocaleString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  const proposerIsStudent = proposal.proposed_by === 'student'
  const proposerEmail = proposerIsStudent ? sProfile?.email : tProfile?.email
  const proposerName = proposerIsStudent ? (sProfile?.full_name ?? 'Uczniu') : (tProfile?.full_name ?? 'Nauczycielu')

  if (action === 'decline') {
    await db.from('makeup_proposals').update({ status: 'declined', responded_at: new Date().toISOString() }).eq('id', proposalId)
    if (isEmailConfigured() && proposerEmail) {
      await sendBulkMessage([{ email: proposerEmail, name: proposerName }],
        'Propozycja terminu odrabiania odrzucona',
        `Zaproponowany termin (${when}) został odrzucony. Zaproponuj inny termin odrobienia zajęć.`)
    }
    return NextResponse.json({ success: true })
  }

  // action === 'accept' — sprawdź, czy nauczyciel nie ma już w tym czasie innych zajęć
  const { data: conflicts } = await db.from('lessons').select('id')
    .eq('teacher_id', proposal.teacher_id).is('cancelled_at', null)
    .lt('starts_at', proposal.proposed_ends_at).gt('ends_at', proposal.proposed_starts_at)
  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'Nauczyciel ma już zajęcia o tej porze — poproś o inny termin.' }, { status: 400 })
  }

  const lesson = proposal.lesson as { id: string; type: string; level: string; starts_at: string; meeting_url: string | null }
  const origDate = new Date(lesson.starts_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
  const { data: created, error: createErr } = await db.from('lessons').insert({
    student_id: proposal.student_id,
    teacher_id: proposal.teacher_id,
    type: lesson.type,
    format: 'individual',
    level: lesson.level,
    topic: `Odrabianie (za ${origDate})`,
    starts_at: proposal.proposed_starts_at,
    ends_at: proposal.proposed_ends_at,
    meeting_url: proposal.meeting_url || lesson.meeting_url || null,
    makeup_for_lesson_id: lesson.id,
  }).select('id').single()
  if (createErr) return NextResponse.json({ error: 'Nie udało się utworzyć lekcji: ' + createErr.message }, { status: 500 })

  await db.from('makeup_proposals')
    .update({ status: 'accepted', responded_at: new Date().toISOString(), created_lesson_id: created!.id })
    .eq('id', proposalId)

  if (isEmailConfigured() && proposerEmail) {
    await sendBulkMessage([{ email: proposerEmail, name: proposerName }],
      'Propozycja terminu odrabiania zaakceptowana',
      `Termin odrobienia zajęć (${when}) został zaakceptowany. Nowa lekcja jest już w kalendarzu.`)
  }

  return NextResponse.json({ success: true, lessonId: created!.id })
}
