import type { MetadataRoute } from 'next'
import { siteConfig } from './lib/site-config'

// Polityka dostępu dla botów.
//
// Cel: pozwolić wyszukiwarkom (Google, Bing) oraz wyszukiwarkom AI
// (ChatGPT Search, Claude Search) korzystać z publicznych treści, przy
// jednoczesnym NIEwyrażaniu zgody na crawling trenujący modele (GPTBot,
// ClaudeBot) — zgodnie z instrukcją właściciela.
//
// Prywatne/techniczne ścieżki (panele, API, auth) są zablokowane dla
// wszystkich, ale nie blokujemy zasobów _next (CSS/JS/obrazy potrzebne do
// prawidłowego renderowania i oceny strony).
//
// Na liście NIE ma starych adresów z WordPressa (/nauczyciele, /dla-firm,
// /metoda...), które next.config.ts przekierowuje na nowe strony: bota nie
// wolno blokować przed adresem, przez który ma przejść dalej — inaczej stare
// linki przychodzące nie przekazują nic nowym stronom.

const DISALLOW_PRIVATE = [
  '/api/',
  '/admin/',
  '/ufos/',
  '/nauczyciel/',
  '/firma/',
  '/dashboard',
  '/lekcje',
  '/postepy',
  '/polecenia',
  '/platnosci',
  '/rozliczenia',
  '/profil',
  '/kursy',
  '/zapisy',
  '/login',
  '/logowanie',
  '/reset-haslo',
  '/zapomniane-haslo',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Wyszukiwarki AI (odpowiedzi/wyszukiwanie) — dozwolone.
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: DISALLOW_PRIVATE },
      { userAgent: 'Claude-SearchBot', allow: '/', disallow: DISALLOW_PRIVATE },
      { userAgent: 'Claude-User', allow: '/', disallow: DISALLOW_PRIVATE },
      // Klasyczne wyszukiwarki — dozwolone.
      { userAgent: 'Googlebot', allow: '/', disallow: DISALLOW_PRIVATE },
      { userAgent: 'Bingbot', allow: '/', disallow: DISALLOW_PRIVATE },
      // Boty trenujące modele — bez zgody na crawling.
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      // Domyślnie: reszta botów może indeksować część publiczną.
      { userAgent: '*', allow: '/', disallow: DISALLOW_PRIVATE },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
