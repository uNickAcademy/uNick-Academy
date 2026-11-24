import * as O from '../foundation/options'
import {foundationGroupOptions, type FoundationGroupSelection} from '../foundation/groups'
import {normalizePolishPhone} from '../foundation/validation'
import {WINTER} from './event'

export type WinterRegistration = {
  participantName: string
  birthDate: string
  participantAge: number
  municipality: string
  residenceConfirmed: true
  regularParticipant: boolean
  regularGroups: FoundationGroupSelection[]
  attendanceDeclaration: true
  rulesAccepted: true
  specialNeeds: string | null
  contactName: string
  email: string
  phone: string
  consentContact: true
  privacyAcknowledged: true
  consentVersion: string
}

type Result =
  | {ok: true; data: WinterRegistration}
  | {ok: false; errors: Record<string, string>}

const text = (value: unknown, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const words = (value: string) => value.split(/\s+/).filter(Boolean).length

export function validateWinterRegistration(input: unknown): Result {
  const values = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  // Zbyt szybkie lub bardzo stare wysłanie to zwykle bot. Ukrytego pola
  // pułapki nie używamy: autouzupełnianie przeglądarek blokowało nim ludzi.
  const startedAt = Number(values.startedAt)
  if (!startedAt || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86_400_000) {
    errors.form = 'Odśwież stronę i spróbuj ponownie.'
  }

  const participantName = text(values.participantName, 120)
  const birthDate = text(values.birthDate, 10)
  const participantAge = O.calculateAgeOnDate(birthDate)
  const municipality = text(values.municipality)

  if (words(participantName) < 2) errors.participantName = 'Podaj imię i nazwisko uczestnika.'
  if (participantAge == null || participantAge < 10 || participantAge > 18) {
    errors.birthDate = 'Uczestnik powinien mieć od 10 do 18 lat.'
  }
  if (!O.optionValues(O.municipalityOptions).includes(municipality)) {
    errors.municipality = 'Wybierz gminę zamieszkania.'
  }
  if (values.residenceConfirmed !== true) {
    errors.residenceConfirmed = 'Potwierdź zamieszkanie w wybranej gminie.'
  }

  const regularParticipant = values.regularParticipant === true
  if (typeof values.regularParticipant !== 'boolean') {
    errors.regularParticipant = 'Wybierz jedną odpowiedź.'
  }

  const groupIds = Array.isArray(values.regularGroups)
    ? [...new Set(values.regularGroups.filter((item): item is string => typeof item === 'string'))]
    : []
  const regularGroups = foundationGroupOptions.filter(group => groupIds.includes(group.id))
  if (regularParticipant) {
    const invalid = !regularGroups.length
      || regularGroups.length !== groupIds.length
      || regularGroups.some(group => participantAge == null || participantAge < group.minAge || participantAge > group.maxAge)
    if (invalid) errors.regularGroups = 'Zaznacz grupę lub grupy odpowiednie dla wieku uczestnika.'
  }

  if (values.attendanceDeclaration !== true) {
    errors.attendanceDeclaration = 'Deklaracja regularnego udziału jest wymagana.'
  }
  if (values.rulesAccepted !== true) errors.rulesAccepted = 'Akceptacja zasad projektu jest wymagana.'

  const specialNeeds = text(values.specialNeeds, 1500) || null
  const contactName = text(values.contactName, 120)
  const email = text(values.email, 254).toLowerCase()
  const phone = normalizePolishPhone(values.phone)
  if (words(contactName) < 2) errors.contactName = 'Podaj imię i nazwisko rodzica, opiekuna lub pełnoletniego uczestnika.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Podaj poprawny adres e-mail.'
  if (!phone) errors.phone = 'Podaj polski numer telefonu.'

  if (values.consentContact !== true) errors.consentContact = 'Zgoda na kontakt jest wymagana.'
  if (values.privacyAcknowledged !== true) errors.privacyAcknowledged = 'Zgoda na przetwarzanie danych jest wymagana.'

  if (Object.keys(errors).length || participantAge == null) return {ok: false, errors}

  return {
    ok: true,
    data: {
      participantName,
      birthDate,
      participantAge,
      municipality,
      residenceConfirmed: true,
      regularParticipant,
      regularGroups: regularParticipant ? regularGroups.map(group => group.selection) : [],
      attendanceDeclaration: true,
      rulesAccepted: true,
      specialNeeds,
      contactName,
      email,
      phone: phone!,
      consentContact: true,
      privacyAcknowledged: true,
      consentVersion: WINTER.consentVersion,
    },
  }
}

export function toWinterRecord(data: WinterRegistration) {
  return {
    participant_name: data.participantName,
    birth_date: data.birthDate,
    participant_age: data.participantAge,
    municipality: data.municipality,
    residence_confirmed: true,
    regular_participant: data.regularParticipant,
    regular_groups: data.regularGroups,
    attendance_declaration: true,
    rules_accepted: true,
    special_needs: data.specialNeeds,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    consent_contact: true,
    privacy_acknowledged: true,
    consent_version: data.consentVersion,
  }
}
