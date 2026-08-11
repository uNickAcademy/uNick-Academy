import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendBookingReceived, notifySchoolEmail, sendGroupReservation, sendAdviceReceived, sendMonthlyPayment,
} from '@/lib/email/send'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { chargeStudentForPeriod, chargeFirstLesson } from '@/lib/billing/charge'
import { billFamilies } from '@/lib/billing/family'
import { firstBillablePeriod } from '@/lib/billing/engine'
import { notifySchoolSms } from '@/lib/sms/send'
import { createPasswordSetupLink } from '@/lib/auth/password-link'
import { createLead, type LeadLocation, type LeadStudentType } from '@/lib/leads/create'
import { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

// createLead() woła Agenta Łowcę (Claude + Resend) synchronicznie dla nowych
// leadów (kind 'advice'/'individual') — domyślny limit czasu funkcji Vercel
// bywa za krótki na to wywołanie.
export const maxDuration = 30

const DAYS_PL_FULL = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']

// Powiadomienie do panelu admina (dzwonek). Best-effort — nie blokuje zapisu.
async function notifyAdmin(admin: SupabaseClient, kind: string, title: string, body: string, studentId?: string | null) {
  try {
    await admin.from('admin_notifications').insert({ kind, title, body, student_id: studentId ?? null })
  } catch (err) {
    console.error('[Booking] notifyAdmin error:', err)
  }
}

// Pierwsze wystąpienie dnia zajęć od daty startu semestru. `start_date` to
// początek semestru, niekoniecznie dzień tygodnia, w którym grupa się spotyka.
function firstLessonDate(startDate: string | null, dayOfWeek: number | null): Date | null {
  if (!startDate || dayOfWeek == null) return null
  const d = new Date(`${startDate}T00:00:00`)
  const targetDow = dayOfWeek === 6 ? 0 : dayOfWeek + 1 // JS: 0 = niedziela
  const diff = (targetDow - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  return d
}

function scheduleLabel(dayOfWeek: number | null, scheduleText: string | null): string {
  const day = dayOfWeek != null ? DAYS_PL_FULL[dayOfWeek] : null
  return [day, scheduleText].filter(Boolean).join(', ') || 'termin do potwierdzenia'
}

// Wiek → typ ucznia w lejku. Granice zgodne z podziałem grup.
function studentTypeFromAge(age: number | null | undefined): LeadStudentType | null {
  if (age == null) return null
  if (age < 13) return 'child'
  if (age < 18) return 'teen'
  return 'adult'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kind } = body
    const supabase = createAdminClient()

    // ── Rezerwacja miejsca w grupie ───────────────────────────────────────
    // Bez płatności online: model jest abonamentowy, płatny z góry do 5. dnia
    // miesiąca, więc rachunek idzie osobnym mailem po potwierdzeniu miejsca.
    if (kind === 'group') {
      const {
        email, fullName, phone, childName, groupId, termsVersion, consents,
        studentAge, location, consentMarketing, consentClause, campaign,
        referralCode,
      } = body
      if (!email || !fullName || !groupId) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })

      const { data: group } = await supabase.from('groups')
        .select('name, price_per_month, format, schedule_text, day_of_week, start_date, end_date')
        .eq('id', groupId).single()
      if (!group) return NextResponse.json({ error: 'Nie znaleźliśmy tej grupy.' }, { status: 400 })

      const { error } = await supabase.rpc('public_enroll_group', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_group_id: groupId, p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
        p_referral: referralCode || null,
      })
      if (error) {
        const msg = /miejsc/i.test(error.message)
          ? 'Ktoś właśnie zajął ostatnie miejsce w tej grupie. Wybierz inny termin albo zostaw kontakt — znajdziemy coś dla Ciebie.'
          : 'Nie udało się zapisać do grupy.'
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      // Odszukanie właśnie zapisanego ucznia (po e-mailu wśród członków grupy).
      const { data: members } = await supabase.from('group_members')
        .select('student_id, student:students(id, profile:profiles(email))').eq('group_id', groupId)
      const enrolled = (members ?? []).find((m: { student?: unknown }) => {
        const st = Array.isArray(m.student) ? m.student[0] : (m.student as { profile?: { email?: string } | { email?: string }[] } | undefined)
        const p = Array.isArray(st?.profile) ? st?.profile[0] : st?.profile
        return p?.email === email
      })
      const enrolledId = (() => {
        const st = enrolled ? (Array.isArray(enrolled.student) ? enrolled.student[0] : enrolled.student) : null
        return (st as { id?: string } | null)?.id ?? enrolled?.student_id ?? null
      })()

      const groupName = (group.name as string) ?? 'grupa'
      const price = group.price_per_month != null ? Number(group.price_per_month) : null
      const groupFormat = (group.format as 'online' | 'offline' | null) ?? null
      const schedule = scheduleLabel(group.day_of_week as number | null, group.schedule_text as string | null)
      const firstLesson = firstLessonDate(group.start_date as string | null, group.day_of_week as number | null)
      const firstLessonLabel = firstLesson ? format(firstLesson, 'EEEE, d MMMM yyyy', { locale: pl }) : null

      // Lead z pełnym kontekstem zebranym po drodze — wspólna skrzynka zespołu.
      await createLead(supabase, {
        entryPoint: 'zapisy_wizard',
        firstName: childName || fullName,
        parentName: childName ? fullName : null,
        email, phone,
        studentType: studentTypeFromAge(studentAge),
        studentAge: studentAge ?? null,
        location: (location as LeadLocation) ?? (groupFormat === 'online' ? 'online' : 'rumianek'),
        interestedGroupId: groupId,
        goal: `Rezerwacja miejsca: ${groupName} (${schedule})`,
        status: 'booked',
        bookedSlotAt: firstLesson ? firstLesson.toISOString() : null,
        consentMarketing: !!consentMarketing,
        consentClause: consentClause ?? null,
        campaign: campaign ?? null,
        referralCode: referralCode ?? null,
      }).catch((err) => console.error('[Booking group] createLead error:', err))

      // Pierwszy miesiąc kursu płatny przy zapisie — dla kursu startującego we
      // wrześniu naliczamy wrzesień, choćby zapis był w sierpniu. Kolejne
      // miesiące dołoży cron pierwszego dnia miesiąca. Best-effort: problem
      // z naliczeniem nie może wywrócić samej rezerwacji miejsca.
      let firstMonthCharged = false
      if (enrolledId) {
        try {
          const period = firstBillablePeriod({
            name: groupName,
            pricePerMonth: group.price_per_month != null ? Number(group.price_per_month) : null,
            startDate: (group.start_date as string | null) ?? null,
            endDate: (group.end_date as string | null) ?? null,
          }, new Date())

          const outcome = await chargeStudentForPeriod(supabase, {
            id: enrolledId, name: childName || fullName, email, customMonthlyPrice: null,
          }, period)

          // Rachunek wystawiamy rodzinie: jeśli rodzeństwo ma nierozliczoną
          // kwotę za ten sam miesiąc, wejdzie do tej samej płatności zamiast
          // generować rodzicowi drugiego maila i drugi link.
          if (outcome.charged > 0) {
            const base = process.env.NEXT_PUBLIC_APP_URL || ''
            const billed = await billFamilies(supabase, [outcome], outcome.periodLabel, {
              createCheckout: (opts) => createCheckoutSession({
                ...opts,
                successUrl: `${base}/platnosci?success=true`,
                cancelUrl: `${base}/platnosci?cancelled=true`,
              }),
              sendPayment: sendMonthlyPayment,
            })
            firstMonthCharged = billed.emailed > 0
          }
        } catch (err) {
          console.error('[Booking group] billing error:', err)
        }
      }

      const passwordLink = await createPasswordSetupLink(supabase, email)
      await sendGroupReservation(email, {
        studentName: childName || fullName,
        groupName, schedule, firstLessonDate: firstLessonLabel,
        format: groupFormat, pricePerMonth: price, passwordLink,
      }).catch(() => {})

      // Rachunek za pierwszy miesiąc wyszedł już z billFamilies — osobnym
      // mailem, razem z linkiem do płatności i rozbiciem na uczestników.

      await notifyAdmin(supabase, 'group', `Nowa rezerwacja miejsca: ${groupName}`,
        `${fullName}${childName ? ` (uczeń: ${childName})` : ''}${phone ? `, tel. ${phone}` : ''}, ${email}`, enrolledId)
      await notifySchoolSms(`Nowa rezerwacja: ${groupName} — ${fullName}${childName ? ` (${childName})` : ''}${phone ? `, tel. ${phone}` : ''}, ${email}`)
      await notifySchoolEmail({
        title: `Nowa rezerwacja miejsca: ${groupName}`,
        lines: [
          `Osoba zapisująca: ${fullName}`,
          childName ? `Uczeń: ${childName}` : '',
          studentAge ? `Wiek: ${studentAge}` : '',
          phone ? `Telefon: ${phone}` : '',
          `E-mail: ${email}`,
          `Grupa: ${groupName} — ${schedule}`,
          firstLessonLabel ? `Pierwsze zajęcia: ${firstLessonLabel}` : '',
          price ? `Cena: ${price} zł / mies.` : '',
        ],
        actionLabel: 'Zobacz uczniów →',
        actionPath: '/admin/studenci',
      })

      return NextResponse.json({ success: true, groupName, schedule, firstLessonDate: firstLessonLabel, billed: firstMonthCharged })
    }

    // ── „Jeszcze nie wiem" i zajęcia indywidualne ─────────────────────────
    // Obie ścieżki kończą się rozmową diagnostyczną, nie automatycznym
    // przypisaniem do terminu — dopasowanie nauczyciela ma się dziać w rozmowie.
    if (kind === 'advice' || kind === 'individual') {
      const {
        email, fullName, phone, childName, studentAge, location, audience, message,
        preferredTimes, consentMarketing, consentClause, campaign, undecided,
        referralCode,
      } = body
      if (!fullName || (!email && !phone)) {
        return NextResponse.json({ error: 'Podaj imię oraz e-mail lub telefon.' }, { status: 400 })
      }

      const individual = kind === 'individual'
      const studentType: LeadStudentType | null =
        audience === 'company' ? 'corporate'
        : audience === 'child' ? (studentTypeFromAge(studentAge) ?? 'child')
        : audience === 'self' ? 'adult'
        : studentTypeFromAge(studentAge)

      await createLead(supabase, {
        entryPoint: individual ? 'zapisy_wizard' : 'advice',
        firstName: childName || fullName,
        parentName: childName ? fullName : null,
        email: email || null,
        phone: phone || null,
        studentType,
        studentAge: studentAge ?? null,
        location: (location as LeadLocation) ?? null,
        goal: message || (individual ? 'Prośba o zajęcia indywidualne' : 'Prośba o dobranie oferty'),
        preferredStart: preferredTimes || null,
        status: 'new',
        consentMarketing: !!consentMarketing,
        consentClause: consentClause ?? null,
        campaign: campaign ?? null,
        referralCode: referralCode ?? null,
      })

      // Konto powstaje od razu, żeby klient nie musiał zakładać go osobno.
      // Bez e-maila nie ma czego założyć — wtedy zostaje sam lead.
      let passwordLink: string | null = null
      if (email) {
        await supabase.rpc('_booking_ensure_account', {
          p_email: email, p_full_name: fullName, p_phone: phone || '',
        }).then(undefined, (e: unknown) => console.error('[Booking advice] ensure account:', e))
        passwordLink = await createPasswordSetupLink(supabase, email)
        await sendAdviceReceived(email, { name: fullName, individual, passwordLink }).catch(() => {})
      }

      const label = individual
        ? 'zajęcia indywidualne'
        : undecided ? 'nie wie, czego szuka' : 'prośba o doradztwo'
      await notifyAdmin(supabase, 'advice', `Nowe zgłoszenie (${label}): ${fullName}`,
        `${childName ? `uczeń: ${childName}, ` : ''}${phone ? `tel. ${phone}, ` : ''}${email || 'bez e-maila'}${message ? ` — ${message}` : ''}`)
      await notifySchoolSms(`Nowe zgłoszenie (${label}): ${fullName}${phone ? `, tel. ${phone}` : ''}${email ? `, ${email}` : ''}`)
      await notifySchoolEmail({
        title: `Nowe zgłoszenie — ${label}: ${fullName}`,
        lines: [
          `Osoba zgłaszająca: ${fullName}`,
          childName ? `Uczeń: ${childName}` : '',
          studentAge ? `Wiek: ${studentAge}` : '',
          phone ? `Telefon: ${phone}` : '',
          email ? `E-mail: ${email}` : 'E-mail: nie podano',
          location ? `Forma: ${location === 'online' ? 'online' : 'Rumianek'}` : '',
          preferredTimes ? `Preferowane pory: ${preferredTimes}` : '',
          message ? `Opis: ${message}` : '',
          'Obiecany czas odpowiedzi: 2 dni robocze.',
        ],
        actionLabel: 'Otwórz pipeline →',
        actionPath: '/admin/pipeline',
      })

      return NextResponse.json({ success: true })
    }

    // ── Ścieżki historyczne ───────────────────────────────────────────────
    // `online` i `stationary` nie są już osiągalne z kreatora (zajęcia
    // indywidualne idą przez `individual` do rozmowy diagnostycznej), ale
    // panel administracyjny nadal obsługuje rekordy utworzone wcześniej.
    // Zostawione do czasu rozliczenia zaległych zapisów.
    if (kind === 'online') {
      const { email, fullName, phone, childName, teacherId, slot, ongoing, weeks, referralCode, discountCode, termsVersion, consents } = body
      if (!email || !fullName || !teacherId || !slot) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
      const startsAt = new Date(slot)
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
      const { error } = await supabase.rpc('public_book_online', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_teacher: teacherId, p_starts: startsAt.toISOString(), p_ends: endsAt.toISOString(),
        p_ongoing: !!ongoing, p_weeks: weeks ?? 12,
        p_referral: referralCode || '', p_discount: discountCode || '',
        p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
      })
      if (error) {
        console.error('[Booking online] RPC error:', error)
        return NextResponse.json({ error: 'Nie udało się zarezerwować lekcji.' }, { status: 500 })
      }
      // Zajęcia indywidualne: przy zapisie płatna jest pierwsza lekcja.
      // Pozostałe lekcje z tego miesiąca dolicza cron po jej odbyciu.
      try {
        const { data: booked } = await supabase
          .from('students')
          .select('id, full_name, profile:profiles!inner(email)')
          .eq('profile.email', email)
          .is('deleted_at', null)
          .order('joined_at', { ascending: false })
          .limit(1)
        const student = booked?.[0]
        if (student) {
          await chargeFirstLesson(supabase, {
            id: student.id, name: (student.full_name as string) || fullName, email, customMonthlyPrice: null,
          }, startsAt.toISOString())
        }
      } catch (err) {
        console.error('[Booking online] billing error:', err)
      }

      const { data: teacher } = await supabase.from('teachers').select('profile:profiles(full_name)').eq('id', teacherId).single()
      const teacherName: string = (teacher?.profile as { full_name?: string } | null)?.full_name ?? 'Nauczyciel'
      await sendBookingReceived(email, {
        studentName: fullName, teacherName,
        date: format(startsAt, 'EEEE, d MMMM yyyy', { locale: pl }), time: format(startsAt, 'HH:mm'),
      }).catch(() => {})
      await notifyAdmin(supabase, 'online', `Nowy zapis online: ${fullName}`,
        `${phone ? `tel. ${phone}, ` : ''}${email} — ${teacherName}, ${format(startsAt, 'd.MM HH:mm')} — do zatwierdzenia`)
      return NextResponse.json({ success: true })
    }

    if (kind === 'stationary') {
      const { email, fullName, phone, childName, level, age, address, slots, notes, termsVersion, consents, referralCode } = body
      if (!email || !fullName || !address) return NextResponse.json({ error: 'Podaj dane i adres zajęć' }, { status: 400 })
      const { error } = await supabase.rpc('public_stationary_request', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_level: level || 'A1', p_age: age ?? null, p_address: address, p_slots: slots ?? [],
        p_notes: notes || '', p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
        p_referral: referralCode || null,
      })
      if (error) {
        console.error('[Booking stationary] RPC error:', error)
        return NextResponse.json({ error: 'Nie udało się wysłać prośby.' }, { status: 500 })
      }
      await notifyAdmin(supabase, 'stationary', `Nowa prośba o zajęcia stacjonarne: ${fullName}`,
        `${phone ? `tel. ${phone}, ` : ''}${email}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Nieznany typ zapisu' }, { status: 400 })
  } catch (err) {
    console.error('[Booking] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
