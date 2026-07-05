'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { findVariant } from '@/lib/teenpreneurs/products'

export type CartItem = { variantId: string; qty: number }

type CartContextValue = {
  items: CartItem[]
  add: (variantId: string, qty?: number) => void
  setQty: (variantId: string, qty: number) => void
  remove: (variantId: string) => void
  clear: () => void
  count: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'tp-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate from localStorage after mount (SSR-safe), dropping any
  // variant ids that no longer exist in the products config.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed: CartItem[] = JSON.parse(raw)
      setItems(parsed.filter(i => i.qty > 0 && findVariant(i.variantId)))
    } catch {
      /* corrupt storage — start empty */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable (private mode) — cart lives in memory only */
    }
  }, [items])

  const value = useMemo<CartContextValue>(() => ({
    items,
    add: (variantId, qty = 1) =>
      setItems(prev => {
        const existing = prev.find(i => i.variantId === variantId)
        return existing
          ? prev.map(i => (i.variantId === variantId ? { ...i, qty: Math.min(i.qty + qty, 10) } : i))
          : [...prev, { variantId, qty }]
      }),
    setQty: (variantId, qty) =>
      setItems(prev =>
        qty <= 0
          ? prev.filter(i => i.variantId !== variantId)
          : prev.map(i => (i.variantId === variantId ? { ...i, qty: Math.min(qty, 10) } : i))
      ),
    remove: variantId => setItems(prev => prev.filter(i => i.variantId !== variantId)),
    clear: () => setItems([]),
    count: items.reduce((n, i) => n + i.qty, 0),
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
