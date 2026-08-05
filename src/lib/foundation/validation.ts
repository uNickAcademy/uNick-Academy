import * as O from './options'

export type FoundationInterestDeclaration = Record<string, unknown> & {
  phone: string
  email: string
  participantAge: number
  activities: string[]
  preferredLocations: string[]
  motivations: string[]
}

type Result =
  | {ok: true; data: FoundationInterestDeclaration}
  | {ok: false; errors: Record<string, string>}

const stringValue = (value: unknown, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const arrayValue = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()))]
  : []
const validOption = (value: string, options: readonly {value: string}[]) => O.optionValues(options).includes(value)

export function normalizePolishPhone(value: unknown) {
  const cleaned = stringValue(value, 40).replace(/[^0-9+]/g, '').replace(/^0048/, '+48')
  const number = cleaned.startsWith('+48') ? cleaned.slice(3) : cleaned
  return /^\d{9}$/.test(number) ? `+48${number}` : null
}

export function validateFoundationInterest(input: unknown): Result {
  const values = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  if (stringValue(values.website)) errors.form = 'Nie udało się wysłać formularza.'
  const startedAt = Number(values.startedAt)
  if (!startedAt || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86400000) {
    errors.form = 'Odśwież stronę i spróbuj ponownie.'
  }

  const respondentType = stringValue(values.respondentType)
  const participantFirstName = stringValue(values.participantFirstName, 80)
  const participantAge = Number(values.participantAge)
  const locality = stringValue(values.locality, 120)
  if (!validOption(respondentType, O.respondentOptions)) errors.respondentType = 'Wybierz, kto wypełnia formularz.'
  if (!participantFirstName) errors.participantFirstName = 'Podaj imię uczestnika.'
  if (!Number.isInteger(participantAge) || participantAge < 9 || participantAge > 18) errors.participantAge = 'Wybierz wiek od 9 do 18 lat.'
  if (!locality) errors.locality = 'Podaj miejscowość.'

  const activities = arrayValue(values.activities)
  const eligibleActivities = O.activitiesForAge(participantAge).map(option => option.value)
  const primaryActivity = stringValue(values.primaryActivity)
  if (!activities.length || activities.some(value => !eligibleActivities.includes(value as never))) {
    errors.activities = 'Wybierz co najmniej jedne zajęcia zgodne z wiekiem.'
  }
  if (!activities.includes(primaryActivity)) errors.primaryActivity = 'Wybierz pierwszy wybór spośród zaznaczonych zajęć.'

  const attendanceCommitment = stringValue(values.attendanceCommitment)
  if (!validOption(attendanceCommitment, O.attendanceOptions)) errors.attendanceCommitment = 'Wybierz odpowiedź.'

  const preferredLocations = arrayValue(values.preferredLocations)
  const primaryLocation = stringValue(values.primaryLocation)
  if (!preferredLocations.length || preferredLocations.some(value => !validOption(value, O.projectLocationOptions))) {
    errors.preferredLocations = 'Wybierz lokalizację.'
  }
  if (!preferredLocations.includes(primaryLocation)) errors.primaryLocation = 'Wybierz pierwszy wybór spośród lokalizacji.'

  const motivations = arrayValue(values.motivations)
  const motivationOther = stringValue(values.motivationOther, 300) || null
  const organizationalNeeds = stringValue(values.organizationalNeeds, 1500) || null
  if (motivations.some(value => !validOption(value, O.motivationOptions))) errors.motivations = 'Wybierz poprawne odpowiedzi.'
  if (motivations.includes('other') && !motivationOther) errors.motivationOther = 'Napisz, co jeszcze zachęca uczestnika.'

  const contactName = stringValue(values.contactName, 120)
  const email = stringValue(values.email, 254).toLowerCase()
  const phone = normalizePolishPhone(values.phone)
  if (contactName.length < 3) errors.contactName = 'Podaj imię i nazwisko osoby kontaktowej.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Podaj poprawny adres e-mail.'
  if (!phone) errors.phone = 'Podaj polski numer telefonu.'

  if (values.consentDeclaration !== true) errors.consentDeclaration = 'To potwierdzenie jest wymagane.'
  if (values.consentContact !== true) errors.consentContact = 'Zgoda na kontakt jest wymagana.'
  if (values.privacyAcknowledged !== true) errors.privacyAcknowledged = 'Potwierdzenie klauzuli jest wymagane.'
  if (Object.keys(errors).length) return {ok: false, errors}

  return {ok: true, data: {
    respondentType,
    participantFirstName,
    participantAge,
    locality,
    activities,
    primaryActivity,
    attendanceCommitment,
    preferredLocations,
    primaryLocation,
    motivations,
    motivationOther,
    organizationalNeeds,
    contactName,
    email,
    phone: phone!,
    consentDeclaration: true,
    consentContact: true,
    privacyAcknowledged: true,
    consentVersion: O.FOUNDATION_CONSENT_VERSION,
    privacyNoticeVersion: O.FOUNDATION_PRIVACY_NOTICE_VERSION,
  }}
}
