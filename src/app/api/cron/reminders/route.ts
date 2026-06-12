import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendLessonReminder, sendOverdueNotification, sendBulkMessage } from '@/lib/email/send'
import { format, addHours } from 'date-fns'
import { pl } from 'date-fns/locale'

// Endpoint wywoływany przez Vercel Cron co godzinę
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }

export async function GET(req: NextRequest) {
  // Zabezpieczenie – tylko Vercel Cron może wywołać
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const in24h = addHours(now, 24)
  const window = addHours(now, 25) // ±1h okno

  // 1. Przypomnienia o lekcjach 24h wcześniej
  const { data: upcomingLessons } = await supabase
    .from('lessons')
    .select(`
      *,
      student:students(*, profile:profiles(*)),
      teacher:teachers(*, profile:profiles(*))
    `)
    .gte('starts_at', in24h.toISOString())
    .lte('starts_at', window.toISOString())

  for (const lesson of upcomingLessons ?? []) {
    const startsAt = new Date(lesson.starts_at)
    await sendLessonReminder(lesson.student.profile.email, {
      studentName: lesson.student.profile.full_name,
      teacherName: lesson.teacher.profile.full_name,
      date: format(startsAt, 'EEEE, d MMMM', { locale: pl }),
      time: format(startsAt, 'HH:mm'),
      type: lesson.type,
    })
  }

  // 2. Przypomnienia o zaległościach (studenci z statusem overdue)
  const { data: overdueStudents } = await supabase
    .from('students')
    .select(`*, profile:profiles(*)`)
    .eq('status', 'overdue')

  for (const student of overdueStudents ?? []) {
    // Oblicz zaległość
    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('student_id', student.id)

    const balance = (transactions ?? []).reduce((acc, tx) => {
      return tx.type === 'charge' ? acc - tx.amount : acc + tx.amount
    }, 0)

    if (balance < 0) {
      await sendOverdueNotification(student.profile.email, {
        studentName: student.profile.full_name,
        amount: Math.abs(balance),
        dueDate: format(new Date(), 'd MMMM yyyy', { locale: pl }),
      })
    }
  }

  // 3. Przypomnienia o odrabianiu – zgłoszona nieobecność (excused), jeszcze niezapisana na odrabianie
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

  return NextResponse.json({
    reminders: upcomingLessons?.length ?? 0,
    overdueNotifications: overdueStudents?.length ?? 0,
    makeupReminders,
  })
}
