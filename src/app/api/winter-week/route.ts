import {NextRequest, NextResponse} from 'next/server'
import {toWinterRecord, validateWinterRegistration} from '@/lib/winter/validation'
import {WINTER} from '@/lib/winter/event'
import {locationLabel} from '@/lib/foundation/statistics'
import {createAdminClient} from '@/lib/supabase/server'
import {notifyFoundationEmail, sendWinterWeekConfirmation} from '@/lib/email/send'

export const runtime = 'nodejs'

// Zgłoszenie na Winter Project Week. Zapis do bazy jest najważniejszy; maile
// nie mogą go wywrócić, bo zgłoszenie jest już zapisane.
export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > 50000) {
    return NextResponse.json({error: 'Formularz jest zbyt duży.'}, {status: 413})
  }
  const origin = request.headers.get('origin')
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) {
    return NextResponse.json({error: 'Nie można wysłać formularza z tej strony.'}, {status: 403})
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Nieprawidłowe dane.'}, {status: 400})
  }

  const validation = validateWinterRegistration(body)
  if (!validation.ok) return NextResponse.json({errors: validation.errors}, {status: 400})

  const data = validation.data
  const database = createAdminClient()
  const {data: row, error} = await database
    .from('winter_week_registrations')
    .insert(toWinterRecord(data))
    .select('id, reference')
    .single()

  if (error || !row) {
    console.error('[Ferie] Zapis nie powiódł się', error?.code)
    return NextResponse.json({error: 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.'}, {status: 500})
  }

  await Promise.all([
    sendWinterWeekConfirmation(data.email, {
      contactName: data.contactName,
      participantName: data.participantName,
      reference: row.reference,
      dateLabel: WINTER.dateLabel,
      hours: WINTER.hours,
      priority: data.regularParticipant,
      locale: (body as {locale?: unknown})?.locale === 'en' ? 'en' : 'pl',
    }),
    notifyFoundationEmail({
      title: `Winter Project Week: nowe zgłoszenie ${row.reference}, ${data.participantName}`,
      adminPath: '/admin/ferie',
      linkLabel: 'Otwórz zgłoszenia na ferie',
      lines: [
        `Uczestnik: ${data.participantName}, ${data.participantAge} lat, ${locationLabel(data.municipality)}`,
        data.regularParticipant
          ? `Regularne zajęcia: ${data.regularGroups.map(group => group.label.split(' · ')[0]).join('; ')}`
          : 'Nie bierze udziału w regularnych zajęciach (bez pierwszeństwa).',
        `Kontakt: ${data.contactName}, ${data.email}, ${data.phone}`,
        data.specialNeeds ? 'Zgłoszono szczególne potrzeby, szczegóły w panelu.' : '',
      ].filter(Boolean),
    }),
  ]).catch(err => console.error('[Ferie] Wysyłka maili nie powiodła się', err))

  return NextResponse.json({success: true, id: row.id, reference: row.reference}, {status: 201})
}
