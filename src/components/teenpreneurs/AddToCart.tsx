'use client'

import { useState } from 'react'
import type { TpDictionary } from '@/lib/teenpreneurs/i18n'
import type { TpProduct, TpCurrency } from '@/lib/teenpreneurs/products'
import { formatTpPrice } from '@/lib/teenpreneurs/products'
import { useCart } from './CartProvider'
import { TpButton } from './TpButton'

/** Variant picker + add-to-cart, one per product page. */
export function AddToCart({
  product, dict, currency, locale,
}: {
  product: TpProduct
  dict: TpDictionary
  currency: TpCurrency
  locale: string
}) {
  const { add } = useCart()
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const [justAdded, setJustAdded] = useState(false)
  const selected = product.variants.find(v => v.id === variantId) ?? product.variants[0]

  function handleAdd() {
    add(selected.id)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <div>
      <fieldset>
        <legend className="tp-visually-hidden">{dict.shop.cart.title}</legend>
        <div className="flex flex-col gap-3">
          {product.variants.map(variant => (
            <label
              key={variant.id}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 p-4 transition-colors ${
                variant.id === variantId ? 'border-tp-coral bg-tp-coral/5' : 'border-tp-navy/15 bg-white hover:border-tp-navy/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`variant-${product.slug}`}
                  value={variant.id}
                  checked={variant.id === variantId}
                  onChange={() => setVariantId(variant.id)}
                  className="h-4 w-4 accent-tp-coral"
                />
                <span>
                  <span className="block font-tp-display font-semibold text-tp-navy">{dict.shop.variants[variant.labelKey]}</span>
                  <span className="block text-xs text-tp-ink/60">
                    {variant.requiresShipping ? dict.shop.variants.shippingNote : dict.shop.variants.digitalNote}
                  </span>
                </span>
              </span>
              <span className="font-tp-display text-lg font-bold text-tp-navy">
                {formatTpPrice(variant.prices[currency], currency, locale)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <TpButton onClick={handleAdd} className="mt-6 w-full sm:w-auto">
        {justAdded ? dict.shop.cart.added : dict.shop.cart.addToCart}
      </TpButton>
    </div>
  )
}
