import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TP_ENROLMENT, currencyForLocale, formatTpPrice } from '@/lib/teenpreneurs/products'
import { TpButton } from '@/components/teenpreneurs/TpButton'
import { FaqAccordion } from '@/components/teenpreneurs/FaqAccordion'
import { Reveal } from '@/components/teenpreneurs/Reveal'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.parents.title, description: dict.meta.parents.description }
}

export default async function ParentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const p = dict.parents
  const base = `/teenpreneurs/${locale}`
  const currency = currencyForLocale(locale)

  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-14 sm:px-6 md:pt-20">
        <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{p.hero.kicker}</p>
        <h1 className="mt-4 font-tp-display text-4xl font-extrabold leading-tight text-tp-navy sm:text-5xl">{p.hero.headline}</h1>
        <p className="mt-6 max-w-2xl font-tp-editorial text-lg italic leading-relaxed text-tp-ink/80">{p.hero.sub}</p>
      </section>

      {/* Safety specifics */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{p.safety.title}</h2>
          <div className="mt-8 space-y-6">
            {p.safety.items.map((item, i) => (
              <Reveal key={item.title} delay={i * 40}>
                <div className="flex gap-4">
                  <span aria-hidden className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tp-mint font-tp-display text-sm font-bold text-white">✓</span>
                  <div>
                    <h3 className="font-tp-display font-bold text-tp-navy">{item.title}</h3>
                    <p className="mt-1 leading-relaxed text-tp-ink/80">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing plainly */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{p.pricing.title}</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-tp-ink/85">{p.pricing.text}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-tp-coral bg-white p-6">
            <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-coral">{p.pricing.foundingLabel}</p>
            <p className="mt-2 font-tp-display text-4xl font-extrabold text-tp-navy">
              {formatTpPrice(TP_ENROLMENT.founding[currency], currency, locale)}
            </p>
          </div>
          <div className="rounded-2xl border border-tp-navy/15 bg-white p-6">
            <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-ink/50">{p.pricing.standardLabel}</p>
            <p className="mt-2 font-tp-display text-4xl font-extrabold text-tp-ink/50">
              {formatTpPrice(TP_ENROLMENT.standard[currency], currency, locale)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-tp-ink/60">{p.pricing.installmentsNote}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-tp-ink/70">{p.pricing.coolingOff}</p>
        <div className="mt-8 rounded-2xl bg-tp-sun/40 p-6">
          <h3 className="font-tp-display text-lg font-bold text-tp-navy">{p.pricing.guaranteeTitle}</h3>
          <p className="mt-2 leading-relaxed text-tp-ink/85">{p.pricing.guaranteeText}</p>
        </div>
      </section>

      {/* FAQ — data-driven from the dictionary */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{p.faqTitle}</h2>
          <div className="mt-8">
            <FaqAccordion items={p.faq} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{p.contact.title}</h2>
        <p className="mt-3 text-tp-ink/80">{p.contact.text}</p>
        <TpButton href={`${base}/contact`} variant="ghost" className="mt-6">{p.contact.cta}</TpButton>
      </section>
    </>
  )
}
