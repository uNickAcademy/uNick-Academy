import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingReceived, notifySchoolEmail } from '@/lib/email/send'
import { notifySchoolSms } from '@/lib/sms/send'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

// Powiadomienie do panelu admina (dzwonek). Best-effort — nie blokuje zapisu.
async function notifyAdmin(admin: SupabaseClient, kind: string, title: string, body: string, studentId?: string | null) {
  try {
    await admin.from('admin_notifications').insert({ kind, title, body, student_id: studentId ?? null })
  } catch (err) {
    console.error('[Booking] notifyAdmin error:', err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kind } = body
    const supabase = createAdminClient()

    if (kind === 'group') {
      const { email, fullName, phone, childName, groupId, termsVersion, consents } = body
      if (!email || !fullName || !groupId) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
      const { error } = await supabase.rpc('public_enroll_group', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_group_id: groupId, p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
      })
      if (error) {
        const msg = /miejsc/i.test(error.message) ? 'Brak wolnych miejsc w tej grupie.' : 'Nie udało się zapisać do grupy.'
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      // Dane grupy + odszukanie właśnie zapisanego ucznia (po e-mailu wśród członków)
      const { data: group } = await supabase.from('groups')
        .select('name, price_per_month').eq('id', groupId).single()
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
      const groupName = (group?.name as string) ?? 'grupa'
      const price = group?.price_per_month != null ? Number(group.price_per_month) : null

      await notifyAdmin(supabase, 'group', `Nowy zapis do grupy: ${groupName}`,
        `${fullName}${childName ? ` (dziecko: ${childName})` : ''}${phone ? `, tel. ${phone}` : ''}, ${email}`, enrolledId)
      await notifySchoolSms(`Nowy zapis do grupy: ${fullName}${childName ? ` (dziecko: ${childName})` : ''}${phone ? `, tel. ${phone}` : ''}, ${email}`)
      await notifySchoolEmail({
        title: `Nowy zapis do grupy: ${groupName}`,
        lines: [
          `Osoba zapisująca: ${fullName}`,
          childName ? `Dziecko: ${childName}` : '',
          phone ? `Telefon: ${phone}` : '',
          `E-mail: ${email}`,
          `Grupa: ${groupName}`,
          price ? `Cena: ${price} zł / mies.` : '',
        ],
        actionLabel: 'Zobacz uczniów →',
        actionPath: '/admin/studenci',
      })

      // Opłata za pierwszy miesiąc — Stripe Checkout (BLIK/P24/karta), jeśli grupa
      // ma cenę i płatności są skonfigurowane. Bez tego zapis działa jak dotąd.
      let checkoutUrl: string | null = null
      if (price && price > 0 && enrolledId) {
        try {
          const base = process.env.NEXT_PUBLIC_APP_URL || ''
          checkoutUrl = await createCheckoutSession({
            amount: price, studentId: enrolledId, email,
            description: `Zajęcia grupowe: ${groupName} — pierwszy miesiąc`,
            successUrl: `${base}/platnosci?success=true`,
            cancelUrl: `${base}/zapisy?paid=cancel`,
          })
        } catch (err) {
          console.error('[Booking group] checkout error:', err)
        }
      }
      return NextResponse.json({ success: true, checkoutUrl })
    }

    if (kind === 'online') {
      const { email, fullName, phone, childName, teacherId, slot, ongoing, weeks, referralCode, discountCode, termsVersion, consents } = body
      if (!email || !fullName || !teacherId || !slot) return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 })
      const startsAt = new Date(slot)
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
      const { data: meetLink, error } = await supabase.rpc('public_book_online', {
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
      const { data: teacher } = await supabase.from('teachers').select('profile:profiles(full_name)').eq('id', teacherId).single()
      const teacherName: string = (teacher?.profile as { full_name?: string } | null)?.full_name ?? 'Nauczyciel'

      // Zapis czeka na akceptację admina, więc nie potwierdzamy jeszcze lekcji —
      // uczeń dostaje informację, że termin potwierdzimy osobnym mailem.
      await sendBookingReceived(email, {
        studentName: fullName, teacherName,
        date: format(startsAt, 'EEEE, d MMMM yyyy', { locale: pl }), time: format(startsAt, 'HH:mm'),
      }).catch(() => {})

      // Powiadomienie z powiązanym uczniem — dzięki temu admin klika i ląduje
      // od razu na liście zapisów do zatwierdzenia.
      const { data: bookedStudent } = await supabase
        .from('students').select('id, profile:profiles!inner(email)')
        .eq('profile.email', email).order('joined_at', { ascending: false }).limit(1).maybeSingle()
      await notifyAdmin(supabase, 'online', `Nowy zapis online: ${fullName}`,
        `${childName ? `dziecko: ${childName}, ` : ''}${phone ? `tel. ${phone}, ` : ''}${email} — ${teacherName}, ${format(startsAt, 'd.MM HH:mm')}${ongoing ? ' (cykliczne)' : ''} — do zatwierdzenia`,
        (bookedStudent?.id as string) ?? null)
      await notifySchoolSms(
        `Nowy zapis online: ${fullName}${childName ? ` (dziecko: ${childName})` : ''}${phone ? `, tel. ${phone}` : ''}, ${email} — ${teacherName}, ${format(startsAt, 'd.MM HH:mm')}${ongoing ? ' (cykliczne)' : ''}`
      )
      await notifySchoolEmail({
        title: `Nowy zapis online do zatwierdzenia: ${fullName}`,
        lines: [
          `Osoba zapisująca: ${fullName}`,
          childName ? `Dziecko: ${childName}` : '',
          phone ? `Telefon: ${phone}` : '',
          `E-mail: ${email}`,
          `Nauczyciel: ${teacherName}`,
          `Termin: ${format(startsAt, 'EEEE, d MMMM yyyy, HH:mm', { locale: pl })}`,
          ongoing ? `Zajęcia cykliczne — ${weeks ?? 12} tyg.` : 'Pojedyncza lekcja',
        ],
        actionLabel: 'Zatwierdź zapis →',
        actionPath: '/admin/zapisy#online',
      })
      return NextResponse.json({ success: true })
    }

    if (kind === 'stationary') {
      const { email, fullName, phone, childName, level, age, address, slots, notes, termsVersion, consents } = body
      if (!email || !fullName || !address) return NextResponse.json({ error: 'Podaj dane i adres zajęć' }, { status: 400 })
      const { error } = await supabase.rpc('public_stationary_request', {
        p_email: email, p_full_name: fullName, p_phone: phone || '', p_child: childName || '',
        p_level: level || 'A1', p_age: age ?? null, p_address: address, p_slots: slots ?? [],
        p_notes: notes || '', p_terms_version: termsVersion ?? null, p_consents: consents ?? {},
      })
      if (error) {
        console.error('[Booking stationary] RPC error:', error)
        return NextResponse.json({ error: 'Nie udało się wysłać prośby.' }, { status: 500 })
      }
      await notifyAdmin(supabase, 'stationary', `Nowa prośba o zajęcia stacjonarne: ${fullName}`,
        `${childName ? `dziecko: ${childName}, ` : ''}${phone ? `tel. ${phone}, ` : ''}${email}`)
      await notifySchoolSms(`Nowa prośba o zajęcia stacjonarne: ${fullName}${childName ? ` (dziecko: ${childName})` : ''}${phone ? `, tel. ${phone}` : ''}, ${email}`)
      await notifySchoolEmail({
        title: `Nowa prośba o zajęcia stacjonarne: ${fullName}`,
        lines: [
          `Osoba zapisująca: ${fullName}`,
          childName ? `Dziecko: ${childName}` : '',
          age ? `Wiek: ${age}` : '',
          phone ? `Telefon: ${phone}` : '',
          `E-mail: ${email}`,
          `Poziom: ${level || 'A1'}`,
          `Adres zajęć: ${address}`,
          notes ? `Uwagi: ${notes}` : '',
        ],
        actionLabel: 'Zatwierdź prośbę →',
        actionPath: '/admin/zapisy#stacjonarne',
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Nieznany typ zapisu' }, { status: 400 })
  } catch (err) {
    console.error('[Booking] Error:', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
