import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherStudents, getTeacherLessons } from '@/lib/supabase/queries'
import { StudentsView } from './StudentsView'

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const now = new Date()
  const in14days = new Date(now.getTime() + 14 * 86400000)

  const [students, lessons] = await Promise.all([
    getTeacherStudents(teacher.id),
    getTeacherLessons(teacher.id, now.toISOString(), in14days.toISOString()),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1">Students assigned to you and their upcoming lessons.</p>
      </div>

      <StudentsView students={students} lessons={lessons} />
    </div>
  )
}
