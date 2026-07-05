'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TpDictionary } from '@/lib/teenpreneurs/i18n'
import { currencyForLocale, findVariant, formatTpPrice } from '@/lib/teenpreneurs/products'
import { useCart } from './CartProvider'
import { TpButton } from './TpButton'

export function CartView({ dict, locale }: { dict: TpDictionary; locale: string }) {
  const { items, setQty, remove, count } = useCart()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currency = currencyForLocale(locale)
  const c = dict.shop.cart
  const base = `/teenpreneurs/${locale}`

  const lines = items
    .map(item => {
      const hit = findVariant(item.variantId)
      return hit ? { ...item, ...hit } : null
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)

  const subtotal = lines.reduce((sum, l) => sum + l.variant.prices[currency] * l.qty, 0)

  async function checkout() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/teenpreneurs/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(i => ({ variantId: i.variantId, qty: i.qty })), locale }),
      })
      const data = await res.json()
      if (res.status === 503) throw new Error(c.notConfigured)
      if (!res.ok || !data.url) throw new Error(c.checkoutError)
      // Cart is intentionally NOT cleared here — if the user cancels on
      // Stripe, they come back to an intact cart. Cleared on success page.
      window.location.assign(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : c.checkoutError)
      setBusy(false)
    }
  }

  if (count === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-tp-navy/20 bg-white px-6 py-16 text-center">
        <p className="font-tp-editorial text-lg italic text-tp-ink/70">{c.empty}</p>
        <TpButton href={`${base}/shop`} variant="ghost" className="mt-6">{c.emptyCta}</TpButton>
      </div>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-tp-navy/10 rounded-2xl border border-tp-navy/10 bg-white">
        {lines.map(line => {
          const name = dict.shop.products[line.product.copyKey].name
          const variantLabel = dict.shop.variants[line.variant.labelKey]
          return (
            <li key={line.variantId} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <p className="font-tp-display font-semibold text-tp-navy">{name}</p>
                <p className="text-sm text-tp-ink/60">{variantLabel}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-tp-ink/70">
                {c.quantity}
                <select
                  value={line.qty}
                  onChange={e => setQty(line.variantId, Number(e.target.value))}
                  className="rounded-lg border border-tp-navy/20 bg-white px-2 py-1.5 font-tp-display"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <p className="w-24 text-right font-tp-display font-bold text-tp-navy">
                {formatTpPrice(line.variant.prices[currency] * line.qty, currency, locale)}
              </p>
              <button
                type="button"
                onClick={() => remove(line.variantId)}
                className="text-sm font-medium text-tp-coral underline-offset-2 hover:underline"
              >
                {c.remove}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex flex-col items-end gap-2">
        <p className="font-tp-display text-lg text-tp-navy">
          {c.subtotal}: <strong>{formatTpPrice(subtotal, currency, locale)}</strong>
        </p>
        <p className="text-sm text-tp-ink/60">{c.taxNote}</p>
        {error && <p role="alert" className="text-sm font-medium text-tp-coral">{error}</p>}
        <TpButton onClick={checkout} disabled={busy} className="mt-2">
          {busy ? c.checkingOut : c.checkout}
        </TpButton>
        <Link href={`${base}/shop`} className="mt-1 text-sm text-tp-ink/60 underline-offset-2 hover:underline">
          ← {c.emptyCta}
        </Link>
      </div>
    </div>
  )
}
