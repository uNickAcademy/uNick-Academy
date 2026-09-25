import { NextRequest, NextResponse } from 'next/server'
import { validateBallRegistration } from '@/lib/ball/validation'
import { BALL, PAYMENT, SEATS_MILESTONE, ticketSummary, transferTitle } from '@/lib/ball/event'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyFoundationEmail, sendBallMilestone, sendBallRegistration } from '@/lib/email/send'

export const runtime = 'nodejs'

// Zgłoszenie na The uNickorn Ball.
//
// Zgłoszenie to rezerwacja, nie opłacony bilet. Zapisujemy je ze statusem
// „oczekuje na wpłatę" i wysyłamy dane do przelewu; miejsca potwierdza człowiek
// po zaksięgowaniu wpłaty (§2 ust. 3 i 4 regulaminu). Nic tutaj nie ustawia
// statusu „opłacone".
//
// Odpowiedź niesie `emailSent`. Strona mówi „wysłaliśmy e-mail" wyłącznie
// wtedy, gdy to pole jest prawdziwe — inaczej gość zostałby z przekonaniem, że
// ma gdzieś numer rachunku, którego nigdy nie dostał.

export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > 50_000) {
    return NextResponse.json({ error: 'Formularz jest zbyt duży.' }, { status: 413 })
  }
  const origin = request.headers.get('origin')
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) {
    return NextResponse.json({ error: 'Nie można wysłać formularza z tej strony.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const validation = validateBallRegistration(body)
  if (!validation.ok) return NextResponse.json({ errors: validation.errors }, { status: 400 })

  const data = validation.data
  const database = createAdminClient()

  // Numer zgłoszenia nadaje baza (sekwencja), a nie aplikacja — dwa równoległe
  // zgłoszenia nie mogą dostać tego samego numeru.
  const { data: row, error } = await database.from('ball_registrations').insert({
    single_tickets: data.counts.single,
    couple_tickets: data.counts.couple,
    seats: data.seats,
    amount_pln: data.amount,
    guests: data.guests,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    table_request: data.tableRequest,
    dietary_notes: data.dietaryNotes,
    dietary_consent: data.dietaryConsent,
    terms_accepted: true,
    privacy_acknowledged: true,
    terms_version: data.termsVersion,
  }).select('id, reference').single()

  if (error || !row) {
    console.error('[Bal] Nie udało się zapisać zgłoszenia:', error)
    return NextResponse.json({ error: 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.' }, { status: 500 })
  }

  const summary = ticketSummary(data.counts)
  const title = transferTitle(row.reference, data.contactName)

  // Zgłoszenie jest już w bazie, więc nawet nieudany mail go nie unieważnia.
  // Dlatego wysyłka nie może wywrócić odpowiedzi — ma tylko powiedzieć, czy się
  // udała, żeby strona wiedziała, co pokazać.
  const emailSent = await sendBallRegistration(data.email, {
    reference: row.reference,
    contactName: data.contactName,
    ticketSummary: summary,
    seats: data.seats,
    amount: data.amount,
    recipient: PAYMENT.recipient,
    iban: PAYMENT.iban,
    transferTitle: title,
    hasTableRequest: !!data.tableRequest,
  }).catch((err) => {
    console.error('[Bal] Wysyłka maila wywaliła się:', err)
    return false
  })

  // Powiadomienie dla Fundacji. Nie blokuje odpowiedzi i nie zawiera potrzeb
  // żywieniowych — te zostają w panelu, gdzie widzi je wyłącznie admin.
  await notifyFoundationEmail({
    title: `Bal: nowe zgłoszenie ${row.reference} — ${data.contactName}`,
    lines: [
      `${summary} · ${data.seats} ${data.seats === 1 ? 'miejsce' : 'miejsca'} · ${data.amount} zł`,
      `Kontakt: ${data.contactName}, ${data.email}, ${data.phone}`,
      `Goście: ${data.guests.join(', ')}`,
      data.tableRequest ? `Prośba o stolik: ${data.tableRequest}` : '',
      data.dietaryNotes ? 'Zgłoszono potrzeby żywieniowe — szczegóły w panelu.' : '',
      emailSent ? '' : '⚠️ Mail z danymi do wpłaty NIE został wysłany — skontaktuj się z tą osobą.',
    ].filter(Boolean),
  }).catch((err) => console.error('[Bal] Powiadomienie Fundacji:', err))

  // Próg frekwencji: gdy liczba zgłoszonych miejsc przekroczy setkę, Fundacja
  // dostaje o tym jednego maila. Że dokładnie jednego, pilnuje klucz główny
  // w `ball_milestones` — przy dwóch zgłoszeniach w tej samej sekundzie drugie
  // wstawienie odbija się od bazy i maila nie wysyła.
  await checkMilestone(database).catch((err) => console.error('[Bal] Próg frekwencji:', err))

  return NextResponse.json({
    success: true,
    reference: row.reference,
    seats: data.seats,
    amount: data.amount,
    ticketSummary: summary,
    emailSent,
    // Gdy mail nie wyszedł, strona pokazuje dane do przelewu na miejscu, żeby
    // zgłoszenie nie utknęło z powodu awarii poczty.
    payment: emailSent ? null : {
      recipient: PAYMENT.recipient,
      iban: PAYMENT.iban,
      transferTitle: title,
      contactEmail: BALL.contactEmail,
    },
  }, { status: 201 })
}

/** Sumuje zgłoszone miejsca i przy przekroczeniu progu wysyła jedno powiadomienie. */
async function checkMilestone(database: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data: rows, error } = await database
    .from('ball_registrations')
    .select('seats, status')
    .neq('status', 'cancelled')
  if (error || !rows) return

  const seats = rows.reduce((sum, r) => sum + Number(r.seats), 0)
  if (seats < SEATS_MILESTONE) return

  // `ignoreDuplicates` sprawia, że `.select()` zwraca wiersz tylko wtedy, gdy
  // ten próg faktycznie właśnie zajęliśmy. Przy powtórce lista jest pusta.
  const { data: claimed } = await database
    .from('ball_milestones')
    .upsert({ threshold: SEATS_MILESTONE, seats_at_trigger: seats },
      { onConflict: 'threshold', ignoreDuplicates: true })
    .select('threshold')
  if ((claimed?.length ?? 0) === 0) return

  const paidSeats = rows
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + Number(r.seats), 0)

  await sendBallMilestone(BALL.contactEmail, {
    threshold: SEATS_MILESTONE,
    seats,
    registrations: rows.length,
    paidSeats,
  })
}
