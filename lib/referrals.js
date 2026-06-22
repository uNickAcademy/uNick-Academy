import { createAdminClient } from '@/lib/supabase/admin'
import {
  REFERRAL_BONUS_PLN,
  QUALIFYING_PURCHASE_MIN_PLN,
  QUALIFYING_PURCHASE_TYPES,
  CREDIT_INELIGIBLE_PURCHASE_TYPES,
  MIN_LESSONS_FOR_REFERRER_REWARD,
  MAX_CREDIT_REDEMPTION_RATIO,
} from './constants'

function supabase() {
  return createAdminClient()
}

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

export function looseEmailKey(email) {
  const normalized = normalizeEmail(email)
  const [local, domain] = normalized.split('@')
  if (!domain) return normalized
  const strippedTag = local.split('+')[0]
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com'
  const finalLocal = isGmail ? strippedTag.replace(/\./g, '') : strippedTag
  return `${finalLocal}@${domain}`
}

export function normalizePhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return digits.slice(-9)
}

const ELIGIBILITY_ERRORS = {
  invalid_code: 'This referral code does not exist.',
  self_referral: 'You cannot use your own referral code.',
  already_referred: 'This account has already used a referral code.',
  existing_student: 'Referral codes are only for brand new students.',
  b2b_excluded: 'Corporate (B2B) accounts are not part of the referral programme.',
}

export function checkReferralEligibility({ referrer, candidate, candidatePurchaseCount, candidateReferral }) {
  if (!referrer) {
    return { ok: false, reason: 'invalid_code', message: ELIGIBILITY_ERRORS.invalid_code }
  }

  if (referrer.company_id || candidate.company_id) {
    return { ok: false, reason: 'b2b_excluded', message: ELIGIBILITY_ERRORS.b2b_excluded }
  }

  if (referrer.id === candidate.id) {
    return { ok: false, reason: 'self_referral', message: ELIGIBILITY_ERRORS.self_referral }
  }

  if (candidateReferral) {
    return { ok: false, reason: 'already_referred', message: ELIGIBILITY_ERRORS.already_referred }
  }

  if (candidatePurchaseCount > 0) {
    return { ok: false, reason: 'existing_student', message: ELIGIBILITY_ERRORS.existing_student }
  }

  const candidateEmail = normalizeEmail(candidate.email)
  const referrerEmail = normalizeEmail(referrer.email)
  if (candidateEmail && referrerEmail && candidateEmail === referrerEmail) {
    return { ok: false, reason: 'self_referral', message: ELIGIBILITY_ERRORS.self_referral }
  }

  const candidatePhone = normalizePhone(candidate.phone)
  const referrerPhone = normalizePhone(referrer.phone)
  if (candidatePhone && referrerPhone && candidatePhone === referrerPhone) {
    return { ok: false, reason: 'self_referral', message: ELIGIBILITY_ERRORS.self_referral }
  }

  let flagged = false
  let flagReason = null
  if (candidateEmail && referrerEmail && looseEmailKey(candidateEmail) === looseEmailKey(referrerEmail)) {
    flagged = true
    flagReason = 'Referred email looks like a variant of the referrer\'s email.'
  }

  return { ok: true, flagged, flagReason }
}

export class ReferralError extends Error {
  constructor(reason, message) {
    super(message)
    this.reason = reason
  }
}

export async function applyReferralCode({ candidateStudentId, code }) {
  const normalizedCode = (code || '').trim().toUpperCase()
  const db = supabase()

  const { data: candidate } = await db
    .from('students')
    .select('id, company_id, phone, profile_id, profiles(email)')
    .eq('id', candidateStudentId)
    .single()

  if (!candidate) throw new ReferralError('not_found', 'Account not found.')

  const candidateEmail = candidate.profiles?.email

  const { data: candidateReferral } = await db
    .from('referrals')
    .select('id')
    .eq('referred_id', candidateStudentId)
    .maybeSingle()

  const { count: purchaseCount } = await db
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', candidateStudentId)

  const { data: referrer } = await db
    .from('students')
    .select('id, company_id, phone, profile_id, profiles(email)')
    .eq('referral_code', normalizedCode)
    .maybeSingle()

  const referrerEmail = referrer?.profiles?.email

  const eligibility = checkReferralEligibility({
    referrer: referrer ? { ...referrer, email: referrerEmail } : null,
    candidate: { ...candidate, email: candidateEmail },
    candidatePurchaseCount: purchaseCount || 0,
    candidateReferral,
  })

  if (!eligibility.ok) {
    throw new ReferralError(eligibility.reason, eligibility.message)
  }

  const { data: referral, error: refError } = await db
    .from('referrals')
    .insert({
      code: normalizedCode,
      referrer_id: referrer.id,
      referred_id: candidate.id,
      flagged: eligibility.flagged || false,
      flag_reason: eligibility.flagReason,
    })
    .select()
    .single()

  if (refError) throw new ReferralError('insert_failed', refError.message)

  await db.from('credit_transactions').insert({
    student_id: candidate.id,
    amount: REFERRAL_BONUS_PLN,
    reason: 'referred_signup_bonus',
    status: 'pending',
    referral_id: referral.id,
    note: 'Welcome bonus for using a referral code (becomes usable after a qualifying purchase).',
  })

  return referral
}

export function computeIsQualifyingPurchase({ amount, type }) {
  return amount >= QUALIFYING_PURCHASE_MIN_PLN || QUALIFYING_PURCHASE_TYPES.includes(type)
}

export async function recordPurchase({ studentId, amount, type, status = 'paid' }) {
  const db = supabase()

  const { data: purchase } = await db
    .from('purchases')
    .insert({
      student_id: studentId,
      amount,
      type,
      status,
      is_qualifying: computeIsQualifyingPurchase({ amount, type }),
    })
    .select()
    .single()

  if (purchase.status === 'paid' && purchase.is_qualifying) {
    await qualifyReferralForPurchase(purchase)
  }

  return purchase
}

async function qualifyReferralForPurchase(purchase) {
  const db = supabase()

  const { data: referral } = await db
    .from('referrals')
    .select('id, referrer_id, referred_id, status')
    .eq('referred_id', purchase.student_id)
    .maybeSingle()

  if (!referral || referral.status !== 'pending') return

  await db.from('referrals').update({
    status: 'qualified',
    qualified_at: new Date().toISOString(),
    qualifying_purchase_id: purchase.id,
  }).eq('id', referral.id)

  await db.from('credit_transactions').update({ status: 'active' })
    .eq('referral_id', referral.id)
    .eq('reason', 'referred_signup_bonus')
    .eq('status', 'pending')

  await tryRewardReferrer(referral.id)
}

export async function recordLesson({ studentId, attended = true, isTrial = false, purchaseId = null }) {
  const db = supabase()

  const { data: lesson } = await db
    .from('lessons')
    .insert({ student_id: studentId, attended, is_trial: isTrial, purchase_id: purchaseId })
    .select()
    .single()

  if (attended && !isTrial) {
    const { data: referral } = await db
      .from('referrals')
      .select('id, status')
      .eq('referred_id', studentId)
      .maybeSingle()

    if (referral && referral.status === 'qualified') {
      await tryRewardReferrer(referral.id)
    }
  }

  return lesson
}

async function getAttendedLessonCount(studentId) {
  const db = supabase()
  const { count } = await db
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('attended', true)
    .eq('is_trial', false)
  return count || 0
}

export async function tryRewardReferrer(referralId) {
  const db = supabase()

  const { data: referral } = await db
    .from('referrals')
    .select('id, referrer_id, referred_id, status, flagged, qualifying_purchase_id')
    .eq('id', referralId)
    .single()

  if (!referral || referral.status !== 'qualified') return referral

  if (referral.qualifying_purchase_id) {
    const { data: qp } = await db
      .from('purchases')
      .select('status')
      .eq('id', referral.qualifying_purchase_id)
      .single()
    if (!qp || qp.status !== 'paid') return referral
  }

  const lessonCount = await getAttendedLessonCount(referral.referred_id)
  if (lessonCount < MIN_LESSONS_FOR_REFERRER_REWARD) return referral

  if (referral.flagged) {
    await db.from('referrals').update({ status: 'reward_pending' }).eq('id', referral.id)
    return { ...referral, status: 'reward_pending' }
  }

  return grantReferrerReward(referral.id)
}

export async function grantReferrerReward(referralId) {
  const db = supabase()

  const { data: referral } = await db
    .from('referrals')
    .select('id, referrer_id, referred_id, rewarded_at')
    .eq('id', referralId)
    .single()

  if (!referral) throw new ReferralError('not_found', 'Referral not found.')

  const { data: alreadyGranted } = await db
    .from('credit_transactions')
    .select('id')
    .eq('referral_id', referral.id)
    .eq('reason', 'referrer_bonus')
    .maybeSingle()

  if (alreadyGranted) {
    const { data: updated } = await db.from('referrals').update({
      status: 'rewarded',
      rewarded_at: referral.rewarded_at ?? new Date().toISOString(),
    }).eq('id', referral.id).select().single()
    return updated
  }

  await db.from('credit_transactions').insert({
    student_id: referral.referrer_id,
    amount: REFERRAL_BONUS_PLN,
    reason: 'referrer_bonus',
    status: 'active',
    referral_id: referral.id,
    note: 'Reward for a successful referral.',
  })

  const { data: updated } = await db.from('referrals').update({
    status: 'rewarded',
    rewarded_at: new Date().toISOString(),
  }).eq('id', referral.id).select().single()

  return updated
}

export async function updatePurchaseStatus({ purchaseId, status }) {
  const db = supabase()

  const { data: purchase } = await db
    .from('purchases')
    .update({ status })
    .eq('id', purchaseId)
    .select()
    .single()

  if (status === 'paid') return purchase

  const { data: referral } = await db
    .from('referrals')
    .select('id, status')
    .eq('qualifying_purchase_id', purchase.id)
    .maybeSingle()

  if (!referral) return purchase
  if (referral.status === 'rejected' || referral.status === 'cancelled') return purchase

  await reverseReferralCredits(referral.id)

  await db.from('referrals').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
  }).eq('id', referral.id)

  return purchase
}

export async function reverseReferralCredits(referralId) {
  const db = supabase()

  await db.from('credit_transactions').update({ status: 'cancelled' })
    .eq('referral_id', referralId)
    .eq('reason', 'referred_signup_bonus')
    .eq('status', 'pending')

  const { data: grants } = await db
    .from('credit_transactions')
    .select('id, student_id, amount, reason')
    .eq('referral_id', referralId)
    .eq('status', 'active')
    .in('reason', ['referred_signup_bonus', 'referrer_bonus'])
    .gt('amount', 0)

  if (!grants) return

  for (const grant of grants) {
    const { data: alreadyReversed } = await db
      .from('credit_transactions')
      .select('id')
      .eq('referral_id', referralId)
      .eq('reason', 'referral_reversal')
      .eq('student_id', grant.student_id)
      .maybeSingle()

    if (alreadyReversed) continue

    await db.from('credit_transactions').insert({
      student_id: grant.student_id,
      amount: -grant.amount,
      reason: 'referral_reversal',
      status: 'active',
      referral_id: referralId,
      note: 'Referral credit reversed (qualifying purchase refunded/cancelled).',
    })
  }
}

export async function getCreditSummary(studentId) {
  const db = supabase()

  const { data: transactions } = await db
    .from('credit_transactions')
    .select('*')
    .eq('student_id', studentId)

  const items = transactions || []

  const balance = items
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const pending = items
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return { balance: round2(balance), pending: round2(pending), transactions: items }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

export async function getMaxCreditRedemption({ studentId, amount, type }) {
  if (CREDIT_INELIGIBLE_PURCHASE_TYPES.includes(type)) return 0

  const { balance } = await getCreditSummary(studentId)
  if (balance <= 0) return 0

  const cap = amount * MAX_CREDIT_REDEMPTION_RATIO
  return round2(Math.max(0, Math.min(balance, cap)))
}

export async function redeemCredit({ studentId, purchaseId, amount }) {
  if (amount <= 0) return null
  const db = supabase()

  const { data: purchase } = await db
    .from('purchases')
    .select('*')
    .eq('id', purchaseId)
    .eq('student_id', studentId)
    .single()

  if (!purchase) throw new ReferralError('not_found', 'Purchase not found.')

  const maxRedeemable = await getMaxCreditRedemption({ studentId, amount: Number(purchase.amount), type: purchase.type })
  const redeemed = round2(Math.min(amount, maxRedeemable))
  if (redeemed <= 0) return null

  await db.from('credit_transactions').insert({
    student_id: studentId,
    amount: -redeemed,
    reason: 'redemption',
    status: 'active',
    purchase_id: purchaseId,
    note: 'Account credit applied to a purchase.',
  })

  const { data: updated } = await db
    .from('purchases')
    .update({ credit_applied: Number(purchase.credit_applied) + redeemed })
    .eq('id', purchaseId)
    .select()
    .single()

  return updated
}

export async function getStudentReferralOverview(studentId) {
  const db = supabase()

  const [
    { data: student },
    credit,
    { data: referralsMade },
    { data: referralReceived },
    { count: purchaseCount },
  ] = await Promise.all([
    db.from('students').select('id, referral_code, company_id').eq('id', studentId).single(),
    getCreditSummary(studentId),
    db.from('referrals').select('id, status, created_at, qualified_at, rewarded_at, referred_id').eq('referrer_id', studentId).order('created_at', { ascending: false }),
    db.from('referrals').select('status').eq('referred_id', studentId).maybeSingle(),
    db.from('purchases').select('id', { count: 'exact', head: true }).eq('student_id', studentId),
  ])

  const programmeAvailable = !student.company_id

  const referralsWithNames = await Promise.all(
    (referralsMade || []).map(async (r) => {
      const { data: referred } = await db.from('students').select('full_name').eq('id', r.referred_id).single()
      return {
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        qualifiedAt: r.qualified_at,
        rewardedAt: r.rewarded_at,
        referredFirstName: maskName(referred?.full_name),
      }
    })
  )

  return {
    referralCode: student.referral_code,
    creditBalance: credit.balance,
    pendingCredit: credit.pending,
    programmeAvailable,
    canApplyReferralCode: programmeAvailable && !referralReceived && (purchaseCount || 0) === 0,
    referralReceived: referralReceived ? { status: referralReceived.status } : null,
    referrals: referralsWithNames,
  }
}

function maskName(name) {
  if (!name) return 'Student'
  const trimmed = name.trim()
  const first = trimmed.split(/\s+/)[0]
  if (first.length <= 1) return `${first}.`
  return `${first[0]}${'*'.repeat(Math.min(first.length - 1, 4))}`
}

export async function listReferralsForAdmin() {
  const db = supabase()

  const { data: referrals } = await db
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })

  if (!referrals) return []

  return Promise.all(
    referrals.map(async (r) => {
      const [
        { data: referrer },
        { data: referred },
        { data: qp },
      ] = await Promise.all([
        db.from('students').select('id, full_name, phone, profiles(email)').eq('id', r.referrer_id).single(),
        db.from('students').select('id, full_name, phone, profiles(email)').eq('id', r.referred_id).single(),
        r.qualifying_purchase_id
          ? db.from('purchases').select('id, amount, type, status').eq('id', r.qualifying_purchase_id).single()
          : { data: null },
      ])

      const lessonsAttended = await getAttendedLessonCount(r.referred_id)

      return {
        id: r.id,
        status: r.status,
        flagged: r.flagged,
        flagReason: r.flag_reason,
        adminNote: r.admin_note,
        code: r.code,
        createdAt: r.created_at,
        qualifiedAt: r.qualified_at,
        rewardedAt: r.rewarded_at,
        cancelledAt: r.cancelled_at,
        referrer: { id: referrer.id, name: referrer.full_name, email: referrer.profiles?.email },
        referred: { id: referred.id, name: referred.full_name, email: referred.profiles?.email, phone: referred.phone },
        qualifyingPurchase: qp
          ? { id: qp.id, amount: Number(qp.amount), type: qp.type, status: qp.status }
          : null,
        lessonsAttended,
      }
    })
  )
}

const ADMIN_SETTABLE_STATUSES = ['pending', 'qualified', 'reward_pending', 'rewarded', 'rejected', 'cancelled']

export async function adminSetReferralStatus({ referralId, status, adminNote }) {
  if (!ADMIN_SETTABLE_STATUSES.includes(status)) {
    throw new ReferralError('invalid_status', `Unknown referral status: ${status}`)
  }

  const db = supabase()

  const { data: referral } = await db.from('referrals').select('*').eq('id', referralId).single()
  if (!referral) throw new ReferralError('not_found', 'Referral not found.')

  if ((status === 'rejected' || status === 'cancelled') && referral.status !== status) {
    await reverseReferralCredits(referral.id)
  }

  const data = { status, admin_note: adminNote ?? referral.admin_note }
  if (status === 'cancelled') data.cancelled_at = new Date().toISOString()

  await db.from('referrals').update(data).eq('id', referral.id)

  if (status === 'rewarded') {
    return grantReferrerReward(referral.id)
  }

  const { data: updated } = await db.from('referrals').select('*').eq('id', referral.id).single()
  return updated
}

export async function adminAdjustCredit({ studentId, amount, note }) {
  if (!amount) throw new ReferralError('invalid_amount', 'Amount must be non-zero.')
  const db = supabase()

  const { data: transaction } = await db
    .from('credit_transactions')
    .insert({
      student_id: studentId,
      amount,
      reason: 'admin_adjustment',
      status: 'active',
      note: note || 'Manual adjustment by admin.',
    })
    .select()
    .single()

  return transaction
}
