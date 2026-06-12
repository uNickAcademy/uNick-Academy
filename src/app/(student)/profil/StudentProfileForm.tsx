'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { t, type Lang } from '@/lib/i18n'

export function StudentProfileForm({ lang, fullName: initialName, phone: initialPhone, email }: {
  lang: Lang; fullName: string; phone: string; email: string
}) {
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [pwSaving, setPwSaving] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSavedMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone: phone || null }).eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSaving(false)
    setSavedMsg(error ? (lang === 'en' ? 'Failed to save.' : 'Nie udało się zapisać.') : t(lang, 'saved'))
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword.length < 8) { setPwMsg(lang === 'en' ? 'Min 8 characters.' : 'Min. 8 znaków.'); return }
    if (newPassword !== confirmPassword) { setPwMsg(lang === 'en' ? 'Passwords do not match.' : 'Hasła nie są identyczne.'); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { setPwMsg(lang === 'en' ? 'Failed to change password.' : 'Nie udało się zmienić hasła.'); return }
    setPwMsg(t(lang, 'password_changed')); setNewPassword(''); setConfirmPassword('')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">{t(lang, 'my_profile')}</h1>
        <p className="text-gray-500 mt-1">{t(lang, 'profile_intro')}</p>
      </div>

      <form onSubmit={saveProfile} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'full_name')}</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} disabled
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'phone')}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+48 600 100 200"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? '...' : t(lang, 'save')}
          </button>
          {savedMsg && <span className="text-sm text-gray-500">{savedMsg}</span>}
        </div>
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-900">{t(lang, 'change_password')}</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'new_password')}</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'repeat_password')}</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pwSaving}
            className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {pwSaving ? '...' : t(lang, 'change_password')}
          </button>
          {pwMsg && <span className="text-sm text-gray-500">{pwMsg}</span>}
        </div>
      </form>
    </div>
  )
}
