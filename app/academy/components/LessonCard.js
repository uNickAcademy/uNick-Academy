import Link from 'next/link'
import { AGE_GROUPS } from '@/lib/constants'

const ageLabel = (value) =>
  AGE_GROUPS.find((group) => group.value === value)?.label ?? value

export default function LessonCard({ lesson }) {
  return (
    <Link
      href={`/academy/library/${lesson.id}`}
      className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky transition-shadow"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
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
      <h3 className="font-heading font-bold text-lg text-navy mb-1">{lesson.title}</h3>
      <p className="text-sm text-slate-600 mb-3 line-clamp-3">{lesson.description}</p>
      <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
        <span className="bg-slate-100 rounded-full px-2 py-0.5">{ageLabel(lesson.age_group)}</span>
        {(lesson.skills || []).map((skill) => (
          <span key={skill} className="bg-slate-100 rounded-full px-2 py-0.5 capitalize">
            {skill}
          </span>
        ))}
      </div>
    </Link>
  )
}
