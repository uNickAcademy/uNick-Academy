import {
  activityOptions,
  projectLocationOptions,
  dayOptions,
} from './options'

export const MAX_FOUNDATION_GROUP_SIZE = 12

export type FoundationStatisticsRow = {
  activities?: string[] | null
  primary_activity?: string | null
  participant_age?: number | null
  preferred_locations?: string[] | null
  available_days?: string[] | null
  earliest_start?: string | null
  consent_version?: string | null
  municipality?: string | null
}

export type DistributionItem = {
  value: string
  label: string
  count: number
}

const labelFor = (options: readonly {value: string; label: string}[], value: string) =>
  options.find(option => option.value === value)?.label ?? value

const historicalActivities: Record<string, string> = {
  teenpreneurs: 'Teenpreneurs, 13–18 lat',
  creative_diy: 'Creative DIY, 10–15 lat',
  podcasts_audio_video: 'Podcasts Creators, 13–18 lat',
  art_performance_9_13: 'Art & Performance, 9–13 lat',
  art_performance_13_18: 'Art & Performance, 13–18 lat',
  teenage_talk: 'Teenage Talk, 13–18 lat',
}

export const activityLabel = (value: string, consentVersion?: string | null) =>
  consentVersion && consentVersion < '2026-10-14'
    ? historicalActivities[value] ?? value
    : labelFor(activityOptions, value)
export const locationLabel = (value: string) => labelFor(projectLocationOptions, value)
export const dayLabel = (value: string) => labelFor(dayOptions, value)
export const earliestStartLabel = (value: string) => value

export function buildFoundationStatistics(rows: FoundationStatisticsRow[]) {
  const distribution = (
    values: readonly {value: string; label: string}[],
    selected: (row: FoundationStatisticsRow) => string | null,
  ): DistributionItem[] => values.map(option => {
    const count = rows.filter(row => selected(row) === option.value).length
    return {
      value: option.value,
      label: option.label,
      count,
    }
  })

  const ageOptions = Array.from({length: 9}, (_, index) => {
    const age = index + 10
    return {value: String(age), label: `${age} lat`}
  })

  const currentActivities = activityOptions.map(activity => activity.value as string)
  const historicalIds = [...new Set(rows.flatMap(row => row.activities ?? []))]
    .filter(value => !currentActivities.includes(value))
  const courses = [...currentActivities, ...historicalIds].map(value => ({
    value,
    label: historicalIds.includes(value) ? historicalActivities[value] ?? value : activityLabel(value),
    count: rows.filter(row => row.activities?.includes(value)).length,
    firstChoice: rows.filter(row => row.primary_activity === value).length,
  }))

  const residence = (row: FoundationStatisticsRow) =>
    projectLocationOptions.some(option => option.value === row.municipality)
      ? row.municipality!
      : 'unknown'

  return {
    totalDeclarations: rows.length,
    activitySelections: courses.reduce((sum, course) => sum + course.count, 0),
    courses,
    locations: distribution(
      [...projectLocationOptions, {value: 'unknown', label: 'Brak danych o gminie'}],
      residence,
    ),
    ages: distribution(
      ageOptions,
      row => row.participant_age == null ? null : String(row.participant_age),
    ),
  }
}
