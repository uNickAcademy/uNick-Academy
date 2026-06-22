import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AGE_GROUPS } from '@/lib/constants'

const ageLabel = (value) => AGE_GROUPS.find((group) => group.value === value)?.label ?? value

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-bold text-2xl text-navy mb-2">Not authorized</h1>
        <p className="text-slate-600">This page is only available to academy admins.</p>
      </div>
    )
  }

  const { data: lessons } = await supabase
    .from('lesson_plans')
    .select('id, title, cefr_level, age_group, is_free, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/academy/admin/referrals"
          className="border border-slate-200 hover:bg-slate-50 transition-colors text-navy rounded-full px-5 py-2.5 font-semibold text-sm"
        >
          Referrals
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-3xl text-navy">Lesson plans</h1>
        <Link
          href="/academy/admin/new"
          className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-5 py-2.5 font-semibold"
        >
          Add lesson plan
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Age group</th>
              <th className="px-4 py-3">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(lessons ?? []).map((lesson) => (
              <tr key={lesson.id}>
                <td className="px-4 py-3 font-medium text-navy">
                  <Link href={`/academy/library/${lesson.id}`} className="hover:text-sky">
                    {lesson.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{lesson.cefr_level}</td>
                <td className="px-4 py-3">{ageLabel(lesson.age_group)}</td>
                <td className="px-4 py-3">{lesson.is_free ? 'Free' : 'Members'}</td>
              </tr>
            ))}
            {(!lessons || lessons.length === 0) && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                  No lesson plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
