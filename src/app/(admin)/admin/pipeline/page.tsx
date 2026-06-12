import { getB2bLeads } from '@/lib/supabase/queries'
import { PipelineBoard } from './PipelineBoard'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const leads = await getB2bLeads()
  return (
    <PipelineBoard
      leads={leads.map((l) => ({
        id: l.id, companyName: l.company_name, contactName: l.contact_name ?? '',
        email: l.email ?? '', phone: l.phone ?? '', employeesCount: l.employees_count ?? null,
        goal: l.goal ?? '', stage: l.stage, value: l.value != null ? Number(l.value) : null,
        notes: l.notes ?? '', source: l.source ?? '',
      }))}
    />
  )
}
