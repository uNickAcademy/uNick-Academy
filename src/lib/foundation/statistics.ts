import {
  activityOptions,
  dayOptions,
  earliestStartOptions,
  projectLocationOptions,
} from './options'

export const TEENAGE_TALK_ACTIVITY_ID = 'teenage_talk'
export const MAX_FOUNDATION_GROUP_SIZE = 16

export type FoundationStatisticsRow = {
  activities?: string[] | null
  primary_activity?: string | null
  participant_age?: number | null
  preferred_locations?: string[] | null
  available_days?: string[] | null
  earliest_start?: string | null
}

export type DistributionItem = {
  value: string
  label: string
  count: number
  estimatedGroups?: number
}

const countGroups = (count: number) =>
  count === 0 ? 0 : Math.ceil(count / MAX_FOUNDATION_GROUP_SIZE)

const labelFor = (options: readonly {value: string; label: string}[], value: string) =>
  options.find(option => option.value === value)?.label ?? value

export const activityLabel = (value: string) => labelFor(activityOptions, value)
export const locationLabel = (value: string) => labelFor(projectLocationOptions, value)
export const dayLabel = (value: string) => labelFor(dayOptions, value)
export const earliestStartLabel = (value: string) => labelFor(earliestStartOptions, value)

export function buildTeenageTalkStatistics(rows: FoundationStatisticsRow[]) {
  const interestedRows = rows.filter(row =>
    row.activities?.includes(TEENAGE_TALK_ACTIVITY_ID),
  )

  const distribution = (
    values: readonly {value: string; label: string}[],
    selected: (row: FoundationStatisticsRow) => string[],
    includeEstimatedGroups = false,
  ): DistributionItem[] => values.map(option => {
    const count = interestedRows.filter(row => selected(row).includes(option.value)).length
    return {
      value: option.value,
      label: option.label,
      count,
      ...(includeEstimatedGroups ? {estimatedGroups: countGroups(count)} : {}),
    }
  })

  const ageOptions = Array.from({length: 6}, (_, index) => {
    const age = index + 13
    return {value: String(age), label: `${age} lat`}
  })

  return {
    totalInterest: interestedRows.length,
    firstChoice: interestedRows.filter(
      row => row.primary_activity === TEENAGE_TALK_ACTIVITY_ID,
    ).length,
    estimatedGroups: countGroups(interestedRows.length),
    locations: distribution(
      projectLocationOptions,
      row => row.preferred_locations ?? [],
      true,
    ),
    ages: distribution(
      ageOptions,
      row => row.participant_age == null ? [] : [String(row.participant_age)],
    ),
    days: distribution(dayOptions, row => row.available_days ?? []),
    earliestStarts: distribution(
      earliestStartOptions,
      row => row.earliest_start ? [row.earliest_start] : [],
    ),
  }
}
