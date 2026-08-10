import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifySchoolSms } from '@/lib/sms/send'
import { notifySchoolEmail } from '@/lib/email/send'
import { createLead, type LeadStudentType } from '@/lib/leads/create'

// createLead() woła Agenta Łowcę (Claude + Resend) synchronicznie dla nowych
// leadów — domyślny limit czasu funkcji Vercel bywa za krótki na to wywołanie.
export const maxDuration = 30

// Publiczny formularz "Bezpłatna konsultacja" (modal na stronach publicznych).
//
// Zapisywał do `consultation_requests`, którą migracja 116 wycofała
// („ZASTĄPIONA przez public.leads (...) nie pisać tu nic nowego") — od tamtej
// pory zgłoszenia lądowały poza lejkiem, którego używa zespół. Teraz idą do
// `leads` przez ten sam moduł co pozostałe formularze.

// Wartości z `dict.common.audienceOptions` (klucze słownika) na `lead_student_type`.
const AUDIENCE_TO_TYPE: Record<string, LeadStudentType> = {
  child: 'child',
  teen: 'teen',
  adult: 'adult',
  company: 'corporate',
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, audience, message, referralCode, campaign } = await req.json()
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Imię i e-mail są wymagane.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const cleanName = name.trim()
    const cleanEmail = email.trim()
    const cleanPhone = phone?.trim() || null
    const cleanMessage = message?.trim() || null
    const cleanReferralCode = referralCode?.trim() || null
    // Atrybucja zebrana po stronie klienta (utm_*, gclid/fbclid, ?ref=,
    // strona odsyłająca) — zasila `leads.campaign` i widok `v_lead_funnel`.
    const cleanCampaign = typeof campaign === 'string' ? campaign.trim() || null : null

    // 'unsure' i brak wyboru zostają puste — agent dopyta.
    const studentType = AUDIENCE_TO_TYPE[audience] ?? null

    let isReturning = false
    try {
      const result = await createLead(admin, {
        entryPoint: 'consultation_modal',
        firstName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        studentType,
        goal: cleanMessage,
        referralCode: cleanReferralCode,
        campaign: cleanCampaign,
      })
      isReturning = result.isReturning
    } catch (err) {
      console.error('[Consultation] createLead error:', err)
      return NextResponse.json(
        { error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.' },
        { status: 500 }
      )
    }

    await admin.from('admin_notifications').insert({
      kind: 'consultation',
      title: `${isReturning ? 'Ponowna konsultacja' : 'Nowa konsultacja'}: ${cleanName}`,
      body: `${cleanPhone ? `tel. ${cleanPhone}, ` : ''}${cleanEmail}${audience ? ` · dla: ${audience}` : ''}${cleanMessage ? ` — ${cleanMessage}` : ''}${cleanReferralCode ? ` · kod polecenia: ${cleanReferralCode}` : ''}`,
    }).then(undefined, (e: unknown) => console.error('[Consultation] notify error:', e))

    await notifySchoolSms(
      `${isReturning ? 'Ponowna konsultacja' : 'Nowa konsultacja'}: ${cleanName}${cleanPhone ? `, tel. ${cleanPhone}` : ''}, ${cleanEmail}${audience ? ` (${audience})` : ''}`
    )
    await notifySchoolEmail({
      title: `${isReturning ? 'Ponowna prośba' : 'Nowa prośba'} o konsultację: ${cleanName}`,
      lines: [
        `Imię i nazwisko: ${cleanName}`,
        cleanPhone ? `Telefon: ${cleanPhone}` : '',
        `E-mail: ${cleanEmail}`,
        audience ? `Konsultacja dla: ${audience}` : '',
        cleanMessage ? `Wiadomość: ${cleanMessage}` : '',
        cleanReferralCode ? `Kod polecenia: ${cleanReferralCode}` : '',
        isReturning ? 'Uwaga: ten kontakt jest już w lejku — dopisano do istniejącego leada.' : '',
      ],
      actionLabel: 'Otwórz pipeline →',
      actionPath: '/admin/pipeline',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Consultation] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
