import type {FoundationInterestDeclaration} from './validation'
import type {FoundationGroupSelection} from './groups'

export const FOUNDATION_RECORD_SCHEMA = 'kreatorzy-2026-10-v2'
const LEGACY_FOUNDATION_RECORD_SCHEMA = 'kreatorzy-2026-10'

export type FoundationRecordDetails = {
  birthDate: string
  residenceConfirmed: boolean
  notes: string | null
  selectedGroups: FoundationGroupSelection[]
  primaryGroup: string | null
}

export function toFoundationRecord(data: FoundationInterestDeclaration) {
  const details: FoundationRecordDetails & {schema: string} = {
    schema: FOUNDATION_RECORD_SCHEMA,
    birthDate: data.birthDate,
    residenceConfirmed: data.residenceConfirmed,
    notes: data.organizationalNeeds,
    selectedGroups: data.selectedGroups,
    primaryGroup: data.primaryGroup,
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
    preferred_locations: data.selectedGroups.length
      ? [...new Set(data.selectedGroups.map(group => group.municipality))]
      : [data.courseMunicipality],
    primary_location: data.courseMunicipality,
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
  const fallback = {birthDate: '', residenceConfirmed: false, notes: legacyNotes, selectedGroups: [], primaryGroup: null}
  if (!legacyNotes) return fallback

  try {
    const parsed = JSON.parse(legacyNotes) as Record<string, unknown>
    if (parsed.schema !== FOUNDATION_RECORD_SCHEMA && parsed.schema !== LEGACY_FOUNDATION_RECORD_SCHEMA) {
      return fallback
    }
    const selectedGroups = Array.isArray(parsed.selectedGroups)
      ? parsed.selectedGroups.filter((group): group is FoundationGroupSelection =>
        group != null && typeof group === 'object'
        && typeof group.id === 'string' && typeof group.activity === 'string'
        && typeof group.municipality === 'string' && typeof group.label === 'string')
      : []
    return {
      birthDate: typeof parsed.birthDate === 'string' ? parsed.birthDate : '',
      residenceConfirmed: parsed.residenceConfirmed === true,
      notes: typeof parsed.notes === 'string' && parsed.notes.trim() ? parsed.notes.trim() : null,
      selectedGroups,
      primaryGroup: typeof parsed.primaryGroup === 'string' && selectedGroups.some(group => group.id === parsed.primaryGroup)
        ? parsed.primaryGroup : null,
    }
  } catch {
    return fallback
  }
}
