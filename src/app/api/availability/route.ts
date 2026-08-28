import { NextRequest, NextResponse } from 'next/server'
import * as O from '@/lib/availability/options'
import { formatAvailability } from '@/lib/availability/schedule'
import { validateAvailabilitySubmission } from '@/lib/availability/validation'
import { FORM_CLOSES_LABEL, isFormOpen } from '@/lib/availability/window'
import { notifySchoolEmail, sendAvailabilityThankYou } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/server'

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
  const admin = createAdminClient()

  // Kod, który TA rodzina dostaje do podania znajomym — ta sama funkcja, której
  // używa reszta systemu (generate_referral_code), więc format i unikalność są
  // spójne z prawdziwymi kodami uczniów. Generujemy po imieniu rodzica: to on
  // wypełnia formularz i to on będzie dzielił się kodem ze swoimi znajomymi.
  const { data: generatedCode, error: codeError } = await admin.rpc('generate_referral_code', {
    p_name: data.parentFirstName,
  })
  if (codeError || !generatedCode) {
    console.error('[Dostępność] Nie udało się wygenerować kodu polecenia:', codeError)
    return NextResponse.json(
      { error: 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.' },
      { status: 500 }
    )
  }
  const assignedReferralCode = generatedCode as string

  // Etykiety zamiast kluczy technicznych i dostępność spłaszczona do jednego
  // zdania — arkusz ma być czytelny dla człowieka układającego grafik, a każde
  // pole ma trafić dokładnie w jedną kolumnę.
  const availabilityText = formatAvailability(data.availability)
  const trybLabel = data.mode.map((value) => O.labelOf(O.modeOptions, value)).join(' oraz ')
  const formaLabel = data.classFormat.map((value) => O.labelOf(O.formatOptionsFor(data.mode), value)).join(' oraz ')

  // Zapis do bazy jest teraz głównym źródłem prawdy — stąd widać zgłoszenia
  // z poziomu admina (/admin/dostepnosc). Zapier i mail to dodatkowe kanały,
  // nie jedyny zapis, więc ich ewentualna awaria już nie blokuje zgłoszenia.
  const { error: dbError } = await admin.from('availability_declarations').insert({
    parent_first_name: data.parentFirstName,
    parent_last_name: data.parentLastName,
    email: data.email,
    phone: data.phone,
    child_name: data.childName,
    child_age: data.childAge,
    level: data.level || null,
    mode: data.mode,
    class_format: data.classFormat,
    address: data.address || null,
    school_name: data.schoolName || null,
    school_city: data.schoolCity || null,
    availability: data.availability,
    availability_text: availabilityText,
    notes: data.notes || null,
    referral_code: data.referralCode || null,
    assigned_referral_code: assignedReferralCode,
    consent: true,
  })
  if (dbError) {
    console.error('[Dostępność] Zapis zgłoszenia nie powiódł się:', dbError)
    return NextResponse.json(
      { error: 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.' },
      { status: 500 }
    )
  }

  const payload = {
    data_zgloszenia: warsawTimestamp(),
    imie_rodzica: data.parentFirstName,
    nazwisko_rodzica: data.parentLastName,
    email: data.email,
    telefon: data.phone,
    dziecko: data.childName,
    wiek: data.childAge,
    poziom: O.labelOf(O.levelOptions, data.level),
    tryb: trybLabel,
    forma: formaLabel,
    adres: data.address,
    szkola: data.schoolName,
    miejscowosc: data.schoolCity,
    dostepnosc: availabilityText,
    uwagi: data.notes,
    kod_polecony_przez: data.referralCode,
    kod_przyznany: assignedReferralCode,
  }

  // Zapier i kopia mailem to dodatkowe kanały — najlepszy wysiłek, bo zapis w
  // bazie (wyżej) już się udał i zgłoszenie na pewno nie przepadnie.
  const forwarded = await forwardToZapier(payload)

  await notifySchoolEmail({
    title: `Dostępność na wrzesień: ${data.childName} (${data.childAge} l.)`,
    lines: [
      `Rodzic: ${data.parentFirstName} ${data.parentLastName}`,
      `E-mail: ${data.email}`,
      `Telefon: ${data.phone}`,
      `Dziecko: ${data.childName}, ${data.childAge} lat`,
      payload.poziom ? `Poziom: ${payload.poziom}` : '',
      `Tryb: ${trybLabel} — ${formaLabel}`,
      data.address ? `Adres: ${data.address}` : '',
      data.schoolName ? `Szkoła: ${data.schoolName}, ${data.schoolCity}` : '',
      `Dostępność: ${availabilityText}`,
      data.notes ? `Uwagi: ${data.notes}` : '',
      data.referralCode ? `Kod polecony przez: ${data.referralCode}` : '',
      `Przyznany kod polecenia: ${assignedReferralCode}`,
      forwarded ? '' : '⚠️ Nie udało się dopisać wiersza w arkuszu — przepisz ręcznie.',
    ].filter(Boolean),
  })

  await sendAvailabilityThankYou(data.email, {
    parentFirstName: data.parentFirstName,
    childName: data.childName,
    assignedReferralCode,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
