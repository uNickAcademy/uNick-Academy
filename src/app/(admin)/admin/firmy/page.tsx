import { getAllCompanies, getAllStudents, getInvoices, getDeletedCompanies, getAllTeachersAdmin } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { warsawDayOfWeek, warsawTimeOfDay } from '@/lib/lessons/schedule'
import { CompaniesView } from './CompaniesView'

export const dynamic = 'force-dynamic'

export default async function FirmyPage() {
  const supabase = await createClient()
  const [companies, students, invoices, deletedCompanies, teachers, { data: lessonRows }] = await Promise.all([
    getAllCompanies(),
    getAllStudents(),
    getInvoices(),
    getDeletedCompanies(),
    getAllTeachersAdmin(),
    supabase.from('lessons')
      .select('student_id, starts_at, ends_at, meeting_url')
      .is('cancelled_at', null).is('group_id', null).not('student_id', 'is', null),
  ])

  const nowIso = new Date().toISOString()
  // Najbliższa do „teraz" lekcja każdego pracownika — podpowiedź terminu i linku
  // dla tych, którzy nie mają jeszcze course_config (to samo co w panelu Studenci).
  const closestLesson: Record<string, { starts_at: string; ends_at: string; meeting_url: string | null }> = {}
  for (const l of (lessonRows ?? []) as { student_id: string; starts_at: string; ends_at: string; meeting_url: string | null }[]) {
    const cur = closestLesson[l.student_id]
    const isFuture = l.starts_at >= nowIso
    const curIsFuture = cur ? cur.starts_at >= nowIso : false
    const better = !cur
      || (isFuture && !curIsFuture)
      || (isFuture === curIsFuture && (isFuture ? l.starts_at < cur.starts_at : l.starts_at > cur.starts_at))
    if (better) closestLesson[l.student_id] = l
  }

  return (
    <CompaniesView
      companies={companies.map((c) => ({
        id: c.id, name: c.name, nip: c.nip ?? '', address: c.address ?? '',
        employeeCount: c.employeeCount, hrName: c.hrName, isActive: c.is_active,
      }))}
      students={students.map((s) => {
        const near = closestLesson[s.id]
        const inferredSlot = !s.course_config && near
          ? { day: warsawDayOfWeek(near.starts_at), time: warsawTimeOfDay(near.starts_at), durationMin: Math.max(1, Math.round((new Date(near.ends_at).getTime() - new Date(near.starts_at).getTime()) / 60000)) }
          : null
        return {
          id: s.id,
          name: s.full_name ?? s.profile?.full_name ?? '—',
          email: s.profile?.email ?? '',
          companyId: s.company_id ?? '',
          teacherId: s.teacher_id ?? '',
          teacherName: s.teacher?.profile?.full_name ?? '—',
          courseConfig: s.course_config ?? null,
          inferredSlot,
          meetingUrl: s.course_config?.meetingUrl ?? near?.meeting_url ?? '',
          lessonPrice: s.custom_lesson_price ?? null,
          teacherRate: s.custom_teacher_rate ?? null,
        }
      })}
      invoices={invoices.map((i) => ({
        id: i.id, companyId: i.company_id ?? '', number: i.number,
        gross: Number(i.gross_amount), period: i.period ?? '', issuedAt: i.issued_at,
        companyName: i.companyName,
      }))}
      deletedCompanies={deletedCompanies.map((c) => ({ id: c.id, name: c.name }))}
      teacherOptions={teachers.filter((t) => t.is_active).map((t) => ({
        id: t.id,
        name: t.profile?.full_name ?? '—',
        onlineIndividualPayRate: t.online_individual_pay_rate ?? null,
        onlineIndividualClientRate: t.online_individual_client_rate ?? null,
      }))}
    />
  )
}
