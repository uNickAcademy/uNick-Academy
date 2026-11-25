import { createAdminClient } from '@/lib/supabase/server'
import { expiryLabel, renderVoucher } from './artwork'
import { escapeHtml, voucherTerms } from './terms'
import { VOUCHER_SELLER } from './terms'
import type { VoucherOrder } from './types'

export function voucherEmail(order: VoucherOrder) {
  const firstName = escapeHtml(order.buyer_name.split(/\s+/)[0])
  const code = escapeHtml(order.voucher_code!)
  const expires = expiryLabel(order.expires_on!)
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#faf4ec;font:16px/1.8 Arial,sans-serif;color:#1c2b4a"><main style="max-width:680px;background:#fffdf9;padding:32px 24px;margin:24px auto"><img src="https://unick-academy.pl/voucher-preview/assets/official-logo.jpg" width="155" alt="uNick Academy" style="display:block;margin:0 auto 28px"><p style="text-align:center;color:#C0392B;font-size:12px;letter-spacing:2px">DOBRE ROZMOWY ZACZYNAJĄ SIĘ TUTAJ</p><h1 style="text-align:center;font:36px/1.2 Georgia,serif">Twój voucher.<br><span style="color:#C0392B">Cały świat możliwości.</span></h1><p>Cześć ${firstName}.<br>Dziękujemy za wybór uNick Academy. Oto Twój voucher o wartości <strong>${order.value} zł</strong>.</p><img src="cid:unick-voucher" alt="Voucher ${order.value} zł, kod ${code}, ważny do ${expires}" width="632" style="display:block;width:100%;height:auto;border-radius:12px"><p style="text-align:center"><strong>Twój kod: ${code}</strong><br>Ważny do ${expires}</p><h2 style="font:27px Georgia,serif">${order.gift ? 'Teraz wystarczy przekazać go dalej.' : 'Twój kolejny dobry początek.'}</h2><p>${order.gift ? 'Prześlij voucher bliskiej osobie albo wydrukuj i wpisz jej imię w pustym miejscu. Nie wysyłamy niczego do obdarowanej osoby.' : 'Zachowaj voucher i skontaktuj się z nami, gdy zechcesz ustalić zajęcia.'}</p><p>Odbiorca przekazuje nam kod przy pierwszym kontakcie. Po weryfikacji przypiszemy wartość do właściwego konta w ActiveNow. Kolejne zajęcia będą pomniejszać tę wartość według ceny wybranych zajęć. Można korzystać z różnych nauczycieli, indywidualnie lub w grupie, online albo stacjonarnie, według dostępności.</p><p>Do usłyszenia,<br><strong>Milena i zespół uNick Academy</strong><br><a href="mailto:hello@unick-academy.pl" style="color:#C0392B">hello@unick-academy.pl</a> · +48 666 661 750</p><hr style="border:0;border-top:1px solid #e7dfd2"><p style="font-size:12px">Zamówienie ${order.id}<br>Wpłata: ${(order.cash_grosze / 100).toFixed(2)} zł · Bonus: ${(order.bonus_grosze / 100).toFixed(2)} zł · Wartość: ${order.value} zł.<br>To potwierdzenie zakupu; nie jest fakturą.</p><p style="font-size:12px">${VOUCHER_SELLER}<br>Regulamin otrzymujesz w załączniku. Masz 14 dni na odstąpienie zgodnie z jego warunkami. Samo otrzymanie vouchera nie pozbawia tego prawa.</p></main></body></html>`
}

export async function deliverVoucher(orderId: string) {
  const db = createAdminClient()
  const existing = await db.from('voucher_orders').select('email_sent_at,status').eq('id', orderId).single()
  if (existing.error || existing.data?.status !== 'paid') throw new Error('Paid order unavailable')
  if (existing.data.email_sent_at) return
  const claim = await db.rpc('voucher_claim_email', { p_order_id: orderId })
  const order = claim.data as VoucherOrder | null
  if (claim.error || !order?.id) throw new Error('Email delivery pending')
  try {
    const png = await renderVoucher(order)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `voucher-${order.id}-paid-v1` },
      body: JSON.stringify({ from: 'uNick Academy <hello@unick-academy.pl>', to: [order.buyer_email], reply_to: 'hello@unick-academy.pl',
        subject: 'Twój voucher uNick Academy jest gotowy', html: voucherEmail(order),
        attachments: [
          { filename: `uNick-Academy-voucher-${order.value}.png`, content: png.toString('base64'), content_type: 'image/png', content_id: 'unick-voucher' },
          { filename: 'Regulamin-voucherow-Black-Friday-2026.txt', content: Buffer.from(voucherTerms).toString('base64'), content_type: 'text/plain; charset=utf-8' },
        ],
      }),
    })
    const result = await response.json()
    if (!response.ok || typeof result.id !== 'string') throw new Error('Email provider unavailable')
    const saved = await db.from('voucher_orders').update({ email_sent_at: new Date().toISOString(), email_provider_id: result.id }).eq('id', order.id)
    if (saved.error) throw new Error('Email receipt persistence failed')
  } catch (error) {
    await db.from('voucher_orders').update({ email_claimed_at: null }).eq('id', order.id).is('email_sent_at', null)
    throw error
  }
}
