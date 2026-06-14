import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AGE_GROUPS } from '@/lib/constants'

const ageLabel = (value) => AGE_GROUPS.find((group) => group.value === value)?.label ?? value

export default async function LessonPlanPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from('lesson_plans')
    .select('id, title, description, cefr_level, age_group, skills, is_free')
    .eq('id', id)
    .maybeSingle()

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-bold text-2xl text-navy mb-3">Lesson not available</h1>
        <p className="text-slate-600 mb-6">
          This lesson plan doesn&apos;t exist, or it&apos;s part of the members-only library.
          Subscribe to unlock the full collection.
        </p>
        <Link
          href="/academy/pricing"
          className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold inline-block"
        >
          See membership pricing
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block bg-navy text-white text-xs font-semibold rounded-full px-2.5 py-1">
          {lesson.cefr_level}
        </span>
        {lesson.is_free ? (
          <span className="inline-block bg-sky/20 text-sky-700 text-xs font-semibold rounded-full px-2.5 py-1">
            Free sample
          </span>
        ) : (
          <span className="inline-block bg-brand/10 text-brand text-xs font-semibold rounded-full px-2.5 py-1">
            Members
          </span>
        )}
      </div>

      <h1 className="font-heading font-bold text-3xl text-navy mb-3">{lesson.title}</h1>
      <p className="text-slate-700 mb-4 leading-relaxed">{lesson.description}</p>

      <div className="flex flex-wrap gap-1.5 text-xs text-slate-500 mb-8">
        <span className="bg-slate-100 rounded-full px-2.5 py-1">{ageLabel(lesson.age_group)}</span>
        {(lesson.skills || []).map((skill) => (
          <span key={skill} className="bg-slate-100 rounded-full px-2.5 py-1 capitalize">{skill}</span>
        ))}
      </div>

      <a
        href={`/academy/api/download/${lesson.id}`}
        className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold inline-block"
      >
        Download PDF
      </a>
    </div>
  )
}
