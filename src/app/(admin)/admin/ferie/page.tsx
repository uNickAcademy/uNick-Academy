import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WINTER } from '@/lib/winter/event'
import { locationLabel } from '@/lib/foundation/statistics'
import { WinterStatus } from './WinterStatus'

export const dynamic = 'force-dynamic'

type Group = { id: string; label: string }

type Row = {
  id: string
  created_at: string
  reference: string
  status: 'new' | 'confirmed' | 'waitlist' | 'cancelled'
  participant_name: string
  birth_date: string
  participant_age: number
  municipality: string
  regular_participant: boolean
  regular_groups: Group[]
  special_needs: string | null
  contact_name: string
  email: string
  phone: string
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw',
  })

function Tile({ label, value, note, tone }: {
  label: string; value: string; note?: string; tone: 'dark' | 'amber' | 'green'
}) {
  const tones = {
    dark: 'bg-gray-900 text-white',
    amber: 'bg-amber-100 text-amber-950',
    green: 'bg-green-700 text-white',
  }
  return (
    <article className={`rounded-2xl p-5 ${tones[tone]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <strong className="text-3xl tabular-nums">{value}</strong>
      {note && <p className="text-xs opacity-70">{note}</p>}
    </article>
  )
}

export default async function Page() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const { data, error } = await db
    .from('winter_week_registrations')
    .select('*')
    .order('created_at', { ascending: true })

  const rows = (data ?? []) as Row[]
  const live = rows.filter((r) => r.status !== 'cancelled')
  const confirmed = live.filter((r) => r.status === 'confirmed')
  const priority = live.filter((r) => r.regular_participant)

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase text-amber-700">uNick Academy Foundation</p>
        <h1 className="text-2xl font-black">{WINTER.name}</h1>
        <p className="text-gray-500">
          {WINTER.dateLabel}, {WINTER.hours}, {WINTER.capacity} miejsc. Zgłoszenie nie gwarantuje
          miejsca, a pierwszeństwo mają osoby z regularnych zajęć.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Nie udało się pobrać zgłoszeń. Odśwież stronę lub spróbuj ponownie później.
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Tile tone="green" label="Miejsca potwierdzone" value={`${confirmed.length} / ${WINTER.capacity}`} />
        <Tile tone="amber" label="Z regularnych zajęć" value={String(priority.length)}
          note="mają pierwszeństwo" />
        <Tile tone="dark" label="Zgłoszenia" value={String(live.length)}
          note={`${rows.length - live.length} anulowanych`} />
      </div>

      <section aria-labelledby="winter-list">
        <h2 id="winter-list" className="mb-4 text-xl font-black text-gray-900">Zgłoszenia</h2>

        {rows.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-gray-500">
            Brak zgłoszeń. Formularz działa pod{' '}
            <span className="font-mono text-sm">{WINTER.path}</span>.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <details key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <summary className="cursor-pointer font-bold">
                  <span className="font-mono">{r.reference}</span> · {r.participant_name} ·{' '}
                  {r.participant_age} lat · {locationLabel(r.municipality)}
                  {r.regular_participant && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                      regularne zajęcia
                    </span>
                  )}
                  <span className="ml-2 font-normal text-gray-400">{fmt(r.created_at)}</span>
                </summary>

                <div className="mt-4 space-y-4 text-sm">
                  <WinterStatus id={r.id} status={r.status} />

                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div><dt className="text-gray-500">Kontakt</dt>
                      <dd className="font-medium">
                        {r.contact_name}{' · '}
                        <a href={`mailto:${r.email}`} className="text-[#23479E] hover:underline">{r.email}</a>
                        {' · '}
                        <a href={`tel:${r.phone}`} className="text-[#23479E] hover:underline">{r.phone}</a>
                      </dd></div>
                    <div><dt className="text-gray-500">Data urodzenia</dt>
                      <dd className="font-medium">{r.birth_date}</dd></div>
                    {r.regular_groups.length > 0 && (
                      <div className="sm:col-span-2"><dt className="text-gray-500">Regularne grupy</dt>
                        <dd className="font-medium">
                          {r.regular_groups.map((g) => g.label.split(' · ')[0]).join('; ')}
                        </dd></div>
                    )}
                    {r.special_needs && (
                      <div className="sm:col-span-2"><dt className="text-gray-500">Szczególne potrzeby</dt>
                        <dd className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
                          {r.special_needs}
                        </dd></div>
                    )}
                  </dl>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
