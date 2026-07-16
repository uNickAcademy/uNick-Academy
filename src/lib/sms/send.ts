// Wysyłka SMS przez SMSAPI.pl (https://www.smsapi.pl) — polski dostawca, prosty
// REST endpoint z tokenem Bearer, bez OAuth. Wystarczy jeden klucz API.
// Konto zakłada się na smsapi.pl, token generuje się w panelu (OAuth → Access Tokens).

const API_URL = 'https://api.smsapi.pl/sms.do'

export function isSmsConfigured() {
  return !!process.env.SMSAPI_TOKEN
}

// Normalizuje numer do formatu, jaki SMSAPI akceptuje najpewniej (z kierunkowym, bez spacji/myślników)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits.slice(1)
  if (digits.length === 9) return `48${digits}` // domyślnie polski numer bez kierunkowego
  return digits
}

async function sendOne(phone: string, message: string): Promise<boolean> {
  const token = process.env.SMSAPI_TOKEN
  if (!token) {
    console.warn('[SMS] Brak SMSAPI_TOKEN — pomijam wysyłkę.')
    return false
  }
  const to = normalizePhone(phone)
  if (!to) return false
  try {
    const params = new URLSearchParams({
      to,
      message,
      format: 'json',
      encoding: 'utf-8',
      normalize: '1',
    })
    const res = await fetch(`${API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.error) {
      console.error(`[SMS] Błąd wysyłki do ${to}:`, data?.message ?? res.status)
      return false
    }
    return true
  } catch (err) {
    console.error(`[SMS] Błąd wysyłki do ${to}:`, err)
    return false
  }
}

export type SmsRecipient = { phone: string; name: string }

// Wysyłka masowa — jedna wiadomość na odbiorcę (personalizowana imieniem).
export async function sendBulkSms(
  recipients: SmsRecipient[],
  message: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  for (const r of recipients) {
    if (!r.phone) continue
    const personalized = r.name ? `Cześć ${r.name}! ${message}`.trim() : message
    const ok = await sendOne(r.phone, personalized)
    if (ok) sent++
    else failed++
  }
  return { sent, failed }
}

// Pojedyncza wiadomość transakcyjna (np. przypomnienie o lekcji) — bez personalizacji "Cześć",
// wywołujący sam komponuje pełną treść.
export async function sendSms(phone: string, message: string): Promise<boolean> {
  return sendOne(phone, message)
}
