import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendBulkMessage, isEmailConfigured } from '@/lib/email/send'
import { sendBulkWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp/send'

type Recipient = { email: string; name: string; phone: string }

export async function POST(req: NextRequest) {
  // Autoryzacja: admin
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const { channel, segment, subject, body, groupId, dateFrom, dateTo, preview } = await req.json()
  const isWhatsApp = channel === 'whatsapp'
  if (!preview && (!isWhatsApp && !subject?.trim())) {
    return NextResponse.json({ error: 'Podaj temat.' }, { status: 400 })
  }
  if (!preview && !body?.trim()) {
    return NextResponse.json({ error: 'Podaj treść.' }, { status: 400 })
  }

  const admin = createAdminClient()
  let recipients: Recipient[] = []

  // Joiny zwracają zagnieżdżenia, których typy bywają wnioskowane jako tablice — pracujemy na any
  const profOf = (p: unknown): { email?: string; full_name?: string; phone?: string } | undefined =>
    Array.isArray(p) ? p[0] : (p as { email?: string; full_name?: string; phone?: string } | undefined)

  if (segment === 'all_students') {
    const { data } = await admin.from('students').select('profile:profiles(email, full_name, phone)')
    recipients = (data ?? []).map((s: { profile?: unknown }) => {
      const p = profOf(s.profile); return { email: p?.email ?? '', name: p?.full_name ?? '', phone: p?.phone ?? '' }
    })
  } else if (segment === 'all_teachers') {
    const { data } = await admin.from('teachers').select('whatsapp_phone, profile:profiles(email, full_name, phone)')
    recipients = (data ?? []).map((t: { whatsapp_phone?: string | null; profile?: unknown }) => {
      const p = profOf(t.profile); return { email: p?.email ?? '', name: p?.full_name ?? '', phone: t.whatsapp_phone || p?.phone || '' }
    })
  } else if (segment === 'group' && groupId) {
    const { data } = await admin.from('group_members')
      .select('student:students(profile:profiles(email, full_name, phone))').eq('group_id', groupId)
    recipients = (data ?? []).map((m: { student?: unknown }) => {
      const st = Array.isArray(m.student) ? m.student[0] : (m.student as { profile?: unknown } | undefined)
      const p = profOf(st?.profile); return { email: p?.email ?? '', name: p?.full_name ?? '', phone: p?.phone ?? '' }
    })
    // Lekcja grupowa = wszyscy uczestnicy + prowadzący (jedna wiadomość na osobę — WhatsApp nie obsługuje grup)
    const { data: group } = await admin.from('groups')
      .select('teacher:teachers(whatsapp_phone, profile:profiles(email, full_name, phone))')
      .eq('id', groupId).single()
    const teacherRaw = group?.teacher
    const teacher = Array.isArray(teacherRaw) ? teacherRaw[0] : teacherRaw as { whatsapp_phone?: string | null; profile?: unknown } | undefined
    if (teacher) {
      const p = profOf(teacher.profile)
      recipients.push({ email: p?.email ?? '', name: p?.full_name ?? '', phone: teacher.whatsapp_phone || p?.phone || '' })
    }
  } else if (segment === 'lessons_range' && dateFrom && dateTo) {
    const { data } = await admin.from('lessons')
      .select('student:students(profile:profiles(email, full_name, phone))')
      .gte('starts_at', dateFrom).lte('starts_at', dateTo).not('student_id', 'is', null)
    const seen = new Set<string>()
    for (const l of (data ?? []) as { student?: unknown }[]) {
      const st = Array.isArray(l.student) ? l.student[0] : (l.student as { profile?: unknown } | undefined)
      const p = profOf(st?.profile)
      const key = p?.email || p?.phone
      if (key && !seen.has(key)) { seen.add(key); recipients.push({ email: p?.email ?? '', name: p?.full_name ?? '', phone: p?.phone ?? '' }) }
    }
  } else {
    return NextResponse.json({ error: 'Nieprawidłowy segment.' }, { status: 400 })
  }

  recipients = isWhatsApp ? recipients.filter((r) => r.phone) : recipients.filter((r) => r.email)

  // Tryb podglądu — tylko liczba odbiorców, bez wysyłki
  if (preview) {
    return NextResponse.json({ preview: true, recipients: recipients.length })
  }

  if (isWhatsApp) {
    if (!isWhatsAppConfigured()) {
      return NextResponse.json({ sent: 0, recipients: recipients.length, channelConfigured: false })
    }
    const { sent, failed } = await sendBulkWhatsApp(recipients, body.trim())
    return NextResponse.json({ sent, failed, recipients: recipients.length, channelConfigured: true })
  }

  if (!isEmailConfigured()) {
    // Resend nieaktywny — zwracamy listę odbiorców bez wysyłki (gotowe do włączenia kluczem)
    return NextResponse.json({ sent: 0, recipients: recipients.length, channelConfigured: false })
  }

  const sent = await sendBulkMessage(recipients, subject.trim(), body.trim())
  return NextResponse.json({ sent, recipients: recipients.length, channelConfigured: true })
}
