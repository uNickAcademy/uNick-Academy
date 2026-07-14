'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text, label, copiedLabel, className }: {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={className ?? 'flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 text-[#23479E] text-sm font-medium hover:bg-blue-200 transition-colors'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label ? (copied ? copiedLabel ?? label : label) : null}
    </button>
  )
}
