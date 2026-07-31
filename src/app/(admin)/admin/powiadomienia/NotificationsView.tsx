'use client'

import Link from 'next/link'
import { Bell, Users, Monitor, MapPin, MessageCircleQuestion, Building2 } from 'lucide-react'

type Item = {
  id: string
  createdAt: string
  kind: string
  title: string
  body: string
  studentId: string | null
  wasUnread: boolean
}

const KIND_META: Record<string, { icon: typeof Users; color: string; label: string }> = {
  group: { icon: Users, color: 'text-violet-600 bg-violet-50', label: 'Grupa' },
  online: { icon: Monitor, color: 'text-blue-600 bg-blue-50', label: 'Online' },
  stationary: { icon: MapPin, color: 'text-emerald-600 bg-emerald-50', label: 'Stacjonarnie' },
  consultation: { icon: MessageCircleQuestion, color: 'text-amber-600 bg-amber-50', label: 'Konsultacja' },
  b2b: { icon: Building2, color: 'text-gray-600 bg-gray-100', label: 'B2B' },
}

export function NotificationsView({ items }: { items: Item[] }) {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6"><Bell size={22} />Powiadomienia</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">
          Brak powiadomień. Nowe zapisy z formularzy pojawią się tutaj.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const meta = KIND_META[n.kind] ?? { icon: Bell, color: 'text-gray-600 bg-gray-100', label: n.kind }
            const Icon = meta.icon
            // Zapisy wymagające decyzji prowadzą do panelu zatwierdzania,
            // reszta — do profilu ucznia, jeśli jest z czym go powiązać.
            const href = n.kind === 'online' ? '/admin/zapisy#online'
              : n.kind === 'stationary' ? '/admin/zapisy#stacjonarne'
              : n.studentId ? `/admin/studenci/${n.studentId}`
              : null
            const card = (
              <div className={`flex items-start gap-3 bg-white rounded-2xl border p-4 transition-colors ${n.wasUnread ? 'border-[#23479E]/30 bg-[#EAF3FF]/40' : 'border-gray-100'} ${href ? 'hover:bg-gray-50' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                    {n.wasUnread && <span className="w-2 h-2 rounded-full bg-[#23479E]" />}
                  </div>
                  {n.body && <p className="text-sm text-gray-500 mt-0.5 break-words">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{n.createdAt}</p>
                </div>
              </div>
            )
            return href
              ? <Link key={n.id} href={href}>{card}</Link>
              : <div key={n.id}>{card}</div>
          })}
        </div>
      )}
    </div>
  )
}
