import * as O from './options'
import {foundationGroupOptions, type FoundationGroupSelection} from './groups'

export type FoundationInterestDeclaration = {
  respondentType: 'parent_guardian'
  participantFirstName: string
  birthDate: string
  participantAge: number
  municipality: string
  courseMunicipality: string
  selectedGroups: FoundationGroupSelection[]
  primaryGroup: string | null
  residenceConfirmed: true
  activities: string[]
  primaryActivity: string
  availableDays: string[]
  timeSlots: string[]
  organizationalNeeds: string | null
  contactName: string
  email: string
  phone: string
  consentDeclaration: true
  consentContact: true
  privacyAcknowledged: true
  consentVersion: string
  privacyNoticeVersion: string
}

type Result =
  | {ok: true; data: FoundationInterestDeclaration}
  | {ok: false; errors: Record<string, string>}

const stringValue = (value: unknown, max = 200) => typeof value === 'string'
  ? value.trim().slice(0, max)
  : ''

const arrayValue = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()))]
  : []

const validOption = (value: string, options: readonly {value: string}[]) =>
  O.optionValues(options).includes(value)

export function normalizePolishPhone(value: unknown) {
  const cleaned = stringValue(value, 40).replace(/[^0-9+]/g, '').replace(/^0048/, '+48')
  const number = cleaned.startsWith('+48') ? cleaned.slice(3) : cleaned
  return /^\d{9}$/.test(number) ? `+48${number}` : null
}

export function validateFoundationInterest(input: unknown): Result {
  const values = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  if (stringValue(values.uniBallPotwierdzenie)) {
    errors.form = 'Nie udało się wysłać formularza. Odśwież stronę i spróbuj ponownie, a jeśli to nie pomoże, napisz na hello@unick-academy.pl.'
  }
  const startedAt = Number(values.startedAt)
  if (!startedAt || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86400000) {
    errors.form = 'Odśwież stronę i spróbuj ponownie.'
  }

  const participantFirstName = stringValue(values.participantFirstName, 80)
  const birthDate = stringValue(values.birthDate, 10)
  const participantAge = O.calculateAgeOnDate(birthDate)
  const municipality = stringValue(values.municipality)
  const usesGroupChoices = values.selectedGroups !== undefined
  const selectedGroupIds = arrayValue(values.selectedGroups)
  const selectedGroups = foundationGroupOptions.filter(group => selectedGroupIds.includes(group.id))
  const primaryGroupId = stringValue(values.primaryGroup)
  const primaryGroup = selectedGroups.find(group => group.id === primaryGroupId)
  // Keep older open forms working without treating their preferences as an
  // explicit choice of a particular group.
  const courseMunicipality = usesGroupChoices
    ? primaryGroup?.municipality ?? ''
    : values.courseMunicipality === undefined ? municipality : stringValue(values.courseMunicipality)

  if (participantFirstName.split(/\s+/).filter(Boolean).length < 2) {
    errors.participantFirstName = 'Podaj imię i nazwisko uczestnika.'
  }
  if (participantAge == null || participantAge < 10 || participantAge > 18) {
    errors.birthDate = 'Uczestnik powinien mieć od 10 do 18 lat.'
  }
  if (!validOption(municipality, O.municipalityOptions)) {
    errors.municipality = 'Wybierz gminę zamieszkania.'
  }
  if (!usesGroupChoices && !validOption(courseMunicipality, O.projectLocationOptions)) {
    errors.courseMunicipality = 'Wybierz gminę, w której mają odbywać się zajęcia.'
  }
  if (values.residenceConfirmed !== true) {
    errors.residenceConfirmed = 'Potwierdź zamieszkanie w wybranej gminie.'
  }

  const activities = usesGroupChoices
    ? [...new Set(selectedGroups.map(group => group.activity))]
    : arrayValue(values.activities)
  const eligibleActivities = participantAge == null
    ? []
    : O.activitiesForParticipant(participantAge, courseMunicipality).map(activity => activity.value)
  const primaryActivity = usesGroupChoices ? primaryGroup?.activity ?? '' : stringValue(values.primaryActivity)
  if (usesGroupChoices && (
    !Array.isArray(values.selectedGroups)
    || values.selectedGroups.some(value => typeof value !== 'string' || !value.trim())
    || !selectedGroups.length || selectedGroups.length !== selectedGroupIds.length
    || selectedGroups.some(group => participantAge == null || participantAge < group.minAge || participantAge > group.maxAge)
  )) {
    errors.selectedGroups = 'Wybierz co najmniej jedną grupę odpowiednią dla wieku uczestnika.'
  }
  if (usesGroupChoices && !primaryGroup) {
    errors.primaryGroup = 'Wybierz pierwszy wybór spośród zaznaczonych grup.'
  }
  if (!usesGroupChoices && (!activities.length || activities.some(value => !eligibleActivities.includes(value as never)))) {
    errors.activities = 'Wybierz co najmniej jedne zajęcia dostępne dla tego wieku w wybranej gminie zajęć.'
  }
  if (!usesGroupChoices && !activities.includes(primaryActivity)) {
    errors.primaryActivity = 'Wybierz pierwszy wybór spośród zaznaczonych zajęć.'
  }

  const availableDays = arrayValue(values.availableDays)
  const timeSlots = arrayValue(values.timeSlots)
  if (!availableDays.length || availableDays.some(value => !validOption(value, O.dayOptions))) {
    errors.availableDays = 'Wybierz co najmniej jeden możliwy dzień.'
  }
  if (!timeSlots.length || timeSlots.some(value => !validOption(value, O.timeSlotOptions))) {
    errors.timeSlots = 'Wybierz co najmniej jeden możliwy przedział godzinowy.'
  }

  const organizationalNeeds = stringValue(values.organizationalNeeds, 1500) || null
  const contactName = stringValue(values.contactName, 120)
  const email = stringValue(values.email, 254).toLowerCase()
  const phone = normalizePolishPhone(values.phone)
  if (contactName.split(/\s+/).filter(Boolean).length < 2) {
    errors.contactName = 'Podaj imię i nazwisko rodzica lub opiekuna.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Podaj poprawny adres e-mail.'
  if (!phone) errors.phone = 'Podaj polski numer telefonu.'

  if (values.consentDeclaration !== true) errors.consentDeclaration = 'To potwierdzenie jest wymagane.'
  if (values.consentContact !== true) errors.consentContact = 'Zgoda na kontakt jest wymagana.'
  if (values.privacyAcknowledged !== true) errors.privacyAcknowledged = 'Zgoda na przetwarzanie danych jest wymagana.'
  if (Object.keys(errors).length || participantAge == null) return {ok: false, errors}

  return {
    ok: true,
    data: {
      respondentType: 'parent_guardian',
      participantFirstName,
      birthDate,
      participantAge,
      municipality,
      courseMunicipality,
      selectedGroups: selectedGroups.map(group => group.selection),
      primaryGroup: primaryGroup?.id ?? null,
      residenceConfirmed: true,
      activities,
      primaryActivity,
      availableDays,
      timeSlots,
      organizationalNeeds,
      contactName,
      email,
      phone: phone!,
      consentDeclaration: true,
      consentContact: true,
      privacyAcknowledged: true,
      consentVersion: O.FOUNDATION_CONSENT_VERSION,
      privacyNoticeVersion: O.FOUNDATION_PRIVACY_NOTICE_VERSION,
    },
  }
}
