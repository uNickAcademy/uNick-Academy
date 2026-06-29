import { Resend } from 'resend'
import {
  welcomeEmail,
  lessonConfirmationEmail,
  lessonReminderEmail,
  overdueEmail,
  referralEmail,
  bulkMessageEmail,
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
