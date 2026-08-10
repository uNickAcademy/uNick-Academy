import { getDuplicateStudents } from '@/lib/supabase/queries'
import { DuplicatesView } from './DuplicatesView'

export const dynamic = 'force-dynamic'

export default async function DuplikatyPage() {
  const groups = await getDuplicateStudents()
  return <DuplicatesView groups={groups} />
}
