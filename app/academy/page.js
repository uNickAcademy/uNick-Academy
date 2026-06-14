import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LessonCard from './components/LessonCard'
import UnicornMascot from './components/UnicornMascot'

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
      <section className="bg-gradient-to-b from-navy to-navy/90 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20 flex flex-col items-center text-center gap-6">
          <UnicornMascot className="h-20 w-20" />
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl leading-tight">
            Ready-to-teach ESL lesson plans,<br className="hidden sm:block" /> made for real classrooms.
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-slate-200">
            uNick Teachers Academy gives English teachers worldwide instant access to a growing
            library of CEFR-aligned lesson plans &mdash; created by Nick Rudd, covering every level
            from A1 to C2, for young learners, teens and adults.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/academy/signup"
              className="bg-brand hover:bg-red-700 transition-colors rounded-full px-6 py-3 font-semibold"
            >
              Sign up &amp; subscribe
            </Link>
            <Link
              href="/academy/library"
              className="bg-white/10 hover:bg-white/20 transition-colors border border-white/30 rounded-full px-6 py-3 font-semibold"
            >
              Browse the library
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-heading font-bold text-2xl text-navy text-center mb-2">
          How it works
        </h2>
        <p className="text-center text-slate-600 mb-8">Three simple steps to a fully-stocked lesson plan library.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            ['1. Subscribe', 'Create a free account and subscribe for a low monthly or annual fee, billed in your local currency.'],
            ['2. Browse', 'Filter the library by CEFR level, age group, and topic or skill to find exactly what you need.'],
            ['3. Download', 'Download print-ready PDF lesson plans for your classes, whenever your subscription is active.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
              <h3 className="font-heading font-bold text-navy mb-2">{title}</h3>
              <p className="text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="font-heading font-bold text-2xl text-navy text-center mb-2">
            Try a few lessons for free
          </h2>
          <p className="text-center text-slate-600 mb-8">
            No account needed &mdash; download these sample lesson plans to see what&apos;s inside.
          </p>
          {freeLessons && freeLessons.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-5">
              {freeLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500">Free samples are coming soon &mdash; check back shortly.</p>
          )}
          <div className="text-center mt-8">
            <Link href="/academy/library" className="text-navy font-semibold hover:text-sky">
              See the full library &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14 text-center">
        <h2 className="font-heading font-bold text-2xl text-navy mb-3">
          Unlock the whole library
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-6">
          A uNick Teachers Academy membership gives you unlimited downloads from the full
          collection &mdash; new lesson plans added regularly, all CEFR-aligned and classroom-tested.
        </p>
        <Link
          href="/academy/pricing"
          className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold inline-block"
        >
          See membership pricing
        </Link>
      </section>
    </div>
  )
}
