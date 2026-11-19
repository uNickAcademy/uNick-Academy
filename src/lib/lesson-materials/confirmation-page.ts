import { randomBytes } from 'node:crypto'
import { PRIVATE_RESPONSE_HEADERS } from './access'

type Language = 'pl' | 'en'
type ConfirmationPage = {
  language: Language
  title: string
  description: string
  button?: string
  action?: 'confirm' | 'unsubscribe'
  status?: number
}

export function confirmationPage({ language, title, description, button, action, status = 200 }: ConfirmationPage) {
  const pl = language === 'pl'
  const nonce = randomBytes(16).toString('base64')
  // This document has no third-party resources. Email secrets stay in the
  // fragment until the recipient actively submits the form.
  return new Response(`<!doctype html>
<html lang="${language}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | uNick Academy</title>
<style nonce="${nonce}">body{margin:0;padding:clamp(24px,8vw,80px);background:#faf7f0;color:#192847;font-family:system-ui,sans-serif}main{margin:auto;max-width:36rem;padding:clamp(24px,5vw,48px);background:#fff;border:1px solid #e1d8ca;border-radius:24px}h1{font-family:Georgia,serif;font-size:clamp(28px,5vw,40px);line-height:1.15}p{line-height:1.6}button{margin:12px 0 16px;padding:12px 20px;border:0;border-radius:12px;background:#a93226;color:white;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.56;cursor:default}a{color:#a93226}a:focus-visible,button:focus-visible{outline:2px solid #192847;outline-offset:4px}</style>
<main><b>uNick Academy</b><h1>${title}</h1><p>${description}</p>
${action ? `<form method="post" action="/api/lesson-materials/${action}"><input type="hidden" name="token"><input type="hidden" name="lang" value="${language}"><button disabled>${button}</button>
<noscript><p>${pl ? 'Włącz JavaScript i otwórz ponownie link z wiadomości.' : 'Enable JavaScript and reopen the link from your email.'}</p></noscript></form>
<script nonce="${nonce}">const token=location.hash.slice(1);const pattern=${action === 'confirm' ? '/^[A-Za-z0-9_-]{43}$/' : '/^[0-9a-f-]{36}\\.[A-Za-z0-9_-]{43}$/'};if(pattern.test(token)){document.querySelector('[name=token]').value=token;document.querySelector('button').disabled=false;history.replaceState(null,'',location.pathname+location.search)}document.querySelector('form').addEventListener('submit',()=>{document.querySelector('button').disabled=true})</script>` : ''}
<p><a href="/${language}/meterials${action === 'confirm' || status >= 400 ? '#access' : ''}">${pl ? 'Wróć do materiałów' : 'Back to lesson materials'}</a></p></main></html>`, {
    status,
    headers: {
      ...PRIVATE_RESPONSE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
      'X-Robots-Tag': 'noindex',
    },
  })
}
