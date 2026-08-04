import {NextRequest, NextResponse} from 'next/server'
import {
  activityLabel,
  buildTeenageTalkStatistics,
  type FoundationStatisticsRow,
} from '@/lib/foundation/statistics'
import {createClient} from '@/lib/supabase/server'

type FoundationExportRow = FoundationStatisticsRow & Record<string, unknown> & {
  activities?: string[] | null
  primary_activity?: string | null
}

const cell = (value: unknown) => {
  let text = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

const csvRow = (values: unknown[]) => values.map(cell).join(';')

export async function GET(request: NextRequest) {
  const db = await createClient()
  const {data: {user}} = await db.auth.getUser()
  if (!user) return NextResponse.json({error: 'Brak autoryzacji'}, {status: 401})

  const {data: profile} = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({error: 'Brak uprawnień'}, {status: 403})
  if (request.nextUrl.searchParams.get('format') !== 'csv') {
    return NextResponse.json({error: 'Nieobsługiwany format'}, {status: 400})
  }

  const {data, error} = await db
    .from('foundation_interest_declarations')
    .select('*')
    .order('created_at', {ascending: false})
  if (error) return NextResponse.json({error: 'Błąd eksportu'}, {status: 500})

  const rows = (data ?? []) as FoundationExportRow[]
  const statistics = buildTeenageTalkStatistics(rows)
  const lines: string[] = [
    csvRow(['STATYSTYKI TEENAGE TALK']),
    csvRow(['metryka', 'wartość']),
    csvRow(['wszystkie deklaracje zainteresowania', statistics.totalInterest]),
    csvRow(['Teenage Talk jako pierwszy wybór', statistics.firstChoice]),
    csvRow(['orientacyjna liczba grup (maks. 16 osób)', statistics.estimatedGroups]),
    '',
    csvRow(['ZAINTERESOWANIE WEDŁUG LOKALIZACJI']),
    csvRow(['lokalizacja', 'deklaracje', 'orientacyjna liczba grup']),
    ...statistics.locations.map(item => csvRow([item.label, item.count, item.estimatedGroups ?? 0])),
    '',
    csvRow(['ZAINTERESOWANIE WEDŁUG WIEKU']),
    csvRow(['wiek', 'deklaracje']),
    ...statistics.ages.map(item => csvRow([item.label, item.count])),
    '',
    csvRow(['DOSTĘPNOŚĆ WEDŁUG DNI']),
    csvRow(['dzień', 'deklaracje']),
    ...statistics.days.map(item => csvRow([item.label, item.count])),
    '',
    csvRow(['DOSTĘPNOŚĆ WEDŁUG GODZINY']),
    csvRow(['najwcześniejsza godzina', 'deklaracje']),
    ...statistics.earliestStarts.map(item => csvRow([item.label, item.count])),
    '',
    csvRow(['WSZYSTKIE DEKLARACJE']),
  ]

  const columns = [
    'created_at', 'status', 'respondent_type', 'participant_first_name',
    'participant_age', 'municipality', 'locality', 'activities', 'activities_labels',
    'primary_activity', 'primary_activity_label', 'attendance_commitment',
    'available_days', 'earliest_start', 'preferred_locations', 'primary_location',
    'travel_flexibility', 'alternative_locations', 'transport_barrier',
    'english_comfort', 'motivations', 'motivation_other', 'organizational_needs',
    'contact_name', 'email', 'phone', 'preferred_contact', 'consent_version',
    'privacy_notice_version', 'consented_at',
  ]

  const exportRows: Record<string, unknown>[] = rows.map(row => ({
    ...row,
    activities_labels: row.activities?.map(activityLabel) ?? [],
    primary_activity_label: row.primary_activity ? activityLabel(row.primary_activity) : '',
  }))

  lines.push(
    csvRow(columns),
    ...exportRows.map(row => csvRow(columns.map(column => row[column]))),
  )

  return new Response(`\uFEFF${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kreatorzy-przyszlosci.csv"',
      'Cache-Control': 'private, no-store',
    },
  })
}
