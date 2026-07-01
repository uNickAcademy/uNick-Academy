import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId } from '@/lib/supabase/queries'
import { ProfileForm } from './ProfileForm'
import { PhotoUpload } from './PhotoUpload'

export default async function TeacherProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">This information (photo, bio, contact) is visible to students.</p>
      </div>

      <PhotoUpload teacherId={teacher.id} photoUrl={teacher.photo_url ?? ''} />

      <ProfileForm
        teacherId={teacher.id}
        fullName={teacher.profile?.full_name ?? ''}
        bio={teacher.bio ?? ''}
        contactEmail={teacher.contact_email ?? ''}
        whatsappPhone={teacher.whatsapp_phone ?? ''}
        videoUrl={teacher.video_url ?? ''}
      />
    </div>
  )
}
