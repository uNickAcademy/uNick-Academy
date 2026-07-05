import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.contact.title, description: dict.meta.contact.description }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const c = getTpDictionary(locale).legal.contact

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
      <h1 className="font-tp-display text-4xl font-extrabold text-tp-navy">{c.title}</h1>
      <p className="mt-5 font-tp-editorial text-lg leading-relaxed text-tp-ink/85">{c.text}</p>
      <div className="mt-10 rounded-2xl border border-tp-navy/10 bg-white p-7">
        <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{c.emailLabel}</p>
        <a href={`mailto:${c.email}`} className="mt-1 block font-tp-display text-2xl font-bold text-tp-coral hover:underline">
          {c.email}
        </a>
        <p className="mt-6 font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{c.companyTitle}</p>
        <ul className="mt-1 space-y-0.5 text-tp-ink/80">
          {c.companyLines.map(line => <li key={line}>{line}</li>)}
        </ul>
      </div>
    </section>
  )
}
