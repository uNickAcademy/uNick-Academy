'use client'

import { useEffect } from 'react'
import { useCart } from './CartProvider'

/** Rendered on the order-success page: payment happened, so empty the cart. */
export function ClearCartOnSuccess() {
  const { clear } = useCart()
  useEffect(() => {
    clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
