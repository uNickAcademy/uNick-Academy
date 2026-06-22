import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, phone, audience, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey && !supabaseKey.includes('placeholder')) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase.from('form_submissions').insert({
        form_type: 'contact',
        name,
        email,
        phone: phone || null,
        audience: audience || null,
        message: message || null,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
