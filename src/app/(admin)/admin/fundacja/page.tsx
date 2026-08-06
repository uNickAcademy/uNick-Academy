import Link from 'next/link'
import {redirect} from 'next/navigation'
import {
  activityLabel,
  buildTeenageTalkStatistics,
  type DistributionItem,
  type FoundationStatisticsRow,
  locationLabel,
  MAX_FOUNDATION_GROUP_SIZE,
} from '@/lib/foundation/statistics'
import {createClient} from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type FoundationRow = FoundationStatisticsRow & {
  id: string
  status: string
  participant_first_name: string
  participant_age: number
  locality: string
  contact_name: string
  email: string
  phone: string
  activities: string[]
  preferred_locations: string[]
  available_days?: string[] | null
  earliest_start?: string | null
  organizational_needs?: string | null
}

function Distribution({title, items, showGroups = false}: {
  title: string
  items: DistributionItem[]
  showGroups?: boolean
}) {
  return <section className="rounded-2xl border border-gray-200 bg-white p-5">
    <h3 className="mb-4 font-bold text-gray-900">{title}</h3>
    <dl className="space-y-2 text-sm">
      {items.map(item => <div key={item.value} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
        <dt className="text-gray-600">{item.label}</dt>
        <dd className="font-bold text-gray-900">
          {item.count}
          {showGroups && <span className="ml-2 font-normal text-gray-400">({item.estimatedGroups ?? 0} grup)</span>}
        </dd>
      </div>)}
    </dl>
  </section>
}

export default async function Page() {
  const db = await createClient()
  const {data: {user}} = await db.auth.getUser()
  if (!user) redirect('/login')

  const {data: profile} = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const {data, error} = await db
    .from('foundation_interest_declarations')
    .select('*')
    .order('created_at', {ascending: false})

  const rows = (data ?? []) as FoundationRow[]
  const statistics = buildTeenageTalkStatistics(rows)

  return <div className="mx-auto max-w-6xl p-4 md:p-6">
    <header className="mb-6 md:flex md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase text-teal-700">uNick Academy Foundation</p>
        <h1 className="text-2xl font-black">Kreatorzy Przyszłości</h1>
        <p className="text-gray-500">Wstępne deklaracje — nie są zapisami ani leadami sprzedażowymi.</p>
      </div>
      <Link prefetch={false} href="/api/admin/foundation-interest?format=csv" className="mt-3 inline-block rounded-xl bg-gray-900 px-4 py-2 text-white">
        Eksportuj CSV ze statystykami
      </Link>
    </header>

    {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      Nie udało się pobrać deklaracji. Odśwież stronę lub spróbuj ponownie później.
    </p>}

    <section aria-labelledby="teenage-talk-statistics" className="mb-8">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase text-teal-700">Statystyki zainteresowania</p>
        <h2 id="teenage-talk-statistics" className="text-xl font-black text-gray-900">Teenage Talk</h2>
        <p className="text-sm text-gray-500">Preferencje lokalizacji mogą się nakładać, ponieważ formularz pozwala wybrać kilka odpowiedzi.</p>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-teal-700 p-5 text-white">
          <p className="text-sm text-teal-100">Wszystkie deklaracje</p>
          <strong className="text-3xl">{statistics.totalInterest}</strong>
        </article>
        <article className="rounded-2xl bg-gray-900 p-5 text-white">
          <p className="text-sm text-gray-300">Pierwszy wybór</p>
          <strong className="text-3xl">{statistics.firstChoice}</strong>
        </article>
        <article className="rounded-2xl bg-amber-100 p-5 text-amber-950">
          <p className="text-sm">Orientacyjna liczba grup</p>
          <strong className="text-3xl">{statistics.estimatedGroups}</strong>
          <p className="text-xs">przy maks. {MAX_FOUNDATION_GROUP_SIZE} osobach</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Distribution title="Preferowane lokalizacje" items={statistics.locations} showGroups />
        <Distribution title="Wiek uczestników" items={statistics.ages} />
      </div>
    </section>

    <section aria-labelledby="foundation-declarations">
      <h2 id="foundation-declarations" className="mb-4 text-xl font-black text-gray-900">Wszystkie deklaracje</h2>
      <div className="space-y-3">
        {rows.length === 0
          ? <p className="rounded-xl bg-white p-8 text-gray-500">Brak deklaracji.</p>
          : rows.map(row => <details key={row.id} className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-bold">
              {row.participant_first_name}, {row.participant_age} lat · {row.locality}{' '}
              <span className="text-gray-400">({row.status})</span>
            </summary>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <p><b>Kontakt:</b> {row.contact_name}<br />{row.email}<br />{row.phone}</p>
              <p><b>Zajęcia:</b> {row.activities?.map(activityLabel).join(', ')}<br />
                <b>Lokalizacje:</b> {row.preferred_locations?.map(locationLabel).join(', ')}</p>
              <p><b>Uwagi:</b> {row.organizational_needs || '—'}</p>
            </div>
          </details>)}
      </div>
    </section>
  </div>
}
