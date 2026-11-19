import { siteConfig } from '@/app/lib/site-config'

// Podpis pod odpowiedziami Agenta Skrzynki i odpowiedziami wysyłanymi z panelu.
// Wersja HTML: logo, nazwa zespołu, strona, telefon i ikony mediów
// społecznościowych w kolorach marki. Wersja tekstowa: te same dane dla
// programów, które nie wyświetlają HTML.
//
// Obrazki są hostowane na stronie szkoły (jak w pozostałych mailach marki),
// więc nie dokładamy ich do każdej wiadomości jako załączników.
//
// Moduł nie ma zależności serwerowych: panel używa go do podglądu podpisu.

export const DEFAULT_SIGNATURE_NAME = 'uNick Academy Team'

const NAVY = '#1E3282'
const RED = '#B4321E'
const CREAM = '#F0DCC8'

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', file: 'icon-instagram.png' },
  { key: 'facebook', label: 'Facebook', file: 'icon-facebook.png' },
  { key: 'youtube', label: 'YouTube', file: 'icon-youtube.png' },
  { key: 'linkedin', label: 'LinkedIn', file: 'icon-linkedin.png' },
] as const

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function siteHost(): string {
  return siteConfig.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

// `name` to treść pola „Podpis" z panelu: pierwsza linia wychodzi pogrubiona,
// kolejne (np. imię osoby) pod nią.
export function signatureHtml(name: string, baseUrl: string = siteConfig.url): string {
  const lines = (name.trim() || DEFAULT_SIGNATURE_NAME).split('\n').map((l) => l.trim()).filter(Boolean)
  const [first, ...rest] = lines
  const social = SOCIAL.map(
    (s) =>
      `<a href="${siteConfig.social[s.key]}" style="text-decoration:none;display:inline-block;margin-right:6px;">` +
      `<img src="${baseUrl}/brand/icons/${s.file}" width="24" height="24" alt="${s.label}" style="display:block;border:0;border-radius:50%;" /></a>`,
  ).join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-collapse:collapse;font-family:'Poppins',Arial,Helvetica,sans-serif;">
  <tr>
    <td style="padding:14px 18px 14px 0;vertical-align:middle;border-top:2px solid ${CREAM};">
      <a href="${siteConfig.url}" style="text-decoration:none;"><img src="${baseUrl}/brand/unick-academy-logo.png" width="118" alt="uNick Academy" style="display:block;border:0;width:118px;height:auto;" /></a>
    </td>
    <td style="padding:14px 0 14px 18px;vertical-align:middle;border-top:2px solid ${CREAM};border-left:2px solid ${RED};">
      <div style="font-size:15px;font-weight:700;color:${NAVY};line-height:1.3;">${escapeHtml(first)}</div>
      ${rest.map((l) => `<div style="font-size:13px;color:${NAVY};line-height:1.4;">${escapeHtml(l)}</div>`).join('')}
      <div style="font-size:13px;line-height:1.6;margin-top:4px;">
        <a href="${siteConfig.url}" style="color:${RED};text-decoration:none;font-weight:600;">${siteHost()}</a>
        <span style="color:#9ca3af;">&nbsp;|&nbsp;</span>
        <a href="tel:${siteConfig.phone.e164}" style="color:${NAVY};text-decoration:none;">${siteConfig.phone.display}</a>
      </div>
      <div style="margin-top:8px;line-height:0;">${social}</div>
    </td>
  </tr>
</table>`
}

export function signatureText(name: string): string {
  const lines = (name.trim() || DEFAULT_SIGNATURE_NAME).split('\n').map((l) => l.trim()).filter(Boolean)
  return [
    ...lines,
    `${siteHost()} | ${siteConfig.phone.display}`,
    ...SOCIAL.map((s) => `${s.label}: ${siteConfig.social[s.key]}`),
  ].join('\n')
}
