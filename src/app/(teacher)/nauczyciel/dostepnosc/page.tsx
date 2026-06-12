import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherAvailability } from '@/lib/supabase/queries'
import { AvailabilityGrid } from './AvailabilityGrid'

export default async function TeacherAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const availability = await getTeacherAvailability(teacher.id)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Availability</h1>
        <p className="text-gray-500 mt-1">
          Mark the hours when you are available for lessons. This schedule is visible to students.
        </p>
      </div>

      <AvailabilityGrid teacherId={teacher.id} initialAvailability={availability} />
    </div>
  )
}
