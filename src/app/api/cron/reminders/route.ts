import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendLessonReminder, sendOverdueNotification, sendBulkMessage, sendProgressDigest } from '@/lib/email/send'
import { format, addHours } from 'date-fns'
import { pl } from 'date-fns/locale'

// Endpoint wywoływany przez Vercel Cron raz dziennie o 8:00
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 8 * * *" }] }
// Codziennie: przypomnienia o lekcjach (24–48h) i o odrabianiu.
// W poniedziałki dodatkowo: windykacja (z realnego salda) + tygodniowe podsumowanie postępów.

function computeBalance(txs: { type: string; amount: number }[]): number {
  return txs.reduce((acc, tx) => (tx.type === 'charge' ? acc - Number(tx.amount) : acc + Number(tx.amount)), 0)
}

export async function GET(req: NextRequest) {
  // Zabezpieczenie – tylko Vercel Cron może wywołać
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const isMonday = now.getDay() === 1

  // ── 0. Auto-obecność ────────────────────────────────────────────────────
  // Zakończone lekcje, których nikt nie oznaczył, domyślnie liczymy jako obecność.
  const { data: autoPresent } = await supabase
    .from('lessons')
    .update({ attendance: 'present' })
    .eq('attendance', 'scheduled')
    .lt('ends_at', now.toISOString())
    .select('id')
  const autoPresentCount = autoPresent?.length ?? 0

  // ── 1. Przypomnienia o lekcjach (codziennie) ────────────────────────────
  // Cron działa raz dziennie – obejmujemy pełną dobę „jutro” (24–48h w przód),
  // żeby każda lekcja dostała dokładnie jedno przypomnienie
  const in24h = addHours(now, 24)
  const window = addHours(now, 48)
  const { data: upcomingLessons } = await supabase
    .from('lessons')
    .select(`*, student:students(*, profile:profiles(*)), teacher:teachers(*, profile:profiles(*))`)
    .gte('starts_at', in24h.toISOString())
    .lte('starts_at', window.toISOString())

  for (const lesson of upcomingLessons ?? []) {
    if (!lesson.student?.profile?.email) continue
    const startsAt = new Date(lesson.starts_at)
    await sendLessonReminder(lesson.student.profile.email, {
      studentName: lesson.student.profile.full_name,
      teacherName: lesson.teacher?.profile?.full_name ?? 'Nauczyciel',
      date: format(startsAt, 'EEEE, d MMMM', { locale: pl }),
      time: format(startsAt, 'HH:mm'),
      type: lesson.type,
      meetLink: lesson.meeting_url ?? undefined,
    })
  }

  // ── 2. Przypomnienia o odrabianiu (codziennie) ──────────────────────────
  const { data: excusedLessons } = await supabase
    .from('lessons')
    .select('id, starts_at, student:students(id, profile:profiles(full_name, email))')
    .eq('attendance', 'excused')
    .eq('makeup_reminded', false)
    .lt('starts_at', addHours(now, -48).toISOString())

  let makeupReminders = 0
  for (const l of excusedLessons ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const st: any = Array.isArray((l as any).student) ? (l as any).student[0] : (l as any).student
    const prof = Array.isArray(st?.profile) ? st.profile[0] : st?.profile
    if (st?.id && prof?.email) {
      const { data: makeups } = await supabase
        .from('lessons').select('id')
        .eq('student_id', st.id).gte('starts_at', now.toISOString())
        .or('topic.ilike.Odrabianie%,topic.ilike.Make-up%').limit(1)
      if (!makeups || makeups.length === 0) {
        await sendBulkMessage([{ email: prof.email, name: prof.full_name ?? '' }],
          'Przypomnienie: zapisz się na odrabianie',
          'Masz zgłoszoną nieobecność, ale nie zapisałeś/aś się jeszcze na odrabianie. Wejdź w „Moje lekcje", aby wybrać dogodny termin z dostępności lektora.')
        makeupReminders++
      }
    }
    await supabase.from('lessons').update({ makeup_reminded: true }).eq('id', l.id)
  }

  // ── 3. Windykacja + podsumowanie postępów (tylko w poniedziałki) ─────────
  let overdueNotifications = 0
  let statusUpdates = 0
  let progressDigests = 0

  if (isMonday) {
    // Studenci indywidualni (B2B rozlicza firma) – aktywni/próbni/zalegli
    const { data: students } = await supabase
      .from('students')
      .select(`id, status, billing_type, full_name, dunning_paused_until, profile:profiles(full_name, email)`)
      .is('deleted_at', null)
      .neq('billing_type', 'b2b')
      .in('status', ['active', 'trial', 'overdue'])

    for (const s of students ?? []) {
      // Windykacja wstrzymana — sporne obciążenie w trakcie wyjaśniania.
      // Bez tej bramki uczeń dostaje wezwanie co poniedziałek, także wtedy
      // gdy to my pomyliliśmy się przy naliczeniu.
      if (s.dunning_paused_until && new Date(s.dunning_paused_until as string) > now) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prof: any = Array.isArray((s as any).profile) ? (s as any).profile[0] : (s as any).profile
      const email = prof?.email
      const name = s.full_name ?? prof?.full_name ?? ''

      const { data: txs } = await supabase.from('transactions').select('type, amount').eq('student_id', s.id)
      const balance = computeBalance(txs ?? [])

      // Windykacja – realne saldo ujemne
      if (balance < 0 && email) {
        await sendOverdueNotification(email, {
          studentName: name,
          amount: Math.abs(Math.round(balance)),
          dueDate: format(now, 'd MMMM yyyy', { locale: pl }),
        })
        overdueNotifications++
        if (s.status === 'active') {
          await supabase.from('students').update({ status: 'overdue' }).eq('id', s.id)
          statusUpdates++
        }
      } else if (balance >= 0 && s.status === 'overdue') {
        // Uregulowano – przywróć aktywny status
        await supabase.from('students').update({ status: 'active' }).eq('id', s.id)
        statusUpdates++
      }
    }

    // Tygodniowe podsumowanie postępów – uczniowie z odbytą lekcją w ostatnich 7 dniach
    const weekAgo = addHours(now, -24 * 7)
    const { data: weekLessons } = await supabase
      .from('lessons')
      .select(`id, starts_at, ends_at, topic, homework, attendance, student:students(id, status, deleted_at, billing_type, full_name, profile:profiles(full_name, email))`)
      .gte('starts_at', weekAgo.toISOString())
      .lte('starts_at', now.toISOString())

    // Grupuj po uczniu
    const byStudent = new Map<string, {
      email: string; name: string; hoursMs: number; count: number; topics: string[]; homework: string[]
    }>()
    for (const l of weekLessons ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const st: any = Array.isArray((l as any).student) ? (l as any).student[0] : (l as any).student
      if (!st || st.deleted_at || st.billing_type === 'b2b') continue
      if (!['active', 'trial', 'overdue'].includes(st.status)) continue
      // Do „nauki” liczymy tylko faktycznie odbyte lekcje
      if (!['present', 'scheduled'].includes(l.attendance)) continue
      const prof = Array.isArray(st.profile) ? st.profile[0] : st.profile
      if (!prof?.email) continue
      const cur = byStudent.get(st.id) ?? { email: prof.email, name: st.full_name ?? prof.full_name ?? '', hoursMs: 0, count: 0, topics: [] as string[], homework: [] as string[] }
      cur.hoursMs += new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()
      cur.count += 1
      if (l.topic) cur.topics.push(l.topic)
      if (l.homework) cur.homework.push(l.homework)
      byStudent.set(st.id, cur)
    }

    const weekLabel = `${format(weekAgo, 'd MMM', { locale: pl })} – ${format(now, 'd MMM', { locale: pl })}`
    for (const [studentId, d] of byStudent) {
      if (d.count === 0) continue
      // Następna zaplanowana lekcja
      const { data: next } = await supabase
        .from('lessons').select('starts_at')
        .eq('student_id', studentId).gte('starts_at', now.toISOString())
        .order('starts_at', { ascending: true }).limit(1)
      const nextLesson = next && next.length > 0
        ? { date: format(new Date(next[0].starts_at), 'EEEE d MMMM', { locale: pl }), time: format(new Date(next[0].starts_at), 'HH:mm') }
        : null

      await sendProgressDigest(d.email, {
        studentName: d.name,
        weekLabel,
        lessonsCount: d.count,
        hours: Math.round((d.hoursMs / 3_600_000) * 10) / 10,
        topics: d.topics,
        homework: d.homework,
        nextLesson,
      })
      progressDigests++
    }
  }

  return NextResponse.json({
    autoPresent: autoPresentCount,
    reminders: upcomingLessons?.length ?? 0,
    makeupReminders,
    overdueNotifications,
    statusUpdates,
    progressDigests,
    ranWeekly: isMonday,
  })
}
