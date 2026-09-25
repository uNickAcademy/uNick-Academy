import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BALL, PAYMENT, transferTitle } from '@/lib/ball/event'
import { BallStatus } from './BallStatus'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  created_at: string
  reference: string
  status: 'awaiting_payment' | 'paid' | 'cancelled'
  single_tickets: number
  couple_tickets: number
  seats: number
  amount_pln: number
  guests: string[]
  contact_name: string
  email: string
  phone: string
  table_request: string | null
  dietary_notes: string | null
  paid_at: string | null
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
    .from('ball_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as Row[]
  const live = rows.filter((r) => r.status !== 'cancelled')
  const paid = live.filter((r) => r.status === 'paid')
  const awaiting = live.filter((r) => r.status === 'awaiting_payment')

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase text-amber-700">uNick Academy Foundation</p>
        <h1 className="text-2xl font-black">{BALL.name}</h1>
        <p className="text-gray-500">
          {BALL.dateLabel}, {BALL.venue}, {BALL.city}. Zgłoszenie to rezerwacja — udział
          potwierdza dopiero wpłata na rachunek Fundacji.
        </p>
      </header>

      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Nie udało się pobrać zgłoszeń. Odśwież stronę lub spróbuj ponownie później.
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Tile tone="green" label="Miejsca opłacone"
          value={String(paid.reduce((a, r) => a + r.seats, 0))}
          note={`${paid.reduce((a, r) => a + r.amount_pln, 0)} zł na rachunku`} />
        <Tile tone="amber" label="Miejsca zarezerwowane"
          value={String(awaiting.reduce((a, r) => a + r.seats, 0))}
          note={`${awaiting.reduce((a, r) => a + r.amount_pln, 0)} zł czeka na wpłatę`} />
        <Tile tone="dark" label="Zgłoszenia" value={String(live.length)}
          note={`${rows.length - live.length} anulowanych`} />
      </div>

      <section aria-labelledby="ball-list">
        <h2 id="ball-list" className="mb-4 text-xl font-black text-gray-900">Zgłoszenia</h2>

        {rows.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-gray-500">
            Brak zgłoszeń. Formularz działa pod{' '}
            <span className="font-mono text-sm">/pl/foundation#bal</span>.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <details key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <summary className="cursor-pointer font-bold">
                  <span className="font-mono">{r.reference}</span> · {r.contact_name} ·{' '}
                  {r.seats} {r.seats === 1 ? 'miejsce' : 'miejsca'} · {r.amount_pln} zł
                  <span className="ml-2 font-normal text-gray-400">{fmt(r.created_at)}</span>
                </summary>

                <div className="mt-4 space-y-4 text-sm">
                  <BallStatus id={r.id} status={r.status} />

                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div><dt className="text-gray-500">Kontakt</dt>
                      <dd className="font-medium">
                        <a href={`mailto:${r.email}`} className="text-[#23479E] hover:underline">{r.email}</a>
                        {' · '}
                        <a href={`tel:${r.phone}`} className="text-[#23479E] hover:underline">{r.phone}</a>
                      </dd></div>
                    <div><dt className="text-gray-500">Bilety</dt>
                      <dd className="font-medium">
                        {r.single_tickets > 0 && `${r.single_tickets} × pojedynczy`}
                        {r.single_tickets > 0 && r.couple_tickets > 0 && ', '}
                        {r.couple_tickets > 0 && `${r.couple_tickets} × para`}
                      </dd></div>
                    <div className="sm:col-span-2"><dt className="text-gray-500">Goście</dt>
                      <dd className="font-medium">{r.guests.join(', ')}</dd></div>
                    {r.table_request && (
                      <div className="sm:col-span-2"><dt className="text-gray-500">Prośba o stolik</dt>
                        <dd>{r.table_request}</dd></div>
                    )}
                    {r.dietary_notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-gray-500">Potrzeby żywieniowe</dt>
                        <dd className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
                          {r.dietary_notes}
                          <span className="mt-1 block text-xs text-amber-700">
                            Dane dotyczące zdrowia — przekazujemy je wyłącznie hotelowi.
                          </span>
                        </dd>
                      </div>
                    )}
                    {r.paid_at && (
                      <div><dt className="text-gray-500">Zaksięgowano</dt>
                        <dd className="font-medium">{fmt(r.paid_at)}</dd></div>
                    )}
                  </dl>

                  <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                    <span className="font-semibold">Tytuł przelewu do sprawdzenia:</span>{' '}
                    {transferTitle(r.reference, r.contact_name)}
                    <br />
                    <span className="font-semibold">Rachunek:</span> {PAYMENT.iban}
                  </p>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
