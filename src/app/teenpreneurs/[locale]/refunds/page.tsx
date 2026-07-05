import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { LegalPage } from '@/components/teenpreneurs/LegalPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.refunds.title, description: dict.meta.refunds.description }
}

export default async function RefundsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const r = getTpDictionary(locale).legal.refunds
  return <LegalPage title={r.title} updated={r.updated} sections={r.sections} />
}
