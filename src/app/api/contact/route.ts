import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifySchoolSms } from '@/lib/sms/send'
import { notifySchoolEmail } from '@/lib/email/send'
import { createLead, type LeadStudentType } from '@/lib/leads/create'

// Formularz kontaktowy ze stron marketingowych (/pl/contact).
//
// Ten endpoint nie istniał — `ContactForm.js` wysyłał POST pod nieistniejącą
// ścieżkę, więc każde zgłoszenie ze strony kontaktu przepadało, a użytkownik
// widział komunikat o błędzie. Zapisujemy od razu do `leads`, bo migracja 116
// uczyniła go jedynym lejkiem B2C.

// Wartości z `dict.common.audienceOptions` (klucze słownika) na `lead_student_type`.
const AUDIENCE_TO_TYPE: Record<string, LeadStudentType> = {
  child: 'child',
  teen: 'teen',
  adult: 'adult',
  company: 'corporate',
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, audience, message } = await req.json()
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Imię i e-mail są wymagane.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const cleanName = name.trim()
    const cleanEmail = email.trim()
    const cleanPhone = phone?.trim() || null
    const cleanMessage = message?.trim() || null

    // 'unsure' i brak wyboru zostają puste — agent dopyta. Zgadywanie typu
    // ucznia zaśmieciłoby lejek gorzej niż pusta wartość.
    const studentType = AUDIENCE_TO_TYPE[audience] ?? null

    let isReturning = false
    try {
      const result = await createLead(admin, {
        entryPoint: 'contact_form',
        firstName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        studentType,
        goal: cleanMessage,
      })
      isReturning = result.isReturning
    } catch (err) {
      console.error('[Contact] createLead error:', err)
      return NextResponse.json(
        { error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.' },
        { status: 500 }
      )
    }

    await admin.from('admin_notifications').insert({
      kind: 'contact',
      title: `${isReturning ? 'Ponowny kontakt' : 'Nowa wiadomość z formularza'}: ${cleanName}`,
      body: `${cleanPhone ? `tel. ${cleanPhone}, ` : ''}${cleanEmail}${audience ? ` · dla: ${audience}` : ''}${cleanMessage ? ` — ${cleanMessage}` : ''}`,
    }).then(undefined, (e: unknown) => console.error('[Contact] notify error:', e))

    await notifySchoolSms(
      `${isReturning ? 'Ponowny kontakt' : 'Nowa wiadomość'}: ${cleanName}${cleanPhone ? `, tel. ${cleanPhone}` : ''}, ${cleanEmail}${audience ? ` (${audience})` : ''}`
    )
    await notifySchoolEmail({
      title: `${isReturning ? 'Ponowna wiadomość' : 'Nowa wiadomość'} z formularza kontaktowego: ${cleanName}`,
      lines: [
        `Imię i nazwisko: ${cleanName}`,
        cleanPhone ? `Telefon: ${cleanPhone}` : '',
        `E-mail: ${cleanEmail}`,
        audience ? `Pyta o: ${audience}` : '',
        cleanMessage ? `Wiadomość: ${cleanMessage}` : '',
        isReturning ? 'Uwaga: ten kontakt jest już w lejku — dopisano do istniejącego leada.' : '',
      ],
      actionLabel: 'Otwórz pipeline →',
      actionPath: '/admin/pipeline',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Contact] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
