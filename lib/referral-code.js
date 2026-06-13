import { randomInt } from 'crypto'
import { prisma } from './prisma'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion
const CODE_LENGTH = 6

function randomSegment() {
  let segment = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    segment += ALPHABET[randomInt(ALPHABET.length)]
  }
  return segment
}

// Generates a unique, human-friendly referral code, e.g. "UNICK-7F3KQM".
export async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `UNICK-${randomSegment()}`
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique referral code, please retry')
}
