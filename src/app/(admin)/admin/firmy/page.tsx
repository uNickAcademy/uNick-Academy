import { getAllCompanies, getAllStudents, getInvoices } from '@/lib/supabase/queries'
import { CompaniesView } from './CompaniesView'

export const dynamic = 'force-dynamic'

export default async function FirmyPage() {
  const [companies, students, invoices] = await Promise.all([
    getAllCompanies(),
    getAllStudents(),
    getInvoices(),
  ])

  return (
    <CompaniesView
      companies={companies.map((c) => ({
        id: c.id, name: c.name, nip: c.nip ?? '', address: c.address ?? '',
        employeeCount: c.employeeCount, hrName: c.hrName,
      }))}
      students={students.map((s) => ({
        id: s.id, name: s.profile?.full_name ?? '—', companyId: s.company_id ?? '',
      }))}
      invoices={invoices.map((i) => ({
        id: i.id, companyId: i.company_id ?? '', number: i.number,
        gross: Number(i.gross_amount), period: i.period ?? '', issuedAt: i.issued_at,
        companyName: i.companyName,
      }))}
    />
  )
}
