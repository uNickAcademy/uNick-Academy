import { createClient } from '@/lib/supabase/server'
import { CEFR_LEVELS, AGE_GROUPS, SKILLS } from '@/lib/constants'
import { createLessonPlan } from '../actions'

export default async function NewLessonPlanPage({ searchParams }) {
  const params = await searchParams
  const error = params?.error

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

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">Admin</span>
      <h1 className="font-heading font-bold text-3xl text-navy mb-8 tracking-tight">Add a lesson plan</h1>

      {error && (
        <div className="bg-brand-soft text-brand text-sm rounded-card px-5 py-3 mb-6">{error}</div>
      )}

      <form action={createLessonPlan} encType="multipart/form-data" className="bg-white border border-ui-border rounded-card p-7 shadow-card space-y-5">
        <div>
          <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded-xl border-[1.5px] border-ui-border px-4 py-2.5 text-[15px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition-colors"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-xl border-[1.5px] border-ui-border px-4 py-2.5 text-[15px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition-colors"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="cefr_level">
              CEFR level
            </label>
            <select
              id="cefr_level"
              name="cefr_level"
              required
              className="w-full rounded-xl border-[1.5px] border-ui-border px-3 py-2.5 bg-white text-[14px] focus:outline-none focus:border-brand"
            >
              {CEFR_LEVELS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="age_group">
              Age group
            </label>
            <select
              id="age_group"
              name="age_group"
              required
              className="w-full rounded-xl border-[1.5px] border-ui-border px-3 py-2.5 bg-white text-[14px] focus:outline-none focus:border-brand"
            >
              {AGE_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>{group.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="block text-[13px] font-semibold text-navy mb-2">Skills / topics</span>
          <div className="flex flex-wrap gap-3">
            {SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-1.5 text-sm capitalize text-ink-soft">
                <input type="checkbox" name={`skill_${skill}`} className="rounded border-ui-border" />
                {skill}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="pdf">
            Lesson plan PDF
          </label>
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf"
            required
            className="w-full rounded-xl border-[1.5px] border-ui-border px-4 py-2 bg-white text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="is_free" className="rounded border-ui-border" />
          Free sample (visible to everyone, no subscription required)
        </label>

        <button
          type="submit"
          className="w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold text-[15px]"
        >
          Save lesson plan
        </button>
      </form>
    </div>
  )
}
