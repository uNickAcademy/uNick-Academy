import type { Metadata } from 'next'
import { getTpDictionary, tpLocales, TpLocale } from '@/lib/teenpreneurs/i18n'
import { CartProvider } from '@/components/teenpreneurs/CartProvider'
import { TpHeader } from '@/components/teenpreneurs/TpHeader'
import { TpFooter } from '@/components/teenpreneurs/TpFooter'

export function generateStaticParams() {
  return tpLocales.map(locale => ({ locale }))
}

// Unknown locale segments 404 instead of rendering a bogus page.
export const dynamicParams = false

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.home.title, template: `%s | ${dict.meta.siteName}` },
    description: dict.meta.home.description,
    openGraph: {
      siteName: dict.meta.siteName,
      locale: locale === 'pl' ? 'pl_PL' : 'en_GB',
      type: 'website',
    },
    alternates: {
      languages: { en: '/teenpreneurs/en', pl: '/teenpreneurs/pl' },
    },
  }
}

export default async function TpLocaleLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = getTpDictionary(locale)

  return (
    <CartProvider>
      <a href="#tp-main" className="tp-visually-hidden focus:not-sr-only">
        {dict.common.skipToContent}
      </a>
      <TpHeader locale={locale as TpLocale} dict={dict} />
      <main id="tp-main">{children}</main>
      <TpFooter locale={locale as TpLocale} dict={dict} />
    </CartProvider>
  )
}
