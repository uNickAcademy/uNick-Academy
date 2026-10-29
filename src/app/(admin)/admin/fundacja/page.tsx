import Link from 'next/link'
import {redirect} from 'next/navigation'
import {
  activityLabel,
  buildFoundationStatistics,
  dayLabel,
  type DistributionItem,
  type FoundationStatisticsRow,
  locationLabel,
  MAX_FOUNDATION_GROUP_SIZE,
} from '@/lib/foundation/statistics'
import {createClient} from '@/lib/supabase/server'
import {readFoundationDetails} from '@/lib/foundation/record'
import {listFoundationDeclarations} from '@/lib/foundation/declarations'
import RefreshStatistics from './RefreshStatistics'

export const dynamic = 'force-dynamic'

type FoundationRow = FoundationStatisticsRow & {
  id: string
  status: string
  participant_first_name: string
  participant_age: number
  municipality: string
  locality: string
  contact_name: string
  email: string
  phone: string
  activities: string[]
  preferred_locations: string[]
  available_days?: string[] | null
  earliest_start?: string | null
  organizational_needs?: string | null
  consent_version: string
}

function Distribution({title, items}: {
  title: string
  items: DistributionItem[]
}) {
  return <section className="rounded-2xl border border-gray-200 bg-white p-5">
    <h3 className="mb-4 font-bold text-gray-900">{title}</h3>
    <dl className="space-y-2 text-sm">
      {items.map(item => <div key={item.value} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
        <dt className="text-gray-600">{item.label}</dt>
        <dd className="font-bold text-gray-900">
          {item.count}
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

  const {data, error} = await listFoundationDeclarations(db)

  const rows = (data ?? []) as FoundationRow[]
  const statistics = buildFoundationStatistics(rows)
  const updatedAt = new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date())

  return <div className="mx-auto max-w-6xl p-4 md:p-6">
    <header className="mb-6 md:flex md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase text-teal-700">uNick Academy Foundation</p>
        <h1 className="text-2xl font-black">Kreatorzy Przyszłości</h1>
        <p className="text-gray-500">Zgłoszenia chęci udziału w bezpłatnych zajęciach — nie są leadami sprzedażowymi.</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <RefreshStatistics />
        <Link prefetch={false} href="/api/admin/foundation-interest?format=csv" className="inline-block rounded-xl bg-gray-900 px-4 py-2 text-white">
          Eksportuj CSV ze statystykami
        </Link>
      </div>
    </header>

    {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      Nie udało się pobrać deklaracji. Odśwież stronę lub spróbuj ponownie później.
    </p>}

    {!error && <section aria-labelledby="foundation-statistics" className="mb-8">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase text-teal-700">Statystyki zainteresowania</p>
        <h2 id="foundation-statistics" className="text-xl font-black text-gray-900">Wszystkie zgłoszenia i zajęcia</h2>
        <p className="text-sm text-gray-500">Dane z {updatedAt}. Odświeżanie co minutę i po powrocie do zakładki.</p>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-teal-700 p-5 text-white">
          <p className="text-sm text-teal-100">Zgłoszenia łącznie</p>
          <strong className="text-3xl">{statistics.totalDeclarations}</strong>
        </article>
        <article className="rounded-2xl bg-gray-900 p-5 text-white">
          <p className="text-sm text-gray-300">Wskazania zajęć</p>
          <strong className="text-3xl">{statistics.activitySelections}</strong>
        </article>
        <article className="rounded-2xl bg-amber-100 p-5 text-amber-950">
          <p className="text-sm">Maks. osób w grupie</p>
          <strong className="text-3xl">{MAX_FOUNDATION_GROUP_SIZE}</strong>
        </article>
      </div>

      <p className="mb-4 text-sm text-gray-600">Jedno zgłoszenie może wskazywać kilka zajęć. To deklaracje zainteresowania, a nie potwierdzone miejsca w konkretnych grupach.</p>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.courses.map(course => <article key={course.value} className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-bold text-gray-900">{course.label}</h3>
          <p className="mt-3 text-3xl font-black text-teal-700">{course.count}</p>
          <p className="text-sm text-gray-600">W tym pierwszy wybór: <strong>{course.firstChoice}</strong></p>
        </article>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Distribution title="Gmina zamieszkania — wszystkie zgłoszenia" items={statistics.locations} />
        <Distribution title="Wiek uczestników" items={statistics.ages} />
      </div>
    </section>}

    <section aria-labelledby="foundation-declarations">
      <h2 id="foundation-declarations" className="mb-4 text-xl font-black text-gray-900">Wszystkie deklaracje</h2>
      <div className="space-y-3">
        {error ? <p className="rounded-xl bg-white p-8 text-gray-500">Lista nie jest dostępna. Użyj przycisku „Odśwież dane”.</p> : rows.length === 0
          ? <p className="rounded-xl bg-white p-8 text-gray-500">Brak deklaracji.</p>
          : rows.map((row, index) => {
            const details = readFoundationDetails(row.organizational_needs)
            const residence = row.consent_version >= '2026-10-14'
              ? locationLabel(row.municipality)
              : row.locality
            return <details key={row.id} className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-bold">
              #{index + 1} · {row.participant_first_name}, {row.participant_age} lat · {residence}{' '}
              <span className="text-gray-400">({row.status})</span>
            </summary>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <p><b>Kontakt:</b> {row.contact_name}<br />{row.email}<br />{row.phone}</p>
              <p><b>Zajęcia:</b> {row.activities?.map(value => activityLabel(value, row.consent_version)).join(', ')}<br />
                <b>Gmina:</b> {residence}</p>
              <p><b>Data urodzenia:</b> {details.birthDate || 'brak w starszym zgłoszeniu'}<br />
                <b>Zamieszkanie potwierdzone:</b> {details.residenceConfirmed ? 'tak' : 'brak w starszym zgłoszeniu'}</p>
              <p><b>Dostępność:</b> {row.available_days?.map(dayLabel).join(', ') || '—'}<br />
                <b>Godziny:</b> {row.earliest_start || '—'}</p>
              <p><b>Potrzeby / uwagi:</b> {details.notes || '—'}</p>
            </div>
          </details>
          })}
      </div>
    </section>
  </div>
}
