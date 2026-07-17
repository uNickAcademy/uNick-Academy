import { getLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/server'
import { getStudentsByProfileId, getStudentByProfileId } from '@/lib/supabase/queries'
import { StudentShell } from './StudentShell'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let billingType: 'individual' | 'b2b' = 'individual'
  let childOptions: { id: string; name: string }[] = []
  let activeStudentId = ''
  if (user) {
    const [students, active] = await Promise.all([
      getStudentsByProfileId(user.id),
      getStudentByProfileId(user.id),
    ])
    if (active?.billing_type === 'b2b') billingType = 'b2b'
    activeStudentId = active?.id ?? ''
    // Przełącznik dzieci pokazujemy tylko, gdy rodzic ma więcej niż jedno podkonto
    if (students.length > 1) {
      childOptions = students.map((s) => ({ id: s.id, name: s.full_name ?? s.profile?.full_name ?? '—' }))
    }
  }

  return (
    <StudentShell lang={lang} billingType={billingType} childOptions={childOptions} activeStudentId={activeStudentId}>
      {children}
    </StudentShell>
  )
}
