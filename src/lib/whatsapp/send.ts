// Wysyłka WhatsApp przez webhook: aplikacja woła skonfigurowany URL żądaniem POST
// z ciałem JSON { to, message }. Po drugiej stronie może stać dowolny mostek
// (Make.com, Pipedream, Zapier, n8n…) podłączony do akcji "WhatsApp: Send Message".
// WhatsApp Business API nie obsługuje wątków grupowych (ograniczenie Meta), więc
// "lekcja grupowa" = osobna wiadomość 1:1 do każdego uczestnika + prowadzącego.
//
// Akceptujemy obie nazwy zmiennej (nowa, neutralna + starsza zapierowa) dla zgodności.
function getWebhookUrl(): string | undefined {
  return process.env.WHATSAPP_WEBHOOK_URL || process.env.ZAPIER_WHATSAPP_WEBHOOK_URL
}

export function isWhatsAppConfigured() {
  return !!getWebhookUrl()
}

export type WhatsAppRecipient = { phone: string; name: string }

async function sendOne(phone: string, message: string): Promise<boolean> {
  const url = getWebhookUrl()
  if (!url) {
    console.warn('[WhatsApp] Brak WHATSAPP_WEBHOOK_URL — pomijam wysyłkę.')
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
