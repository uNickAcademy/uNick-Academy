import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { CartView } from '@/components/teenpreneurs/CartView'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: getTpDictionary(locale).shop.cart.title, robots: { index: false } }
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
      <h1 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{dict.shop.cart.title}</h1>
      <div className="mt-8">
        <CartView dict={dict} locale={locale} />
      </div>
    </section>
  )
}
