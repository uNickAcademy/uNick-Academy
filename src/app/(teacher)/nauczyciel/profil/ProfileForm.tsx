'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ProfileForm({
  teacherId,
  fullName,
  bio: initialBio,
  contactEmail: initialContactEmail,
  whatsappPhone: initialWhatsappPhone,
  videoUrl: initialVideoUrl,
}: {
  teacherId: string
  fullName: string
  bio: string
  contactEmail: string
  whatsappPhone: string
  videoUrl: string
}) {
  const [bio, setBio] = useState(initialBio)
  const [contactEmail, setContactEmail] = useState(initialContactEmail)
  const [whatsappPhone, setWhatsappPhone] = useState(initialWhatsappPhone)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedMsg(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('teachers')
      .update({ bio, contact_email: contactEmail, whatsapp_phone: whatsappPhone || null, video_url: videoUrl || null })
      .eq('id', teacherId)

    setSaving(false)
    setSavedMsg(error ? 'Failed to save.' : 'Saved!')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.')
      return
    }

    setPasswordSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)

    if (error) {
      setPasswordMsg('Failed to change password.')
      return
    }

    setPasswordMsg('Password changed!')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={fullName}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact email (visible to students)</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@unick-academy.pl"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp number</label>
          <input
            type="tel"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="+48 600 100 200"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">Used so the school can message you and your students on WhatsApp.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Intro video (YouTube link)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtu.be/..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">
            If set, students see a video tile instead of your photo on the &quot;Meet Us&quot; page — clicking it plays the video.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            placeholder="Tell students about yourself..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {savedMsg && <span className="text-sm text-gray-500">{savedMsg}</span>}
        </div>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-900">Change password</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={passwordSaving}
            className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {passwordSaving ? 'Saving...' : 'Change password'}
          </button>
          {passwordMsg && <span className="text-sm text-gray-500">{passwordMsg}</span>}
        </div>
      </form>
    </div>
  )
}
