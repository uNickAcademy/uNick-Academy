import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendLessonConfirmation } from '@/lib/email/send'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kind } = body
    const supabase = createAdminClient()

    if (kind === 'group') {
      const { email, fullName, phone, childName, groupId, termsVersion, consents } = body
      if (!email || !fullName || !groupId) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
      const { error } = await supabase.rpc('public_enroll_group', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_group_id: groupId, p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
      })
      if (error) {
        const msg = /miejsc/i.test(error.message) ? 'Brak wolnych miejsc w tej grupie.' : 'Nie udało się zapisać do grupy.'
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (kind === 'online') {
      const { email, fullName, phone, childName, teacherId, slot, ongoing, weeks, referralCode, discountCode, termsVersion, consents } = body
      if (!email || !fullName || !teacherId || !slot) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
      const startsAt = new Date(slot)
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
      const { error } = await supabase.rpc('public_book_online', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_teacher: teacherId, p_starts: startsAt.toISOString(), p_ends: endsAt.toISOString(),
        p_ongoing: !!ongoing, p_weeks: weeks ?? 12,
        p_referral: referralCode || '', p_discount: discountCode || '',
        p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
      })
      if (error) {
        console.error('[Booking online] RPC error:', error)
        return NextResponse.json({ error: 'Nie udało się zarezerwować lekcji.' }, { status: 500 })
      }
      const { data: teacher } = await supabase.from('teachers').select('profile:profiles(full_name)').eq('id', teacherId).single()
      const teacherName: string = (teacher?.profile as { full_name?: string } | null)?.full_name ?? 'Nauczyciel'
      await sendLessonConfirmation(email, {
        studentName: fullName, teacherName,
        date: format(startsAt, 'EEEE, d MMMM yyyy', { locale: pl }), time: format(startsAt, 'HH:mm'),
        topic: ongoing ? 'Lekcje cykliczne (online)' : 'Lekcja online',
        type: 'online', meetLink: 'https://meet.google.com/unick-lesson',
      }).catch(() => {})
      return NextResponse.json({ success: true })
    }

    if (kind === 'stationary') {
      const { email, fullName, phone, childName, level, age, address, slots, notes, termsVersion, consents } = body
      if (!email || !fullName || !address) return NextResponse.json({ error: 'Podaj dane i adres zajęć' }, { status: 400 })
      const { error } = await supabase.rpc('public_stationary_request', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_level: level || 'A1', p_age: age ?? null, p_address: address, p_slots: slots ?? [],
        p_notes: notes || '', p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
      })
      if (error) {
        console.error('[Booking stationary] RPC error:', error)
        return NextResponse.json({ error: 'Nie udało się wysłać prośby.' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Nieznany typ zapisu' }, { status: 400 })
  } catch (err) {
    console.error('[Booking] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
