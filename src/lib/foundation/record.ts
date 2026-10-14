import type {FoundationInterestDeclaration} from './validation'

export const FOUNDATION_RECORD_SCHEMA = 'kreatorzy-2026-10'

export type FoundationRecordDetails = {
  birthDate: string
  residenceConfirmed: boolean
  notes: string | null
}

export function toFoundationRecord(data: FoundationInterestDeclaration) {
  const details: FoundationRecordDetails & {schema: string} = {
    schema: FOUNDATION_RECORD_SCHEMA,
    birthDate: data.birthDate,
    residenceConfirmed: data.residenceConfirmed,
    notes: data.organizationalNeeds,
  }

  return {
    respondent_type: data.respondentType,
    participant_first_name: data.participantFirstName,
    participant_age: data.participantAge,
    municipality: data.municipality,
    locality: data.municipality,
    activities: data.activities,
    primary_activity: data.primaryActivity,
    attendance_commitment: 'not_collected',
    available_days: data.availableDays,
    earliest_start: data.timeSlots.join(', '),
    preferred_locations: [data.municipality],
    primary_location: data.municipality,
    travel_flexibility: 'not_collected',
    alternative_locations: [],
    transport_barrier: 'not_collected',
    english_comfort: 'not_collected',
    motivations: [],
    motivation_other: null,
    organizational_needs: JSON.stringify(details),
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    preferred_contact: 'not_collected',
    consent_declaration: true,
    consent_contact: true,
    privacy_acknowledged: true,
    consent_version: data.consentVersion,
    privacy_notice_version: data.privacyNoticeVersion,
  }
}

export function readFoundationDetails(value: unknown): FoundationRecordDetails {
  const legacyNotes = typeof value === 'string' && value.trim() ? value.trim() : null
  if (!legacyNotes) return {birthDate: '', residenceConfirmed: false, notes: null}

  try {
    const parsed = JSON.parse(legacyNotes) as Record<string, unknown>
    if (parsed.schema !== FOUNDATION_RECORD_SCHEMA) {
      return {birthDate: '', residenceConfirmed: false, notes: legacyNotes}
    }
    return {
      birthDate: typeof parsed.birthDate === 'string' ? parsed.birthDate : '',
      residenceConfirmed: parsed.residenceConfirmed === true,
      notes: typeof parsed.notes === 'string' && parsed.notes.trim() ? parsed.notes.trim() : null,
    }
  } catch {
    return {birthDate: '', residenceConfirmed: false, notes: legacyNotes}
  }
}
