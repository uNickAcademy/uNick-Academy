export const FOUNDATION_CONSENT_VERSION = '2026-10-14'
export const FOUNDATION_PRIVACY_NOTICE_VERSION = '2026-10-14'
export const PROJECT_START_DATE = '2026-11-01'

const option = (value: string, label: string) => ({value, label})
export const municipalityOptions = [
  option('tarnowo_podgorne', 'Tarnowo Podgórne'),
  option('rokietnica', 'Rokietnica'),
  option('kazmierz', 'Kaźmierz'),
  option('szamotuly', 'Szamotuły'),
] as const

export type Municipality = typeof municipalityOptions[number]['value']

export const activityOptions = [
  {
    value: 'teenpreneurs',
    label: 'Teenpreneurs, 13–18 lat',
    minAge: 13,
    maxAge: 18,
    municipalities: ['tarnowo_podgorne'],
  },
  {
    value: 'podcasts_audio_video',
    label: 'Podcasts, 10–16 lat',
    minAge: 10,
    maxAge: 16,
    municipalities: ['rokietnica', 'kazmierz', 'szamotuly'],
  },
  {
    value: 'teenage_talk',
    label: 'Teenage Talk, 13–18 lat',
    minAge: 13,
    maxAge: 18,
    municipalities: ['rokietnica', 'kazmierz', 'szamotuly'],
  },
  {
    // The existing database identifier is retained so no production migration
    // is required and historical submissions remain readable.
    value: 'art_performance_9_13',
    label: 'Art & Creative Performance, 10–16 lat',
    minAge: 10,
    maxAge: 16,
    municipalities: ['tarnowo_podgorne'],
  },
] as const satisfies readonly {
  value: string
  label: string
  minAge: number
  maxAge: number
  municipalities: readonly Municipality[]
}[]

export const dayOptions = [
  option('monday', 'poniedziałek'),
  option('tuesday', 'wtorek'),
  option('wednesday', 'środa'),
  option('thursday', 'czwartek'),
  option('friday', 'piątek'),
  option('saturday', 'sobota'),
] as const

export const timeSlotOptions = [
  option('15:00–17:00', '15:00–17:00'),
  option('17:00–19:00', '17:00–19:00'),
  option('19:00–20:30', '19:00–20:30'),
  option('sobota 9:00–12:00', 'sobota 9:00–12:00'),
  option('sobota 12:00–16:00', 'sobota 12:00–16:00'),
] as const

export const projectLocationOptions = municipalityOptions

export function calculateAgeOnDate(birthDate: string, onDate = PROJECT_START_DATE) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !/^\d{4}-\d{2}-\d{2}$/.test(onDate)) return null
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number)
  const [year, month, day] = onDate.split('-').map(Number)
  const parsedBirthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay))
  if (
    parsedBirthDate.getUTCFullYear() !== birthYear
    || parsedBirthDate.getUTCMonth() !== birthMonth - 1
    || parsedBirthDate.getUTCDate() !== birthDay
  ) return null
  if (birthDate > onDate) return null
  return year - birthYear - (month < birthMonth || (month === birthMonth && day < birthDay) ? 1 : 0)
}

export function activitiesForParticipant(age: number, courseMunicipality: string) {
  return activityOptions.filter(activity => {
    const municipalities: readonly string[] = activity.municipalities
    return age >= activity.minAge
      && age <= activity.maxAge
      && municipalities.includes(courseMunicipality)
  })
}

export const optionValues = (options: readonly {value: string}[]) => options.map(item => item.value)
