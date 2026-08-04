import { Resend } from 'resend'
import {
  welcomeEmail,
  lessonConfirmationEmail,
  lessonReminderEmail,
  overdueEmail,
  referralEmail,
  bulkMessageEmail,
  progressDigestEmail,
  paymentReceiptEmail,
  bookingReceivedEmail,
  bookingApprovedEmail,
  monthlyPaymentEmail,
  internalNotificationEmail,
  platformWelcomeEmail,
} from './templates'

const FROM = 'uNick Academy <hello@unick-academy.pl>'

// Leniwa inicjalizacja — klient powstaje dopiero przy wysyłce, gdy jest klucz.
// Dzięki temu build nie wywala się, gdy RESEND_API_KEY nie jest ustawiony.
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

// ──────────────────────────────────────────
// Pomocnik wysyłki
// ──────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] Brak RESEND_API_KEY — pomijam wysyłkę e-maila.')
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error(`[Email] Błąd wysyłki do ${to}:`, err)
    // Nie rzucamy błędu – email to nie blokujący krok
  }
}

// Czy Resend jest skonfigurowany (klucz API)
export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY
}

// Adres szkoły do powiadomień wewnętrznych. Nadpisywalny przez env (można
// podać kilka adresów po przecinku), żeby zmiana nie wymagała deploya.
const SCHOOL_NOTIFY_EMAIL = process.env.SCHOOL_NOTIFY_EMAIL || 'hello@unick-academy.pl'

// Powiadomienie e-mail do szkoły o nowym zapisie/zapytaniu — fire-and-forget,
// nigdy nie blokuje odpowiedzi dla klienta (błąd wysyłki tylko logujemy).
// Odpowiednik notifySchoolSms, ale mailem — SMS wymaga osobnego tokenu.
export async function notifySchoolEmail(params: {
  title: string
  lines: string[]
  actionLabel?: string
  actionPath?: string
}): Promise<void> {
  try {
    const { subject, html } = internalNotificationEmail(params)
    const recipients = SCHOOL_NOTIFY_EMAIL.split(',').map((e) => e.trim()).filter(Boolean)
    for (const to of recipients) await send(to, subject, html)
  } catch (err) {
    console.error('[Email] Powiadomienie szkoły nie wyszło:', err)
  }
}

// Wysyłka masowa do listy odbiorców {email, name}. Zwraca liczbę wysłanych.
export async function sendBulkMessage(
  recipients: { email: string; name: string }[],
  subject: string,
  body: string,
): Promise<number> {
  let sent = 0
  for (const r of recipients) {
    if (!r.email) continue
    const { subject: subj, html } = bulkMessageEmail(r.name || 'Cześć', subject, body)
    await send(r.email, subj, html)
    sent++
  }
  return sent
}

// ──────────────────────────────────────────
// Publiczne funkcje
// ──────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, referralCode: string) {
  const { subject, html } = welcomeEmail(name, referralCode)
  await send(to, subject, html)
}

export async function sendLessonConfirmation(to: string, params: {
  studentName: string
  teacherName: string
  date: string
  time: string
  topic: string
  type: 'online' | 'offline'
  meetLink?: string
}) {
  const { subject, html } = lessonConfirmationEmail(params)
  await send(to, subject, html)
}

// Zapis online przyjęty — czeka na potwierdzenie terminu przez szkołę.
export async function sendBookingReceived(to: string, params: {
  studentName: string
  teacherName: string
  date: string
  time: string
}) {
  const { subject, html } = bookingReceivedEmail(params)
  await send(to, subject, html)
}

// Admin zatwierdził termin — potwierdzenie + link do płatności za 1. lekcję.
export async function sendBookingApproved(to: string, params: {
  studentName: string
  teacherName: string
  date: string
  time: string
  meetLink?: string
  amount?: number | null
  paymentUrl?: string | null
  recurring?: boolean
}) {
  const { subject, html } = bookingApprovedEmail(params)
  await send(to, subject, html)
}

// Miesięczna opłata z góry — wysyłana 1. dnia miesiąca.
export async function sendMonthlyPayment(to: string, params: {
  studentName: string
  monthLabel: string
  amount: number
  paymentUrl?: string | null
}) {
  const { subject, html } = monthlyPaymentEmail(params)
  await send(to, subject, html)
}

export async function sendLessonReminder(to: string, params: {
  studentName: string
  teacherName: string
  date: string
  time: string
  type: 'online' | 'offline'
  meetLink?: string
}) {
  const { subject, html } = lessonReminderEmail(params)
  await send(to, subject, html)
}

export async function sendOverdueNotification(to: string, params: {
  studentName: string
  amount: number
  dueDate: string
}) {
  const { subject, html } = overdueEmail(params)
  await send(to, subject, html)
}

export async function sendReferralNotification(to: string, params: {
  referrerName: string
  referredName: string
  creditAmount: number
}) {
  const { subject, html } = referralEmail(params)
  await send(to, subject, html)
}

export async function sendPaymentReceipt(to: string, params: {
  studentName: string
  amount: number
  method: string
  balanceAfter?: number
}) {
  const { subject, html } = paymentReceiptEmail(params)
  await send(to, subject, html)
}

export async function sendProgressDigest(to: string, params: {
  studentName: string
  weekLabel: string
  lessonsCount: number
  hours: number
  topics: string[]
  homework: string[]
  nextLesson?: { date: string; time: string } | null
}) {
  const { subject, html } = progressDigestEmail(params)
  await send(to, subject, html)
}

export async function sendPlatformWelcome(to: string, params: {
  name: string
  referralCode: string
}) {
  const { subject, html } = platformWelcomeEmail({
    ...params,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl',
  })
  return send(to, subject, html)
}
