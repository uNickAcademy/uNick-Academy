import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PwaRegister } from './PwaRegister'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
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
    <html lang="pl" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
