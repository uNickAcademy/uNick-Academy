import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AvailabilityInboxView, type AvailabilityRow } from './AvailabilityInboxView'

// TYMCZASOWE (nabór wrzesień 2026) — zgłoszenia z /pl/dostepnosc. Usuń razem
// z resztą naboru, patrz docs/FORMULARZ-DOSTEPNOSCI.md.

export const dynamic = 'force-dynamic'

export default async function Page() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) redirect('/admin/dashboard')

  const { data, error } = await db
    .from('availability_declarations')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as AvailabilityRow[]
  const newCount = rows.filter((r) => r.status === 'new').length

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <header className="mb-6 md:flex md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#23479E]">Nabór wrzesień 2026</p>
          <h1 className="text-2xl font-black">Dostępność na nowy rok szkolny</h1>
          <p className="text-gray-500">
            Zgłoszenia z formularza <code className="text-xs">/pl/dostepnosc</code> — {rows.length} łącznie
            {newCount > 0 && `, ${newCount} nowych`}.
          </p>
        </div>
        <Link prefetch={false} href="/api/admin/availability?format=csv" className="mt-3 inline-block rounded-xl bg-gray-900 px-4 py-2 text-white">
          Eksportuj CSV
        </Link>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Nie udało się pobrać zgłoszeń. Odśwież stronę lub spróbuj ponownie później.
        </p>
      )}

      <AvailabilityInboxView rows={rows} />
    </div>
  )
}
