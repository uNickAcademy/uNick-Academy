import type { Metadata } from 'next'
import Link from 'next/link'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TP_PRODUCTS, currencyForLocale, formatTpPrice } from '@/lib/teenpreneurs/products'
import { MediaSlot } from '@/components/teenpreneurs/MediaSlot'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.shop.title, description: dict.meta.shop.description }
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const currency = currencyForLocale(locale)
  const base = `/teenpreneurs/${locale}`

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <h1 className="font-tp-display text-4xl font-extrabold text-tp-navy sm:text-5xl">{dict.shop.title}</h1>
      <p className="mt-4 max-w-2xl font-tp-editorial text-lg italic text-tp-ink/80">{dict.shop.sub}</p>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {TP_PRODUCTS.map((product, i) => {
          const copy = dict.shop.products[product.copyKey]
          const minPrice = Math.min(...product.variants.map(v => v.prices[currency]))
          return (
            <article
              key={product.slug}
              className={`group rounded-3xl border border-tp-navy/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg sm:p-8 ${i % 2 ? 'md:translate-y-8' : ''}`}
            >
              <Link href={`${base}/shop/${product.slug}`} className="block">
                <MediaSlot label={copy.imageLabel} ratio={product.copyKey === 'journal' ? 'square' : 'portrait'} />
                <h2 className="mt-6 font-tp-display text-2xl font-bold text-tp-navy group-hover:text-tp-coral">{copy.name}</h2>
                <p className="mt-2 font-tp-editorial italic leading-relaxed text-tp-ink/75">{copy.tagline}</p>
                <div className="mt-5 flex items-center justify-between">
                  <p className="font-tp-display font-bold text-tp-navy">
                    <span className="text-sm font-medium text-tp-ink/60">{dict.shop.from} </span>
                    {formatTpPrice(minPrice, currency, locale)}
                  </p>
                  <span className="font-tp-display text-sm font-semibold text-tp-coral">{dict.shop.viewProduct} →</span>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
