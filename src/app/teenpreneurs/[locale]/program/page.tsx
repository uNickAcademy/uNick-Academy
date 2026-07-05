import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from '@/components/teenpreneurs/TpButton'
import { Reveal } from '@/components/teenpreneurs/Reveal'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.program.title, description: dict.meta.program.description }
}

const accents = ['bg-tp-sun', 'bg-tp-sky', 'bg-tp-lilac', 'bg-tp-coral'] as const

export default async function ProgramPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const p = dict.program
  const base = `/teenpreneurs/${locale}`

  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-14 sm:px-6 md:pt-20">
        <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{p.hero.kicker}</p>
        <h1 className="mt-4 font-tp-display text-4xl font-extrabold leading-tight text-tp-navy sm:text-5xl">{p.hero.headline}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-tp-ink/85">{p.hero.sub}</p>
      </section>

      {/* Weekly rhythm */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <h2 className="font-tp-display text-2xl font-bold text-tp-navy">{p.rhythm.title}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {p.rhythm.items.map((item, i) => (
            <div key={item.title} className={`rounded-2xl border border-tp-navy/10 bg-white p-6 shadow-sm ${i ? 'sm:translate-y-3' : ''}`}>
              <h3 className="font-tp-display font-bold text-tp-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tp-ink/80">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The four phases, week by week */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ol className="space-y-14">
            {p.phases.map((phase, i) => (
              <Reveal key={phase.name}>
                <li className="relative pl-8 md:pl-12">
                  <span aria-hidden className={`absolute left-0 top-1 h-full w-1.5 rounded-full ${accents[i]}`} />
                  <p className="font-tp-display text-xs font-semibold uppercase tracking-wider text-tp-ink/50">{phase.weeks}</p>
                  <h2 className="mt-1 font-tp-display text-2xl font-extrabold text-tp-navy sm:text-3xl">
                    {i + 1}. {phase.name}
                  </h2>
                  <p className="mt-3 max-w-2xl font-tp-editorial text-lg italic leading-relaxed text-tp-ink/80">{phase.intro}</p>
                  <ul className="mt-5 space-y-2">
                    {phase.weeksDetail.map(week => (
                      <li key={week} className="flex gap-3 text-tp-ink/85">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tp-coral" />
                        <span className="leading-relaxed">{week}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Showcase, guarantee, groups */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-tp-navy p-7 text-white md:col-span-2">
            <h2 className="font-tp-display text-2xl font-bold">{p.showcase.title}</h2>
            <p className="mt-3 leading-relaxed text-white/80">{p.showcase.text}</p>
          </div>
          <div className="rounded-2xl bg-tp-sun p-7 text-tp-navy">
            <h2 className="font-tp-display text-xl font-bold">{p.groups.title}</h2>
            <p className="mt-3 text-sm leading-relaxed">{p.groups.text}</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border-2 border-tp-coral bg-white p-7">
          <h2 className="font-tp-display text-2xl font-bold text-tp-coral">{p.guarantee.title}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-tp-ink/85">{p.guarantee.text}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-6">
        <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy">{p.cta.title}</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <TpButton href={`${base}/enrol`}>{p.cta.enrol}</TpButton>
          <TpButton href={`${base}/event`} variant="ghost">{p.cta.event}</TpButton>
        </div>
      </section>
    </>
  )
}
