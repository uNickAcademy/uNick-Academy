import { NextResponse } from 'next/server'

// Status konfiguracji integracji — wyłącznie wartości tak/nie, żadnych sekretów.
// Pozwala szybko sprawdzić po wdrożeniu, które klucze są ustawione.
export async function GET() {
  return NextResponse.json({
    ok: true,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    resend: !!process.env.RESEND_API_KEY,
    whatsapp: !!(process.env.WHATSAPP_WEBHOOK_URL || process.env.ZAPIER_WHATSAPP_WEBHOOK_URL),
    nipLookup: true, // biała lista MF – działa bez klucza
    gusEnrichment: !!process.env.GUS_API_KEY, // opcjonalne, bogatszy adres
    cron: !!process.env.CRON_SECRET,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    aiCfo: !!process.env.ANTHROPIC_API_KEY,
  })
}
