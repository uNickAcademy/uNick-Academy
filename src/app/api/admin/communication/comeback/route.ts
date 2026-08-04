import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendComeback } from '@/lib/email/send'
import { comebackEmail } from '@/lib/email/templates'

// Kampania „wracamy do Was": nieaktywni uczniowie, nowa platforma, kod polecenia.
//
// Domyślnie NIC NIE WYSYŁA. Bez `confirm: true` zwraca listę odbiorców.
// Przy wysyłce do żywych skrzynek nie ma „cofnij", więc podgląd jest stanem
// domyślnym, nie opcją.
//
// Odbiorcy: uczniowie BEZ zaplanowanych lekcji (czyli dziś nieaktywni).
// Twardo wykluczeni, niezależnie od parametrów:
//   * klienci B2B (billing_type = 'b2b' albo przypisana firma) — kampanie
//     konsumenckie nie mogą trafiać do kontaktów firmowych,
//   * uczniowie z zaplanowanymi lekcjami (są aktywni, ten mail nie jest dla nich),
//   * konta bez adresu e-mail,
//   * osoby, którym ten mail już poszedł.
//
// Konta objęte incydentem naliczenia z 1.08 NIE są wykluczone, bo pokrywają się
// niemal w całości z bazą nieaktywnych. Podgląd pokazuje ich liczbę osobno,
// żeby decyzja o wysyłce do nich była świadoma.

const CAMPAIGN = 'powrot_wrzesien_2026'

type Recipient = {
  student_id: string
  email: string
  first_name: string
  referral_code: string
}

// Imię do powitania odzyskujemy z kodu polecenia: kod ma postać
// uNick<Imie><4 znaki>, a imię w kodzie jest po transliteracji („Michal").
// Dopasowujemy je z powrotem do oryginalnego członu, żeby w mailu było
// „Michał", a nie „Michal".
function greetingName(referralCode: string, sourceName: string | null): string {
  const fromCode = referralCode.startsWith('uNick')
    ? referralCode.slice(5, -4)
    : ''
  if (!fromCode) return (sourceName ?? '').split(' ')[0] || 'Cześć'

  const deaccent = (s: string) =>
    s.replace(/[ąĄ]/g, 'a').replace(/[ćĆ]/g, 'c').replace(/[ęĘ]/g, 'e')
     .replace(/[łŁ]/g, 'l').replace(/[ńŃ]/g, 'n').replace(/[óÓ]/g, 'o')
     .replace(/[śŚ]/g, 's').replace(/[źŹżŻ]/g, 'z')

  for (const token of (sourceName ?? '').split(/\s+/).filter(Boolean)) {
    if (deaccent(token).toLowerCase() === fromCode.toLowerCase()) return token
  }
  return fromCode
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const confirm: boolean = body.confirm === true
  const limit: number = Number.isFinite(body.limit) ? Math.max(1, Math.min(500, body.limit)) : 500

  const admin = createAdminClient()

  const { data: students, error: qErr } = await admin
    .from('students')
    .select('id, full_name, guardian_name, referral_code, billing_type, company_id, profile:profiles(full_name, email)')
    .is('deleted_at', null)

  if (qErr) {
    console.error('[Comeback] Błąd pobierania uczniów:', qErr)
    return NextResponse.json({ error: 'Nie udało się pobrać listy uczniów' }, { status: 500 })
  }

  // Uczniowie z zaplanowanymi lekcjami = aktywni, poza kampanią.
  const { data: futureRows } = await admin
    .from('lessons').select('student_id')
    .gte('starts_at', new Date().toISOString())
    .eq('is_event', false)
    .not('student_id', 'is', null)
  const active = new Set((futureRows ?? []).map((l) => l.student_id as string))

  const { data: incidentRows } = await admin
    .from('billing_incident_snapshot').select('student_id')
    .eq('incident', 'abonament_sierpien_2026')
  const inIncident = new Set((incidentRows ?? []).map((r) => r.student_id as string))

  const { data: sentRows } = await admin
    .from('email_campaign_log').select('student_id').eq('campaign', CAMPAIGN)
  const alreadySent = new Set((sentRows ?? []).map((r) => r.student_id as string))

  const recipients: Recipient[] = []
  let skB2b = 0, skActive = 0, skNoEmail = 0, skSent = 0, incidentCount = 0

  for (const s of students ?? []) {
    // B2B odpada zawsze i bez wyjątku.
    if (s.billing_type === 'b2b' || s.company_id) { skB2b++; continue }
    if (active.has(s.id as string)) { skActive++; continue }
    if (alreadySent.has(s.id as string)) { skSent++; continue }

    const p = Array.isArray(s.profile) ? s.profile[0] : s.profile
    const email = (p as { email?: string } | undefined)?.email?.trim()
    if (!email) { skNoEmail++; continue }

    const source = (s.guardian_name as string | null)?.trim()
      || (p as { full_name?: string } | undefined)?.full_name?.trim()
      || (s.full_name as string | null)?.trim()
      || null

    if (inIncident.has(s.id as string)) incidentCount++

    recipients.push({
      student_id: s.id as string,
      email,
      first_name: greetingName(s.referral_code as string, source),
      referral_code: s.referral_code as string,
    })
  }

  const selected = recipients.slice(0, limit)

  if (!confirm) {
    const sample = selected[0]
    return NextResponse.json({
      dryRun: true,
      doWyslania: selected.length,
      uwaga: incidentCount > 0
        ? `${incidentCount} z tych osób ma otwarte obciążenie z 1.08 i dostało wezwanie do zapłaty. Rozstrzygnij zwroty przed wysyłką albo wyślij świadomie.`
        : null,
      pominieto: { b2b: skB2b, majaZaplanowaneLekcje: skActive, brakMaila: skNoEmail, juzWyslane: skSent },
      odbiorcy: selected.map((r) => ({ email: r.email, imie: r.first_name, kod: r.referral_code })),
      podgladTematu: sample
        ? comebackEmail({
            firstName: sample.first_name, referralCode: sample.referral_code,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl',
          }).subject
        : null,
      wskazowka: 'Aby wysłać, powtórz żądanie z { "confirm": true }.',
    })
  }

  let sent = 0
  const failed: string[] = []

  for (const r of selected) {
    try {
      // Log PRZED wysyłką: przy awarii w połowie wolimy pominąć jedną osobę
      // niż wysłać jej to samo drugi raz przy ponownym uruchomieniu.
      const { error: logErr } = await admin.from('email_campaign_log').insert({
        campaign: CAMPAIGN, student_id: r.student_id, email: r.email,
      })
      if (logErr) { skSent++; continue }

      await sendComeback(r.email, { firstName: r.first_name, referralCode: r.referral_code })
      sent++
    } catch (err) {
      console.error(`[Comeback] Błąd wysyłki do ${r.email}:`, err)
      failed.push(r.email)
      await admin.from('email_campaign_log')
        .update({ error: String(err) }).eq('campaign', CAMPAIGN).eq('student_id', r.student_id)
    }
    await new Promise((res) => setTimeout(res, 120))
  }

  await admin.from('admin_notifications').insert({
    kind: 'kampania_email',
    title: `Kampania „powrót": wysłano ${sent}`,
    body: `Nieudane: ${failed.length}. B2B pominięte: ${skB2b}.`,
  }).then(undefined, (e: unknown) => console.error('[Comeback] notify error:', e))

  return NextResponse.json({ dryRun: false, wyslano: sent, nieudane: failed })
}
