import Link from 'next/link'
import { AGE_GROUPS } from '@/lib/constants'

const ageLabel = (value) =>
  AGE_GROUPS.find((group) => group.value === value)?.label ?? value

export default function LessonCard({ lesson }) {
  return (
    <Link
      href={`/academy/library/${lesson.id}`}
      className="block bg-white border border-ui-border rounded-card p-6 shadow-card hover:shadow-soft hover:border-brand/30 transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
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
      <h3 className="font-heading font-bold text-lg text-navy mb-1">{lesson.title}</h3>
      <p className="text-sm text-muted mb-3 line-clamp-3 leading-relaxed">{lesson.description}</p>
      <div className="flex flex-wrap gap-1.5 text-xs text-muted">
        <span className="bg-cream rounded-full px-2.5 py-0.5">{ageLabel(lesson.age_group)}</span>
        {(lesson.skills || []).map((skill) => (
          <span key={skill} className="bg-cream rounded-full px-2.5 py-0.5 capitalize">
            {skill}
          </span>
        ))}
      </div>
    </Link>
  )
}
