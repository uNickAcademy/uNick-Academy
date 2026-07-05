import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from '@/components/teenpreneurs/TpButton'
import { MediaSlot } from '@/components/teenpreneurs/MediaSlot'
import { Reveal } from '@/components/teenpreneurs/Reveal'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.differentability.title, description: dict.meta.differentability.description }
}

// The heart of the brand — editorial page, Lora leads.
export default async function DifferentabilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const d = dict.differentability
  const base = `/teenpreneurs/${locale}`

  return (
    <>
      <section className="bg-tp-navy py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{d.hero.kicker}</p>
          <h1 className="mt-5 font-tp-editorial text-4xl font-medium italic leading-tight text-tp-sun sm:text-6xl">
            {d.hero.headline}
          </h1>
          <p className="mt-6 font-tp-editorial text-lg text-white/75">{d.hero.sub}</p>
        </div>
      </section>

      <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
        <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy">{d.story.title}</h2>
        <div className="mt-8 space-y-6 font-tp-editorial text-lg leading-[1.8] text-tp-ink">
          {d.story.paragraphs.slice(0, 2).map(para => (
            <p key={para.slice(0, 32)}>{para}</p>
          ))}
        </div>

        <Reveal>
          <blockquote className="my-12 border-l-4 border-tp-coral pl-6">
            <p className="font-tp-editorial text-2xl italic leading-relaxed text-tp-navy">{d.story.pullQuote}</p>
            <footer className="mt-3 font-tp-display text-sm font-medium text-tp-ink/60">{d.story.pullQuoteAttribution}</footer>
          </blockquote>
        </Reveal>

        <div className="space-y-6 font-tp-editorial text-lg leading-[1.8] text-tp-ink">
          {d.story.paragraphs.slice(2).map(para => (
            <p key={para.slice(0, 32)}>{para}</p>
          ))}
        </div>

        <div className="my-14">
          <MediaSlot label={d.video.label} caption={d.video.caption} />
        </div>

        <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy">{d.mission.title}</h2>
        <div className="mt-8 space-y-6 font-tp-editorial text-lg leading-[1.8] text-tp-ink">
          {d.mission.paragraphs.map(para => (
            <p key={para.slice(0, 32)}>{para}</p>
          ))}
        </div>
      </article>

      <section className="bg-tp-sky-tint py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-tp-display text-3xl font-extrabold text-tp-navy">{d.cta.title}</h2>
          <p className="mt-4 font-tp-editorial text-lg italic text-tp-ink/80">{d.cta.text}</p>
          <TpButton href={`${base}/program`} className="mt-7">{d.cta.button}</TpButton>
        </div>
      </section>
    </>
  )
}
