import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifySchoolSms } from '@/lib/sms/send'

// Publiczny formularz "Bezpłatna konsultacja" (modal na stronach publicznych).
export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, audience, message } = await req.json()
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Imię i e-mail są wymagane.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('consultation_requests').insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      audience: audience || null,
      message: message?.trim() || null,
    })
    if (error) {
      console.error('[Consultation] Insert error:', error)
      return NextResponse.json({ error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.' }, { status: 500 })
    }

    await notifySchoolSms(
      `Nowa konsultacja: ${name.trim()}${phone ? `, tel. ${phone.trim()}` : ''}, ${email.trim()}${audience ? ` (${audience})` : ''}`
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Consultation] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
