import {NextRequest, NextResponse} from 'next/server'
import {validateFoundationInterest} from '@/lib/foundation/validation'
import {createAdminClient} from '@/lib/supabase/server'
import {notifyFoundationEmail, sendFoundationInterestConfirmation} from '@/lib/email/send'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > 50000) {
    return NextResponse.json({error: 'Formularz jest zbyt duży.'}, {status: 413})
  }
  const origin = request.headers.get('origin')
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) {
    return NextResponse.json({error: 'Nie można wysłać formularza z tej strony.'}, {status: 403})
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Nieprawidłowe dane.'}, {status: 400})
  }

  const validation = validateFoundationInterest(body)
  if (!validation.ok) return NextResponse.json({errors: validation.errors}, {status: 400})

  const data = validation.data
  const database = createAdminClient()
  const {data: declaration, error} = await database.from('foundation_interest_declarations').insert({
    respondent_type: data.respondentType,
    participant_first_name: data.participantFirstName,
    participant_age: data.participantAge,
    // Kept only for compatibility with the existing production schema. These
    // legacy fields are no longer collected or displayed by the survey.
    municipality: 'other',
    locality: data.locality,
    activities: data.activities,
    primary_activity: data.primaryActivity,
    attendance_commitment: data.attendanceCommitment,
    available_days: ['monday'],
    earliest_start: 'not_collected',
    preferred_locations: data.preferredLocations,
    primary_location: data.primaryLocation,
    travel_flexibility: 'not_collected',
    alternative_locations: [],
    transport_barrier: 'not_collected',
    english_comfort: 'not_collected',
    motivations: data.motivations,
    motivation_other: data.motivationOther,
    organizational_needs: data.organizationalNeeds,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    preferred_contact: 'not_collected',
    consent_declaration: true,
    consent_contact: true,
    privacy_acknowledged: true,
    consent_version: data.consentVersion,
    privacy_notice_version: data.privacyNoticeVersion,
  }).select('id').single()

  if (error || !declaration) {
    console.error('[Foundation]', error)
    return NextResponse.json({error: 'Nie udało się zapisać deklaracji.'}, {status: 500})
  }

  await Promise.all([
    sendFoundationInterestConfirmation(data.email, {
      contactName: data.contactName as string,
      participantFirstName: data.participantFirstName as string,
    }),
    notifyFoundationEmail({
      title: `Nowa deklaracja: ${data.participantFirstName}, ${data.participantAge} lat`,
      lines: [`Miejscowość: ${data.locality}`, `Kontakt: ${data.contactName}, ${data.email}, ${data.phone}`],
    }),
  ])

  return NextResponse.json({success: true, id: declaration.id}, {status: 201})
}
