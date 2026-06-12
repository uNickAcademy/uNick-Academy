import { getSubstitutions, getAllTeachersAdmin } from '@/lib/supabase/queries'
import { SubstitutionsView } from './SubstitutionsView'

export const dynamic = 'force-dynamic'

export default async function ZastepstwaPage() {
  const [subs, teachers] = await Promise.all([getSubstitutions(), getAllTeachersAdmin()])
  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))
  return <SubstitutionsView subs={subs} teacherOptions={teacherOptions} />
}
