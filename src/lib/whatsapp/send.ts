// Wysyłka WhatsApp przez Zapier: nasza aplikacja woła webhook ("Webhooks by Zapier: Catch Hook"),
// który w Zapie jest podłączony do akcji "WhatsApp Business: Send Message". Zapier nie udostępnia
// tworzenia/zarządzania grupami WhatsApp (to ograniczenie samego Meta Business API, nie Zapiera),
// więc "lekcja grupowa" = wiadomość wysłana indywidualnie do każdego uczestnika + prowadzącego.

const WEBHOOK_URL_ENV = 'ZAPIER_WHATSAPP_WEBHOOK_URL'

export function isWhatsAppConfigured() {
  return !!process.env[WEBHOOK_URL_ENV]
}

export type WhatsAppRecipient = { phone: string; name: string }

async function sendOne(phone: string, message: string): Promise<boolean> {
  const url = process.env[WEBHOOK_URL_ENV]
  if (!url) {
    console.warn('[WhatsApp] Brak ZAPIER_WHATSAPP_WEBHOOK_URL — pomijam wysyłkę.')
    return false
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, message }),
    })
    return res.ok
  } catch (err) {
    console.error(`[WhatsApp] Błąd wysyłki do ${phone}:`, err)
    return false
  }
}

// Wysyłka masowa (fan-out) — każdy odbiorca dostaje osobną wiadomość 1:1,
// ponieważ WhatsApp Business API nie obsługuje grupowych wątków.
export async function sendBulkWhatsApp(
  recipients: WhatsAppRecipient[],
  message: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  for (const r of recipients) {
    if (!r.phone) continue
    const personalized = `Cześć ${r.name || ''}!\n\n${message}`.trim()
    const ok = await sendOne(r.phone, personalized)
    if (ok) sent++
    else failed++
  }
  return { sent, failed }
}
