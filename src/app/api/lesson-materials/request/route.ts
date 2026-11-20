import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { materialsCopy } from '@/lib/lesson-materials/copy'
import { materialRequestTopic } from '@/lib/lesson-materials/catalogue'
import { isEmailConfigured, sendAuthActionEmail } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/server'
import {
  createAccessToken, hashAccessToken, hashRequestClient, materialsActionUrl, NEWSLETTER_CONSENT_VERSION,
} from '@/lib/lesson-materials/access'

const accessRequest = z.object({
  email: z.string().trim().max(254).email().transform(email => email.toLowerCase()),
  locale: z.enum(['pl', 'en']),
  topic: z.string().max(48).optional(),
  newsletter: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  const input = accessRequest.safeParse(await request.json().catch(() => null))
  if (!input.success) return NextResponse.json({ code: 'invalid' }, { status: 400 })
  if (!isEmailConfigured()) return NextResponse.json({ code: 'unavailable' }, { status: 503 })

  const { email, locale, topic, newsletter } = input.data
  const requestedTopic = materialRequestTopic(topic)
  const token = createAccessToken()
  const tokenHash = hashAccessToken(token)
  const admin = createAdminClient()
  const client = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const { data: reserved, error } = await admin.rpc('request_lesson_material_access', {
    requested_email: email,
    request_hash: tokenHash,
    requester_hash: hashRequestClient(client.split(',')[0].trim()),
    request_locale: locale,
    request_topic: requestedTopic,
    request_consent_version: newsletter ? NEWSLETTER_CONSENT_VERSION : null,
  })
  if (error) {
    console.error('Lesson materials request could not be stored', error.code)
    return NextResponse.json({ code: 'unavailable' }, { status: 503 })
  }
  if (!reserved) return NextResponse.json({ code: 'wait' }, { status: 429 })

  const url = materialsActionUrl('confirm', locale, token)
  const pl = locale === 'pl'
  const subject = pl ? 'Twój link do materiałów uNick Academy' : 'Your uNick Academy materials link'
  const label = newsletter
    ? (pl ? 'Potwierdź dostęp i newsletter' : 'Confirm access and newsletter')
    : (pl ? 'Przejdź do materiałów' : 'Go to lesson materials')
  const newsletterNotice = newsletter
    ? (pl
      ? 'W formularzu zaznaczono również dobrowolną zgodę na newsletter. Używając przycisku, potwierdzasz tę zgodę. ' + materialsCopy.pl.newsletter
      : 'Optional newsletter consent was also selected on the form. By using the button, you confirm that consent. ' + materialsCopy.en.newsletter)
    : ''
  const description = pl
    ? 'Otwórz link i potwierdź dostęp do fiszek oraz 100 kart do rozmowy online i do druku. Link jest ważny 30 minut.'
    : 'Open the link and confirm access to the flashcards and 100 conversation cards, online and in print. The link expires in 30 minutes.'
  const footer = pl
    ? 'Wiadomość wysłana w odpowiedzi na prośbę o dostęp do materiałów.'
    : 'This email was sent in response to a request for access to lesson materials.'
  try {
    await sendAuthActionEmail({
      to: email,
      subject,
      html: `<div style="font:16px system-ui,sans-serif;color:#192847"><h1>${subject}</h1><p>${description}</p>${newsletterNotice ? `<p>${newsletterNotice}</p>` : ''}<p><a href="${url}">${label}</a></p><p>${footer}</p></div>`,
      text: `${description}\n\n${newsletterNotice}\n\n${url}\n\n${footer}`,
    }, `lesson-materials-${tokenHash}`)
  } catch {
    // Retain the reservation only as a throttle if delivery is ambiguous.
    console.error('Lesson materials email could not be sent')
    return NextResponse.json({ code: 'unavailable' }, { status: 503 })
  }
  return NextResponse.json({ code: 'sent' })
}
