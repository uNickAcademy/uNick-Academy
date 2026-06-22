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
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="font-heading font-bold text-2xl text-navy mb-3 tracking-tight">Lesson not available</h1>
        <p className="text-muted mb-6">
          This lesson plan doesn&apos;t exist, or it&apos;s part of the members-only library.
          Subscribe to unlock the full collection.
        </p>
        <Link
          href="/academy/pricing"
          className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-7 py-3 font-semibold inline-block text-[15px]"
        >
          See membership pricing
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block bg-navy text-white text-xs font-semibold rounded-full px-2.5 py-1">
          {lesson.cefr_level}
        </span>
        {lesson.is_free ? (
          <span className="inline-block bg-cream-deep text-navy text-xs font-semibold rounded-full px-2.5 py-1">
            Free sample
          </span>
        ) : (
          <span className="inline-block bg-brand-soft text-brand text-xs font-semibold rounded-full px-2.5 py-1">
            Members
          </span>
        )}
      </div>

      <h1 className="font-heading font-bold text-3xl text-navy mb-3 tracking-tight">{lesson.title}</h1>
      <p className="text-ink-soft mb-4 leading-relaxed">{lesson.description}</p>

      <div className="flex flex-wrap gap-1.5 text-xs text-muted mb-8">
        <span className="bg-cream rounded-full px-2.5 py-1">{ageLabel(lesson.age_group)}</span>
        {(lesson.skills || []).map((skill) => (
          <span key={skill} className="bg-cream rounded-full px-2.5 py-1 capitalize">{skill}</span>
        ))}
      </div>

      <a
        href={`/academy/api/download/${lesson.id}`}
        className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-7 py-3 font-semibold inline-block text-[15px]"
      >
        Download PDF
      </a>
    </div>
  )
}
