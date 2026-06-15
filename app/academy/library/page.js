import { createClient } from '@/lib/supabase/server'
import { CEFR_LEVELS, AGE_GROUPS, SKILLS } from '@/lib/constants'
import LessonCard from '../components/LessonCard'

export default async function LibraryPage({ searchParams }) {
  const params = await searchParams
  const level = params?.level || ''
  const age = params?.age || ''
  const skill = params?.skill || ''

  const supabase = await createClient()
  let query = supabase
    .from('lesson_plans')
    .select('id, title, description, cefr_level, age_group, skills, is_free')
    .order('created_at', { ascending: false })

  if (level) query = query.eq('cefr_level', level)
  if (age) query = query.eq('age_group', age)
  if (skill) query = query.contains('skills', [skill])

  const { data: lessons, error } = await query

  const { data: { user } } = await supabase.auth.getUser()
  let isSubscriber = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    isSubscriber = profile?.subscription_status === 'active'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Lesson plan library</h1>
      <p className="text-slate-600 mb-6">
        Filter by CEFR level, age group, and topic or skill to find your next lesson.
      </p>

      <form className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="level">
            CEFR level
          </label>
          <select
            id="level"
            name="level"
            defaultValue={level}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">All levels</option>
            {CEFR_LEVELS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="age">
            Age group
          </label>
          <select
            id="age"
            name="age"
            defaultValue={age}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">All ages</option>
            {AGE_GROUPS.map((group) => (
              <option key={group.value} value={group.value}>{group.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="skill">
            Topic / skill
          </label>
          <select
            id="skill"
            name="skill"
            defaultValue={skill}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">All skills</option>
            {SKILLS.map((value) => (
              <option key={value} value={value} className="capitalize">{value}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3 flex justify-end gap-3">
          <a href="/academy/library" className="text-sm text-slate-500 self-center hover:text-navy">
            Clear filters
          </a>
          <button
            type="submit"
            className="bg-navy hover:bg-navy/90 transition-colors text-white rounded-full px-5 py-2 text-sm font-semibold"
          >
            Apply filters
          </button>
        </div>
      </form>

      {!isSubscriber && (
        <p className="bg-sky/10 text-navy text-sm rounded-lg px-4 py-3 mb-6">
          You&apos;re seeing our free sample lessons. <a href="/academy/pricing" className="font-semibold underline">Subscribe</a> to unlock the full library.
        </p>
      )}

      {error && (
        <p className="bg-red-50 text-brand text-sm rounded-lg px-4 py-3 mb-6">
          Couldn&apos;t load the library right now. Please try again shortly.
        </p>
      )}

      {lessons && lessons.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-center py-12">No lesson plans match these filters yet.</p>
      )}
    </div>
  )
}
