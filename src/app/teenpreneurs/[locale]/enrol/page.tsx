import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TP_ENROLMENT, currencyForLocale, formatTpPrice } from '@/lib/teenpreneurs/products'
import { EnrolForm } from '@/components/teenpreneurs/EnrolForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.enrol.title, description: dict.meta.enrol.description }
}

export default async function EnrolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const e = dict.enrol
  const currency = currencyForLocale(locale)

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <div>
          <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{e.hero.kicker}</p>
          <h1 className="mt-4 font-tp-display text-4xl font-extrabold leading-tight text-tp-navy sm:text-5xl">{e.hero.headline}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-tp-ink/85">{e.hero.sub}</p>

          <div className="mt-8 flex flex-wrap items-baseline gap-4 rounded-2xl bg-tp-navy p-6 text-white">
            <div>
              <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sun">{e.priceFounding}</p>
              <p className="font-tp-display text-4xl font-extrabold">{formatTpPrice(TP_ENROLMENT.founding[currency], currency, locale)}</p>
            </div>
            <p className="text-white/60">
              <s>{formatTpPrice(TP_ENROLMENT.standard[currency], currency, locale)}</s> {e.priceStandard}
            </p>
            <p className="w-full font-tp-display text-sm font-semibold text-tp-coral sm:w-auto sm:ml-auto">{e.deadlineNote}</p>
          </div>

          <h2 className="mt-10 font-tp-display text-xl font-bold text-tp-navy">{e.included.title}</h2>
          <ul className="mt-4 space-y-2.5">
            {e.included.items.map(item => (
              <li key={item} className="flex gap-3 text-tp-ink/85">
                <span aria-hidden className="mt-0.5 text-tp-mint">✓</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-3xl border border-tp-navy/10 bg-white p-6 shadow-card sm:p-8 md:sticky md:top-24">
          <EnrolForm dict={dict} locale={locale} />
        </div>
      </div>
    </section>
  )
}
