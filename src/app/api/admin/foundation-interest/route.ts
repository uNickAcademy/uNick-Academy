import {NextRequest, NextResponse} from 'next/server'
import {
  activityLabel,
  buildFoundationStatistics,
  MAX_FOUNDATION_GROUP_SIZE,
  type FoundationStatisticsRow,
} from '@/lib/foundation/statistics'
import {createClient} from '@/lib/supabase/server'
import {readFoundationDetails} from '@/lib/foundation/record'
import {listFoundationDeclarations} from '@/lib/foundation/declarations'

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

  const {data, error} = await listFoundationDeclarations(db)
  if (error) return NextResponse.json({error: 'Błąd eksportu'}, {status: 500})

  const rows = (data ?? []) as FoundationExportRow[]
  const statistics = buildFoundationStatistics(rows)
  const lines: string[] = [
    csvRow(['STATYSTYKI WSZYSTKICH ZGŁOSZEŃ']),
    csvRow(['metryka', 'wartość']),
    csvRow(['zgłoszenia łącznie', statistics.totalDeclarations]),
    csvRow(['wskazania zajęć (można wskazać kilka)', statistics.activitySelections]),
    csvRow(['maks. osób w grupie', MAX_FOUNDATION_GROUP_SIZE]),
    '',
    csvRow(['ZAINTERESOWANIE POSZCZEGÓLNYMI ZAJĘCIAMI']),
    csvRow(['zajęcia', 'zgłoszenia zainteresowania', 'pierwszy wybór']),
    ...statistics.courses.map(course => csvRow([course.label, course.count, course.firstChoice])),
    '',
    csvRow(['GMINA ZAMIESZKANIA — WSZYSTKIE ZGŁOSZENIA']),
    csvRow(['gmina', 'zgłoszenia']),
    ...statistics.locations.map(item => csvRow([item.label, item.count])),
    '',
    csvRow(['ZAINTERESOWANIE WEDŁUG WIEKU']),
    csvRow(['wiek', 'deklaracje']),
    ...statistics.ages.map(item => csvRow([item.label, item.count])),
    '',
    csvRow(['WSZYSTKIE DEKLARACJE']),
  ]

  const columns = [
    'created_at', 'status', 'respondent_type', 'participant_first_name',
    'participant_age', 'birth_date', 'municipality', 'primary_location', 'residence_confirmed',
    'activities', 'activities_labels',
    'primary_activity', 'primary_activity_label', 'attendance_commitment',
    'selected_groups', 'selected_groups_labels', 'primary_group', 'primary_group_label',
    'available_days', 'preferred_hours', 'accessibility_notes',
    'contact_name', 'email', 'phone', 'consent_version',
    'privacy_notice_version', 'consented_at',
  ]

  const exportRows: Record<string, unknown>[] = rows.map(row => {
    const details = readFoundationDetails(row.organizational_needs)
    const consentVersion = String(row.consent_version || '')
    return {
      ...row,
      birth_date: details.birthDate,
      residence_confirmed: details.residenceConfirmed ? 'tak' : '',
      activities_labels: row.activities?.map(value => activityLabel(value, consentVersion)) ?? [],
      primary_activity_label: row.primary_activity ? activityLabel(row.primary_activity, consentVersion) : '',
      selected_groups: details.selectedGroups.map(group => group.id),
      selected_groups_labels: details.selectedGroups.map(group => group.label),
      primary_group: details.primaryGroup,
      primary_group_label: details.selectedGroups.find(group => group.id === details.primaryGroup)?.label || '',
      preferred_hours: row.earliest_start,
      accessibility_notes: details.notes,
    }
  })

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
