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
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <h1 className="font-heading font-bold text-2xl text-navy mb-2">Not authorized</h1>
        <p className="text-muted">This page is only available to academy admins.</p>
      </div>
    )
  }

  const { data: lessons } = await supabase
    .from('lesson_plans')
    .select('id, title, cefr_level, age_group, is_free, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/academy/admin/referrals"
          className="border border-ui-border hover:bg-cream transition-colors text-navy rounded-full px-5 py-2.5 font-semibold text-sm"
        >
          Referrals
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-3xl text-navy tracking-tight">Lesson plans</h1>
        <Link
          href="/academy/admin/new"
          className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-2.5 font-semibold text-[15px]"
        >
          Add lesson plan
        </Link>
      </div>

      <div className="bg-white border border-ui-border rounded-card overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs font-semibold text-muted uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Level</th>
              <th className="px-5 py-3">Age group</th>
              <th className="px-5 py-3">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border/50">
            {(lessons ?? []).map((lesson) => (
              <tr key={lesson.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-5 py-3 font-medium text-navy">
                  <Link href={`/academy/library/${lesson.id}`} className="hover:text-brand transition-colors">
                    {lesson.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted">{lesson.cefr_level}</td>
                <td className="px-5 py-3 text-muted">{ageLabel(lesson.age_group)}</td>
                <td className="px-5 py-3 text-muted">{lesson.is_free ? 'Free' : 'Members'}</td>
              </tr>
            ))}
            {(!lessons || lessons.length === 0) && (
              <tr>
                <td className="px-5 py-8 text-center text-muted" colSpan={4}>
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
