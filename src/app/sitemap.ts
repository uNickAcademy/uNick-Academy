import type { MetadataRoute } from 'next'
import { TP_PRODUCTS } from '@/lib/teenpreneurs/products'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl'
const locales = ['en', 'pl']

// Marketing pages of the main site (src/app/[locale]/…)
const mainPaths = [
  '', '/adults', '/children', '/companies', '/contact', '/how-we-teach',
  '/meet-unickorn', '/meet-us', '/teenagers', '/privacy-policy', '/terms-of-service',
]

// Teenpreneurs sub-site (src/app/teenpreneurs/[locale]/…)
const tpPaths = [
  '', '/program', '/differentability', '/parents', '/event', '/shop',
  ...TP_PRODUCTS.map(p => `/shop/${p.slug}`),
  '/enrol', '/contact', '/privacy', '/terms', '/refunds',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    for (const path of mainPaths) {
      entries.push({ url: `${SITE_URL}/${locale}${path}`, lastModified: now })
    }
    for (const path of tpPaths) {
      entries.push({ url: `${SITE_URL}/teenpreneurs/${locale}${path}`, lastModified: now })
    }
  }
  return entries
}
