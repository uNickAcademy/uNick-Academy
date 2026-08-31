import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendComeback } from '@/lib/email/send'
import { comebackEmail } from '@/lib/email/templates'

// Kampania „wracamy do Was": nieaktywni uczniowie indywidualni, nowa platforma,
// kod polecenia.
//
// Domyślnie NIC NIE WYSYŁA. Bez `confirm: true` zwraca listę odbiorców.
// Przy wysyłce do żywych skrzynek nie ma „cofnij", więc podgląd jest stanem
// domyślnym, nie opcją.
//
// Dwa tryby:
//   * `pierwszy`      — do osób, które jeszcze nic od nas nie dostały,
//   * `przypomnienie` — do tych, które dostały pierwszą wiadomość i mimo to
//                       nigdy się nie zalogowały.
// Osobna nazwa kampanii dla przypomnienia jest tu warunkiem działania: lista
// „już wysłane" blokuje powtórki, więc bez nowej nazwy druga tura nie miałaby
// do kogo pójść.
//
// Twardo wykluczeni, niezależnie od trybu i parametrów:
//   * klienci B2B (billing_type = 'b2b' albo przypisana firma) — kampanie
//     konsumenckie nie mogą trafiać do kontaktów firmowych,
//   * osoby, które już się zalogowały — mail prosi o założenie hasła, więc
//     wysyłanie go komuś, kto to zrobił, jest tylko hałasem,
//   * uczniowie z zaplanowanymi lekcjami (są aktywni, ten mail nie jest dla nich),
//   * konta bez adresu e-mail,
//   * adresy wypisane z wysyłek (email_optouts),
//   * adresy, którym ta kampania już poszła.
//
// Liczymy na ADRESY, nie na kartoteki. Rodzic trójki dzieci ma trzy kartoteki
// i jedno konto — przy poprzedniej wysyłce dostał trzy identyczne maile.
//
// Podgląd wypisuje osobno, ilu odbiorców ma ujemne saldo, żeby ciepła
// wiadomość nie poszła do kogoś, kto ma u nas otwartą zaległość. Liczone
// z realnych transakcji, nie z historycznej listy incydentu.

// Wysyłka idzie partiami: Resend przyjmuje ograniczoną liczbę wiadomości na
// sekundę, a funkcja na Vercelu ma limit czasu. Jedna partia mieści się
// spokojnie w obu, a log zapisujemy przed wysyłką, więc kolejne wywołanie
// płynnie podejmuje resztę listy.
export const maxDuration = 60

const KAMPANIE = {
  pierwszy: 'powrot_wrzesien_2026',
  przypomnienie: 'przypomnienie_wrzesien_2026',
} as const

type Tryb = keyof typeof KAMPANIE

const PIERWSZA_KAMPANIA = KAMPANIE.pierwszy
const ODSTEP_MS = 600
// Wielkość strony przy czytaniu z bazy. PostgREST i tak nie odda więcej niż
// 1000 wierszy naraz, więc pytamy dokładnie o tyle i sami przewijamy dalej.
const STRONA = 1000
const PARTIA_DOMYSLNA = 60
const PARTIA_MAX = 200

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

const norm = (email: string | null | undefined) => (email ?? '').trim().toLowerCase()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const confirm: boolean = body.confirm === true
  const testTo: string | null = typeof body.testTo === 'string' ? body.testTo.trim() : null
  const tryb: Tryb = body.tryb === 'przypomnienie' ? 'przypomnienie' : 'pierwszy'
  const kampania = KAMPANIE[tryb]
  const przypomnienie = tryb === 'przypomnienie'
  const limit: number = Number.isFinite(body.limit)
    ? Math.max(1, Math.min(PARTIA_MAX, body.limit))
    : PARTIA_DOMYSLNA

  const admin = createAdminClient()

  // ── Mail próbny ───────────────────────────────────────────────────────────
  // Idzie na wskazany adres i NIE dotyka listy kampanii: nie zużywa odbiorcy,
  // nie blokuje nikomu właściwej wysyłki. Dostaje jednak prawdziwy token, żeby
  // dało się sprawdzić, czy zliczanie otwarć, kliknięć i wypisanie działają.
  if (testTo) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testTo)) {
      return NextResponse.json({ error: 'Niepoprawny adres w testTo' }, { status: 400 })
    }

    // Kod istniejącego ucznia, żeby próbka wyglądała jak realna wysyłka.
    const { data: sampleStudent } = await admin
      .from('students')
      .select('referral_code, guardian_name, full_name, profile:profiles(full_name)')
      .is('deleted_at', null)
      .not('referral_code', 'is', null)
      .limit(1)
      .single()

    const sp = Array.isArray(sampleStudent?.profile) ? sampleStudent?.profile[0] : sampleStudent?.profile
    const sampleSource = (sampleStudent?.guardian_name as string | null)?.trim()
      || (sp as { full_name?: string } | undefined)?.full_name?.trim()
      || null
    const kod = (sampleStudent?.referral_code as string | undefined) ?? 'uNickTest7DZS'

    const { data: logRow } = await admin
      .from('email_campaign_log')
      .insert({ campaign: `test_${kampania}`, student_id: null, email: testTo })
      .select('track_token')
      .single()

    const wynik = await sendComeback(testTo, {
      firstName: greetingName(kod, sampleSource),
      referralCode: kod,
      trackToken: logRow?.track_token as string | undefined,
      przypomnienie,
    })

    if (!wynik.ok) {
      return NextResponse.json({ error: `Nie udało się wysłać testu: ${wynik.blad}` }, { status: 502 })
    }

    return NextResponse.json({
      test: true,
      tryb,
      wyslanoNa: testTo,
      uzytyKod: kod,
      trackToken: logRow?.track_token ?? null,
      uwaga: 'Wysyłka testowa. Nie zapisała się na liście kampanii, więc nikomu nie zablokowała właściwego maila.',
    })
  }

  type StudentRow = {
    id: string
    full_name: string | null
    guardian_name: string | null
    referral_code: string
    billing_type: string | null
    company_id: string | null
    profile_id: string | null
    profile: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null
  }

  const students: StudentRow[] = []
  for (let od = 0; ; od += STRONA) {
    const { data, error: qErr } = await admin
      .from('students')
      .select('id, full_name, guardian_name, referral_code, billing_type, company_id, profile_id, profile:profiles(full_name, email)')
      .is('deleted_at', null)
      .order('id')
      .range(od, od + STRONA - 1)

    if (qErr) {
      console.error('[Comeback] Błąd pobierania uczniów:', qErr)
      return NextResponse.json({ error: 'Nie udało się pobrać listy uczniów' }, { status: 500 })
    }
    students.push(...((data ?? []) as StudentRow[]))
    if ((data?.length ?? 0) < STRONA) break
  }

  // Uczniowie z zaplanowanymi lekcjami = aktywni, poza kampanią.
  //
  // Czytamy stronami. PostgREST domyślnie oddaje najwyżej 1000 wierszy i nie
  // mówi, że uciął resztę — a lekcji na cały rok szkolny jest więcej. Ucięta
  // lista wyglądałaby jak „ten uczeń nie ma lekcji" i ktoś aktywny dostałby
  // mail z prośbą o powrót.
  const active = new Set<string>()
  for (let od = 0; ; od += STRONA) {
    const { data: futureRows, error: lekcjeErr } = await admin
      .from('lessons').select('student_id')
      .gte('starts_at', new Date().toISOString())
      .eq('is_event', false)
      .not('student_id', 'is', null)
      .range(od, od + STRONA - 1)

    if (lekcjeErr) {
      console.error('[Comeback] Błąd pobierania lekcji:', lekcjeErr)
      return NextResponse.json({ error: 'Nie udało się sprawdzić zaplanowanych lekcji' }, { status: 500 })
    }
    for (const l of futureRows ?? []) active.add(l.student_id as string)
    if ((futureRows?.length ?? 0) < STRONA) break
  }

  // Kto już się zalogował. auth.users nie jest widoczne przez PostgREST,
  // więc pytamy funkcję bazodanową dostępną tylko dla service_role.
  const { data: loggedRows, error: loggedErr } = await admin.rpc('profile_ids_zalogowani')
  if (loggedErr) {
    // Bez tej listy wysłalibyśmy „ustaw hasło" ludziom, którzy już je mają.
    // Lepiej nie wysłać nic niż wysłać to komuś, kto zrobił, o co prosiliśmy.
    console.error('[Comeback] Błąd listy zalogowanych:', loggedErr)
    return NextResponse.json({ error: 'Nie udało się sprawdzić, kto już się zalogował' }, { status: 500 })
  }
  const zalogowani = new Set((loggedRows ?? []).map((r: { id: string }) => r.id))

  // Ostrzeżenie o otwartych obciążeniach liczymy z REALNEGO salda, a nie
  // z samej przynależności do incydentu z 1.08 — po wycofaniu naliczeń
  // przynależność nic już nie znaczy, a saldo mówi prawdę.
  const { data: txRows } = await admin.from('transactions').select('student_id, type, amount')
  const saldo = new Map<string, number>()
  for (const t of txRows ?? []) {
    const id = t.student_id as string
    const kwota = Number(t.amount) || 0
    saldo.set(id, (saldo.get(id) ?? 0) + (t.type === 'charge' ? -kwota : kwota))
  }

  // Blokady liczone po ADRESIE, nie po kartotece: rodzic z dwójką dzieci ma
  // jeden e-mail i ma dostać jedną wiadomość.
  const wyslaneWTejKampanii = new Set<string>()
  const dostaliPierwszy = new Set<string>()
  for (let od = 0; ; od += STRONA) {
    const { data: logRows, error: logCzytErr } = await admin
      .from('email_campaign_log').select('campaign, email')
      .in('campaign', [kampania, PIERWSZA_KAMPANIA])
      .range(od, od + STRONA - 1)

    if (logCzytErr) {
      // Bez pełnego logu nie wiemy, komu już wysłaliśmy. Powtórka tej samej
      // wiadomości jest gorsza niż nieudana próba wysyłki.
      console.error('[Comeback] Błąd czytania logu kampanii:', logCzytErr)
      return NextResponse.json({ error: 'Nie udało się sprawdzić, komu już wysłano' }, { status: 500 })
    }
    for (const r of logRows ?? []) {
      const adres = norm(r.email as string)
      if (!adres) continue
      if (r.campaign === kampania) wyslaneWTejKampanii.add(adres)
      if (r.campaign === PIERWSZA_KAMPANIA) dostaliPierwszy.add(adres)
    }
    if ((logRows?.length ?? 0) < STRONA) break
  }

  const { data: optRows } = await admin.from('email_optouts').select('email_norm')
  const wypisani = new Set((optRows ?? []).map((r) => norm(r.email_norm as string)))

  const wybrani = new Map<string, Recipient>()
  let skB2b = 0, skActive = 0, skNoEmail = 0, skSent = 0, skZalogowani = 0,
      skWypisani = 0, skBezPierwszego = 0, skDuplikatAdresu = 0, incidentCount = 0

  for (const s of students) {
    // B2B odpada zawsze i bez wyjątku.
    if (s.billing_type === 'b2b' || s.company_id) { skB2b++; continue }
    if (zalogowani.has(s.profile_id as string)) { skZalogowani++; continue }
    if (active.has(s.id as string)) { skActive++; continue }

    const p = Array.isArray(s.profile) ? s.profile[0] : s.profile
    const email = norm((p as { email?: string } | undefined)?.email)
    if (!email) { skNoEmail++; continue }

    if (wypisani.has(email)) { skWypisani++; continue }
    if (wyslaneWTejKampanii.has(email)) { skSent++; continue }
    // Przypomnienie ma sens tylko dla kogoś, kto dostał pierwszą wiadomość.
    if (przypomnienie && !dostaliPierwszy.has(email)) { skBezPierwszego++; continue }
    // Pierwsza tura nie może trafić do kogoś, kto już ją dostał pod inną
    // kartoteką — sprawdzenie po adresie łapie rodzeństwo.
    if (!przypomnienie && dostaliPierwszy.has(email)) { skSent++; continue }

    if (wybrani.has(email)) { skDuplikatAdresu++; continue }

    const source = (s.guardian_name as string | null)?.trim()
      || (p as { full_name?: string } | undefined)?.full_name?.trim()
      || (s.full_name as string | null)?.trim()
      || null

    if ((saldo.get(s.id as string) ?? 0) < 0) incidentCount++

    wybrani.set(email, {
      student_id: s.id as string,
      email,
      first_name: greetingName(s.referral_code as string, source),
      referral_code: s.referral_code as string,
    })
  }

  const wszyscy = [...wybrani.values()]
  const selected = wszyscy.slice(0, limit)

  if (!confirm) {
    const sample = selected[0]
    return NextResponse.json({
      dryRun: true,
      tryb,
      kampania,
      doWyslania: wszyscy.length,
      wTejPartii: selected.length,
      uwaga: incidentCount > 0
        ? `${incidentCount} z tych osób ma ujemne saldo. Sprawdź, czy to prawdziwe zaległości, zanim wyślesz im ciepłą wiadomość.`
        : null,
      pominieto: {
        b2b: skB2b,
        juzSieZalogowali: skZalogowani,
        majaZaplanowaneLekcje: skActive,
        brakMaila: skNoEmail,
        wypisaniZWysylek: skWypisani,
        juzWyslane: skSent,
        bezPierwszejWiadomosci: skBezPierwszego,
        rodzenstwoPodTymSamymAdresem: skDuplikatAdresu,
      },
      odbiorcy: selected.map((r) => ({ email: r.email, imie: r.first_name, kod: r.referral_code })),
      podgladTematu: sample
        ? comebackEmail({
            firstName: sample.first_name, referralCode: sample.referral_code,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl',
            przypomnienie,
          }).subject
        : null,
      wskazowka: 'Aby wysłać, powtórz żądanie z { "confirm": true }.',
    })
  }

  let sent = 0
  const failed: string[] = []

  for (const r of selected) {
    // Log PRZED wysyłką: przy awarii w połowie wolimy pominąć jedną osobę
    // niż wysłać jej to samo drugi raz przy ponownym uruchomieniu.
    // Wiersz logu generuje track_token, którym oznaczamy piksel, linki
    // i odnośnik do wypisania się.
    const { data: logRow, error: logErr } = await admin
      .from('email_campaign_log')
      .insert({ campaign: kampania, student_id: r.student_id, email: r.email })
      .select('id, track_token')
      .single()
    if (logErr || !logRow) {
      console.error(`[Comeback] Nie zapisano logu dla ${r.email}:`, logErr)
      failed.push(r.email)
      continue
    }

    const wynik = await sendComeback(r.email, {
      firstName: r.first_name,
      referralCode: r.referral_code,
      trackToken: logRow.track_token as string,
      przypomnienie,
    })

    if (wynik.ok) {
      sent++
    } else {
      console.error(`[Comeback] Błąd wysyłki do ${r.email}: ${wynik.blad}`)
      failed.push(r.email)
      await admin.from('email_campaign_log')
        .update({ error: wynik.blad }).eq('id', logRow.id)
    }

    await new Promise((res) => setTimeout(res, ODSTEP_MS))
  }

  const zostalo = Math.max(0, wszyscy.length - selected.length)

  await admin.from('admin_notifications').insert({
    kind: 'kampania_email',
    title: `Kampania „${przypomnienie ? 'przypomnienie' : 'powrót'}": wysłano ${sent}`,
    body: `Nieudane: ${failed.length}. Zostało do wysłania: ${zostalo}. B2B pominięte: ${skB2b}.`,
  }).then(undefined, (e: unknown) => console.error('[Comeback] notify error:', e))

  return NextResponse.json({ dryRun: false, tryb, wyslano: sent, nieudane: failed, zostalo })
}
