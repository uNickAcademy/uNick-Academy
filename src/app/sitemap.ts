import type { MetadataRoute } from 'next'
import { siteConfig } from './lib/site-config'

// Sitemap zawiera wyłącznie kanoniczne, indeksowalne adresy HTTPS obu wersji
// językowych. Każdy wpis niesie alternatywne wersje językowe (hreflang), by
// wyszukiwarki poprawnie łączyły /pl i /en. Panele, API i strony techniczne
// są pominięte celowo.

const BASE = siteConfig.url

// Trasy wspólne dla obu języków (ten sam slug w /pl i /en).
// lastmod = data ostatniej istotnej zmiany treści (nie „dziś dla wszystkich”).
const SHARED_ROUTES: { path: string; lastmod: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', lastmod: '2026-07-22', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/children', lastmod: '2026-07-22', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/teenagers', lastmod: '2026-07-22', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/adults', lastmod: '2026-07-22', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/companies', lastmod: '2026-07-22', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/how-we-teach', lastmod: '2026-07-22', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/meet-us', lastmod: '2026-07-22', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', lastmod: '2026-07-22', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/meet-unickorn', lastmod: '2026-07-22', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/teachers-zone', lastmod: '2026-07-22', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy-policy', lastmod: '2026-06-23', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms-of-service', lastmod: '2026-06-23', priority: 0.2, changeFrequency: 'yearly' },
]

// Lokalna strona docelowa ma inny slug w każdym języku, dlatego łączymy je
// ręcznie jako parę hreflang.
const LOCAL_LANDING = {
  pl: '/szkola-jezykowa-tarnowo-podgorne',
  en: '/english-school-tarnowo-podgorne',
  lastmod: '2026-07-22',
  priority: 0.9,
  changeFrequency: 'monthly' as const,
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const route of SHARED_ROUTES) {
    const languages = {
      pl: `${BASE}/pl${route.path}`,
      en: `${BASE}/en${route.path}`,
      'x-default': `${BASE}/pl${route.path}`,
    }
    // Jeden wpis na wersję językową, każdy z kompletem alternates.
    for (const locale of ['pl', 'en'] as const) {
      entries.push({
        url: `${BASE}/${locale}${route.path}`,
        lastModified: route.lastmod,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      })
    }
  }

  // Lokalna strona docelowa (para PL/EN o różnych slugach).
  const localLanguages = {
    pl: `${BASE}/pl${LOCAL_LANDING.pl}`,
    en: `${BASE}/en${LOCAL_LANDING.en}`,
    'x-default': `${BASE}/pl${LOCAL_LANDING.pl}`,
  }
  entries.push(
    {
      url: `${BASE}/pl${LOCAL_LANDING.pl}`,
      lastModified: LOCAL_LANDING.lastmod,
      changeFrequency: LOCAL_LANDING.changeFrequency,
      priority: LOCAL_LANDING.priority,
      alternates: { languages: localLanguages },
    },
    {
      url: `${BASE}/en${LOCAL_LANDING.en}`,
      lastModified: LOCAL_LANDING.lastmod,
      changeFrequency: LOCAL_LANDING.changeFrequency,
      priority: LOCAL_LANDING.priority,
      alternates: { languages: localLanguages },
    },
  )

  return entries
}
