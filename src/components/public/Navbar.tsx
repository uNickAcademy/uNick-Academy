'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="uNick Academy" width={100} height={40} className="object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dla-siebie" className="text-sm font-medium text-gray-600 hover:text-[#23479E] transition-colors">Dla siebie</Link>
          <Link href="/dla-firm" className="text-sm font-medium text-gray-600 hover:text-[#23479E] transition-colors">Dla firm</Link>
          <Link href="/nauczyciele" className="text-sm font-medium text-gray-600 hover:text-[#23479E] transition-colors">Nauczyciele</Link>
          <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-[#23479E] transition-colors">Blog</Link>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#23479E] transition-colors">Zaloguj się</Link>
          <Link href="/zapisy" className="px-4 py-2 text-sm font-semibold text-white rounded-full bg-[#D72614] hover:bg-[#B81E10] transition-colors">Zapisz się</Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          <Link href="/dla-siebie" className="font-medium text-gray-700" onClick={() => setOpen(false)}>Dla siebie</Link>
          <Link href="/dla-firm" className="font-medium text-gray-700" onClick={() => setOpen(false)}>Dla firm</Link>
          <Link href="/nauczyciele" className="font-medium text-gray-700" onClick={() => setOpen(false)}>Nauczyciele</Link>
          <Link href="/blog" className="font-medium text-gray-700" onClick={() => setOpen(false)}>Blog</Link>
          <Link href="/login" className="font-medium text-gray-700" onClick={() => setOpen(false)}>Zaloguj się</Link>
          <Link href="/zapisy" className="px-4 py-2 text-sm font-semibold text-white rounded-full bg-[#D72614] text-center" onClick={() => setOpen(false)}>Zapisz się</Link>
        </div>
      )}
    </nav>
  )
}
