import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { canManageMaterialContacts, hasMaterialNewsletterConsent, type MaterialContact } from '@/lib/lesson-materials/contacts'

export const dynamic = 'force-dynamic'
const PAGE_SIZE = 50

export default async function MaterialContactsPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>
}) {
  if (!await canManageMaterialContacts()) redirect('/login')
  const { page: requestedPage } = await searchParams
  const page = Math.max(1, Math.floor(Number(requestedPage) || 1))
  const { data, error, count } = await createAdminClient()
    .from('lesson_material_contacts').select('*', { count: 'exact' })
    .order('first_verified_at', { ascending: false }).order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const contacts = (data ?? []) as MaterialContact[]

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <Link href="/admin/komunikacja" className="text-blue-800 underline">← Komunikacja</Link>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">Osoby korzystające z fiszek</h1>
      <p className="mt-3 text-slate-600">Potwierdzone adresy e-mail i aktualna zgoda na newsletter.</p>
      {error ? <p role="alert" className="mt-6 text-red-800">Nie udało się wczytać adresów. Odśwież stronę za chwilę.</p> : (
        <>
          <div className="my-6 flex flex-wrap items-center gap-4">
            <p>{count ?? 0} potwierdzonych adresów</p>
            <a className="rounded-xl bg-blue-900 px-4 py-3 text-white" href="/api/admin/lesson-materials/contacts" download>Pobierz kontakty CSV</a>
          </div>
          <p className="mb-4 text-sm text-slate-600">Do newslettera kwalifikują się adresy ze statusem „Aktywna zgoda”. Eksport zawiera indywidualne linki do wypisania się.</p>
          {contacts.length === 0 ? <p className="rounded-xl bg-white p-6">Tutaj pojawią się osoby, które potwierdzą dostęp z wiadomości.</p> : (
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Kontakty z biblioteki materiałów</caption>
                <thead className="bg-slate-50"><tr>
                  <th scope="col" className="p-4">Adres e-mail</th><th scope="col" className="p-4">Język</th>
                  <th scope="col" className="p-4">Potwierdzony dostęp</th><th scope="col" className="p-4">Newsletter</th>
                </tr></thead>
                <tbody>{contacts.map(contact => (
                  <tr key={contact.id} className="border-t">
                    <td className="p-4">{contact.email}</td><td className="p-4">{contact.locale.toUpperCase()}</td>
                    <td className="p-4">{new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'Europe/Warsaw' }).format(new Date(contact.first_verified_at))}</td>
                    <td className="p-4">{hasMaterialNewsletterConsent(contact) ? 'Aktywna zgoda' : contact.newsletter_unsubscribed_at ? 'Wypisano' : 'Dostęp do materiałów'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <nav aria-label="Strony kontaktów" className="mt-6 flex gap-6">
            {page > 1 && <Link className="text-blue-800 underline" href={`?page=${page - 1}`}>Poprzednia</Link>}
            {count !== null && page * PAGE_SIZE < count && <Link className="text-blue-800 underline" href={`?page=${page + 1}`}>Następna</Link>}
          </nav>
        </>
      )}
    </div>
  )
}
