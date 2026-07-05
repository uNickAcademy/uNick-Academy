import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from '@/components/teenpreneurs/TpButton'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: getTpDictionary(locale).shop.cancelled.title, robots: { index: false } }
}

export default async function OrderCancelledPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const c = dict.shop.cancelled
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{c.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-tp-ink/85">{c.text}</p>
      <TpButton href={`/teenpreneurs/${locale}/shop/cart`} className="mt-8">{c.cta}</TpButton>
    </section>
  )
}
