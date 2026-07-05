import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from '@/components/teenpreneurs/TpButton'
import { ClearCartOnSuccess } from '@/components/teenpreneurs/ClearCartOnSuccess'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: getTpDictionary(locale).shop.success.title, robots: { index: false } }
}

// Friendly landing after Stripe redirect. Fulfilment (order record, emails,
// download links) is driven by the webhook, never by reaching this page.
export default async function OrderSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const s = dict.shop.success
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <ClearCartOnSuccess />
      <p aria-hidden className="text-6xl">🎉</p>
      <h1 className="mt-6 font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{s.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-tp-ink/85">{s.text}</p>
      <p className="mt-4 text-sm leading-relaxed text-tp-ink/60">{s.note}</p>
      <TpButton href={`/teenpreneurs/${locale}/shop`} variant="ghost" className="mt-8">{s.cta}</TpButton>
    </section>
  )
}
