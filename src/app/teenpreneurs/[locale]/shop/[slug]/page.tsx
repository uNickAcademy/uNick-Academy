import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTpDictionary, tpLocales } from '@/lib/teenpreneurs/i18n'
import { TP_PRODUCTS, currencyForLocale, findProduct } from '@/lib/teenpreneurs/products'
import { AddToCart } from '@/components/teenpreneurs/AddToCart'
import { MediaSlot } from '@/components/teenpreneurs/MediaSlot'

export function generateStaticParams() {
  return tpLocales.flatMap(locale => TP_PRODUCTS.map(p => ({ locale, slug: p.slug })))
}
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const product = findProduct(slug)
  if (!product) return {}
  const copy = getTpDictionary(locale).shop.products[product.copyKey]
  return { title: copy.name, description: copy.tagline }
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const product = findProduct(slug)
  if (!product) notFound()

  const dict = getTpDictionary(locale)
  const copy = dict.shop.products[product.copyKey]
  const currency = currencyForLocale(locale)

  return (
    <article className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <MediaSlot label={copy.imageLabel} ratio={product.copyKey === 'journal' ? 'square' : 'portrait'} className="md:sticky md:top-24 md:self-start" />

        <div>
          <h1 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{copy.name}</h1>
          <p className="mt-3 font-tp-editorial text-xl italic leading-relaxed text-tp-ink/80">{copy.tagline}</p>

          <div className="mt-8">
            <AddToCart product={product} dict={dict} currency={currency} locale={locale} />
          </div>

          {/* Editorial description — Lora, generous space */}
          <div className="mt-10 space-y-5 font-tp-editorial text-lg leading-[1.8] text-tp-ink">
            {copy.description.map(para => (
              <p key={para.slice(0, 32)}>{para}</p>
            ))}
          </div>

          <ul className="mt-8 space-y-2 border-t border-tp-navy/10 pt-6">
            {copy.details.map(detail => (
              <li key={detail} className="flex gap-3 text-sm text-tp-ink/75">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tp-sky" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
