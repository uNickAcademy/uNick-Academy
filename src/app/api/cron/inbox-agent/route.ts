import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runInboxAgent } from '@/lib/inbox-agent/run'

// Agent Skrzynki: przebieg z harmonogramu (vercel.json). Porządkuje skrzynkę
// szkoły, odpowiada na pewne maile, resztę odkłada do decyzji człowieka.
// Ten sam przebieg można uruchomić ręcznie z panelu /admin/skrzynka.

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const summary = await runInboxAgent(createAdminClient())
  // Brak konfiguracji to nie awaria: agent po prostu czeka na dane logowania.
  return NextResponse.json(summary, { status: summary.error ? 500 : 200 })
}
