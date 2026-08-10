import { getArrearsReport } from '@/lib/supabase/queries'
import { ArrearsView } from './ArrearsView'

export const dynamic = 'force-dynamic'

export default async function ZaleglosciPage() {
  const report = await getArrearsReport()
  return <ArrearsView report={report} />
}
