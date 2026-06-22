import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import LessonCard from './components/LessonCard'

export default async function AcademyHomePage() {
  const supabase = await createClient()
  const { data: freeLessons } = await supabase
    .from('lesson_plans')
    .select('id, title, description, cefr_level, age_group, skills, is_free')
    .eq('is_free', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div>
      <section className="bg-gradient-to-b from-navy to-navy-bright text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
          <span className="text-5xl">&#x1F984;</span>
          <h1 className="font-heading font-bold text-3xl sm:text-[2.8rem] leading-[1.15] tracking-tight max-w-3xl">
            Ready-to-teach ESL lesson plans,<br className="hidden sm:block" /> made for real classrooms.
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-white/75 leading-relaxed">
            uNick Teachers Academy gives English teachers worldwide instant access to a growing
            library of CEFR-aligned lesson plans &mdash; created by Nick Rudd, covering every level
            from A1 to C2, for young learners, teens and adults.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Link
              href="/academy/signup"
              className="bg-brand hover:bg-red-700 transition-colors rounded-full px-7 py-3.5 font-semibold text-[15px]"
            >
              Sign up &amp; subscribe
            </Link>
            <Link
              href="/academy/library"
              className="bg-white/10 hover:bg-white/20 transition-colors border border-white/25 rounded-full px-7 py-3.5 font-semibold text-[15px]"
            >
              Browse the library
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">How it works</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-navy">Three simple steps</h2>
          <p className="text-muted mt-2 max-w-lg mx-auto">Get a fully-stocked lesson plan library in minutes.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            ['1. Subscribe', 'Create a free account and subscribe for a low monthly or annual fee, billed in your local currency.'],
            ['2. Browse', 'Filter the library by CEFR level, age group, and topic or skill to find exactly what you need.'],
            ['3. Download', 'Download print-ready PDF lesson plans for your classes, whenever your subscription is active.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white border border-ui-border rounded-card p-6 text-center shadow-card">
              <h3 className="font-heading font-bold text-navy mb-2 text-lg">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">Free samples</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-navy">Try a few lessons for free</h2>
            <p className="text-muted mt-2">No account needed &mdash; download these samples to see what&apos;s inside.</p>
          </div>
          {freeLessons && freeLessons.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-5">
              {freeLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">Free samples are coming soon &mdash; check back shortly.</p>
          )}
          <div className="text-center mt-8">
            <Link href="/academy/library" className="text-navy font-semibold hover:text-brand transition-colors text-[15px]">
              See the full library &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-16 text-center">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-navy mb-3">
          Unlock the whole library
        </h2>
        <p className="text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
          A uNick Teachers Academy membership gives you unlimited downloads from the full
          collection &mdash; new lesson plans added regularly, all CEFR-aligned and classroom-tested.
        </p>
        <Link
          href="/academy/pricing"
          className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-7 py-3.5 font-semibold inline-block text-[15px]"
        >
          See membership pricing
        </Link>
      </section>
    </div>
  )
}
