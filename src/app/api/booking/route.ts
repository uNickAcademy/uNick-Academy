import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendLessonConfirmation } from '@/lib/email/send'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lessonType, lessonFormat, teacherId, slot, fullName, email, phone, referralCode, discountCode, termsVersion, consents } = body

    if (!lessonType || !lessonFormat || !teacherId || !slot || !fullName || !email) {
      return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
    }

    const startsAt = new Date(slot)
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)

    const supabase = createAdminClient()

    const { error } = await supabase.rpc('public_booking', {
      p_email: email, p_full_name: fullName, p_phone: phone || '', p_teacher: teacherId,
      p_type: lessonType, p_format: lessonFormat, p_starts: startsAt.toISOString(), p_ends: endsAt.toISOString(),
      p_referral: referralCode || '', p_discount: discountCode || '',
      p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
    })

    if (error) {
      console.error('[Booking] RPC error:', error)
      return NextResponse.json({ error: 'Nie udało się utworzyć rezerwacji' }, { status: 500 })
    }

    // mail potwierdzający (najlepszy wysiłek)
    const { data: teacher } = await supabase
      .from('teachers').select('profile:profiles(full_name)').eq('id', teacherId).single()
    // @ts-expect-error zagnieżdżenie
    const teacherName: string = teacher?.profile?.full_name ?? 'Nauczyciel'

    await sendLessonConfirmation(email, {
      studentName: fullName,
      teacherName,
      date: format(startsAt, 'EEEE, d MMMM yyyy', { locale: pl }),
      time: format(startsAt, 'HH:mm'),
      topic: 'Lekcja próbna',
      type: lessonType,
      meetLink: lessonType === 'online' ? 'https://meet.google.com/unick-lesson' : undefined,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Booking] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
