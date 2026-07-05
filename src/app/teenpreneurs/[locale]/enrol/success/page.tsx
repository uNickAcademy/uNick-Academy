import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from '@/components/teenpreneurs/TpButton'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: getTpDictionary(locale).enrol.success.title, robots: { index: false } }
}

// Warm confirmation after paid enrolment. The enrolment record + welcome
// email come from the Stripe webhook, not from this page.
export default async function EnrolSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const s = dict.enrol.success

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h1 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{s.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-tp-ink/85">{s.text}</p>
      </div>
      <div className="mt-10 rounded-2xl border border-tp-navy/10 bg-white p-7">
        <h2 className="font-tp-display text-lg font-bold text-tp-navy">{s.next.title}</h2>
        <ol className="mt-4 space-y-3">
          {s.next.items.map((item, i) => (
            <li key={item} className="flex gap-3 text-tp-ink/85">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tp-sky font-tp-display text-xs font-bold text-white">{i + 1}</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-8 text-center">
        <TpButton href={`/teenpreneurs/${locale}`} variant="ghost">{s.cta}</TpButton>
      </div>
    </section>
  )
}
