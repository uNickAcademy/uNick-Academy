import { NextRequest, NextResponse } from 'next/server'
import * as O from '@/lib/availability/options'
import { formatAvailability } from '@/lib/availability/schedule'
import { validateAvailabilitySubmission } from '@/lib/availability/validation'
import { FORM_CLOSES_LABEL, isFormOpen } from '@/lib/availability/window'
import { notifySchoolEmail, sendAvailabilityThankYou } from '@/lib/email/send'
import { createPasswordSetupLink } from '@/lib/auth/password-link'
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

  // Etykiety zamiast kluczy technicznych i dostępność spłaszczona do jednego
  // zdania — arkusz ma być czytelny dla człowieka układającego grafik, a każde
  // pole ma trafić dokładnie w jedną kolumnę.
  const availabilityText = formatAvailability(data.availability)
  const trybLabel = data.mode.map((value) => O.labelOf(O.modeOptions, value)).join(' oraz ')
  const formaLabel = data.classFormat.map((value) => O.labelOf(O.formatOptionsFor(data.mode), value)).join(' oraz ')

  // Zapis do bazy jest teraz głównym źródłem prawdy — stąd widać zgłoszenia
  // z poziomu admina (/admin/dostepnosc). Zapier i mail to dodatkowe kanały,
  // nie jedyny zapis, więc ich ewentualna awaria już nie blokuje zgłoszenia.
  //
  // Jedno wywołanie RPC (public_availability_declaration) robi wszystko: od
  // razu zakłada konto i ucznia (status trial) tym samym mechanizmem co reszta
  // publicznych zapisów (_booking_ensure_account/_booking_ensure_student), więc
  // przyznany kod polecenia to PRAWDZIWY students.referral_code — działa w
  // register_referral natychmiast, bez ręcznego przepisywania przy zapisie.
  const { data: rpcRows, error: dbError } = await admin.rpc('public_availability_declaration', {
    p_parent_first_name: data.parentFirstName,
    p_parent_last_name: data.parentLastName,
    p_email: data.email,
    p_phone: data.phone,
    p_child_name: data.childName,
    p_child_age: data.childAge,
    p_level: data.level || null,
    p_mode: data.mode,
    p_class_format: data.classFormat,
    p_address: data.address || null,
    p_school_name: data.schoolName || null,
    p_school_city: data.schoolCity || null,
    p_availability: data.availability,
    p_availability_text: availabilityText,
    p_notes: data.notes || null,
    p_referral: data.referralCode || null,
  })
  const result = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows
  if (dbError || !result?.assigned_referral_code) {
    console.error('[Dostępność] Zapis zgłoszenia nie powiódł się:', dbError)
    return NextResponse.json(
      { error: 'Nie udało się zapisać zgłoszenia. Spróbuj ponownie.' },
      { status: 500 }
    )
  }
  const assignedReferralCode = result.assigned_referral_code as string

  // Konto już istnieje (RPC wyżej) — link jednorazowy do ustawienia hasła
  // wchodzi od razu do maila podziękowania, tak samo jak przy zgłoszeniach
  // „doradztwo”/„zajęcia indywidualne" (src/app/api/booking/route.ts). Rodzina
  // nie musi go użyć teraz — przyda się, gdy się zdecyduje.
  const passwordLink = await createPasswordSetupLink(admin, data.email)

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
    passwordLink,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
