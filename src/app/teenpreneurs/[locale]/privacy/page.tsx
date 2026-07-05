import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { LegalPage } from '@/components/teenpreneurs/LegalPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.privacy.title, description: dict.meta.privacy.description }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const p = getTpDictionary(locale).legal.privacy
  return <LegalPage title={p.title} updated={p.updated} sections={p.sections} />
}
