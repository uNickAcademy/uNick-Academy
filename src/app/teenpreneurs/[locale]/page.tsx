import type { Metadata } from 'next'
import Link from 'next/link'
import { getTpDictionary, TpLocale } from '@/lib/teenpreneurs/i18n'
import { TP_ENROLMENT, currencyForLocale, formatTpPrice } from '@/lib/teenpreneurs/products'
import { TpButton } from '@/components/teenpreneurs/TpButton'
import { MediaSlot } from '@/components/teenpreneurs/MediaSlot'
import { Reveal } from '@/components/teenpreneurs/Reveal'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: { absolute: dict.meta.home.title }, description: dict.meta.home.description }
}

const phaseAccents = ['bg-tp-sun', 'bg-tp-sky', 'bg-tp-lilac', 'bg-tp-coral'] as const
const phaseTilts = ['md:-rotate-1 md:translate-y-0', 'md:rotate-1 md:translate-y-6', 'md:-rotate-1 md:translate-y-2', 'md:rotate-1 md:translate-y-8'] as const

export default async function TpHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const base = `/teenpreneurs/${locale as TpLocale}`
  const currency = currencyForLocale(locale)
  const h = dict.home

  return (
    <>
      {/* Hero — deliberately asymmetric: text block left, tilted accents right */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-tp-sky/15" />
        <div aria-hidden className="pointer-events-none absolute right-32 top-40 h-6 w-24 -rotate-12 rounded-full bg-tp-sun/70" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[7fr_5fr] md:items-center md:pb-24 md:pt-20">
          <div>
            <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{h.hero.kicker}</p>
            <h1 className="mt-4 font-tp-display text-4xl font-extrabold leading-[1.05] text-tp-navy sm:text-5xl lg:text-6xl">
              {h.hero.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-tp-ink/85">{h.hero.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <TpButton href={`${base}/enrol`}>{h.hero.ctaEnrol}</TpButton>
              <TpButton href={`${base}/event`} variant="ghost">{h.hero.ctaEvent}</TpButton>
            </div>
            <p className="mt-5 font-tp-display text-sm font-medium text-tp-ink/60">{h.hero.note}</p>
          </div>
          <div className="tp-float">
            <MediaSlot label={h.video.label} caption={h.video.caption} ratio="portrait" className="md:rotate-2" />
          </div>
        </div>
      </section>

      {/* Four phases */}
      <section className="bg-tp-navy py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{h.phases.kicker}</p>
            <h2 className="mt-3 max-w-2xl font-tp-display text-3xl font-extrabold sm:text-4xl">{h.phases.title}</h2>
            <p className="mt-4 max-w-2xl text-white/75">{h.phases.sub}</p>
          </Reveal>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {h.phases.items.map((phase, i) => (
              <Reveal key={phase.name} delay={i * 80}>
                <li className={`h-full rounded-2xl bg-tp-navy-soft p-6 transition-transform ${phaseTilts[i]}`}>
                  <span aria-hidden className={`inline-block h-2.5 w-10 rounded-full ${phaseAccents[i]}`} />
                  <p className="mt-4 font-tp-display text-xs font-semibold uppercase tracking-wider text-white/50">{phase.weeks}</p>
                  <h3 className="mt-1 font-tp-display text-xl font-bold">{phase.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">{phase.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="mt-12">
            <Link href={`${base}/program`} className="font-tp-display font-semibold text-tp-sky underline-offset-4 hover:underline">
              {h.phases.linkLabel} →
            </Link>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{h.who.title}</h2>
            <p className="mt-4 max-w-2xl font-tp-editorial text-lg italic text-tp-ink/75">{h.who.sub}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {h.who.items.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <article className={`h-full rounded-2xl border border-tp-navy/10 bg-white p-7 shadow-sm ${i % 2 ? 'md:translate-y-4' : ''}`}>
                  <h3 className="font-tp-display text-lg font-bold text-tp-navy">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-tp-ink/80">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Founding offer */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-tp-coral px-6 py-12 text-white sm:px-12 md:py-16">
              <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10" />
              <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sun">{h.offer.kicker}</p>
              <div className="mt-4 grid gap-8 md:grid-cols-[3fr_2fr] md:items-center">
                <div>
                  <h2 className="font-tp-display text-3xl font-extrabold sm:text-4xl">{h.offer.title}</h2>
                  <p className="mt-4 max-w-xl leading-relaxed text-white/90">{h.offer.text}</p>
                  <p className="mt-6 inline-block rounded-full bg-tp-navy px-4 py-2 font-tp-display text-sm font-bold">{h.offer.deadline}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                  <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-white/70">{h.offer.priceLabel}</p>
                  <p className="mt-1 font-tp-display text-4xl font-extrabold">
                    {formatTpPrice(TP_ENROLMENT.founding[currency], currency, locale)}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {h.offer.standardLabel}: <s>{formatTpPrice(TP_ENROLMENT.standard[currency], currency, locale)}</s>
                  </p>
                  <TpButton href={`${base}/enrol`} variant="navy" className="mt-5 w-full">{h.offer.cta}</TpButton>
                </div>
              </div>
              <p className="mt-8 max-w-2xl font-tp-editorial italic leading-relaxed text-white/90">{h.offer.guarantee}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Proof placeholder */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy">{h.proof.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl rounded-2xl border-2 border-dashed border-tp-navy/20 bg-tp-sand px-6 py-8 font-tp-editorial italic text-tp-ink/70">
            {h.proof.text}
          </p>
        </div>
      </section>

      {/* Parent trust */}
      <section className="bg-tp-sky-tint py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:grid md:grid-cols-[1fr_2fr] md:gap-12">
          <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy">{h.parents.title}</h2>
          <div>
            <p className="mt-4 leading-relaxed text-tp-ink/85 md:mt-0">{h.parents.text}</p>
            <Link href={`${base}/parents`} className="mt-5 inline-block font-tp-display font-semibold text-tp-navy underline decoration-tp-coral decoration-2 underline-offset-4 hover:text-tp-coral">
              {h.parents.linkLabel} →
            </Link>
          </div>
        </div>
      </section>

      {/* Alternative paths */}
      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-tp-navy/10 bg-white p-8 shadow-sm">
              <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{h.paths.event.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-tp-ink/80">{h.paths.event.text}</p>
              <TpButton href={`${base}/event`} variant="sky" className="mt-6 self-start">{h.paths.event.cta}</TpButton>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="flex h-full flex-col rounded-2xl border border-tp-navy/10 bg-white p-8 shadow-sm md:translate-y-4">
              <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{h.paths.shop.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-tp-ink/80">{h.paths.shop.text}</p>
              <TpButton href={`${base}/shop`} variant="ghost" className="mt-6 self-start">{h.paths.shop.cta}</TpButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
