import { Resend } from 'resend'
import { getTpDictionary } from './i18n'
import { formatTpPrice, TpCurrency } from './products'

// Teenpreneurs transactional email via Resend (same provider as the school
// platform, own sender identity). TP_RESEND_API_KEY lets the international
// entity use its own Resend account later; falls back to the shared key.
const FROM = process.env.TP_EMAIL_FROM || 'Teenpreneurs <hello@teenpreneur.academy>'

function getResend(): Resend | null {
  const key = process.env.TP_RESEND_API_KEY || process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend()
  if (!resend) {
    console.warn('[TP Email] No Resend API key — skipping email to', to)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    // Never let email failure break order/webhook processing.
    console.error('[TP Email] send failed:', err)
  }
}

// Simple brand wrapper shared by all TP emails.
function shell(inner: string) {
  return `
  <div style="background:#FBF6EE;padding:32px 16px;font-family:Verdana,Geneva,sans-serif;color:#22304A;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <div style="background:#101E3C;padding:24px 32px;">
        <span style="color:#ffffff;font-size:22px;font-weight:bold;">Teen<span style="color:#FF5A48;">preneurs</span></span>
      </div>
      <div style="padding:32px;line-height:1.6;">${inner}</div>
      <div style="padding:20px 32px;border-top:1px solid #eee;font-size:12px;color:#8a8a8a;">
        Unick Academy International Sp. z o.o. · <a href="mailto:hello@teenpreneur.academy" style="color:#2EA6FF;">hello@teenpreneur.academy</a>
      </div>
    </div>
  </div>`
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#FF5A48;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;margin:8px 0;">${label}</a>`

export type OrderEmailItem = { name: string; qty: number; unitAmount: number }
export type DownloadEmailLink = { name: string; url: string }

export async function sendTpOrderConfirmation(opts: {
  to: string
  locale: string
  items: OrderEmailItem[]
  total: number
  currency: TpCurrency
  downloads: DownloadEmailLink[]
  hasPhysical: boolean
  siteUrl: string
}) {
  const t = getTpDictionary(opts.locale).emails.orderConfirm
  const rows = opts.items
    .map(i => `<tr><td style="padding:6px 0;">${i.qty} × ${i.name}</td><td style="padding:6px 0;text-align:right;">${formatTpPrice(i.unitAmount * i.qty, opts.currency, opts.locale)}</td></tr>`)
    .join('')
  const downloadBlock = opts.downloads.length
    ? `<h3 style="margin:24px 0 4px;">${t.downloadsTitle}</h3>
       ${opts.downloads.map(d => `<p style="margin:8px 0;">${btn(d.url, `⬇ ${d.name}`)}</p>`).join('')}
       <p style="font-size:13px;color:#666;">${t.downloadsNote}<br/>
       <a href="${opts.siteUrl}/teenpreneurs/${opts.locale}/downloads" style="color:#2EA6FF;">${t.refreshLinkLabel}</a></p>`
    : ''
  const shippingBlock = opts.hasPhysical
    ? `<h3 style="margin:24px 0 4px;">${t.shippingTitle}</h3><p style="margin:4px 0;">${t.shippingNote}</p>`
    : ''
  const html = shell(`
    <h2 style="margin:0 0 12px;">${t.heading}</h2>
    <p>${t.intro}</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}
      <tr><td style="padding:10px 0;border-top:2px solid #101E3C;font-weight:bold;">Total</td>
      <td style="padding:10px 0;border-top:2px solid #101E3C;text-align:right;font-weight:bold;">${formatTpPrice(opts.total, opts.currency, opts.locale)}</td></tr>
    </table>
    ${downloadBlock}
    ${shippingBlock}
    <p style="margin-top:28px;">${t.signoff}<br/><strong>${t.team}</strong></p>
  `)
  await send(opts.to, t.subject, html)
}

export async function sendTpDownloadLinks(opts: {
  to: string
  locale: string
  downloads: DownloadEmailLink[]
}) {
  const t = getTpDictionary(opts.locale).emails.downloads
  const html = shell(`
    <h2 style="margin:0 0 12px;">${t.heading}</h2>
    <p>${t.body}</p>
    ${opts.downloads.map(d => `<p style="margin:8px 0;">${btn(d.url, `⬇ ${d.name}`)}</p>`).join('')}
  `)
  await send(opts.to, t.subject, html)
}

export async function sendTpEventConfirmation(opts: { to: string; locale: string }) {
  const t = getTpDictionary(opts.locale).emails.event
  const html = shell(`
    <h2 style="margin:0 0 12px;">${t.heading}</h2>
    <p>${t.body}</p>
    <p style="font-size:13px;color:#666;margin-top:20px;">${t.ps}</p>
  `)
  await send(opts.to, t.subject, html)
}

export async function sendTpEnrolmentWelcome(opts: {
  to: string
  locale: string
  studentName: string
  ageTrack: string
  timeSlotLabel: string
}) {
  const t = getTpDictionary(opts.locale).emails.enrol
  const html = shell(`
    <h2 style="margin:0 0 12px;">${t.heading}</h2>
    <p>${t.body}</p>
    <h3 style="margin:24px 0 4px;">${t.detailsTitle}</h3>
    <p style="margin:4px 0;">${opts.studentName} · ${opts.ageTrack} · ${opts.timeSlotLabel}</p>
  `)
  await send(opts.to, t.subject, html)
}
