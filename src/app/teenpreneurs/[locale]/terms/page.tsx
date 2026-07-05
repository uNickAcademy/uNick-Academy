import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { LegalPage } from '@/components/teenpreneurs/LegalPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.terms.title, description: dict.meta.terms.description }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getTpDictionary(locale).legal.terms
  return <LegalPage title={t.title} updated={t.updated} sections={t.sections} />
}
