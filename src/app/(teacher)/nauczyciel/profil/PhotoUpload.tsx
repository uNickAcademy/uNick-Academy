'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const OUTPUT_SIZE = 800

// Crops the source image to a centered square and draws it onto a fixed-size canvas,
// so every teacher photo ends up the same dimensions regardless of the original upload.
function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2

      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported'))
      ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))), 'image/png')
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = URL.createObjectURL(file)
  })
}

export function PhotoUpload({ teacherId, photoUrl }: { teacherId: string; photoUrl: string }) {
  const [preview, setPreview] = useState(photoUrl)
  const [status, setStatus] = useState<'idle' | 'processing' | 'uploading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setStatus('processing')
    setErrorMsg(null)

    try {
      const squared = await cropToSquare(file)

      let finalBlob: Blob = squared
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        finalBlob = await removeBackground(squared)
      } catch {
        // Background removal is best-effort (large model download, WASM support varies).
        // Fall back to the plain cropped photo rather than blocking the upload.
      }

      setStatus('uploading')
      const supabase = createClient()
      const path = `${teacherId}/photo.png`
      const { error: uploadError } = await supabase.storage
        .from('teacher-photos')
        .upload(path, finalBlob, { contentType: 'image/png', upsert: true })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('teacher-photos').getPublicUrl(path)
      const bustedUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

      const { error: dbError } = await supabase
        .from('teachers')
        .update({ photo_url: bustedUrl })
        .eq('id', teacherId)
      if (dbError) throw dbError

      setPreview(bustedUrl)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  const busy = status === 'processing' || status === 'uploading'

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">Profile photo</h3>
        <p className="text-sm text-gray-500 mt-1">
          Shown on the public teachers pages. Upload a clear photo of yourself — it&apos;s automatically
          cropped to a square and the background is removed to match the site.
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#E7ECF4] flex items-center justify-center shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-[#23479E]/30">?</span>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            disabled={busy}
            className="hidden"
            id="photo-upload-input"
          />
          <label
            htmlFor="photo-upload-input"
            className={`inline-flex px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${busy ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {status === 'processing' ? 'Removing background…' : status === 'uploading' ? 'Uploading…' : 'Change photo'}
          </label>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </div>
      </div>
    </div>
  )
}
