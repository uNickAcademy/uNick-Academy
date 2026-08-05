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
  comebackEmail,
  groupReservationEmail,
  adviceReceivedEmail,
  groupPrepEmail,
  groupStartReminderEmail,
} from './templates'
import type { AuthEmailMessage } from './auth-email'

const FROM = 'uNick Academy <hello@unick-academy.pl>'
const FOUNDATION_FROM = 'uNick Academy Foundation <hello@unick-academy.pl>'
const AUTH_FROM = 'uNick Academy <hello@unick-academy.pl>'

// Leniwa inicjalizacja — klient powstaje dopiero przy wysyłce, gdy jest klucz.
// Dzięki temu build nie wywala się, gdy RESEND_API_KEY nie jest ustawiony.
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

// ──────────────────────────────────────────
// Pomocnik wysyłki
// ──────────────────────────────────────────
async function send(to: string, subject: string, html: string, from = FROM) {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] Brak RESEND_API_KEY — pomijam wysyłkę e-maila.')
    return
  }
  try {
    await resend.emails.send({ from, to, subject, html })
  } catch (err) {
    console.error(`[Email] Błąd wysyłki do ${to}:`, err)
    // Nie rzucamy błędu – email to nie blokujący krok
  }
}

// Wiadomości uwierzytelniające są krytyczne: błąd musi wrócić do hooka,
// aby Supabase mógł ponowić próbę zamiast potwierdzić cichy sukces.
export async function sendAuthActionEmail(
  message: AuthEmailMessage,
  idempotencyKey: string,
): Promise<void> {
  const resend = getResend()
  if (!resend) throw new Error('Brak RESEND_API_KEY.')

  const { error } = await resend.emails.send(
    {
      from: AUTH_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: 'hello@unick-academy.pl',
    },
    { idempotencyKey },
  )
  if (error) throw new Error(`Resend: ${error.message}`)
}

// Czy Resend jest skonfigurowany (klucz API)
export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY
}

// Adres szkoły do powiadomień wewnętrznych. Nadpisywalny przez env (można
// podać kilka adresów po przecinku), żeby zmiana nie wymagała deploya.
const SCHOOL_NOTIFY_EMAIL = process.env.SCHOOL_NOTIFY_EMAIL || 'hello@unick-academy.pl'
const FOUNDATION_NOTIFY_EMAIL = process.env.FOUNDATION_NOTIFY_EMAIL || SCHOOL_NOTIFY_EMAIL

const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const foundationWrap=(body:string)=>`<!doctype html><html lang="pl"><body style="font-family:Arial;background:#f7f3e9;padding:20px"><div style="max-width:560px;margin:auto;background:white"><header style="background:#1e3449;color:white;padding:28px;text-align:center"><b>uNick Academy Foundation</b></header><main style="padding:32px">${body}</main><footer style="padding:20px;text-align:center;color:#64748b;background:#f8fafc;font-size:12px">UNICK ACADEMY FOUNDATION · KRS 0001212961<br>Wiadomość dotyczy wyłącznie projektu „Kreatorzy Przyszłości”.</footer></div></body></html>`
export async function sendFoundationInterestConfirmation(to:string,p:{contactName:string;participantFirstName:string}){await send(to,'Otrzymaliśmy deklarację zainteresowania — Kreatorzy Przyszłości',foundationWrap(`<h2>Dziękujemy za deklarację</h2><p>${esc(p.contactName.split(' ')[0])}, zapisaliśmy informację o zainteresowaniu zajęciami dla ${esc(p.participantFirstName)}.</p><div style="background:#edf7f5;padding:18px;border-left:4px solid #247e85"><b>To nie jest jeszcze formalny zapis.</b><p>Zajęcia powstaną tylko wtedy, gdy projekt otrzyma dofinansowanie. Deklaracja nie gwarantuje miejsca.</p></div><p>Dane wykorzystamy wyłącznie w sprawie projektu — nie trafią do newslettera ani oferty płatnych kursów.</p>`),FOUNDATION_FROM)}
export async function notifyFoundationEmail(p:{title:string;lines:string[]}){const url=`${process.env.NEXT_PUBLIC_APP_URL||'https://unick-academy.pl'}/admin/fundacja`,html=foundationWrap(`<h2>${esc(p.title)}</h2>${p.lines.map(x=>`<p>${esc(x)}</p>`).join('')}<a href="${url}">Otwórz deklaracje</a>`);for(const to of FOUNDATION_NOTIFY_EMAIL.split(',').map(x=>x.trim()).filter(Boolean))await send(to,p.title,html,FOUNDATION_FROM)}

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

export async function sendComeback(to: string, params: {
  firstName: string
  referralCode: string
  trackToken?: string
}) {
  const { subject, html } = comebackEmail({
    ...params,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl',
  })
  return send(to, subject, html)
}

// ──────────────────────────────────────────
// Zapisy przez kreator /zapisy
// ──────────────────────────────────────────

// Natychmiast po rezerwacji miejsca w grupie.
export async function sendGroupReservation(to: string, params: {
  studentName: string
  groupName: string
  schedule: string
  firstLessonDate: string | null
  format: 'online' | 'offline' | null
  pricePerMonth: number | null
  passwordLink?: string | null
}) {
  const { subject, html } = groupReservationEmail(params)
  await send(to, subject, html)
}

// Zgłoszenie bez konkretnego terminu — „jeszcze nie wiem" i zajęcia indywidualne.
export async function sendAdviceReceived(to: string, params: {
  name: string
  individual?: boolean
  passwordLink?: string | null
}) {
  const { subject, html } = adviceReceivedEmail(params)
  await send(to, subject, html)
}

// Dobę po rezerwacji: co zabrać / jak dojechać albo link i test połączenia.
export async function sendGroupPrep(to: string, params: {
  studentName: string
  groupName: string
  schedule: string
  format: 'online' | 'offline' | null
}) {
  const { subject, html } = groupPrepEmail(params)
  await send(to, subject, html)
}

// Trzy dni przed pierwszymi zajęciami grupy.
export async function sendGroupStartReminder(to: string, params: {
  studentName: string
  groupName: string
  schedule: string
  firstLessonDate: string
  format: 'online' | 'offline' | null
}) {
  const { subject, html } = groupStartReminderEmail(params)
  await send(to, subject, html)
}
