import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId } from '@/lib/supabase/queries'
import { getLang } from '@/lib/lang'
import { StudentProfileForm } from './StudentProfileForm'

export const dynamic = 'force-dynamic'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const student = await getStudentByProfileId(user.id)
  const lang = await getLang()

  return (
    <StudentProfileForm
      lang={lang}
      fullName={student?.profile?.full_name ?? ''}
      phone={student?.profile?.phone ?? ''}
      email={student?.profile?.email ?? ''}
    />
  )
}
