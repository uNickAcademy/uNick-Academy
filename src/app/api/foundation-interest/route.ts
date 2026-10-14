import {NextRequest, NextResponse} from 'next/server'
import {validateFoundationInterest} from '@/lib/foundation/validation'
import {toFoundationRecord} from '@/lib/foundation/record'
import {locationLabel} from '@/lib/foundation/statistics'
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
  const {data: declaration, error} = await database
    .from('foundation_interest_declarations')
    .insert(toFoundationRecord(data))
    .select('id')
    .single()

  if (error || !declaration) {
    console.error('[Foundation] Zapis nie powiódł się', error?.code)
    return NextResponse.json({error: 'Nie udało się zapisać deklaracji.'}, {status: 500})
  }

  await Promise.all([
    sendFoundationInterestConfirmation(data.email, {
      contactName: data.contactName as string,
      participantFirstName: data.participantFirstName as string,
    }),
    notifyFoundationEmail({
      title: `Nowa deklaracja: ${data.participantFirstName}, ${data.participantAge} lat`,
      lines: [`Gmina: ${locationLabel(data.municipality)}`, `Kontakt: ${data.contactName}, ${data.email}, ${data.phone}`],
    }),
  ])

  return NextResponse.json({success: true, id: declaration.id}, {status: 201})
}
