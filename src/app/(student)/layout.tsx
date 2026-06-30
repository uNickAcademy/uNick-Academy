import { getLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/server'
import { StudentShell } from './StudentShell'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let billingType: 'individual' | 'b2b' = 'individual'
  if (user) {
    const { data: student } = await supabase
      .from('students')
      .select('billing_type')
      .eq('profile_id', user.id)
      .single()
    if (student?.billing_type === 'b2b') billingType = 'b2b'
  }

  return <StudentShell lang={lang} billingType={billingType}>{children}</StudentShell>
}
