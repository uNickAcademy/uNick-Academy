import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { siteConfig } from './lib/site-config'
import { PwaRegister } from './PwaRegister'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
})

// Fonty strony marketingowej (sekcja [locale]). Zmienne CSS są dostępne
// globalnie, lecz korzystają z nich tylko style marketingu (marketing.css).
const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  // Bez tego względne adresy w metadanych (kanoniczne, obrazki OG) rozwiązują
  // się względem zgadywanego origin, a poza [locale] nikt metadataBase nie
  // ustawiał. Layout marketingowy ustawia to samo u siebie, więc nic nie traci.
  metadataBase: new URL(siteConfig.url),
  title: 'uNick Academy – Szkoła Języka Angielskiego',
  description: 'Nauka angielskiego online i offline. Wybierz nauczyciela, zarezerwuj lekcję i zacznij mówić po angielsku już dziś.',
  keywords: ['angielski', 'nauka', 'online', 'lekcje', 'uNick Academy'],
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'uNick' },
}

export const viewport: Viewport = {
  themeColor: '#23479E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl" className={`${inter.variable} ${fraunces.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
