import { NextRequest, NextResponse } from 'next/server'
import * as O from '@/lib/availability/options'
import { formatAvailability } from '@/lib/availability/schedule'
import { validateAvailabilitySubmission } from '@/lib/availability/validation'
import { FORM_CLOSES_LABEL, isFormOpen } from '@/lib/availability/window'
import { notifySchoolEmail } from '@/lib/email/send'

export const runtime = 'nodejs'

// Zgłoszenia z formularza dostępności (/pl/dostepnosc).
//
// Zapis idzie do arkusza Google przez webhook Zapiera: my wysyłamy POST z płaskim
// JSON-em, a scenariusz po drugiej stronie dokłada wiersz. Backend nie gada
// z Google bezpośrednio — dzięki temu nabór da się usunąć jednym commitem.
//
// Adres webhooka wklejamy do zmiennej środowiskowej, nie do kodu: URL webhooka
// jest tajny (kto go zna, może dopisywać wiersze do arkusza), a poza tym
// zmienia się przy każdej przebudowie Zapa.
function webhookUrl(): string | undefined {
  return process.env.ZAPIER_AVAILABILITY_WEBHOOK_URL || process.env.AVAILABILITY_WEBHOOK_URL
}

// Data w formacie, który Google Sheets rozumie bez kombinowania z lokalizacją.
function warsawTimestamp(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now)
  return parts.replace('T', ' ')
}

async function forwardToZapier(payload: Record<string, unknown>): Promise<boolean> {
  const url = webhookUrl()
  if (!url) {
    console.warn('[Dostępność] Brak ZAPIER_AVAILABILITY_WEBHOOK_URL — zgłoszenie tylko mailem.')
    return false
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      console.error('[Dostępność] Webhook Zapiera odrzucił zgłoszenie:', response.status)
      return false
    }
    return true
  } catch (err) {
    console.error('[Dostępność] Webhook Zapiera nieosiągalny:', err)
    return false
  }
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > 20_000) {
    return NextResponse.json({ error: 'Formularz jest zbyt duży.' }, { status: 413 })
  }

  const origin = request.headers.get('origin')
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) {
    return NextResponse.json({ error: 'Nie można wysłać formularza z tej strony.' }, { status: 403 })
  }

  // Zamknięcie naboru egzekwuje serwer — sama strona może siedzieć w cache
  // przeglądarki jeszcze długo po terminie.
  if (!isFormOpen()) {
    return NextResponse.json(
      { error: `Zbieranie dostępności zakończyliśmy ${FORM_CLOSES_LABEL}. Napisz do nas na hello@unick-academy.pl.` },
      { status: 410 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 })
  }

  const validation = validateAvailabilitySubmission(body)
  if (!validation.ok) return NextResponse.json({ errors: validation.errors }, { status: 400 })

  const data = validation.data
  // Etykiety zamiast kluczy technicznych i dostępność spłaszczona do jednego
  // zdania — arkusz ma być czytelny dla człowieka układającego grafik, a każde
  // pole ma trafić dokładnie w jedną kolumnę.
  const availabilityText = formatAvailability(data.availability)
  const payload = {
    data_zgloszenia: warsawTimestamp(),
    rodzic: data.parentName,
    kontakt: data.contact,
    dziecko: data.childName,
    wiek: data.childAge,
    poziom: O.labelOf(O.levelOptions, data.level),
    tryb: O.labelOf(O.modeOptions, data.mode),
    forma: O.labelOf(O.formatOptionsFor(data.mode), data.classFormat),
    adres: data.address,
    szkola: data.schoolName,
    miejscowosc: data.schoolCity,
    dostepnosc: availabilityText,
    uwagi: data.notes,
  }

  const forwarded = await forwardToZapier(payload)

  // Kopia mailem leci zawsze: to drugi, niezależny odbiornik na wypadek, gdyby
  // Zap był wyłączony albo webhook jeszcze nie był wklejony.
  await notifySchoolEmail({
    title: `Dostępność na wrzesień: ${data.childName} (${data.childAge} l.)`,
    lines: [
      `Rodzic: ${data.parentName}`,
      `Kontakt: ${data.contact}`,
      `Dziecko: ${data.childName}, ${data.childAge} lat`,
      payload.poziom ? `Poziom: ${payload.poziom}` : '',
      `Tryb: ${payload.tryb} — ${payload.forma}`,
      data.address ? `Adres: ${data.address}` : '',
      data.schoolName ? `Szkoła: ${data.schoolName}, ${data.schoolCity}` : '',
      `Dostępność: ${availabilityText}`,
      data.notes ? `Uwagi: ${data.notes}` : '',
      forwarded ? '' : '⚠️ Nie udało się dopisać wiersza w arkuszu — przepisz ręcznie.',
    ].filter(Boolean),
  })

  // Podziękowanie ma znaczyć „mamy to”. Jeśli ani arkusz, ani poczta nie są
  // skonfigurowane, zgłoszenie przepadłoby — wtedy uczciwiej pokazać błąd.
  if (!forwarded && !process.env.RESEND_API_KEY) {
    console.error('[Dostępność] Zgłoszenie nie trafiło nigdzie — brak webhooka i RESEND_API_KEY.')
    return NextResponse.json(
      { error: 'Nie udało się zapisać zgłoszenia. Napisz do nas na hello@unick-academy.pl.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
