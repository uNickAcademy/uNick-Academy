import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// TYMCZASOWE (nabór wrzesień 2026) — admin dla zgłoszeń z /pl/dostepnosc.
// Usuń razem z resztą naboru, patrz docs/FORMULARZ-DOSTEPNOSCI.md.

const ALLOWED = ['contacted', 'archived'] as const
type AllowedStatus = (typeof ALLOWED)[number]

async function requireTeamRole() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) return null
  return user
}

const cell = (value: unknown) => {
  let text = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
const csvRow = (values: unknown[]) => values.map(cell).join(';')

// Eksport CSV wszystkich zgłoszeń — do planowania grafiku poza panelem.
export async function GET(request: NextRequest) {
  const user = await requireTeamRole()
  if (!user) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  if (request.nextUrl.searchParams.get('format') !== 'csv') {
    return NextResponse.json({ error: 'Nieobsługiwany format' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('availability_declarations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Błąd eksportu' }, { status: 500 })

  const columns = [
    'created_at', 'status', 'parent_first_name', 'parent_last_name', 'email', 'phone',
    'child_name', 'child_age', 'level', 'mode', 'class_format', 'address', 'school_name',
    'school_city', 'availability_text', 'notes', 'referral_code', 'assigned_referral_code',
  ]
  const lines = [csvRow(columns), ...(data ?? []).map((row) => csvRow(columns.map((c) => row[c])))]

  return new Response(`﻿${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="dostepnosc-wrzesien.csv"',
      'Cache-Control': 'private, no-store',
    },
  })
}

// Zmiana statusu zgłoszenia (skontaktowano się / zarchiwizuj) z listy w panelu.
export async function POST(request: NextRequest) {
  const user = await requireTeamRole()
  if (!user) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const { id, status } = await request.json()
  if (!id || !ALLOWED.includes(status as AllowedStatus)) {
    return NextResponse.json({ error: 'Brakujące lub nieznane pola' }, { status: 400 })
  }

  const db = createAdminClient()
  const { error } = await db.from('availability_declarations').update({ status }).eq('id', id)
  if (error) {
    console.error('[Admin dostępność] update error:', error)
    return NextResponse.json({ error: 'Nie udało się zapisać zmiany.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
