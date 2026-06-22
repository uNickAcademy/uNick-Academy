import { randomInt } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function randomSegment() {
  let segment = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    segment += ALPHABET[randomInt(ALPHABET.length)]
  }
  return segment
}

export async function generateUniqueReferralCode() {
  const db = createAdminClient()
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `UNICK-${randomSegment()}`
    const { data: existing } = await db
      .from('students')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!existing) return code
  }
  throw new Error('Could not generate a unique referral code, please retry')
}
