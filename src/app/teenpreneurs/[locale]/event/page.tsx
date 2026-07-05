import type { Metadata } from 'next'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { EventForm } from '@/components/teenpreneurs/EventForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  return { title: dict.meta.event.title, description: dict.meta.event.description }
}

export default async function EventPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getTpDictionary(locale)
  const ev = dict.event

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <div>
          <p className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{ev.hero.kicker}</p>
          <h1 className="mt-4 font-tp-display text-4xl font-extrabold leading-tight text-tp-navy sm:text-5xl">{ev.hero.headline}</h1>
          <p className="mt-4 inline-block rounded-full bg-tp-sun px-5 py-2 font-tp-display font-bold text-tp-navy">{ev.hero.date}</p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-tp-ink/85">{ev.hero.sub}</p>

          <h2 className="mt-10 font-tp-display text-xl font-bold text-tp-navy">{ev.what.title}</h2>
          <ul className="mt-4 space-y-3">
            {ev.what.items.map(item => (
              <li key={item} className="flex gap-3 text-tp-ink/85">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tp-coral" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-xl font-tp-editorial italic leading-relaxed text-tp-ink/70">{ev.after}</p>
        </div>

        <div className="h-fit rounded-3xl border border-tp-navy/10 bg-white p-6 shadow-card sm:p-8 md:sticky md:top-24">
          <EventForm dict={dict} locale={locale} />
        </div>
      </div>
    </section>
  )
}
