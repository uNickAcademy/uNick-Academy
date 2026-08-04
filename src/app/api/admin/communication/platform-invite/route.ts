import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendPlatformWelcome } from '@/lib/email/send'
import { platformWelcomeEmail } from '@/lib/email/templates'

// Jednorazowa kampania: zaproszenie na platformę + kod polecenia.
//
// Domyślnie NIC NIE WYSYŁA. Bez `confirm: true` zwraca listę odbiorców do
// przejrzenia — przy wysyłce do żywych skrzynek nie ma czegoś takiego jak
// „cofnij", więc podgląd jest stanem domyślnym, nie opcją.
//
// Grupy odbiorców:
//   'active' (domyślna) — uczniowie z historią lekcji, bez kont objętych
//                         incydentem naliczenia z 1.08. Tym osobom dwa dni
//                         temu poszło błędne wezwanie do zapłaty i mail
//                         „cieszymy się, że uczycie się z nami" byłby wobec
//                         nich nie na miejscu.
//   'all'              — wszyscy niezableokowani uczniowie z adresem e-mail.
//                         Świadome obejście powyższego zabezpieczenia.

const CAMPAIGN = 'platforma_i_kod_2026_08'

type Audience = 'active' | 'all'

type Recipient = {
  student_id: string
  email: string
  name: string
  referral_code: string
}

export async function POST(req: NextRequest) {
  // ── Autoryzacja: tylko admin ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const audience: Audience = body.audience === 'all' ? 'all' : 'active'
  const confirm: boolean = body.confirm === true
  const limit: number = Number.isFinite(body.limit) ? Math.max(1, Math.min(500, body.limit)) : 500

  const admin = createAdminClient()

  // ── Dobór odbiorców ───────────────────────────────────────────────────────
  const { data: students, error: qErr } = await admin
    .from('students')
    .select('id, full_name, guardian_name, status, referral_code, profile:profiles(full_name, email)')
    .is('deleted_at', null)

  if (qErr) {
    console.error('[PlatformInvite] Błąd pobierania uczniów:', qErr)
    return NextResponse.json({ error: 'Nie udało się pobrać listy uczniów' }, { status: 500 })
  }

  // Uczniowie mający jakąkolwiek lekcję w systemie — tylko oni mieli realny
  // kontakt ze szkołą, więc tylko do nich pasuje „uczycie się z nami".
  const { data: lessonRows } = await admin
    .from('lessons').select('student_id').not('student_id', 'is', null)
  const withLessons = new Set((lessonRows ?? []).map((l) => l.student_id as string))

  // Konta objęte incydentem naliczenia z 1.08 — wykluczone z grupy 'active'.
  const { data: incidentRows } = await admin
    .from('billing_incident_snapshot').select('student_id')
    .eq('incident', 'abonament_sierpien_2026')
  const inIncident = new Set((incidentRows ?? []).map((r) => r.student_id as string))

  // Już wysłane w tej kampanii — zabezpieczenie przed dublem.
  const { data: sentRows } = await admin
    .from('email_campaign_log').select('student_id').eq('campaign', CAMPAIGN)
  const alreadySent = new Set((sentRows ?? []).map((r) => r.student_id as string))

  const recipients: Recipient[] = []
  let skippedNoEmail = 0
  let skippedNoLessons = 0
  let skippedIncident = 0
  let skippedAlreadySent = 0

  for (const s of students ?? []) {
    const p = Array.isArray(s.profile) ? s.profile[0] : s.profile
    const email = (p as { email?: string } | undefined)?.email?.trim()
    if (!email) { skippedNoEmail++; continue }

    if (audience === 'active') {
      if (!withLessons.has(s.id as string)) { skippedNoLessons++; continue }
      if (inIncident.has(s.id as string)) { skippedIncident++; continue }
    }
    if (alreadySent.has(s.id as string)) { skippedAlreadySent++; continue }

    // Zwracamy się do OPIEKUNA, bo to on dostaje maila i dzieli się kodem.
    const name = (s.guardian_name as string | null)?.trim()
      || (p as { full_name?: string } | undefined)?.full_name?.trim()
      || (s.full_name as string | null)?.trim()
      || 'Cześć'

    recipients.push({
      student_id: s.id as string,
      email,
      name,
      referral_code: s.referral_code as string,
    })
  }

  const selected = recipients.slice(0, limit)

  // ── Podgląd (domyślnie) ───────────────────────────────────────────────────
  if (!confirm) {
    const sample = selected[0]
    return NextResponse.json({
      dryRun: true,
      audience,
      doWyslania: selected.length,
      pominieto: {
        brakMaila: skippedNoEmail,
        brakLekcji: skippedNoLessons,
        incydentNaliczenia: skippedIncident,
        juzWyslane: skippedAlreadySent,
      },
      odbiorcy: selected.map((r) => ({ email: r.email, imie: r.name, kod: r.referral_code })),
      podgladTematu: sample
        ? platformWelcomeEmail({
            name: sample.name, referralCode: sample.referral_code,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl',
          }).subject
        : null,
      wskazowka: 'Aby wysłać, powtórz żądanie z { "confirm": true }.',
    })
  }

  // ── Wysyłka ───────────────────────────────────────────────────────────────
  let sent = 0
  const failed: string[] = []

  for (const r of selected) {
    try {
      // Log PRZED wysyłką: przy awarii w połowie wolimy pominąć jedną osobę
      // niż wysłać jej to samo drugi raz przy ponownym uruchomieniu.
      const { error: logErr } = await admin.from('email_campaign_log').insert({
        campaign: CAMPAIGN, student_id: r.student_id, email: r.email,
      })
      if (logErr) { skippedAlreadySent++; continue }

      await sendPlatformWelcome(r.email, { name: r.name, referralCode: r.referral_code })
      sent++
    } catch (err) {
      console.error(`[PlatformInvite] Błąd wysyłki do ${r.email}:`, err)
      failed.push(r.email)
      await admin.from('email_campaign_log')
        .update({ error: String(err) }).eq('campaign', CAMPAIGN).eq('student_id', r.student_id)
    }
    // Delikatny odstęp — Resend ma limit zapytań na sekundę.
    await new Promise((res) => setTimeout(res, 120))
  }

  await admin.from('admin_notifications').insert({
    kind: 'kampania_email',
    title: `Kampania „platforma + kod": wysłano ${sent}`,
    body: `Grupa: ${audience}. Nieudane: ${failed.length}.`,
  }).then(undefined, (e: unknown) => console.error('[PlatformInvite] notify error:', e))

  return NextResponse.json({ dryRun: false, audience, wyslano: sent, nieudane: failed })
}
