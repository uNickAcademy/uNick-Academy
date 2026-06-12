import { getLang } from '@/lib/lang'
import { StudentShell } from './StudentShell'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return <StudentShell lang={lang}>{children}</StudentShell>
}
