import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifySchoolSms } from '@/lib/sms/send'
import { notifySchoolEmail } from '@/lib/email/send'
import { createLead, type LeadStudentType } from '@/lib/leads/create'

// createLead() woła Agenta Łowcę (Claude + Resend) synchronicznie dla nowych
// leadów — domyślny limit czasu funkcji Vercel bywa za krótki na to wywołanie.
export const maxDuration = 30

// Krótkie zgłoszenie z /sign-me-up.
//
// Różni się od konsultacji jedną rzeczą, za to istotną: obowiązkowy jest
// TELEFON, nie e-mail. Człowiek, który pierwszy raz trafia na stronę, nie jest
// gotowy wybrać grupy, poziomu i terminu, ale numer zostawi. Resztę ustala
// rozmowa, a właściwy zapis idzie potem linkiem do ActiveNow.
//
// Ograniczenie `leads_kontakt_wymagany` w bazie wymaga telefonu ALBO maila, więc
// sam numer wystarczy.

const AUDIENCE_TO_TYPE: Record<string, LeadStudentType> = {
  child: 'child',
  teen: 'teen',
  adult: 'adult',
  company: 'corporate',
}

const AUDIENCE_LABEL: Record<string, string> = {
  child: 'dla dziecka',
  teen: 'dla nastolatka',
  adult: 'dla siebie',
  company: 'dla firmy',
}

// Telefon musi dać się oddzwonić: co najmniej 9 cyfr po odsianiu spacji,
// myślników i prefiksu kraju.
function hasDiallableDigits(phone: string): boolean {
  return phone.replace(/[^0-9]/g, '').length >= 9
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, audience, consentMarketing, consentClause, referralCode, campaign } =
      await req.json()

    const cleanName = typeof name === 'string' ? name.trim() : ''
    const cleanPhone = typeof phone === 'string' ? phone.trim() : ''

    if (!cleanName) {
      return NextResponse.json({ error: 'Podaj imię.' }, { status: 400 })
    }
    if (!hasDiallableDigits(cleanPhone)) {
      return NextResponse.json({ error: 'Podaj numer telefonu, żebyśmy mogli oddzwonić.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const cleanEmail = typeof email === 'string' ? email.trim() || null : null
    const studentType = AUDIENCE_TO_TYPE[audience] ?? null
    const audienceLabel = AUDIENCE_LABEL[audience] ?? null
    const cleanCampaign = typeof campaign === 'string' ? campaign.trim() || null : null
    const cleanReferral = typeof referralCode === 'string' ? referralCode.trim() || null : null

    let isReturning = false
    try {
      const result = await createLead(admin, {
        entryPoint: 'sign_me_up',
        firstName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        studentType,
        consentMarketing: consentMarketing === true,
        consentClause: typeof consentClause === 'string' ? consentClause : null,
        referralCode: cleanReferral,
        campaign: cleanCampaign,
      })
      isReturning = result.isReturning
    } catch (err) {
      console.error('[SignMeUp] createLead error:', err)
      return NextResponse.json(
        { error: 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.' },
        { status: 500 }
      )
    }

    const headline = `${isReturning ? 'Ponowne zgłoszenie' : 'Nowe zgłoszenie'}: ${cleanName}`

    // Dzwonek w panelu, SMS i mail to trzy niezależne kanały. Żaden nie może
    // przewrócić zgłoszenia, bo lead siedzi już w bazie.
    await admin.from('admin_notifications').insert({
      kind: 'sign_me_up',
      title: headline,
      body: [`tel. ${cleanPhone}`, audienceLabel, cleanEmail, cleanReferral ? `kod: ${cleanReferral}` : null]
        .filter(Boolean).join(' · '),
    }).then(undefined, (e: unknown) => console.error('[SignMeUp] notify error:', e))

    await notifySchoolSms(`${headline}, tel. ${cleanPhone}${audienceLabel ? ` (${audienceLabel})` : ''}`)

    await notifySchoolEmail({
      title: `${headline} — oddzwonić`,
      lines: [
        `Imię: ${cleanName}`,
        `Telefon: ${cleanPhone}`,
        audienceLabel ? `Zajęcia: ${audienceLabel}` : '',
        cleanEmail ? `E-mail: ${cleanEmail}` : '',
        cleanReferral ? `Kod polecenia: ${cleanReferral}` : '',
        consentMarketing === true ? 'Zgoda marketingowa: tak' : '',
        isReturning ? 'Uwaga: ten kontakt jest już w lejku — dopisano do istniejącego leada.' : '',
      ].filter(Boolean),
      actionLabel: 'Otwórz pipeline →',
      actionPath: '/admin/pipeline',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[SignMeUp] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
