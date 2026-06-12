import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendBulkMessage, isEmailConfigured } from '@/lib/email/send'

type Recipient = { email: string; name: string }

export async function POST(req: NextRequest) {
  // Autoryzacja: admin
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const { segment, subject, body, groupId, dateFrom, dateTo, preview } = await req.json()
  if (!preview && (!subject?.trim() || !body?.trim())) {
    return NextResponse.json({ error: 'Podaj temat i treść.' }, { status: 400 })
  }

  const admin = createAdminClient()
  let recipients: Recipient[] = []

  // Joiny zwracają zagnieżdżenia, których typy bywają wnioskowane jako tablice — pracujemy na any
  const profOf = (p: unknown): { email?: string; full_name?: string } | undefined =>
    Array.isArray(p) ? p[0] : (p as { email?: string; full_name?: string } | undefined)

  if (segment === 'all_students') {
    const { data } = await admin.from('students').select('profile:profiles(email, full_name)')
    recipients = (data ?? []).map((s: { profile?: unknown }) => {
      const p = profOf(s.profile); return { email: p?.email ?? '', name: p?.full_name ?? '' }
    })
  } else if (segment === 'all_teachers') {
    const { data } = await admin.from('teachers').select('profile:profiles(email, full_name)')
    recipients = (data ?? []).map((t: { profile?: unknown }) => {
      const p = profOf(t.profile); return { email: p?.email ?? '', name: p?.full_name ?? '' }
    })
  } else if (segment === 'group' && groupId) {
    const { data } = await admin.from('group_members')
      .select('student:students(profile:profiles(email, full_name))').eq('group_id', groupId)
    recipients = (data ?? []).map((m: { student?: unknown }) => {
      const st = Array.isArray(m.student) ? m.student[0] : (m.student as { profile?: unknown } | undefined)
      const p = profOf(st?.profile); return { email: p?.email ?? '', name: p?.full_name ?? '' }
    })
  } else if (segment === 'lessons_range' && dateFrom && dateTo) {
    const { data } = await admin.from('lessons')
      .select('student:students(profile:profiles(email, full_name))')
      .gte('starts_at', dateFrom).lte('starts_at', dateTo).not('student_id', 'is', null)
    const seen = new Set<string>()
    for (const l of (data ?? []) as { student?: unknown }[]) {
      const st = Array.isArray(l.student) ? l.student[0] : (l.student as { profile?: unknown } | undefined)
      const p = profOf(st?.profile)
      if (p?.email && !seen.has(p.email)) { seen.add(p.email); recipients.push({ email: p.email, name: p.full_name ?? '' }) }
    }
  } else {
    return NextResponse.json({ error: 'Nieprawidłowy segment.' }, { status: 400 })
  }

  recipients = recipients.filter((r) => r.email)

  // Tryb podglądu — tylko liczba odbiorców, bez wysyłki
  if (preview) {
    return NextResponse.json({ preview: true, recipients: recipients.length })
  }

  if (!isEmailConfigured()) {
    // Resend nieaktywny — zwracamy listę odbiorców bez wysyłki (gotowe do włączenia kluczem)
    return NextResponse.json({ sent: 0, recipients: recipients.length, emailConfigured: false })
  }

  const sent = await sendBulkMessage(recipients, subject.trim(), body.trim())
  return NextResponse.json({ sent, recipients: recipients.length, emailConfigured: true })
}
